import { Request, Response } from 'express';
import { PrismaClient, UserRole, BodyType, IssueStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { uploadBufferToCloudinary } from '../utils/cloudinary';

const prisma = new PrismaClient();

// Dashboard Statistics
export const getDashboardStats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const [
      totalUsers,
      totalMlas,
      totalMembers,
      totalIssues,
      pendingIssues,
      resolvedIssues,
      totalNews,
      activeNews,
      recentIssues,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: UserRole.MLA } }),
      prisma.user.count({ where: { role: UserRole.MEMBER } }),
      prisma.issue.count(),
      prisma.issue.count({ where: { status: 'PENDING' } }),
      prisma.issue.count({ where: { status: 'RESOLVED' } }),
      prisma.news.count(),
      prisma.news.count({ where: { isActive: true } }),
      prisma.issue.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          reportedBy: { select: { name: true, email: true } },
          assignedTo: { select: { name: true, email: true } },
        },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalMlas,
          totalMembers,
          totalIssues,
          pendingIssues,
          resolvedIssues,
          totalNews,
          activeNews,
        },
        recentIssues,
        recentUsers,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// User Management
export const getAllUsers = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          mlaProfile: true,
          memberProfile: true,
          state: { select: { name: true } },
          district: { select: { name: true } },
          constituency: { select: { name: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
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
      include: {
        mlaProfile: true,
        memberProfile: true,
        state: { select: { name: true } },
        district: { select: { name: true } },
        constituency: { select: { name: true } },
        reportedIssues: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { assignedTo: { select: { name: true } } },
        },
        assignedIssues: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { reportedBy: { select: { name: true } } },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const createUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      email,
      phone,
      name,
      password,
      role,
      stateId,
      districtId,
      constituencyId,
    } = req.body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      res
        .status(400)
        .json({ success: false, error: 'Missing required fields' });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existingUser) {
      res.status(409).json({ success: false, error: 'User already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        phone: phone || null,
        name,
        password: hashedPassword,
        role: role as UserRole,
        stateId: stateId || null,
        districtId: districtId || null,
        constituencyId: constituencyId || null,
        isVerified: true, // Admin created users are pre-verified
      },
      include: {
        state: { select: { name: true } },
        district: { select: { name: true } },
        constituency: { select: { name: true } },
      },
    });

    // Create profile based on role
    if (role === 'MLA' && constituencyId) {
      await prisma.mlaProfile.create({
        data: {
          userId: user.id,
          constituencyId,
        },
      });
    } else if (role === 'MEMBER') {
      await prisma.memberProfile.create({
        data: {
          userId: user.id,
        },
      });
    }

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
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

    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        role: role as UserRole,
        isActive,
        stateId: stateId || null,
        districtId: districtId || null,
        constituencyId: constituencyId || null,
      },
      include: {
        state: { select: { name: true } },
        district: { select: { name: true } },
        constituency: { select: { name: true } },
      },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const deleteUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// MLA Management
