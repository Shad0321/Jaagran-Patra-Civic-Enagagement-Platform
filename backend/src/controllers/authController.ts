import { Request, Response, NextFunction } from 'express';
import { PrismaClient, UserRole, BodyType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendVerificationEmail, sendResetPasswordEmail } from '../utils/email';
import { uploadBufferToCloudinary } from '../utils/cloudinary';

const prisma = new PrismaClient();
const JWT_SECRET: string = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRY_TIME || '7d';

// Register (Public registration for CITIZENS only)
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, phone, name, password } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existingUser) {
      res
        .status(409)
        .json({ error: 'User already exists with this email or phone number' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const emailVerificationToken = Math.random().toString(36).substring(2, 15);

    // Public registration defaults to CITIZEN role
    const user = await prisma.user.create({
      data: {
        email,
        phone: phone || null,
        name,
        password: hashedPassword,
        role: UserRole.CITIZEN,
        emailVerificationToken,
      },
    });

    await sendVerificationEmail(user.email, emailVerificationToken);
    res.status(201).json({
      message: 'User registered successfully. Please verify your email.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error });
  }
};

// MLA/Admin adds MEMBER
export const addMember = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      email,
      phone,
      name,
      password,
      bodyType,
      bodyId,
      designation,
      description,
      stateId,
      districtId,
      constituencyId,
      canReceiveIssues = true,
      canUpdateIssues = true,
      canCreateSessions = false,
    } = req.body;

    const currentUserId = req.user!.id;
    const currentUserRole = req.user!.role;

    // Validate required fields
    if (!email || !password || !name || !bodyType) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Validate body type
    const validBodyTypes = Object.values(BodyType);
    if (!validBodyTypes.includes(bodyType)) {
      res.status(400).json({ error: 'Invalid body type' });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existingUser) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    // Get the current user's details for validation
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: {
        mlaProfile: true,
        constituency: { select: { id: true, name: true } },
      },
    });

    if (!currentUser) {
      res.status(404).json({ error: 'Current user not found' });
      return;
    }

    let finalBodyId = bodyId;

    // If bodyId is provided, validate it exists
    if (bodyId) {
      const body = await prisma.body.findUnique({
        where: { id: bodyId },
      });
      if (!body) {
        res.status(400).json({ error: 'Invalid body ID' });
        return;
      }
    } else {
      // If no bodyId provided, create a default body for certain body types
      const defaultBodyTypes = [
        'SHAKTI_KENDRA',
        'PANNA_PRAMUKH',
        'LOCAL_BODY',
        'POLLING_BOOTH',
        'WARD',
        'BLOCK',
        'MANDAL',
        'TEHSIL',
        'GRAM_PANCHAYAT',
        'MUNICIPALITY',
        'CORPORATION',
      ];

      if (defaultBodyTypes.includes(bodyType)) {
        // Check if a default body of this type already exists for this location
        const existingBody = await prisma.body.findFirst({
          where: {
            type: bodyType,
            stateId: stateId || currentUser.stateId,
            districtId: districtId || currentUser.districtId,
            constituencyId: constituencyId || currentUser.constituencyId,
            name: {
              contains: bodyType.replace(/_/g, ' '),
              mode: 'insensitive',
            },
          },
        });

        if (existingBody) {
          finalBodyId = existingBody.id;
        } else {
          // Create a default body
          const bodyName = `${bodyType.replace(/_/g, ' ')} - ${currentUser.constituency?.name || 'Default'}`;
          const bodyCode = `${bodyType.substring(0, 3)}-${Date.now()}`;

          const newBody = await prisma.body.create({
            data: {
              name: bodyName,
              code: bodyCode,
              type: bodyType,
              description: `Default ${bodyType.replace(/_/g, ' ')} body`,
              stateId: stateId || currentUser.stateId,
              districtId: districtId || currentUser.districtId,
              constituencyId: constituencyId || currentUser.constituencyId,
              isActive: true,
            },
          });

          finalBodyId = newBody.id;
        }
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const emailVerificationToken = Math.random().toString(36).substring(2, 15);

    // Create MEMBER user with profile
    const user = await prisma.user.create({
      data: {
        email,
        phone: phone || null,
        name,
        password: hashedPassword,
        role: UserRole.MEMBER,
        stateId: stateId || currentUser.stateId,
        districtId: districtId || currentUser.districtId,
        constituencyId: constituencyId || currentUser.constituencyId,
        bodyId: finalBodyId || null,
        mlaId: currentUserRole === 'MLA' ? currentUserId : null,
        isVerified: true, // Admin/MLA created users are pre-verified
        emailVerificationToken,
        memberProfile: {
          create: {
            bodyType,
            designation,
            description,
            canReceiveIssues,
            canUpdateIssues,
            canCreateSessions,
          },
        },
      },
      include: {
        memberProfile: true,
        state: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
        constituency: { select: { id: true, name: true } },
        body: { select: { id: true, name: true, type: true } },
        mla: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json({
      message: 'Member added successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        bodyType: user.memberProfile?.bodyType,
        designation: user.memberProfile?.designation,
        body: user.body,
        mla: user.mla,
      },
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member', details: error });
  }
};

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        mlaProfile: true,
        memberProfile: true,
        state: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
        constituency: { select: { id: true, name: true } },
        body: { select: { id: true, name: true, type: true } },
      },
    });

    if (!user) {
      res
        .status(401)
        .json({ error: 'User not Registered, Please Register First' });
      return;
    }

    if (!(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: 'Invalid Password' });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({ error: 'Email not verified' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Account is deactivated' });
      return;
    }

    // Update login tracking
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        loginCount: { increment: 1 },
      },
    });

    const token = jwt.sign(
      {
        id: user.id,
        userId: user.id,
        role: user.role,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        state: user.state,
        district: user.district,
        constituency: user.constituency,
        body: user.body,
        profile: user.role === 'MLA' ? user.mlaProfile : user.memberProfile,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error });
  }
};

