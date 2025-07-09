import { Request, Response, NextFunction } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendVerificationEmail, sendResetPasswordEmail } from '../utils/email';

const prisma = new PrismaClient();
const JWT_SECRET: string = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRY_TIME || '7d';

// Register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Request body:', req.body); // Debugging line to log request body

    const { email, phone, name, password, role } = req.body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Validate role is a valid UserRole
    const validRoles = ['ADMIN', 'CITIZEN', 'MLA', 'MEMBER'];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: 'Invalid role specified' });
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existingUser) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const emailVerificationToken = Math.random().toString(36).substring(2, 15);

    console.log('Creating user with data:', {
      email,
      phone,
      name,
      role,
      hashedPassword: hashedPassword.substring(0, 10) + '...',
      emailVerificationToken,
    });

    const user = await prisma.user.create({
      data: {
        email,
        phone: phone || null, // Ensure null instead of undefined
        name,
        password: hashedPassword,
        role: role as UserRole,
        emailVerificationToken,
      },
    });

    await sendVerificationEmail(user.email, emailVerificationToken);
    res
      .status(201)
      .json({ message: 'User registered. Please verify your email.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error });
  }
};

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    if (!user.isVerified) {
      res.status(403).json({ error: 'Email not verified' });
      return;
    }
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error });
  }
};

// Email Verification
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

// Resend Verification Email
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

// Initiate Password Reset
export const initiatePasswordReset = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log('Initiating password reset for:', req.body.email); // Debugging line to log email

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

// Complete Password Reset
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

// Logout (client-side: just delete token)
export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.json({ message: 'Logged out' });
};

// Middleware for role-based access
export const requireRole =
  (roles: UserRole[]) => (req: any, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };

// Token refresh (optional, if using refresh tokens)
export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Implement if using refresh tokens

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

// Profile Management
export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        isVerified: true,
        lastLogin: true,
        currentLatitude: true,
        currentLongitude: true,
        currentAddress: true,
        lastLocationUpdate: true,
        state: { select: { id: true, name: true, code: true } },
        district: { select: { id: true, name: true, code: true } },
        constituency: { select: { id: true, name: true, code: true } },
        shaktiKendra: { select: { id: true, name: true, code: true } },
        localBody: { select: { id: true, name: true, code: true } },
        pollingBooth: { select: { id: true, name: true, code: true } },
        mlaProfile: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile', details: error });
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const {
      name,
      phone,
      avatar,
      stateId,
      districtId,
      constituencyId,
      shaktiKendraId,
      localBodyId,
      pollingBoothId,
    } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (avatar) updateData.avatar = avatar;
    if (stateId) updateData.stateId = stateId;
    if (districtId) updateData.districtId = districtId;
    if (constituencyId) updateData.constituencyId = constituencyId;
    if (shaktiKendraId) updateData.shaktiKendraId = shaktiKendraId;
    if (localBodyId) updateData.localBodyId = localBodyId;
    if (pollingBoothId) updateData.pollingBoothId = pollingBoothId;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        avatar: true,
        state: { select: { id: true, name: true, code: true } },
        district: { select: { id: true, name: true, code: true } },
        constituency: { select: { id: true, name: true, code: true } },
        updatedAt: true,
      },
    });

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile', details: error });
  }
};

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res
        .status(400)
        .json({ error: 'Current password and new password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isValidPassword) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Failed to change password', details: error });
  }
};

