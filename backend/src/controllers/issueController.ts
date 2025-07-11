import { Request, Response } from 'express';
import {
  PrismaClient,
  UserRole,
  IssueStatus,
  IssuePriority,
  UpdateType,
  MediaType,
} from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Create a new issue (MLA only)
export const createIssue = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      title,
      description,
      category,
      priority = 'MEDIUM',
      isUrgent = false,
      assignedToId,
      address,
      latitude,
      longitude,
      stateId,
      districtId,
      constituencyId,
      bodyId,
      voiceNote,
      images,
    } = req.body;

    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Verify the user is an MLA
    if (userRole !== 'MLA') {
      res.status(403).json({ error: 'Only MLAs can create issues' });
      return;
    }

    // Validate required fields
    if (!title || !description || !category || !stateId) {
      res
        .status(400)
        .json({
          error:
            'Missing required fields: title, description, category, stateId',
        });
      return;
    }

    // If assigning to someone, verify they are a MEMBER and under this MLA
    if (assignedToId) {
      const assignee = await prisma.user.findFirst({
        where: {
          id: assignedToId,
          role: 'MEMBER',
          mlaId: userId,
        },
      });

      if (!assignee) {
        res
          .status(400)
          .json({
            error: 'Invalid assignee. Must be a MEMBER under your supervision.',
          });
        return;
      }
    }

    const issue = await prisma.issue.create({
      data: {
        title,
        description,
        category,
        priority: priority as IssuePriority,
        isUrgent,
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        stateId,
        districtId,
        constituencyId,
        bodyId,
        voiceNote,
        images: images ? JSON.parse(images) : null,
        reportedById: userId,
        assignedToId: assignedToId || null,
      },
      include: {
        reportedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        state: {
          select: {
            id: true,
            name: true,
          },
        },
        district: {
          select: {
            id: true,
            name: true,
          },
        },
        constituency: {
          select: {
            id: true,
            name: true,
          },
        },
        body: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Create assignment notification if assigned
    if (assignedToId) {
      await prisma.issueUpdate.create({
        data: {
          issueId: issue.id,
          userId,
          message: `Issue assigned to ${issue.assignedTo?.name}`,
          updateType: 'ASSIGNMENT',
          mediaType: 'TEXT',
        },
      });
    }

    res.status(201).json({
      message: 'Issue created successfully',
      issue,
    });
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({ error: 'Failed to create issue', details: error });
  }
};

// Get all issues for the authenticated user
export const getIssues = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const {
      status,
      priority,
      category,
      page = 1,
      limit = 10,
      search,
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    let whereClause: any = {};

    // Filter based on user role
    if (userRole === 'MLA') {
      whereClause.reportedById = userId;
    } else if (userRole === 'MEMBER') {
      whereClause.assignedToId = userId;
    } else if (userRole === 'CITIZEN') {
      // Citizens can only see issues they reported
      whereClause.reportedById = userId;
    } else if (userRole === 'ADMIN') {
      // Admins can see all issues - no additional filter
    }

    // Add filters
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (category) whereClause.category = category;

    if (search) {
      whereClause.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where: whereClause,
        include: {
          reportedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          state: {
            select: {
              id: true,
              name: true,
            },
          },
          district: {
            select: {
              id: true,
              name: true,
            },
          },
          constituency: {
            select: {
              id: true,
              name: true,
            },
          },
          body: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          updates: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 3, // Latest 3 updates only in list view
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      prisma.issue.count({ where: whereClause }),
    ]);

    res.json({
      issues,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({ error: 'Failed to fetch issues', details: error });
  }
};

// Get a specific issue with all details
export const getIssueById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        reportedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            mlaId: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        state: {
          select: {
            id: true,
            name: true,
          },
        },
        district: {
          select: {
            id: true,
            name: true,
          },
        },
        constituency: {
          select: {
            id: true,
            name: true,
          },
        },
        body: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        updates: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!issue) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }

    // Check access permissions
    const hasAccess =
      userRole === 'ADMIN' ||
      issue.reportedById === userId ||
      issue.assignedToId === userId ||
      (userRole === 'MLA' &&
        issue.reportedBy.role === 'MEMBER' &&
        issue.reportedBy.mlaId === userId);

    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ issue });
  } catch (error) {
    console.error('Get issue by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch issue', details: error });
  }
};