// Get Profile
export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        mlaProfile: true,
        memberProfile: true,
        state: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
        constituency: { select: { id: true, name: true } },
        body: { select: { id: true, name: true, type: true } },
        mla: { select: { id: true, name: true, email: true } },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
        isVerified: user.isVerified,
        state: user.state,
        district: user.district,
        constituency: user.constituency,
        body: user.body,
        mla: user.mla,
        profile: user.role === 'MLA' ? user.mlaProfile : user.memberProfile,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        currentAddress: user.currentAddress,
        currentLatitude: user.currentLatitude,
        currentLongitude: user.currentLongitude,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile', details: error });
  }
};

// Update Profile
export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      name,
      phone,
      dateOfBirth,
      gender,
      currentAddress,
      currentLatitude,
      currentLongitude,
    } = req.body;

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // --- ⚙️ Handle Avatar Upload ---
    let avatarUrl = currentUser.avatar; // Keep existing avatar by default
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (files && files.avatar && files.avatar.length > 0) {
      const avatarFile = files.avatar[0];
      try {
        const result = await uploadBufferToCloudinary(
          avatarFile.buffer,
          'avatars',
          'image'
        );
        interface CloudinaryUploadResult {
          secure_url: string;
        }
        avatarUrl = (result as CloudinaryUploadResult).secure_url;
      } catch (uploadError) {
        res.status(500).json({ error: 'Failed to upload avatar' });
        return;
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (gender) updateData.gender = gender;
    if (currentAddress) updateData.currentAddress = currentAddress;

    // Convert string coordinates to numbers
    if (currentLatitude)
      updateData.currentLatitude = parseFloat(currentLatitude);
    if (currentLongitude)
      updateData.currentLongitude = parseFloat(currentLongitude);

    updateData.avatar = avatarUrl; // Set the new or existing avatar URL

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Return a clean user object
    const userToReturn = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      isActive: user.isActive,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      currentAddress: user.currentAddress,
      currentLatitude: user.currentLatitude,
      currentLongitude: user.currentLongitude,
    };

    res.json({
      message: 'Profile updated successfully',
      user: userToReturn,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Get Members (for MLA/Admin)
export const getMembers = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { page = 1, limit = 10, bodyType, search } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    let whereClause: any = {
      role: UserRole.MEMBER,
    };

    // Filter based on user role
    if (userRole === 'MLA') {
      whereClause.mlaId = userId;
    }

    // Add filters
    if (bodyType) {
      whereClause.memberProfile = {
        bodyType: bodyType as BodyType,
      };
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [members, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          memberProfile: true,
          state: { select: { id: true, name: true } },
          district: { select: { id: true, name: true } },
          constituency: { select: { id: true, name: true } },
          body: { select: { id: true, name: true, type: true } },
          assignedIssues: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    res.json({
      members: members.map((member) => ({
        id: member.id,
        email: member.email,
        phone: member.phone,
        name: member.name,
        avatar: member.avatar,
        isActive: member.isActive,
        bodyType: member.memberProfile?.bodyType,
        designation: member.memberProfile?.designation,
        body: member.body,
        state: member.state,
        district: member.district,
        constituency: member.constituency,
        totalIssues: member.memberProfile?.totalIssues || 0,
        resolvedIssues: member.memberProfile?.resolvedIssues || 0,
        pendingIssues: member.memberProfile?.pendingIssues || 0,
        assignedIssuesCount: member.assignedIssues.length,
        createdAt: member.createdAt,
      })),
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Failed to get members', details: error });
  }
};

// Get Bodies (for dropdowns)
export const getBodies = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { stateId, districtId, constituencyId, type } = req.query;

    let whereClause: any = {
      isActive: true,
    };

    if (stateId) whereClause.stateId = stateId as string;
    if (districtId) whereClause.districtId = districtId as string;
    if (constituencyId) whereClause.constituencyId = constituencyId as string;
    if (type) whereClause.type = type as BodyType;

    const bodies = await prisma.body.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        description: true,
        state: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
        constituency: { select: { id: true, name: true } },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({ bodies });
  } catch (error) {
    console.error('Get bodies error:', error);
    res.status(500).json({ error: 'Failed to get bodies', details: error });
  }
};

// Export all the existing functions that weren't modified
export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, token } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerificationToken !== token) {
      res.status(400).json({ error: 'Invalid verification token' });
      return;
    }
    await prisma.user.update({
      where: { email },
      data: { isVerified: true, emailVerificationToken: null },
    });
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed', details: error });
  }
};

