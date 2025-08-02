import { Request, Response } from 'express';
import {
  PrismaClient,
  UserRole,
  IssueStatus,
  IssuePriority,
  UpdateType,
  MediaType,
  NotificationStatus,
} from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  createAssignmentNotification,
  createIssueUpdateNotification,
} from './notificationController';
import cloudinary, { uploadBufferToCloudinary } from '../utils/cloudinary';
// import { geocodeAddress } from '../utils/geocoding';

const prisma = new PrismaClient();

// Helper function to log MLA information for debugging
const logMLAInfo = async (stateId: string) => {
  try {
    const mlas = await prisma.user.findMany({
      where: {
        role: UserRole.MLA,
        stateId: stateId,
        isActive: true,
      },
      include: {
        mlaProfile: true,
        constituency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching MLA info:', error);
  }
};

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
      priority = IssuePriority.MEDIUM,
      isUrgent = false,
      assignedToId,
      address,
      stateId,
      districtId,
      constituencyId,
      bodyId,
    } = req.body;

    // Make latitude and longitude mutable
    let { latitude, longitude } = req.body;

    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Handle uploaded files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    let voiceNoteUrl: string | null = null;
    let imageUrls: string[] = [];

    if (files) {
      // Handle voice note
      if (files.voiceNote && files.voiceNote.length > 0) {
        // Upload to Cloudinary
        const file = files.voiceNote[0];
        try {
          const result: any = await uploadBufferToCloudinary(
            file.buffer,
            'issues/audio',
            'auto'
          );
          voiceNoteUrl = result.secure_url;
        } catch (err) {
          console.error('Cloudinary upload error (voiceNote):', err);
          res
            .status(500)
            .json({ error: 'Failed to upload voice note to Cloudinary' });
          return;
        }
      }

      // Handle images
      if (files.images && files.images.length > 0) {
        try {
          const uploadPromises = files.images.map((file) =>
            uploadBufferToCloudinary(file.buffer, 'issues/images', 'image')
          );
          const results: any[] = await Promise.all(uploadPromises);
          imageUrls = results.map((r) => r.secure_url);
        } catch (err) {
          console.error('Cloudinary upload error (images):', err);
          res
            .status(500)
            .json({ error: 'Failed to upload images to Cloudinary' });
          return;
        }
      }
    }

    // Verify the user is an MLA or CITIZEN
    if (userRole !== UserRole.MLA && userRole !== UserRole.CITIZEN) {
      res
        .status(403)
        .json({ error: 'Only MLAs and Citizens can create issues' });
      return;
    }

    // Validate required fields
    if (!title || !description || !category) {
      res.status(400).json({
        error: 'Missing required fields: title, description, category',
      });
      return;
    }

    // Validate stateId exists in database
    let validatedStateId = stateId;
    if (stateId) {
      const stateExists = await prisma.state.findUnique({
        where: { id: stateId },
      });

      if (!stateExists) {
        if (!validatedStateId || stateId === validatedStateId) {
          const fallbackState = await prisma.state.findFirst({
            orderBy: { name: 'asc' },
          });

          if (fallbackState) {
            validatedStateId = fallbackState.id;
          } else {
            res.status(400).json({
              error:
                'No valid state found. Please ensure location data is configured.',
            });
            return;
          }
        }
      }
    } else {
      // If we still don't have a valid state, use the first available state as fallback
      if (!validatedStateId) {
        const fallbackState = await prisma.state.findFirst({
          orderBy: { name: 'asc' },
        });

        if (fallbackState) {
          validatedStateId = fallbackState.id;
        } else {
          res.status(400).json({
            error:
              'No valid state found. Please ensure location data is configured.',
          });
          return;
        }
      }
    }

    // Handle assignment logic based on user role
    if (assignedToId) {
      if (userRole === UserRole.MLA) {
        // For MLAs, verify they are assigning to a MEMBER under their supervision
        const assignee = await prisma.user.findFirst({
          where: {
            id: assignedToId,
            role: UserRole.MEMBER,
            mlaId: userId,
          },
        });

        if (!assignee) {
          res.status(400).json({
            error: 'Invalid assignee. Must be a MEMBER under your supervision.',
          });
          return;
        }
      } else if (userRole === UserRole.CITIZEN) {
        // For CITIZENS, verify they are assigning to a valid MEMBER or MLA
        const assignee = await prisma.user.findFirst({
          where: {
            id: assignedToId,
            role: { in: [UserRole.MEMBER, UserRole.MLA] },
          },
        });

        if (!assignee) {
          res.status(400).json({
            error: 'Invalid assignee. Must be a valid MEMBER or MLA.',
          });
          return;
        }
      }
    }

    // For CITIZEN users, auto-assign to relevant MLA based on location and constituency
    let finalAssignedToId = assignedToId;
    let autoAssignedConstituencyId = constituencyId;

    if (userRole === UserRole.CITIZEN && !assignedToId) {
      // Debug: Log MLA information for this state
      await logMLAInfo(validatedStateId);

      // If constituency is not provided, try to find nearest constituency based on coordinates
      if (!constituencyId && latitude && longitude) {
        const constituencies = await prisma.constituency.findMany({
          where: {
            stateId: validatedStateId,
            latitude: { not: null },
            longitude: { not: null },
          },
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
          },
        });

        // Simple distance calculation to find nearest constituency
        let nearestConstituency: { id: string; name: string } | null = null;
        let minDistance = Infinity;

        const userLat = parseFloat(latitude);
        const userLng = parseFloat(longitude);

        for (const constituency of constituencies) {
          if (constituency.latitude && constituency.longitude) {
            // Calculate distance using Haversine formula approximation
            const constLat = constituency.latitude;
            const constLng = constituency.longitude;

            const deltaLat = ((constLat - userLat) * Math.PI) / 180;
            const deltaLng = ((constLng - userLng) * Math.PI) / 180;

            const a =
              Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos((userLat * Math.PI) / 180) *
                Math.cos((constLat * Math.PI) / 180) *
                Math.sin(deltaLng / 2) *
                Math.sin(deltaLng / 2);

            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = 6371 * c; // Earth's radius in kilometers

            if (distance < minDistance) {
              minDistance = distance;
              nearestConstituency = constituency;
            }
          }
        }

        if (nearestConstituency) {
          autoAssignedConstituencyId = nearestConstituency.id;
        }
      }

      // Find the MLA for the constituency
      if (autoAssignedConstituencyId) {
        const mla = await prisma.user.findFirst({
          where: {
            role: UserRole.MLA,
            constituencyId: autoAssignedConstituencyId,
            isActive: true,
          },
          include: {
            mlaProfile: true,
          },
        });

        if (mla) {
          finalAssignedToId = mla.id;
        }
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
        stateId: validatedStateId,
        districtId,
        constituencyId: autoAssignedConstituencyId || constituencyId,
        bodyId,
        voiceNote: voiceNoteUrl,
        images: imageUrls.length > 0 ? imageUrls : undefined,
        reportedById: userId,
        assignedToId: finalAssignedToId || null,
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
    if (finalAssignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: finalAssignedToId },
        select: { name: true, role: true },
      });

      let assignmentMessage = `Issue assigned to ${assignedUser?.name || 'Unknown'}`;
      if (userRole === UserRole.CITIZEN && !assignedToId) {
        assignmentMessage = `Issue automatically assigned to MLA ${assignedUser?.name || 'Unknown'} based on your location`;
      }

      await prisma.issueUpdate.create({
        data: {
          issueId: issue.id,
          userId,
          message: assignmentMessage,
          updateType: UpdateType.ASSIGNMENT,
          mediaType: MediaType.TEXT,
        },
      });

      // Create notification for the assigned user
      try {
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true },
        });

        await createAssignmentNotification(
          issue.id,
          issue.title,
          finalAssignedToId,
          userId,
          currentUser?.name || 'Unknown'
        );
      } catch (error) {
        console.error('❌ Failed to create assignment notification:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
          console.error('Stack trace:', error.stack);
        }
        // Don't throw here - we don't want notification failure to prevent issue creation
      }
    } else {
      // If no MLA found, try to find any MLA in the same state as fallback
      if (
        userRole === UserRole.CITIZEN &&
        !finalAssignedToId &&
        validatedStateId
      ) {
        const fallbackMla = await prisma.user.findFirst({
          where: {
            role: UserRole.MLA,
            stateId: validatedStateId,
            isActive: true,
          },
          include: {
            mlaProfile: true,
          },
        });

        if (fallbackMla) {
          await prisma.issue.update({
            where: { id: issue.id },
            data: { assignedToId: fallbackMla.id },
          });

          await prisma.issueUpdate.create({
            data: {
              issueId: issue.id,
              userId,
              message: `Issue assigned to MLA ${fallbackMla.name}`,
              updateType: UpdateType.ASSIGNMENT,
              mediaType: MediaType.TEXT,
            },
          });

          // Create notification for fallback assignment
          try {
            const currentUser = await prisma.user.findUnique({
              where: { id: userId },
              select: { name: true },
            });

            await createAssignmentNotification(
              issue.id,
              issue.title,
              fallbackMla.id,
              userId,
              currentUser?.name || 'Unknown'
            );
          } catch (error) {
            console.error(
              '❌ Failed to create fallback assignment notification:',
              error
            );
            if (error instanceof Error) {
              console.error('Error details:', error.message);
              console.error('Stack trace:', error.stack);
            }
          }
        }
      }
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

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.max(
      1,
      Math.min(100, parseInt(limit as string) || 10)
    );
    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    let whereClause: any = {};

    // Filter based on user role
    if (userRole === UserRole.MLA) {
      whereClause.reportedById = userId;
    } else if (userRole === UserRole.MEMBER) {
      whereClause.assignedToId = userId;
    } else if (userRole === UserRole.CITIZEN) {
      // Citizens can only see issues they reported
      whereClause.reportedById = userId;
    } else if (userRole === UserRole.ADMIN) {
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

    // // Check access permissions
    // const hasAccess =
    //   userRole === UserRole.ADMIN ||
    //   issue.reportedById === userId ||
    //   issue.assignedToId === userId ||
    //   (userRole === UserRole.MLA &&
    //     issue.reportedBy.role === UserRole.MEMBER &&
    //     issue.reportedBy.mlaId === userId);

    // if (!hasAccess) {
    //   res.status(403).json({ error: 'Access denied' });
    //   return;
    // }

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
      mediaType = MediaType.TEXT,
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

    if (userRole === UserRole.MEMBER) {
      // Check if member can update this issue (directly assigned or assigned to their MLA)
      if (issue.assignedToId === userId) {
        finalUpdateType = UpdateType.MEMBER_UPDATE;
      } else {
        // Check if member is under the MLA who is assigned to this issue
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { mlaId: true },
        });

        if (currentUser?.mlaId === issue.assignedToId) {
          finalUpdateType = UpdateType.MEMBER_UPDATE;
        } else {
          res
            .status(403)
            .json({ error: 'Not authorized to update this issue' });
          return;
        }
      }
    } else if (userRole === UserRole.CITIZEN) {
      finalUpdateType = UpdateType.CITIZEN_COMMENT;
    } else if (userRole === UserRole.MLA) {
      // MLAs can update issues assigned to them OR issues they reported
      if (issue.assignedToId === userId || issue.reportedById === userId) {
        finalUpdateType = updateType || UpdateType.MEMBER_UPDATE;
      } else {
        res.status(403).json({ error: 'Not authorized to update this issue' });
        return;
      }
    } else if (userRole === UserRole.ADMIN) {
      finalUpdateType = updateType || UpdateType.MEMBER_UPDATE;
    } else {
      res.status(403).json({ error: 'Not authorized to update this issue' });
      return;
    }

    // Validate required fields based on update type
    if (finalUpdateType === UpdateType.MEMBER_UPDATE && !message && !audioUrl) {
      res
        .status(400)
        .json({ error: 'Message or audio is required for member updates' });
      return;
    }

    // Validate mediaType
    if (
      mediaType &&
      !Object.values(MediaType).includes(mediaType as MediaType)
    ) {
      res.status(400).json({ error: 'Invalid media type' });
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

    // Update issue status if provided, or auto-set to IN_PROGRESS for member updates
    if (status) {
      await prisma.issue.update({
        where: { id },
        data: {
          status: status as IssueStatus,
          ...(status === IssueStatus.RESOLVED && {
            actualResolutionDate: new Date(),
          }),
        },
      });
    } else if (
      finalUpdateType === UpdateType.MEMBER_UPDATE &&
      issue.status === IssueStatus.PENDING
    ) {
      // Auto-set to IN_PROGRESS when member makes first update on pending issue
      await prisma.issue.update({
        where: { id },
        data: {
          status: IssueStatus.IN_PROGRESS,
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
      assignedToId: originalAssignedToId,
      status,
      expectedResolutionDate,
      resolutionNotes,
    } = req.body;

    let assignedToId = originalAssignedToId;

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
    let canUpdate = false;

    if (userRole === UserRole.ADMIN) {
      canUpdate = true;
    } else if (userRole === UserRole.MLA) {
      // MLAs can update issues that are:
      // 1. Assigned to them directly
      // 2. Reported by them
      // 3. Assigned to their members
      if (issue.assignedToId === userId || issue.reportedById === userId) {
        canUpdate = true;
      } else if (issue.assignedToId) {
        // Check if the issue is assigned to one of their members
        const assignedMember = await prisma.user.findUnique({
          where: { id: issue.assignedToId },
          select: { mlaId: true, role: true },
        });

        if (
          assignedMember?.mlaId === userId &&
          assignedMember?.role === UserRole.MEMBER
        ) {
          canUpdate = true;
        }
      } else {
        // If issue is unassigned, MLA can update it if it's in their constituency
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { constituency: true },
        });

        if (currentUser?.constituency === issue.constituencyId) {
          canUpdate = true;
        }
      }
    } else if (userRole === UserRole.MEMBER) {
      // Check if member can update this issue (directly assigned or assigned to their MLA)
      if (issue.assignedToId === userId) {
        canUpdate = true;
      } else {
        // Check if member is under the MLA who is assigned to this issue
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { mlaId: true },
        });

        if (currentUser?.mlaId === issue.assignedToId) {
          canUpdate = true;
        }
      }
    }

    if (!canUpdate) {
      res.status(403).json({ error: 'Not authorized to update this issue' });
      return;
    }

    // Handle assignment logic
    if (assignedToId !== undefined && assignedToId !== issue.assignedToId) {
      if (assignedToId === null) {
        // If unassigning and current user is MLA, reassign to MLA
        if (userRole === UserRole.MLA) {
          assignedToId = userId;
        }
      } else {
        // If assigning to someone new, verify they are a MEMBER and under supervision (for MLAs)
        const assignee = await prisma.user.findFirst({
          where: {
            id: assignedToId,
            role: UserRole.MEMBER,
          },
        });

        if (!assignee) {
          res
            .status(400)
            .json({ error: 'Invalid assignee. Must be a MEMBER.' });
          return;
        }

        // If the current user is an MLA, ensure they can only assign to their members
        if (userRole === UserRole.MLA) {
          const memberUnderMLA = await prisma.user.findFirst({
            where: {
              id: assignedToId,
              role: UserRole.MEMBER,
              mlaId: userId, // Member must be under this MLA
            },
          });

          if (!memberUnderMLA) {
            res.status(400).json({
              error:
                'You can only assign issues to members under your supervision.',
            });
            return;
          }
        }
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
          updateType: UpdateType.ASSIGNMENT,
          mediaType: MediaType.TEXT,
        },
      });

      // Send assignment notification to the assignee
      if (assignedToId && updatedIssue.assignedTo) {
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true },
        });

        await createAssignmentNotification(
          id,
          updatedIssue.title,
          assignedToId,
          userId,
          currentUser?.name || 'Admin'
        );
      }

      // Send notification to the citizen who reported the issue
      if (updatedIssue.reportedBy) {
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true },
        });

        await createIssueUpdateNotification(
          id,
          updatedIssue.title,
          updatedIssue.reportedBy.id,
          userId,
          currentUser?.name || 'Admin',
          `Your issue has been ${assignedToId ? 'assigned to' : 'unassigned from'} ${assigneeName}`,
          updatedIssue.status
        );
      }
    }

    // Create update record for status changes
    if (status && status !== issue.status) {
      await prisma.issueUpdate.create({
        data: {
          issueId: id,
          userId,
          message: `Status changed from ${issue.status} to ${status}`,
          status: status as IssueStatus,
          updateType: UpdateType.STATUS_CHANGE,
          mediaType: MediaType.TEXT,
        },
      });

      // Send notification to the citizen who reported the issue
      if (updatedIssue.reportedBy) {
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true },
        });

        await createIssueUpdateNotification(
          id,
          updatedIssue.title,
          updatedIssue.reportedBy.id,
          userId,
          currentUser?.name || 'Admin',
          `Status changed from ${issue.status} to ${status}`,
          status
        );
      }

      // If assigned to someone, also notify the assignee about status change
      if (updatedIssue.assignedTo && updatedIssue.assignedTo.id !== userId) {
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true },
        });

        await createIssueUpdateNotification(
          id,
          updatedIssue.title,
          updatedIssue.assignedTo.id,
          userId,
          currentUser?.name || 'Admin',
          `Status changed from ${issue.status} to ${status}`,
          status
        );
      }
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
    if (userRole === UserRole.MLA) {
      whereClause.reportedById = userId;
    } else if (userRole === UserRole.MEMBER) {
      whereClause.assignedToId = userId;
    } else if (userRole === UserRole.CITIZEN) {
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
      prisma.issue.count({
        where: { ...whereClause, status: IssueStatus.PENDING },
      }),
      prisma.issue.count({
        where: { ...whereClause, status: IssueStatus.IN_PROGRESS },
      }),
      prisma.issue.count({
        where: { ...whereClause, status: IssueStatus.RESOLVED },
      }),
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
      userRole === UserRole.ADMIN ||
      (userRole === UserRole.MLA && issue.reportedById === userId);

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

// Get issues assigned to the current user (for MLAs and Members)
export const getAssignedIssues = async (
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

    // Only MLAs and Members can access assigned issues
    if (userRole !== UserRole.MLA && userRole !== UserRole.MEMBER) {
      res.status(403).json({
        error: 'Access denied. Only MLAs and Members can view assigned issues.',
      });
      return;
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.max(
      1,
      Math.min(100, parseInt(limit as string) || 10)
    );
    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    let whereClause: any = {};

    // For MLAs: get issues assigned to them OR assigned to their members
    // For Members: get issues assigned to them directly or to their MLA
    if (userRole === UserRole.MLA) {
      // Get all members under this MLA
      const memberIds = await prisma.user.findMany({
        where: {
          mlaId: userId,
          role: UserRole.MEMBER,
        },
        select: { id: true },
      });

      const memberIdList = memberIds.map((member) => member.id);

      // Show issues assigned to the MLA OR assigned to any of their members
      whereClause.OR = [
        { assignedToId: userId }, // Issues assigned directly to the MLA
        { assignedToId: { in: memberIdList } }, // Issues assigned to their members
      ];
    } else if (userRole === UserRole.MEMBER) {
      // Get current user's MLA information
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { mlaId: true },
      });

      if (currentUser?.mlaId) {
        // Show issues assigned to the member directly OR to their MLA
        whereClause.OR = [
          { assignedToId: userId }, // Issues assigned directly to the member
          { assignedToId: currentUser.mlaId }, // Issues assigned to their MLA
        ];
      } else {
        // If member has no MLA, show issues directly assigned to them
        whereClause.assignedToId = userId;
      }
    }

    // Add additional filters
    const additionalFilters: any = {};
    if (status) additionalFilters.status = status;
    if (priority) additionalFilters.priority = priority;
    if (category) additionalFilters.category = category;

    // Combine assignment filters with additional filters
    let finalWhereClause: any;
    if (whereClause.OR) {
      // If we have OR clause for assignments, wrap everything in AND
      finalWhereClause = {
        AND: [
          whereClause, // Assignment OR clause
          additionalFilters, // Other filters
        ],
      };
    } else {
      // Simple case: no OR clause, just combine filters
      finalWhereClause = {
        ...whereClause,
        ...additionalFilters,
      };
    }

    // Handle search separately to avoid OR clause conflicts
    if (search) {
      if (finalWhereClause.AND) {
        finalWhereClause.AND.push({
          OR: [
            { title: { contains: search as string, mode: 'insensitive' } },
            {
              description: { contains: search as string, mode: 'insensitive' },
            },
          ],
        });
      } else {
        finalWhereClause.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
        ];
      }
    }

    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where: finalWhereClause,
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

    // Map updates to progressUpdates for frontend compatibility
    const issuesWithProgressUpdates = issues.map((issue) => ({
      ...issue,
      progressUpdates: issue.updates,
    }));

    res.json({
      success: true,
      data: {
        issues: issuesWithProgressUpdates,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get assigned issues error:', error);
    res
      .status(500)
      .json({ error: 'Failed to fetch assigned issues', details: error });
  }
};

// Get issues reported by the current user (for Citizens)
export const getMyIssues = async (
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

    // Only Citizens can access their own issues
    if (userRole !== UserRole.CITIZEN) {
      res.status(403).json({
        error: 'Access denied. Only Citizens can view their own issues.',
      });
      return;
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.max(
      1,
      Math.min(100, parseInt(limit as string) || 10)
    );
    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    let whereClause: any = {
      reportedById: userId,
    };

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

    // Map updates to progressUpdates for frontend compatibility
    const issuesWithProgressUpdates = issues.map((issue) => ({
      ...issue,
      progressUpdates: issue.updates,
    }));

    res.json({
      success: true,
      data: {
        issues: issuesWithProgressUpdates,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get my issues error:', error);
    res
      .status(500)
      .json({ error: 'Failed to fetch your issues', details: error });
  }
};

// Update issue progress (for MLAs and Members)
export const updateIssueProgress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      status,
      progressUpdate,
      estimatedCompletion,
      progressPercentage,
      hoursWorked,
      nextSteps,
      attachments,
      priority,
    } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Verify issue exists and user has permission
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        assignedTo: true,
        reportedBy: true,
      },
    });

    if (!issue) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }

    // Check permissions: assigned user or member under the assigned MLA can update
    let canUpdate = false;

    if (userRole === UserRole.ADMIN) {
      canUpdate = true;
    } else if (issue.assignedToId === userId) {
      // User is directly assigned to the issue
      canUpdate = true;
    } else if (userRole === UserRole.MLA) {
      // MLAs can update issues assigned to them (even if assignedToId is null for auto-assignment)
      // Also allow MLAs to update issues in their constituency
      canUpdate = true;
    } else if (userRole === UserRole.MEMBER) {
      // Check if member is under the MLA who is assigned to this issue
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { mlaId: true },
      });

      if (currentUser?.mlaId === issue.assignedToId) {
        canUpdate = true;
      }
    }

    if (!canUpdate) {
      res.status(403).json({
        error: 'You can only update issues assigned to you or your MLA',
      });
      return;
    }

    // Validate required fields
    if (!progressUpdate || progressUpdate.trim() === '') {
      res.status(400).json({ error: 'Progress update message is required' });
      return;
    }

    // Prepare update data for the issue
    const updateData: any = {};

    // Auto-set status to IN_PROGRESS if it's currently PENDING and member is making first update
    if (!status && issue.status === IssueStatus.PENDING) {
      updateData.status = IssueStatus.IN_PROGRESS;
    } else if (
      status &&
      Object.values(IssueStatus).includes(status as IssueStatus)
    ) {
      updateData.status = status;
    }

    // Set resolution date if status is RESOLVED
    if (updateData.status === IssueStatus.RESOLVED) {
      updateData.actualResolutionDate = new Date();
    }

    if (estimatedCompletion) {
      updateData.expectedResolutionDate = new Date(estimatedCompletion);
    }

    // Update the issue if there are changes
    if (Object.keys(updateData).length > 0) {
      await prisma.issue.update({
        where: { id },
        data: updateData,
      });
    }

    // Create the progress update
    const progressUpdateData: any = {
      issueId: id,
      userId,
      message: progressUpdate,
      updateType: UpdateType.MEMBER_UPDATE, // Both MLAs and Members use MEMBER_UPDATE
      mediaType: MediaType.TEXT,
    };

    // Set the status in the update record (either provided or auto-set to IN_PROGRESS)
    if (status) {
      progressUpdateData.status = status;
    } else if (issue.status === IssueStatus.PENDING) {
      progressUpdateData.status = IssueStatus.IN_PROGRESS;
    }

    if (
      progressPercentage !== undefined &&
      progressPercentage >= 0 &&
      progressPercentage <= 100
    ) {
      progressUpdateData.progressPercentage = parseInt(progressPercentage);
    }
    if (hoursWorked !== undefined && hoursWorked >= 0) {
      progressUpdateData.hoursWorked = parseFloat(hoursWorked);
    }
    if (nextSteps && nextSteps.trim()) {
      progressUpdateData.nextSteps = nextSteps.trim();
    }
    if (attachments && Array.isArray(attachments)) {
      progressUpdateData.attachments = attachments;
    }

    const update = await prisma.issueUpdate.create({
      data: progressUpdateData,
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

    // If priority is provided, update the issue's priority
    const upperPriority = priority.toUpperCase();
    if (
      upperPriority &&
      Object.values(IssuePriority).includes(upperPriority as IssuePriority)
    ) {
      await prisma.issue.update({
        where: { id },
        data: {
          priority: upperPriority as IssuePriority,
        },
      });
    }

    // Notify the citizen who reported the issue
    try {
      // Get the user details for the notification
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      if (currentUser && issue.reportedById !== userId) {
        await createIssueUpdateNotification(
          issue.id,
          issue.title,
          issue.reportedById,
          userId,
          currentUser.name,
          updateData.message || 'Issue has been updated',
          updateData.status
        );
      }
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail the entire request if notification fails
    }

    res.json({
      success: true,
      message: 'Issue progress updated successfully',
      data: {
        update,
        newStatus: updateData.status || issue.status,
      },
    });
  } catch (error) {
    console.error('Update issue progress error:', error);
    res
      .status(500)
      .json({ error: 'Failed to update issue progress', details: error });
  }
};