// Add an update/comment to an issue
export const addIssueUpdate = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      message,
      status,
      updateType,
      mediaType = 'TEXT',
      audioUrl,
      imageUrls,
      hoursWorked,
      progressPercentage,
      nextSteps,
    } = req.body;

    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Verify issue exists
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        reportedBy: true,
        assignedTo: true,
      },
    });

    if (!issue) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }

    // Determine update type based on user role and permissions
    let finalUpdateType: UpdateType;

    if (userRole === 'MEMBER' && issue.assignedToId === userId) {
      finalUpdateType = 'MEMBER_UPDATE';
    } else if (userRole === 'CITIZEN') {
      finalUpdateType = 'CITIZEN_COMMENT';
    } else if (userRole === 'MLA' && issue.reportedById === userId) {
      finalUpdateType = updateType || 'MEMBER_UPDATE';
    } else if (userRole === 'ADMIN') {
      finalUpdateType = updateType || 'MEMBER_UPDATE';
    } else {
      res.status(403).json({ error: 'Not authorized to update this issue' });
      return;
    }

    // Validate required fields based on update type
    if (finalUpdateType === 'MEMBER_UPDATE' && !message && !audioUrl) {
      res
        .status(400)
        .json({ error: 'Message or audio is required for member updates' });
      return;
    }

    const updateData: any = {
      issueId: id,
      userId,
      updateType: finalUpdateType,
      mediaType: mediaType as MediaType,
    };

    if (message) updateData.message = message;
    if (status) updateData.status = status as IssueStatus;
    if (audioUrl) updateData.audioUrl = audioUrl;
    if (imageUrls)
      updateData.imageUrls = Array.isArray(imageUrls)
        ? imageUrls
        : JSON.parse(imageUrls);
    if (hoursWorked) updateData.hoursWorked = parseFloat(hoursWorked);
    if (progressPercentage)
      updateData.progressPercentage = parseInt(progressPercentage);
    if (nextSteps) updateData.nextSteps = nextSteps;

    const update = await prisma.issueUpdate.create({
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Update issue status if provided
    if (status) {
      await prisma.issue.update({
        where: { id },
        data: {
          status: status as IssueStatus,
          ...(status === 'RESOLVED' && { actualResolutionDate: new Date() }),
        },
      });
    }

    res.status(201).json({
      message: 'Update added successfully',
      update,
    });
  } catch (error) {
    console.error('Add issue update error:', error);
    res.status(500).json({ error: 'Failed to add update', details: error });
  }
};