export const resendVerificationEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (user.isVerified) {
      res.status(400).json({ error: 'Email already verified' });
      return;
    }
    const token =
      user.emailVerificationToken ||
      Math.random().toString(36).substring(2, 15);
    await prisma.user.update({
      where: { email },
      data: { emailVerificationToken: token },
    });
    await sendVerificationEmail(email, token);
    res.json({ message: 'Verification email resent' });
  } catch (error) {
    res.status(500).json({ error: 'Resend failed', details: error });
  }
};

export const initiatePasswordReset = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const resetToken = Math.random().toString(36).substring(2, 15);
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 30); // 30 min
    await prisma.user.update({
      where: { email },
      data: { resetToken, resetTokenExpiry },
    });
    await sendResetPasswordEmail(email, resetToken);
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ error: 'Reset failed', details: error });
  }
};

export const completePasswordReset = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, token, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (
      !user ||
      user.resetToken !== token ||
      !user.resetTokenExpiry ||
      user.resetTokenExpiry < new Date()
    ) {
      res.status(400).json({ error: 'Invalid or expired token' });
      return;
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ error: 'Reset failed', details: error });
  }
};

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (!(await bcrypt.compare(currentPassword, user.password))) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Failed to change password', details: error });
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.json({ message: 'Logged out successfully' });
};

export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  res.status(501).json({ error: 'Not implemented' });
};

export const sendPhoneVerification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { phone } = req.body;
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    // Generate and send verification code (not implemented)
    res.json({ message: 'Phone verification code sent' });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Phone verification failed', details: error });
  }
};

export const verifyPhone = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { phone, code } = req.body;
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    // Verify the code (not implemented)
    res.json({ message: 'Phone verified successfully' });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Phone verification failed', details: error });
  }
};