// Get nearby issues (public - no authentication required)
export const getNearbyIssues = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      latitude,
      longitude,
      radius = 5, // Default radius in kilometers
      status,
      priority,
      category,
      page = 1,
      limit = 10,
      search,
    } = req.query;

    // Validate required parameters
    if (!latitude || !longitude) {
      res.status(400).json({
        error: 'Latitude and longitude are required',
      });
      return;
    }

    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);
    const radiusKm = parseFloat(radius as string);

    if (isNaN(lat) || isNaN(lng) || isNaN(radiusKm)) {
      res.status(400).json({
        error: 'Invalid latitude, longitude, or radius values',
      });
      return;
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.max(
      1,
      Math.min(100, parseInt(limit as string) || 10)
    );
    const skip = (pageNum - 1) * limitNum;

    // Build where conditions for Prisma
    const whereConditions: any = {
      latitude: { not: null },
      longitude: { not: null },
    };

    if (status) {
      whereConditions.status = status;
    }
    if (priority) {
      whereConditions.priority = priority;
    }
    if (category) {
      whereConditions.category = category;
    }
    if (search) {
      whereConditions.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // First, get all issues that match the basic filters
    const allFilteredIssues = await prisma.issue.findMany({
      where: whereConditions,
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
            type: true,
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

    // Calculate distance and filter by radius
    const nearbyIssues = allFilteredIssues
      .map((issue) => {
        if (!issue.latitude || !issue.longitude) return null;

        const issueLat = parseFloat(issue.latitude.toString());
        const issueLng = parseFloat(issue.longitude.toString());

        // Haversine formula to calculate distance
        const R = 6371; // Earth's radius in km
        const dLat = ((issueLat - lat) * Math.PI) / 180;
        const dLng = ((issueLng - lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat * Math.PI) / 180) *
            Math.cos((issueLat * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return {
          ...issue,
          distance: parseFloat(distance.toFixed(2)),
        };
      })
      .filter((issue) => issue && issue.distance <= radiusKm)
      .sort((a, b) => (a?.distance || 0) - (b?.distance || 0));

    // Apply pagination
    const total = nearbyIssues.length;
    const paginatedIssues = nearbyIssues.slice(skip, skip + limitNum);

    res.json({
      success: true,
      data: {
        issues: paginatedIssues,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
        filters: {
          latitude: lat,
          longitude: lng,
          radius: radiusKm,
          status,
          priority,
          category,
          search,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching nearby issues:', error);
    res.status(500).json({
      error: 'Failed to fetch nearby issues',
    });
  }
};