// Update issue (assign, reassign, change priority, etc.)
export const updateIssue = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      priority,
      isUrgent,
      assignedToId,
      status,
      expectedResolutionDate,
      resolutionNotes,
    } = req.body;

    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Verify issue exists
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        reportedBy: true,
        assignedTo: true,
      },
    });

    if (!issue) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }

    // Check permissions
    const canUpdate =
      userRole === 'ADMIN' ||
      (userRole === 'MLA' && issue.reportedById === userId) ||
      (userRole === 'MEMBER' && issue.assignedToId === userId);

    if (!canUpdate) {
      res.status(403).json({ error: 'Not authorized to update this issue' });
      return;
    }

    // If assigning to someone new, verify they are a MEMBER
    if (assignedToId && assignedToId !== issue.assignedToId) {
      const assignee = await prisma.user.findFirst({
        where: {
          id: assignedToId,
          role: 'MEMBER',
        },
      });

      if (!assignee) {
        res.status(400).json({ error: 'Invalid assignee. Must be a MEMBER.' });
        return;
      }
    }

    const updateData: any = {};

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (priority) updateData.priority = priority as IssuePriority;
    if (typeof isUrgent === 'boolean') updateData.isUrgent = isUrgent;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
    if (status) updateData.status = status as IssueStatus;
    if (expectedResolutionDate)
      updateData.expectedResolutionDate = new Date(expectedResolutionDate);
    if (resolutionNotes) updateData.resolutionNotes = resolutionNotes;

    const updatedIssue = await prisma.issue.update({
      where: { id },
      data: updateData,
      include: {
        reportedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Create update record for assignment changes
    if (assignedToId !== undefined && assignedToId !== issue.assignedToId) {
      const assigneeName = assignedToId
        ? updatedIssue.assignedTo?.name
        : 'Unassigned';
      await prisma.issueUpdate.create({
        data: {
          issueId: id,
          userId,
          message: `Issue ${assignedToId ? 'assigned to' : 'unassigned from'} ${assigneeName}`,
          updateType: 'ASSIGNMENT',
          mediaType: 'TEXT',
        },
      });
    }

    // Create update record for status changes
    if (status && status !== issue.status) {
      await prisma.issueUpdate.create({
        data: {
          issueId: id,
          userId,
          message: `Status changed from ${issue.status} to ${status}`,
          status: status as IssueStatus,
          updateType: 'STATUS_CHANGE',
          mediaType: 'TEXT',
        },
      });
    }

    res.json({
      message: 'Issue updated successfully',
      issue: updatedIssue,
    });
  } catch (error) {
    console.error('Update issue error:', error);
    res.status(500).json({ error: 'Failed to update issue', details: error });
  }
};

// Get issue statistics for dashboard
export const getIssueStats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let whereClause: any = {};

    // Filter based on user role
    if (userRole === 'MLA') {
      whereClause.reportedById = userId;
    } else if (userRole === 'MEMBER') {
      whereClause.assignedToId = userId;
    } else if (userRole === 'CITIZEN') {
      whereClause.reportedById = userId;
    }
    // ADMIN sees all issues

    const [
      totalIssues,
      pendingIssues,
      inProgressIssues,
      resolvedIssues,
      urgentIssues,
      issuesByPriority,
      issuesByCategory,
      recentIssues,
    ] = await Promise.all([
      prisma.issue.count({ where: whereClause }),
      prisma.issue.count({ where: { ...whereClause, status: 'PENDING' } }),
      prisma.issue.count({ where: { ...whereClause, status: 'IN_PROGRESS' } }),
      prisma.issue.count({ where: { ...whereClause, status: 'RESOLVED' } }),
      prisma.issue.count({ where: { ...whereClause, isUrgent: true } }),

      // Group by priority
      prisma.issue.groupBy({
        by: ['priority'],
        where: whereClause,
        _count: {
          priority: true,
        },
      }),

      // Group by category
      prisma.issue.groupBy({
        by: ['category'],
        where: whereClause,
        _count: {
          category: true,
        },
      }),

      // Recent issues
      prisma.issue.findMany({
        where: whereClause,
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),
    ]);

    res.json({
      stats: {
        total: totalIssues,
        pending: pendingIssues,
        inProgress: inProgressIssues,
        resolved: resolvedIssues,
        urgent: urgentIssues,
        resolutionRate:
          totalIssues > 0
            ? ((resolvedIssues / totalIssues) * 100).toFixed(2)
            : 0,
      },
      charts: {
        priorityDistribution: issuesByPriority.map((item) => ({
          priority: item.priority,
          count: item._count.priority,
        })),
        categoryDistribution: issuesByCategory.map((item) => ({
          category: item.category,
          count: item._count.category,
        })),
      },
      recentIssues,
    });
  } catch (error) {
    console.error('Get issue stats error:', error);
    res
      .status(500)
      .json({ error: 'Failed to fetch issue statistics', details: error });
  }
};

// Delete issue (Admin and MLA who created it only)
export const deleteIssue = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const issue = await prisma.issue.findUnique({
      where: { id },
    });

    if (!issue) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }

    // Check permissions
    const canDelete =
      userRole === 'ADMIN' ||
      (userRole === 'MLA' && issue.reportedById === userId);

    if (!canDelete) {
      res.status(403).json({ error: 'Not authorized to delete this issue' });
      return;
    }

    await prisma.issue.delete({
      where: { id },
    });

    res.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    console.error('Delete issue error:', error);
    res.status(500).json({ error: 'Failed to delete issue', details: error });
  }
};