// Role-based access middleware
export const requireRole =
  (roles: UserRole[]) => (req: any, res: Response, next: NextFunction) => {
    const user = req.user;
    if (user && user.role === 'ADMIN') {
      return next();
    }
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };

// Update location
export const updateLocation = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { latitude, longitude, address } = req.body;

    await prisma.user.update({
      where: { id: userId },
      data: {
        currentLatitude: latitude ? parseFloat(latitude) : null,
        currentLongitude: longitude ? parseFloat(longitude) : null,
        currentAddress: address || null,
        lastLocationUpdate: new Date(),
      },
    });

    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Failed to update location', details: error });
  }
};

// Get all users (Admin only)
export const getAllUsers = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    let whereClause: any = {};

    if (role) whereClause.role = role as UserRole;
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          mlaProfile: true,
          memberProfile: true,
          state: { select: { id: true, name: true } },
          district: { select: { id: true, name: true } },
          constituency: { select: { id: true, name: true } },
          body: { select: { id: true, name: true, type: true } },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    res.json({
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
        isVerified: user.isVerified,
        state: user.state,
        district: user.district,
        constituency: user.constituency,
        body: user.body,
        profile: user.role === 'MLA' ? user.mlaProfile : user.memberProfile,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      })),
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to get users', details: error });
  }
};

// Update Member
export const updateMember = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: memberId } = req.params;
    const {
      bodyType,
      bodyId,
      designation,
      description,
      canReceiveIssues,
      canUpdateIssues,
      canCreateSessions,
      isActive,
    } = req.body;

    // Check if member exists
    const member = await prisma.user.findUnique({
      where: { id: memberId },
      include: { memberProfile: true },
    });

    if (!member) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    if (member.role !== 'MEMBER') {
      res.status(400).json({ error: 'User is not a member' });
      return;
    }

    // Update member profile
    const updatedMember = await prisma.user.update({
      where: { id: memberId },
      data: {
        bodyId: bodyId || undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        memberProfile: {
          update: {
            bodyType: bodyType || undefined,
            designation: designation || undefined,
            description: description || undefined,
            canReceiveIssues:
              canReceiveIssues !== undefined ? canReceiveIssues : undefined,
            canUpdateIssues:
              canUpdateIssues !== undefined ? canUpdateIssues : undefined,
            canCreateSessions:
              canCreateSessions !== undefined ? canCreateSessions : undefined,
          },
        },
      },
      include: {
        memberProfile: true,
        state: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
        constituency: { select: { id: true, name: true } },
        body: { select: { id: true, name: true, type: true } },
        mla: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({
      message: 'Member updated successfully',
      member: {
        id: updatedMember.id,
        email: updatedMember.email,
        name: updatedMember.name,
        role: updatedMember.role,
        isActive: updatedMember.isActive,
        bodyType: updatedMember.memberProfile?.bodyType,
        designation: updatedMember.memberProfile?.designation,
        body: updatedMember.body,
        mla: updatedMember.mla,
      },
    });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ error: 'Failed to update member', details: error });
  }
};

// Delete Member
export const deleteMember = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: memberId } = req.params;
    const currentUserId = req.user!.id;
    const currentUserRole = req.user!.role;

    // Check if member exists
    const member = await prisma.user.findUnique({
      where: { id: memberId },
      include: {
        assignedIssues: {
          where: {
            status: {
              in: ['PENDING', 'IN_PROGRESS'],
            },
          },
        },
        memberProfile: true,
      },
    });

    if (!member) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    if (member.role !== 'MEMBER') {
      res.status(400).json({ error: 'User is not a member' });
      return;
    }

    // Check if member has active issues
    if (member.assignedIssues.length > 0) {
      res.status(400).json({
        error:
          'Cannot delete member with active issues. Please resolve or reassign them first.',
        activeIssues: member.assignedIssues.length,
      });
      return;
    }

    // Check authorization - MLA can only delete their own members
    if (currentUserRole === 'MLA' && member.mlaId !== currentUserId) {
      res.status(403).json({ error: 'Unauthorized to delete this member' });
      return;
    }

    // Delete the member (cascade will handle memberProfile)
    await prisma.user.delete({
      where: { id: memberId },
    });

    res.json({
      message: 'Member deleted successfully',
    });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ error: 'Failed to delete member', details: error });
  }
};