export const getAllMLAs = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      party,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { role: UserRole.MLA };
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (party && party !== 'all') {
      where.mlaProfile = {
        partyName: { contains: party as string, mode: 'insensitive' },
      };
    }

    const [mlas, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          mlaProfile: true,
          state: { select: { name: true } },
          district: { select: { name: true } },
          constituency: { select: { name: true } },
          members: { select: { id: true, name: true } },
          assignedIssues: { select: { id: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Transform data to match frontend expectations
    const transformedMLAs = mlas.map((mla) => ({
      id: mla.id,
      name: mla.name,
      email: mla.email,
      phone: mla.phone,
      avatar: mla.avatar,
      isActive: mla.isActive,
      createdAt: mla.createdAt,
      stateId: mla.stateId,
      constituencyId: mla.constituencyId,
      constituency: mla.constituency?.name || 'No Constituency',
      party: mla.mlaProfile?.partyName || '',
      position: mla.mlaProfile?.position || '',
      tenure: mla.mlaProfile?.tenure || '',
      bio: mla.mlaProfile?.bio || '',
      achievements: mla.mlaProfile?.achievements || '',
      address: mla.currentAddress || '',
      socialLinks: mla.mlaProfile?.socialLinks || {},
      members: mla.members,
      assignedIssues: mla.assignedIssues,
    }));

    res.json({
      success: true,
      data: {
        mlas: transformedMLAs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get all MLAs error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const createMLA = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      email,
      phone,
      password, // Optional custom password
      stateId,
      constituencyId,
      party,
      address,
      bio,
      isActive,
      position,
      tenure,
      achievements,
      socialLinks,
    } = req.body;

    // Validate required fields
    if (!name || !email || !constituencyId || !party || !stateId) {
      res.status(400).json({
        success: false,
        error:
          'Missing required fields: name, email, stateId, constituencyId, and party are required',
      });
      return;
    }

    // Check if constituency exists
    const constituency = await prisma.constituency.findUnique({
      where: { id: constituencyId },
      include: { state: true },
    });
    if (!constituency) {
      res.status(404).json({ success: false, error: 'Constituency not found' });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone: phone || undefined }] },
    });
    if (existingUser) {
      res.status(409).json({ success: false, error: 'User already exists' });
      return;
    }

    // Check if MLA already exists for this constituency
    const existingMLA = await prisma.mlaProfile.findFirst({
      where: { constituencyId },
    });
    if (existingMLA) {
      res.status(409).json({
        success: false,
        error: 'An MLA already exists for this constituency',
      });
      return;
    }

    interface CloudinaryUploadResult {
      secure_url: string;
      [key: string]: any;
    }

    // Handle avatar upload
    let avatarUrl: string | null = null;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files && files.avatar && files.avatar.length > 0) {
      const avatarFile = files.avatar[0];
      try {
        // Upload avatar to Cloudinary
        const result = await uploadBufferToCloudinary(
          avatarFile.buffer,
          'mla/avatars',
          'image'
        );
        avatarUrl = (result as CloudinaryUploadResult).secure_url;
      } catch (uploadError) {
        console.error('Avatar upload error:', uploadError);
        res.status(500).json({
          success: false,
          error: 'Failed to upload avatar image',
        });
        return;
      }
    }

    // Use provided password or generate a temporary password
    const finalPassword =
      password || Math.random().toString(36).substring(2, 12);
    const hashedPassword = await bcrypt.hash(finalPassword, 10);

    // Create user with MLA role
    const user = await prisma.user.create({
      data: {
        email,
        phone: phone || null,
        name,
        password: hashedPassword,
        role: UserRole.MLA,
        isVerified: true, // Admin created users are pre-verified
        isActive: isActive === 'true',
        stateId,
        constituencyId,
        currentAddress: address || null,
        avatar: avatarUrl, // Store the avatar URL
      },
    });

    // Create MLA profile
    const mlaProfile = await prisma.mlaProfile.create({
      data: {
        userId: user.id,
        constituencyId,
        partyName: party,
        position: position || null,
        tenure: tenure || null,
        bio: bio || null,
        achievements: achievements || null,
        contactEmail: email,
        contactPhone: phone || null,
        socialLinks: socialLinks || null,
      },
    });

    // Fetch the created MLA with related data
    const createdMLA = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        mlaProfile: true,
        state: { select: { name: true, code: true } },
        constituency: { select: { name: true, type: true } },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...createdMLA,
        password: finalPassword, // Send password to admin (temporary if generated, custom if provided)
        isGenerated: !password, // Flag to indicate if password was auto-generated
      },
    });
  } catch (error) {
    console.error('Create MLA error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const updateMLA = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      stateId,
      avatar,
      constituencyId,
      party,
      address,
      bio,
      isActive,
      position,
      tenure,
      achievements,
      socialLinks,
    } = req.body;

    // Check if MLA exists
    const existingMLA = await prisma.user.findUnique({
      where: { id },
      include: { mlaProfile: true },
    });

    if (!existingMLA || existingMLA.role !== 'MLA') {
      res.status(404).json({ success: false, error: 'MLA not found' });
      return;
    }

    // Define the type for the Cloudinary result
    interface CloudinaryUploadResult {
      secure_url: string;
      [key: string]: any;
    }

    // Handle avatar upload
    let avatarUrl = existingMLA.avatar; // Keep existing avatar by default
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files && files.avatar && files.avatar.length > 0) {
      const avatarFile = files.avatar[0];
      try {
        // Upload new avatar to Cloudinary
        const result = await uploadBufferToCloudinary(
          avatarFile.buffer,
          'mla/avatars',
          'image'
        );
        avatarUrl = (result as CloudinaryUploadResult).secure_url;
      } catch (uploadError) {
        console.error('Avatar upload error:', uploadError);
        res.status(500).json({
          success: false,
          error: 'Failed to upload avatar image',
        });
        return;
      }
    }

    // Update user data
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        phone: phone || null,
        stateId,
        constituencyId,
        currentAddress: address || null,
        isActive: isActive === 'true',
        avatar: avatarUrl || avatar || null, // Update avatar URL
      },
    });

    // Update MLA profile
    const updatedMlaProfile = await prisma.mlaProfile.update({
      where: { userId: id },
      data: {
        constituencyId,
        partyName: party,
        position: position || null,
        tenure: tenure || null,
        bio: bio || null,
        achievements: achievements || null,
        contactEmail: email,
        contactPhone: phone || null,
        socialLinks: socialLinks || null,
      },
    });

    // Fetch the updated MLA with related data
    const updatedMLA = await prisma.user.findUnique({
      where: { id },
      include: {
        mlaProfile: true,
        state: { select: { name: true, code: true } },
        constituency: { select: { name: true, type: true } },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedMLA,
    });
  } catch (error) {
    console.error('Update MLA error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const deleteMLA = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // 1. Delete all chat groups owned by the MLA
    await prisma.chatGroup.deleteMany({
      where: { ownerId: id },
    });

    // 2. Disconnect all members associated with this MLA
    await prisma.user.updateMany({
      where: { mlaId: id },
      data: { mlaId: null },
    });

    // 3. Delete the MLA user (will cascade delete MLA profile)
    await prisma.user.delete({
      where: { id },
    });

    res.json({ success: true, message: 'MLA deleted successfully' });
  } catch (error) {
    console.error('Delete MLA error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Member Management
export const getAllMembers = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      bodyType,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      mlaId,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { role: UserRole.MEMBER };

    // Filter by MLA if mlaId is provided
    if (mlaId) {
      where.mlaId = mlaId as string;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [members, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          memberProfile: true,
          mla: { select: { id: true, name: true } },
          state: { select: { name: true } },
          district: { select: { name: true } },
          constituency: { select: { name: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        members,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get all members error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const createMember = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      email,
      phone,
      password, // Optional custom password
      bodyType,
      designation,
      description,
      mlaId,
      stateId,
      constituencyId,
      bodyId,
      localBodyName,
      city,
      address,
      isActive,
    } = req.body;

    // Validate required fields
    if (!name || !email) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: name and email are required',
      });
      return;
    }

    // Validate that mlaId is provided (required for proper hierarchy)
    if (!mlaId) {
      res.status(400).json({
        success: false,
        error:
          'MLA ID is required. Please select an MLA to associate this member with.',
      });
      return;
    }

    // Validate that the MLA exists
    const mla = await prisma.user.findUnique({
      where: { id: mlaId, role: UserRole.MLA },
      include: {
        mlaProfile: { include: { constituency: true } },
        state: true,
        constituency: true,
      },
    });

    if (!mla) {
      res.status(404).json({
        success: false,
        error: 'Selected MLA not found or invalid',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone && phone.trim() !== '' ? [{ phone: phone }] : []),
        ],
      },
    });
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'User with this email or phone already exists',
      });
      return;
    }

    // Get MLA's location data for the member
    const mlaLocationData = {
      stateId: mla.stateId,
      constituencyId: mla.constituencyId,
    };

    // Use provided location data or fall back to MLA's location
    const finalStateId = stateId || mlaLocationData.stateId;
    const finalConstituencyId =
      constituencyId || mlaLocationData.constituencyId;
    const finalDistrictId = mla.constituency?.districtId;

    // If bodyId is provided and not empty, verify it exists
    let finalBodyId: string | null = null;
    if (bodyId && bodyId.trim() !== '') {
      const body = await prisma.body.findUnique({
        where: { id: bodyId },
      });
      if (!body) {
        res.status(404).json({ success: false, error: 'Local body not found' });
        return;
      }
      finalBodyId = bodyId;
    } else if (bodyType) {
      // If no bodyId provided but bodyType is specified, create or find a default body
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
            stateId: finalStateId,
            districtId: finalDistrictId, // Using proper district ID
            constituencyId: finalConstituencyId,
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
          const bodyName = `${bodyType.replace(/_/g, ' ')} - ${mla.constituency?.name || 'Default'}`;
          const bodyCode = `${bodyType.substring(0, 3)}-${Date.now()}`;

          const newBody = await prisma.body.create({
            data: {
              name: bodyName,
              code: bodyCode,
              type: bodyType,
              description:
                description || `Default ${bodyType.replace(/_/g, ' ')} body`,
              stateId: finalStateId,
              districtId: finalDistrictId, // Using proper district ID
              constituencyId: finalConstituencyId,
              isActive: true,
            },
          });

          finalBodyId = newBody.id;
        }
      }
    }

    // Use provided password or generate a temporary password
    const finalPassword =
      password || Math.random().toString(36).substring(2, 12);
    const hashedPassword = await bcrypt.hash(finalPassword, 10);

    // Create user with MEMBER role
    const user = await prisma.user.create({
      data: {
        email,
        phone: phone || null,
        name,
        password: hashedPassword,
        role: UserRole.MEMBER,
        mlaId: mlaId, // Always set from validated MLA
        stateId: finalStateId || null,
        constituencyId: finalConstituencyId || null,
        bodyId: finalBodyId || null,
        currentAddress: address || null,
        isVerified: true, // Admin created users are pre-verified
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    // Create Member profile
    const memberProfile = await prisma.memberProfile.create({
      data: {
        userId: user.id,
        bodyType: bodyType || null,
        designation: designation || null,
        description: description || null,
      },
    });

    // Create or update local body if localBodyName is provided (separate from default body)
    if (localBodyName && finalStateId && finalConstituencyId) {
      try {
        const localBody = await prisma.body.upsert({
          where: {
            stateId_districtId_constituencyId_code_type: {
              stateId: finalStateId,
              districtId: finalStateId, // Using state as district for now
              constituencyId: finalConstituencyId,
              code: localBodyName.replace(/\s+/g, '_').toUpperCase(),
              type: bodyType || 'LOCAL_BODY',
            },
          },
          update: {},
          create: {
            name: localBodyName,
            code: localBodyName.replace(/\s+/g, '_').toUpperCase(),
            type: bodyType || 'LOCAL_BODY',
            stateId: finalStateId,
            districtId: finalStateId, // Using state as district for now
            constituencyId: finalConstituencyId,
            address: city ? `${city}, ${address || ''}` : address || null,
          },
        });

        // Update user with the local body (this will override the default body if both exist)
        await prisma.user.update({
          where: { id: user.id },
          data: { bodyId: localBody.id },
        });
      } catch (bodyError) {
        console.error('Error creating/updating local body:', bodyError);
      }
    } else if (localBodyName) {
    }

    // Fetch the created member with related data
    const createdMember = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        memberProfile: true,
        state: { select: { name: true, code: true } },
        constituency: { select: { name: true, type: true } },
        body: { select: { name: true, type: true } },
        mla: {
          select: {
            name: true,
            email: true,
            mlaProfile: { select: { partyName: true } },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...createdMember,
        password: finalPassword, // Send password to admin (temporary if generated, custom if provided)
        isGenerated: !password, // Flag to indicate if password was auto-generated
      },
    });
  } catch (error) {
    console.error('Create Member error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const updateMember = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      bodyType,
      designation,
      description,
      mlaId,
      isActive,
    } = req.body;

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        mlaId: mlaId || null,
        isActive,
      },
    });

    // Update Member profile
    await prisma.memberProfile.upsert({
      where: { userId: id },
      update: {
        bodyType: bodyType || null,
        designation: designation || null,
        description: description || null,
      },
      create: {
        userId: id,
        bodyType: bodyType || null,
        designation: designation || null,
        description: description || null,
      },
    });

    // Get updated user with profile
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      include: {
        memberProfile: true,
        mla: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Update Member error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const deleteMember = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // 1. Delete all issue updates by this member
    await prisma.issueUpdate.deleteMany({
      where: { userId: id },
    });

    // 2. Delete all chat group memberships for this member
    await prisma.chatGroupMember.deleteMany({
      where: { userId: id },
    });

    // 3. Delete all chat group messages sent by this member
    await prisma.chatGroupMessage.deleteMany({
      where: { senderId: id },
    });

    // 4. Delete all chat message reads by this member
    await prisma.chatMessageRead.deleteMany({
      where: { userId: id },
    });

    // 5. Delete the member user (will cascade delete Member profile)
    await prisma.user.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Delete Member error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Issue Management
export const getAllIssuesAdmin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          reportedBy: { select: { name: true, email: true } },
          assignedTo: { select: { name: true, email: true } },
          state: { select: { name: true } },
          district: { select: { name: true } },
          constituency: { select: { name: true } },
        },
      }),
      prisma.issue.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        issues,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get all issues admin error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getIssueStats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const [
      totalIssues,
      pendingIssues,
      inProgressIssues,
      resolvedIssues,
      rejectedIssues,
      highPriorityIssues,
    ] = await Promise.all([
      prisma.issue.count(),
      prisma.issue.count({ where: { status: 'PENDING' } }),
      prisma.issue.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.issue.count({ where: { status: 'RESOLVED' } }),
      prisma.issue.count({ where: { status: 'REJECTED' } }),
      prisma.issue.count({ where: { priority: 'HIGH' } }),
    ]);

    res.json({
      success: true,
      data: {
        totalIssues,
        pendingIssues,
        inProgressIssues,
        resolvedIssues,
        rejectedIssues,
        highPriorityIssues,
      },
    });
  } catch (error) {
    console.error('Get issue stats error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const updateIssueStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, assignedToId, priority } = req.body;

    const issue = await prisma.issue.update({
      where: { id },
      data: {
        status: status as IssueStatus,
        assignedToId: assignedToId || null,
        priority: priority || undefined,
      },
      include: {
        reportedBy: { select: { name: true, email: true } },
        assignedTo: { select: { name: true, email: true } },
      },
    });

    res.json({ success: true, data: issue });
  } catch (error) {
    console.error('Update issue status error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// News Management
export const getAllNews = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          author: { select: { name: true, email: true } },
          state: { select: { name: true } },
        },
      }),
      prisma.news.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        news,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get all news error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const createNews = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      title,
      content,
      summary,
      category,
      stateId,
      isNational,
      tags,
      isActive,
      isPinned,
      featuredImage,
      attachments,
      slug: providedSlug,
      metaTitle,
      metaDescription,
      publishedAt,
    } = req.body;

    // Generate slug from title if not provided
    const slug =
      providedSlug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const news = await prisma.news.create({
      data: {
        title,
        content, // This will store the rich HTML content
        summary,
        category,
        stateId: stateId || null,
        isNational: isNational || false,
        tags: tags || [],
        isActive: isActive !== undefined ? isActive : true,
        isPinned: isPinned || false,
        featuredImage,
        attachments: attachments || null,
        slug,
        metaTitle,
        metaDescription,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        authorId: req.user!.id,
      },
      include: {
        author: { select: { name: true, email: true } },
        state: { select: { name: true } },
      },
    });

    res.status(201).json({ success: true, data: news });
  } catch (error) {
    console.error('Create news error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const updateNews = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      summary,
      category,
      stateId,
      isNational,
      tags,
      isActive,
      isPinned,
      featuredImage,
      attachments,
      slug: providedSlug,
      metaTitle,
      metaDescription,
      publishedAt,
    } = req.body;

    // Generate slug from title if not provided and title changed
    const updateData: any = {
      content, // Store rich HTML content
      summary,
      category,
      stateId: stateId || null,
      isNational: isNational || false,
      tags: tags || [],
      isActive,
      isPinned: isPinned || false,
      featuredImage,
      attachments: attachments || null,
      metaTitle,
      metaDescription,
    };

    // Only update title and slug if title is provided
    if (title) {
      updateData.title = title;
      updateData.slug =
        providedSlug ||
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
    }

    // Only update publishedAt if provided
    if (publishedAt) {
      updateData.publishedAt = new Date(publishedAt);
    }

    const news = await prisma.news.update({
      where: { id },
      data: updateData,
      include: {
        author: { select: { name: true, email: true } },
        state: { select: { name: true } },
      },
    });

    res.status(200).json({ success: true, data: news });
  } catch (error) {
    console.error('Update news error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const deleteNews = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.news.delete({
      where: { id },
    });

    res.json({ success: true, message: 'News deleted successfully' });
  } catch (error) {
    console.error('Delete news error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const toggleNews = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const news = await prisma.news.update({
      where: { id },
      data: { isActive },
    });

    res.json({
      success: true,
      message: `News ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: news,
    });
  } catch (error) {
    console.error('Toggle news error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Analytics
export const getAnalytics = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { timeRange = '30d' } = req.query;

    let dateFilter: any = {};
    const now = new Date();

    switch (timeRange) {
      case '7d':
        dateFilter = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case '30d':
        dateFilter = {
          gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        };
        break;
      case '90d':
        dateFilter = {
          gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        };
        break;
      case '1y':
        dateFilter = {
          gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
        };
        break;
    }

    const [
      userGrowth,
      issueStats,
      newsStats,
      resolvedIssuesCount,
      mlaPerformance,
      responseTimeMetrics,
      issuesByMonth,
    ] = await Promise.all([
      prisma.user.groupBy({
        by: ['role'],
        _count: { _all: true },
        where: { createdAt: dateFilter },
      }),
      prisma.issue.groupBy({
        by: ['status'],
        _count: { _all: true },
        where: { createdAt: dateFilter },
      }),
      prisma.news.groupBy({
        by: ['category'],
        _count: { _all: true },
        where: { createdAt: dateFilter },
      }),
      prisma.issue.count({
        where: {
          status: 'RESOLVED',
          createdAt: dateFilter,
        },
      }),
      // MLA Performance Analytics
      prisma.user.findMany({
        where: {
          role: UserRole.MLA,
          createdAt: dateFilter,
        },
        select: {
          id: true,
          name: true,
          email: true,
          constituency: {
            select: {
              name: true,
            },
          },
          assignedIssues: {
            where: { createdAt: dateFilter },
            select: {
              id: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      }),
      // Response Time Metrics
      prisma.issue.findMany({
        where: {
          status: 'RESOLVED',
          createdAt: dateFilter,
        },
        select: {
          createdAt: true,
          updatedAt: true,
        },
      }),
      // Issues by Month
      prisma.issue.findMany({
        where: { createdAt: dateFilter },
        select: {
          createdAt: true,
        },
      }),
    ]);

    // Process MLA Performance data
    const processedMlaPerformance = mlaPerformance.map((mla) => {
      const totalIssues = mla.assignedIssues.length;
      const resolvedIssues = mla.assignedIssues.filter(
        (issue) => issue.status === 'RESOLVED'
      ).length;
      const resolutionRate =
        totalIssues > 0
          ? ((resolvedIssues / totalIssues) * 100).toFixed(1)
          : '0';

      // Calculate average response time for this MLA
      const resolvedIssuesWithTime = mla.assignedIssues.filter(
        (issue) => issue.status === 'RESOLVED' && issue.updatedAt
      );

      const avgResponseTime =
        resolvedIssuesWithTime.length > 0
          ? resolvedIssuesWithTime.reduce((sum, issue) => {
              const responseTime =
                (new Date(issue.updatedAt!).getTime() -
                  new Date(issue.createdAt).getTime()) /
                (1000 * 60 * 60); // hours
              return sum + responseTime;
            }, 0) / resolvedIssuesWithTime.length
          : 0;

      return {
        name: mla.name,
        constituency: mla.constituency?.name || 'Not assigned',
        totalIssues,
        resolvedIssues,
        resolutionRate: `${resolutionRate}%`,
        avgResponseTime: avgResponseTime.toFixed(1),
      };
    });

    // Process Response Time Metrics
    const responseTimes = responseTimeMetrics
      .filter((issue) => issue.updatedAt)
      .map((issue) => {
        const responseTime =
          (new Date(issue.updatedAt!).getTime() -
            new Date(issue.createdAt).getTime()) /
          (1000 * 60 * 60); // hours
        return responseTime;
      });

    const processedResponseTimeMetrics = {
      fastest:
        responseTimes.length > 0 ? Math.min(...responseTimes).toFixed(1) : '0',
      slowest:
        responseTimes.length > 0 ? Math.max(...responseTimes).toFixed(1) : '0',
      average:
        responseTimes.length > 0
          ? (
              responseTimes.reduce((sum, time) => sum + time, 0) /
              responseTimes.length
            ).toFixed(1)
          : '0',
    };

    // Process Issues by Month
    const processedIssuesByMonth = () => {
      const monthCounts: { [key: string]: number } = {};

      issuesByMonth.forEach((issue) => {
        const date = new Date(issue.createdAt);
        const monthKey = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
        });
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      });

      // Convert to array format expected by frontend and sort chronologically
      const entries = Object.entries(monthCounts).map(([month, count]) => ({
        month,
        count,
        sortKey: new Date(month + ' 1').getTime(), // Add day for proper date parsing
      }));

      return entries
        .sort((a, b) => a.sortKey - b.sortKey)
        .map(({ month, count }) => ({ month, count }));
    };

    res.json({
      success: true,
      data: {
        userGrowth,
        issueStats,
        newsStats,
        resolvedIssuesCount,
        mlaPerformance: processedMlaPerformance,
        responseTimeMetrics: processedResponseTimeMetrics,
        issuesByMonth: processedIssuesByMonth(),
      },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Settings
export const getSettings = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // For now, return mock settings. In a real app, you'd have a Settings model
    const settings = {
      siteName: 'JagranPatra Admin',
      siteDescription: 'Administrative dashboard for JagranPatra platform',
      maintenanceMode: false,
      emailNotifications: true,
      smsNotifications: false,
      maxFileSize: 10485760, // 10MB
      allowedFileTypes: ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'],
      issueAutoAssignment: true,
      newsAutoPublish: false,
      userRegistration: true,
      defaultUserRole: UserRole.CITIZEN,
      sessionTimeout: 3600, // 1 hour
      passwordMinLength: 8,
      passwordRequireSpecial: true,
      twoFactorAuth: false,
    };

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const updateSettings = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const settings = req.body;

    // In a real app, you'd save these to a Settings model
    // For now, just return the updated settings
    res.json({
      success: true,
      data: settings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Export data functions
export const exportUsers = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { format = 'csv' } = req.query;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        state: { select: { name: true } },
        district: { select: { name: true } },
        constituency: { select: { name: true } },
      },
    });

    if (format === 'csv') {
      const csvData = users.map((user) => ({
        ID: user.id,
        Name: user.name,
        Email: user.email,
        Phone: user.phone || '',
        Role: user.role,
        Active: user.isActive ? 'Yes' : 'No',
        State: user.state?.name || '',
        District: user.district?.name || '',
        Constituency: user.constituency?.name || '',
        'Created At': user.createdAt.toISOString(),
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');

      // Simple CSV conversion
      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map((row) =>
          headers
            .map((header) => `"${row[header as keyof typeof row]}"`)
            .join(',')
        ),
      ].join('\n');

      res.send(csvContent);
    } else {
      res.json({ success: true, data: users });
    }
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const exportIssues = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { format = 'csv' } = req.query;

    const issues = await prisma.issue.findMany({
      include: {
        reportedBy: { select: { name: true, email: true } },
        assignedTo: { select: { name: true, email: true } },
        state: { select: { name: true } },
        district: { select: { name: true } },
        constituency: { select: { name: true } },
      },
    });

    if (format === 'csv') {
      const csvData = issues.map((issue) => ({
        ID: issue.id,
        Title: issue.title,
        Description: issue.description,
        Status: issue.status,
        Priority: issue.priority,
        'Reported By': issue.reportedBy.name,
        'Assigned To': issue.assignedTo?.name || '',
        State: issue.state?.name || '',
        District: issue.district?.name || '',
        Constituency: issue.constituency?.name || '',
        'Created At': issue.createdAt.toISOString(),
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="issues.csv"');

      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map((row) =>
          headers
            .map((header) => `"${row[header as keyof typeof row]}"`)
            .join(',')
        ),
      ].join('\n');

      res.send(csvContent);
    } else {
      res.json({ success: true, data: issues });
    }
  } catch (error) {
    console.error('Export issues error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Location Management Functions
export const getStates = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const states = await prisma.state.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true },
    });

    res.json({ success: true, data: states });
  } catch (error) {
    console.error('Get states error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getConstituencies = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { stateId } = req.query;

    const where: any = {};
    if (stateId) where.stateId = stateId;

    const constituencies = await prisma.constituency.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        state: { select: { name: true, code: true } },
        district: { select: { name: true } },
      },
    });

    res.json({ success: true, data: constituencies });
  } catch (error) {
    console.error('Get constituencies error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getConstituencyDetails = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const constituency = await prisma.constituency.findUnique({
      where: { id },
      include: {
        state: { select: { name: true, code: true } },
        district: { select: { name: true } },
        bodies: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            address: true,
          },
        },
      },
    });

    if (!constituency) {
      res.status(404).json({ success: false, error: 'Constituency not found' });
      return;
    }

    res.json({ success: true, data: constituency });
  } catch (error) {
    console.error('Get constituency details error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getLocalBodies = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { stateId, constituencyId, type } = req.query;

    const where: any = {};
    if (stateId) where.stateId = stateId;
    if (constituencyId) where.constituencyId = constituencyId;
    if (type) where.type = type;

    const bodies = await prisma.body.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        state: { select: { name: true } },
        constituency: { select: { name: true } },
      },
    });

    res.json({ success: true, data: bodies });
  } catch (error) {
    console.error('Get local bodies error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const initializeLocationData = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Read the assembly data from JSON file
    const assemblyDataPath = path.join(
      process.cwd(),
      'form20',
      'uk',
      '2024',
      'assembly.json'
    );

    if (!fs.existsSync(assemblyDataPath)) {
      res
        .status(404)
        .json({ success: false, error: 'Assembly data file not found' });
      return;
    }

    const assemblyData = JSON.parse(fs.readFileSync(assemblyDataPath, 'utf8'));

    // Create or get UK state
    const ukState = await prisma.state.upsert({
      where: { code: 'UK' },
      update: {},
      create: {
        name: 'Uttarakhand',
        code: 'UK',
        latitude: 30.0668,
        longitude: 79.0193,
      },
    });

    // Create a default district for UK (since constituencies require a district)
    const ukDistrict = await prisma.district.upsert({
      where: {
        stateId_code: {
          stateId: ukState.id,
          code: 'UK',
        },
      },
      update: {},
      create: {
        name: 'Uttarakhand',
        code: 'UK',
        stateId: ukState.id,
        latitude: 30.0668,
        longitude: 79.0193,
      },
    });

    // Create constituencies from assembly data
    const constituencies: any[] = [];
    for (const assembly of assemblyData) {
      const constituency = await prisma.constituency.upsert({
        where: {
          stateId_code: {
            stateId: ukState.id,
            code: assembly.Constituency.replace(/\s+/g, '_').toUpperCase(),
          },
        },
        update: {
          name: assembly.Constituency,
          latitude: assembly.Latitude,
          longitude: assembly.Longitude,
        },
        create: {
          name: assembly.Constituency,
          code: assembly.Constituency.replace(/\s+/g, '_').toUpperCase(),
          type: assembly.Constituency.includes('(SC)') ? 'SC' : 'GENERAL',
          stateId: ukState.id,
          districtId: ukDistrict.id, // Use the actual district
          latitude: assembly.Latitude,
          longitude: assembly.Longitude,
        },
      });
      constituencies.push(constituency);
    }

    res.json({
      success: true,
      data: {
        message: 'Location data initialized successfully',
        state: ukState,
        district: ukDistrict,
        constituencies: constituencies.length,
      },
    });
  } catch (error) {
    console.error('Initialize location data error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error', // Include error details for debugging
    });
  }
};