export const updateLocation = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { latitude, longitude, address } = req.body;

    if (!latitude || !longitude) {
      res.status(400).json({ error: 'Latitude and longitude are required' });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        currentLatitude: parseFloat(latitude),
        currentLongitude: parseFloat(longitude),
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

// Subordinate Management
export const getSubordinates = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { page = 1, limit = 10, type, isActive = true } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const whereClause: any = { supervisorId: userId };
    if (type) whereClause.type = type;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    const subordinateRelations = await prisma.subordinateRelation.findMany({
      where: whereClause,
      include: {
        subordinate: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            avatar: true,
            isActive: true,
            currentLatitude: true,
            currentLongitude: true,
            currentAddress: true,
            lastLocationUpdate: true,
            state: { select: { id: true, name: true, code: true } },
            district: { select: { id: true, name: true, code: true } },
            constituency: { select: { id: true, name: true, code: true } },
            shaktiKendra: { select: { id: true, name: true, code: true } },
            localBody: { select: { id: true, name: true, code: true } },
            pollingBooth: { select: { id: true, name: true, code: true } },
          },
        },
        state: { select: { id: true, name: true, code: true } },
        district: { select: { id: true, name: true, code: true } },
        constituency: { select: { id: true, name: true, code: true } },
        shaktiKendra: { select: { id: true, name: true, code: true } },
        localBody: { select: { id: true, name: true, code: true } },
        pollingBooth: { select: { id: true, name: true, code: true } },
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.subordinateRelation.count({
      where: whereClause,
    });

    res.json({
      subordinates: subordinateRelations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Failed to get subordinates', details: error });
  }
};

export const addSubordinate = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const {
      subordinateId,
      type = 'DIRECT',
      designation,
      permissions,
      stateId,
      districtId,
      constituencyId,
      shaktiKendraId,
      localBodyId,
      pollingBoothId,
    } = req.body;

    if (!subordinateId) {
      res.status(400).json({ error: 'Subordinate ID is required' });
      return;
    }

    // Check if subordinate exists
    const subordinate = await prisma.user.findUnique({
      where: { id: subordinateId },
    });
    if (!subordinate) {
      res.status(404).json({ error: 'Subordinate user not found' });
      return;
    }

    // Check if relationship already exists
    const existingRelation = await prisma.subordinateRelation.findUnique({
      where: {
        supervisorId_subordinateId: { supervisorId: userId, subordinateId },
      },
    });

    if (existingRelation) {
      res
        .status(409)
        .json({ error: 'Subordinate relationship already exists' });
      return;
    }

    const subordinateRelation = await prisma.subordinateRelation.create({
      data: {
        supervisorId: userId,
        subordinateId,
        type,
        designation,
        permissions,
        stateId,
        districtId,
        constituencyId,
        shaktiKendraId,
        localBodyId,
        pollingBoothId,
      },
      include: {
        subordinate: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    res
      .status(201)
      .json({ message: 'Subordinate added successfully', subordinateRelation });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Failed to add subordinate', details: error });
  }
};

export const updateSubordinate = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const relationId = req.params.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const {
      type,
      designation,
      permissions,
      isActive,
      stateId,
      districtId,
      constituencyId,
      shaktiKendraId,
      localBodyId,
      pollingBoothId,
    } = req.body;

    const updateData: any = {};
    if (type) updateData.type = type;
    if (designation) updateData.designation = designation;
    if (permissions) updateData.permissions = permissions;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (stateId) updateData.stateId = stateId;
    if (districtId) updateData.districtId = districtId;
    if (constituencyId) updateData.constituencyId = constituencyId;
    if (shaktiKendraId) updateData.shaktiKendraId = shaktiKendraId;
    if (localBodyId) updateData.localBodyId = localBodyId;
    if (pollingBoothId) updateData.pollingBoothId = pollingBoothId;

    const subordinateRelation = await prisma.subordinateRelation.update({
      where: {
        id: relationId,
        supervisorId: userId, // Ensure only supervisor can update
      },
      data: updateData,
      include: {
        subordinate: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    res.json({
      message: 'Subordinate updated successfully',
      subordinateRelation,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Failed to update subordinate', details: error });
  }
};

export const removeSubordinate = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const relationId = req.params.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await prisma.subordinateRelation.delete({
      where: {
        id: relationId,
        supervisorId: userId, // Ensure only supervisor can delete
      },
    });

    res.json({ message: 'Subordinate removed successfully' });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Failed to remove subordinate', details: error });
  }
};

export const getSubordinateHierarchy = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get direct subordinates with their nested subordinates
    const buildHierarchy = async (
      supervisorId: string,
      depth = 0
    ): Promise<any[]> => {
      if (depth > 3) return []; // Prevent infinite recursion

      const relations = await prisma.subordinateRelation.findMany({
        where: { supervisorId, isActive: true },
        include: {
          subordinate: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              avatar: true,
              currentLatitude: true,
              currentLongitude: true,
              currentAddress: true,
              state: { select: { id: true, name: true, code: true } },
              district: { select: { id: true, name: true, code: true } },
              constituency: { select: { id: true, name: true, code: true } },
              shaktiKendra: { select: { id: true, name: true, code: true } },
              localBody: { select: { id: true, name: true, code: true } },
              pollingBooth: { select: { id: true, name: true, code: true } },
            },
          },
        },
      });

      const hierarchyNodes = [];
      for (const relation of relations) {
        const subSubordinates = await buildHierarchy(
          relation.subordinateId,
          depth + 1
        );
        hierarchyNodes.push({
          ...relation,
          subordinates: subSubordinates,
        });
      }
      return hierarchyNodes;
    };

    const hierarchy = await buildHierarchy(userId);
    res.json({ hierarchy });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Failed to get subordinate hierarchy', details: error });
  }
};