// Create Body
export const createBody = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      code,
      type,
      description,
      address,
      latitude,
      longitude,
      headName,
      contactEmail,
      contactPhone,
      stateId,
      districtId,
      constituencyId,
      parentBodyId,
    } = req.body;

    const currentUserId = req.user!.id;

    // Get the current user's details for validation
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { mlaProfile: true },
    });

    if (!currentUser) {
      res.status(404).json({ error: 'Current user not found' });
      return;
    }

    // Validate required fields
    if (!name || !code || !type) {
      res.status(400).json({ error: 'Name, code, and type are required' });
      return;
    }

    // Validate body type
    const validBodyTypes = Object.values(BodyType);
    if (!validBodyTypes.includes(type)) {
      res.status(400).json({ error: 'Invalid body type' });
      return;
    }

    // Check if body with same code already exists in the same location
    const existingBody = await prisma.body.findFirst({
      where: {
        code,
        type,
        stateId: stateId || currentUser.stateId,
        districtId: districtId || currentUser.districtId,
        constituencyId: constituencyId || currentUser.constituencyId,
      },
    });

    if (existingBody) {
      res
        .status(409)
        .json({ error: 'Body with this code already exists in this location' });
      return;
    }

    // Create the body
    const body = await prisma.body.create({
      data: {
        name,
        code,
        type,
        description,
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        headName,
        contactEmail,
        contactPhone,
        stateId: stateId || currentUser.stateId,
        districtId: districtId || currentUser.districtId,
        constituencyId: constituencyId || currentUser.constituencyId,
        parentBodyId: parentBodyId || null,
        isActive: true,
      },
      include: {
        state: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
        constituency: { select: { id: true, name: true } },
        parentBody: { select: { id: true, name: true, type: true } },
      },
    });

    res.status(201).json({
      message: 'Body created successfully',
      body,
    });
  } catch (error) {
    console.error('Create body error:', error);
    res.status(500).json({ error: 'Failed to create body', details: error });
  }
};

// Update Body
export const updateBody = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: bodyId } = req.params;
    const {
      name,
      description,
      address,
      latitude,
      longitude,
      headName,
      contactEmail,
      contactPhone,
      isActive,
    } = req.body;

    // Check if body exists
    const body = await prisma.body.findUnique({
      where: { id: bodyId },
    });

    if (!body) {
      res.status(404).json({ error: 'Body not found' });
      return;
    }

    // Update the body
    const updatedBody = await prisma.body.update({
      where: { id: bodyId },
      data: {
        name: name || undefined,
        description: description || undefined,
        address: address || undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        headName: headName || undefined,
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
      include: {
        state: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
        constituency: { select: { id: true, name: true } },
        parentBody: { select: { id: true, name: true, type: true } },
      },
    });

    res.json({
      message: 'Body updated successfully',
      body: updatedBody,
    });
  } catch (error) {
    console.error('Update body error:', error);
    res.status(500).json({ error: 'Failed to update body', details: error });
  }
};

// Delete Body
export const deleteBody = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: bodyId } = req.params;

    // Check if body exists
    const body = await prisma.body.findUnique({
      where: { id: bodyId },
      include: {
        users: true,
        childBodies: true,
      },
    });

    if (!body) {
      res.status(404).json({ error: 'Body not found' });
      return;
    }

    // Check if body has associated users or child bodies
    if (body.users.length > 0) {
      res.status(400).json({
        error:
          'Cannot delete body with associated members. Please reassign them first.',
        associatedUsers: body.users.length,
      });
      return;
    }

    if (body.childBodies.length > 0) {
      res.status(400).json({
        error:
          'Cannot delete body with child bodies. Please delete or reassign them first.',
        childBodies: body.childBodies.length,
      });
      return;
    }

    // Delete the body
    await prisma.body.delete({
      where: { id: bodyId },
    });

    res.json({
      message: 'Body deleted successfully',
    });
  } catch (error) {
    console.error('Delete body error:', error);
    res.status(500).json({ error: 'Failed to delete body', details: error });
  }
};