// Admin Routes
export const getAllUsers = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { page = 1, limit = 10, role, isActive, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const whereClause: any = {};
    if (role) whereClause.role = role;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        isVerified: true,
        lastLogin: true,
        loginCount: true,
        state: { select: { id: true, name: true, code: true } },
        district: { select: { id: true, name: true, code: true } },
        constituency: { select: { id: true, name: true, code: true } },
        createdAt: true,
        updatedAt: true,
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.user.count({ where: whereClause });

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get users', details: error });
  }
};

export const getUserById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        isVerified: true,
        lastLogin: true,
        loginCount: true,
        currentLatitude: true,
        currentLongitude: true,
        currentAddress: true,
        lastLocationUpdate: true,
        state: { select: { id: true, name: true, code: true } },
        district: { select: { id: true, name: true, code: true } },
        constituency: { select: { id: true, name: true, code: true } },
        shaktiKendra: { select: { id: true, name: true, code: true } },
        localBody: { select: { id: true, name: true, code: true } },
        pollingBooth: { select: { id: true, name: true, code: true } },
        mlaProfile: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user', details: error });
  }
};

export const updateUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      role,
      isActive,
      stateId,
      districtId,
      constituencyId,
    } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (stateId) updateData.stateId = stateId;
    if (districtId) updateData.districtId = districtId;
    if (constituencyId) updateData.constituencyId = constituencyId;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user', details: error });
  }
};

export const deleteUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user', details: error });
  }
};

export const activateUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: { id: true, name: true, email: true, isActive: true },
    });

    res.json({ message: 'User activated successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to activate user', details: error });
  }
};

export const deactivateUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, name: true, email: true, isActive: true },
    });

    res.json({ message: 'User deactivated successfully', user });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Failed to deactivate user', details: error });
  }
};

// Location Routes
export const getStates = async (req: Request, res: Response): Promise<void> => {
  try {
    const states = await prisma.state.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        latitude: true,
        longitude: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({ states });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get states', details: error });
  }
};

export const getDistrictsByState = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { stateId } = req.params;

    const districts = await prisma.district.findMany({
      where: { stateId },
      select: {
        id: true,
        name: true,
        code: true,
        latitude: true,
        longitude: true,
        state: { select: { id: true, name: true, code: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ districts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get districts', details: error });
  }
};

export const getConstituenciesByDistrict = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { districtId } = req.params;

    const constituencies = await prisma.constituency.findMany({
      where: { districtId },
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        latitude: true,
        longitude: true,
        district: { select: { id: true, name: true, code: true } },
        state: { select: { id: true, name: true, code: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ constituencies });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Failed to get constituencies', details: error });
  }
};

export const getShaktiKendrasByConstituency = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { constituencyId } = req.params;

    const shaktiKendras = await prisma.shaktiKendra.findMany({
      where: { constituencyId },
      select: {
        id: true,
        name: true,
        code: true,
        latitude: true,
        longitude: true,
        constituency: { select: { id: true, name: true, code: true } },
        district: { select: { id: true, name: true, code: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ shaktiKendras });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Failed to get shakti kendras', details: error });
  }
};

export const getLocalBodiesByShaktiKendra = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { shaktiKendraId } = req.params;

    const localBodies = await prisma.localBody.findMany({
      where: { shaktiKendraId },
      select: {
        id: true,
        name: true,
        type: true,
        code: true,
        latitude: true,
        longitude: true,
        shaktiKendra: { select: { id: true, name: true, code: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ localBodies });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Failed to get local bodies', details: error });
  }
};

export const getPollingBoothsByLocalBody = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { localBodyId } = req.params;

    const pollingBooths = await prisma.pollingBooth.findMany({
      where: { localBodyId },
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        latitude: true,
        longitude: true,
        localBody: { select: { id: true, name: true, code: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ pollingBooths });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Failed to get polling booths', details: error });
  }
};
