// controllers/chatController.ts
import { Request, Response } from 'express';
import prisma from '../config/database';
import { asyncHandler } from '../middleware/validation';
import { AuthenticatedRequest } from '../middleware/auth';

// Create a new chat group (Only MLAs can create groups)
export const createGroup = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { name, description, type } = req.body;
    const userId = req.user!.id;

    // Check if user is MLA
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { mlaProfile: true },
    });

    if (!user || user.role !== 'MLA') {
      res.status(403).json({
        success: false,
        message: 'Only MLAs can create chat groups',
      });
      return;
    }

    // Get MLA's constituency info
    const mlaProfile = user.mlaProfile;
    if (!mlaProfile) {
      res.status(400).json({
        success: false,
        message: 'MLA profile not found',
      });
      return;
    }

    // Create the group
    const group = await prisma.chatGroup.create({
      data: {
        name,
        description,
        type,
        ownerId: userId,
        constituencyId: mlaProfile.constituencyId,
        stateId: user.stateId,
        districtId: user.districtId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    // Add the MLA as the first member with admin privileges
    await prisma.chatGroupMember.create({
      data: {
        groupId: group.id,
        userId: userId,
        canInvite: true,
        canRemove: true,
        status: 'ACTIVE',
      },
    });

    // Automatically add all associated members to the group
    const associatedMembers = await prisma.user.findMany({
      where: {
        mlaId: userId,
        role: 'MEMBER',
        isActive: true,
      },
    });

    if (associatedMembers.length > 0) {
      await prisma.chatGroupMember.createMany({
        data: associatedMembers.map((member) => ({
          groupId: group.id,
          userId: member.id,
          addedById: userId,
          status: 'ACTIVE',
        })),
      });
    }

    res.status(201).json({
      success: true,
      message: 'Chat group created successfully',
      data: {
        ...group,
        totalMembers: associatedMembers.length + 1, // +1 for MLA
      },
    });
  }
);

// Get all groups for the authenticated user (includes public groups they can join)
export const getGroups = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const user = req.user!;

    // Get groups where user is a member
    const memberGroups = await prisma.chatGroup.findMany({
      where: {
        members: {
          some: {
            userId: userId,
            status: 'ACTIVE',
          },
        },
        isActive: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            message: true,
            createdAt: true,
            sender: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Get public groups that user can join (excluding ones they're already in)
    const memberGroupIds = memberGroups.map((group) => group.id);

    const publicGroups = await prisma.chatGroup.findMany({
      where: {
        type: 'PUBLIC_MLA_GROUP',
        isActive: true,
        // Exclude groups user is already a member of
        NOT: {
          id: {
            in: memberGroupIds,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            message: true,
            createdAt: true,
            sender: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: {
        memberGroups,
        publicGroups,
      },
    });
  }
);

// Get available public groups for joining
export const getPublicGroups = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const user = req.user!;

    // Get groups where user is already a member
    const memberGroupIds = await prisma.chatGroupMember.findMany({
      where: {
        userId: userId,
        status: 'ACTIVE',
      },
      select: {
        groupId: true,
      },
    });

    const excludeGroupIds = memberGroupIds.map((member) => member.groupId);

    // Get public groups that user can join
    const publicGroups = await prisma.chatGroup.findMany({
      where: {
        type: 'PUBLIC_MLA_GROUP',
        isActive: true,
        // Exclude groups user is already a member of
        NOT: {
          id: {
            in: excludeGroupIds,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        constituency: {
          select: {
            name: true,
          },
        },
        district: {
          select: {
            name: true,
          },
        },
        state: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            message: true,
            createdAt: true,
            sender: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      // orderBy: [
      //   {
      //     // Prioritize groups from same constituency
      //     constituencyId: user.constituencyId ? 'desc' : 'asc',
      //   },
      //   {
      //     updatedAt: 'desc',
      //   },
      // ],
    });

    res.json({
      success: true,
      data: publicGroups,
    });
  }
);

// Get messages for a specific group
export const getGroupMessages = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { groupId } = req.params;
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Check if user is a member of the group
    const membership = await prisma.chatGroupMember.findFirst({
      where: {
        groupId,
        userId,
        status: 'ACTIVE',
      },
    });

    if (!membership) {
      res.status(403).json({
        success: false,
        message: 'You are not a member of this group',
      });
      return;
    }

    // Get messages with pagination
    const messages = await prisma.chatGroupMessage.findMany({
      where: {
        groupId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        readBy: {
          select: {
            userId: true,
            readAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    const totalMessages = await prisma.chatGroupMessage.count({
      where: { groupId },
    });

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        pagination: {
          page,
          limit,
          total: totalMessages,
          totalPages: Math.ceil(totalMessages / limit),
        },
      },
    });
  }
);

// Send a message to a group
// export const sendMessage = asyncHandler(
//   async (req: AuthenticatedRequest, res: Response): Promise<void> => {
//     const { groupId } = req.params;
//     const { message, messageType = 'TEXT', attachments } = req.body;
//     const userId = req.user!.id;

//     // Check if user is a member of the group
//     const membership = await prisma.chatGroupMember.findFirst({
//       where: {
//         groupId,
//         userId,
//         status: 'ACTIVE',
//       },
//     });

//     if (!membership) {
//       res.status(403).json({
//         success: false,
//         message: 'You are not a member of this group',
//       });
//       return;
//     }

//     // Create the message
//     const newMessage = await prisma.chatGroupMessage.create({
//       data: {
//         groupId,
//         senderId: userId,
//         message,
//         messageType,
//         attachments,
//       },
//       include: {
//         sender: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//             avatar: true,
//           },
//         },
//       },
//     });

//     // Update group's updatedAt timestamp
//     await prisma.chatGroup.update({
//       where: { id: groupId },
//       data: { updatedAt: new Date() },
//     });

//     res.status(201).json({
//       success: true,
//       message: 'Message sent successfully',
//       data: newMessage,
//     });
//   }
// );

// Join a public group
export const joinGroup = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { groupId } = req.params;
    const userId = req.user!.id;

    // Check if group exists and is public
    const group = await prisma.chatGroup.findUnique({
      where: { id: groupId, isActive: true },
    });

    if (!group) {
      res.status(404).json({
        success: false,
        message: 'Group not found',
      });
      return;
    }

    if (group.type !== 'PUBLIC_MLA_GROUP') {
      res.status(403).json({
        success: false,
        message: 'This is a private group. You need to be invited.',
      });
      return;
    }

    // Check if user is already a member
    const existingMembership = await prisma.chatGroupMember.findFirst({
      where: {
        groupId,
        userId,
      },
    });

    if (existingMembership) {
      if (existingMembership.status === 'ACTIVE') {
        res.status(400).json({
          success: false,
          message: 'You are already a member of this group',
        });
        return;
      }

      // Reactivate membership if previously left
      await prisma.chatGroupMember.update({
        where: { id: existingMembership.id },
        data: {
          status: 'ACTIVE',
          leftAt: null,
        },
      });
    } else {
      // Create new membership
      await prisma.chatGroupMember.create({
        data: {
          groupId,
          userId,
          status: 'ACTIVE',
        },
      });
    }

    res.json({
      success: true,
      message: 'Successfully joined the group',
    });
  }
);

// Leave a group
export const leaveGroup = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { groupId } = req.params;
    const userId = req.user!.id;

    // Check if user is a member
    const membership = await prisma.chatGroupMember.findFirst({
      where: {
        groupId,
        userId,
        status: 'ACTIVE',
      },
    });

    if (!membership) {
      res.status(404).json({
        success: false,
        message: 'You are not a member of this group',
      });
      return;
    }

    // Check if user is the owner
    const group = await prisma.chatGroup.findUnique({
      where: { id: groupId },
    });

    if (group?.ownerId === userId) {
      res.status(400).json({
        success: false,
        message: 'Group owner cannot leave the group',
      });
      return;
    }

    // Update membership status
    await prisma.chatGroupMember.update({
      where: { id: membership.id },
      data: {
        status: 'LEFT',
        leftAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Successfully left the group',
    });
  }
);

// Invite a member to a group
export const inviteMember = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { groupId } = req.params;
    const { userId: inviteeId } = req.body;
    const userId = req.user!.id;

    // Check if current user has permission to invite
    const membership = await prisma.chatGroupMember.findFirst({
      where: {
        groupId,
        userId,
        status: 'ACTIVE',
      },
    });

    if (!membership) {
      res.status(403).json({
        success: false,
        message: 'You are not a member of this group',
      });
      return;
    }

    // Check if user is owner or has invite permission
    const group = await prisma.chatGroup.findUnique({
      where: { id: groupId },
    });

    if (group?.ownerId !== userId && !membership.canInvite) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to invite members',
      });
      return;
    }

    // Check if invitee exists
    const invitee = await prisma.user.findUnique({
      where: { id: inviteeId, isActive: true },
    });

    if (!invitee) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Check if invitee is already a member
    const existingMembership = await prisma.chatGroupMember.findFirst({
      where: {
        groupId,
        userId: inviteeId,
      },
    });

    if (existingMembership) {
      if (existingMembership.status === 'ACTIVE') {
        res.status(400).json({
          success: false,
          message: 'User is already a member of this group',
        });
        return;
      }

      // Reactivate membership
      await prisma.chatGroupMember.update({
        where: { id: existingMembership.id },
        data: {
          status: 'ACTIVE',
          addedById: userId,
          leftAt: null,
        },
      });
    } else {
      // Create new membership
      await prisma.chatGroupMember.create({
        data: {
          groupId,
          userId: inviteeId,
          addedById: userId,
          status: 'ACTIVE',
        },
      });
    }

    res.json({
      success: true,
      message: 'Member invited successfully',
    });
  }
);

// Remove a member from a group
export const removeMember = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { groupId, userId: targetUserId } = req.params;
    const userId = req.user!.id;

    // Check if current user has permission to remove
    const membership = await prisma.chatGroupMember.findFirst({
      where: {
        groupId,
        userId,
        status: 'ACTIVE',
      },
    });

    if (!membership) {
      res.status(403).json({
        success: false,
        message: 'You are not a member of this group',
      });
      return;
    }

    // Check if user is owner or has remove permission
    const group = await prisma.chatGroup.findUnique({
      where: { id: groupId },
    });

    if (group?.ownerId !== userId && !membership.canRemove) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to remove members',
      });
      return;
    }

    // Cannot remove the group owner
    if (group?.ownerId === targetUserId) {
      res.status(400).json({
        success: false,
        message: 'Cannot remove the group owner',
      });
      return;
    }

    // Find target membership
    const targetMembership = await prisma.chatGroupMember.findFirst({
      where: {
        groupId,
        userId: targetUserId,
        status: 'ACTIVE',
      },
    });

    if (!targetMembership) {
      res.status(404).json({
        success: false,
        message: 'User is not a member of this group',
      });
      return;
    }

    // Update membership status
    await prisma.chatGroupMember.update({
      where: { id: targetMembership.id },
      data: {
        status: 'REMOVED',
        leftAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Member removed successfully',
    });
  }
);

// Get group members
export const getGroupMembers = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { groupId } = req.params;
    const userId = req.user!.id;

    // Check if user is a member
    const membership = await prisma.chatGroupMember.findFirst({
      where: {
        groupId,
        userId,
        status: 'ACTIVE',
      },
    });

    if (!membership) {
      res.status(403).json({
        success: false,
        message: 'You are not a member of this group',
      });
      return;
    }

    // Get all active members
    const members = await prisma.chatGroupMember.findMany({
      where: {
        groupId,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        addedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });

    res.json({
      success: true,
      data: members,
    });
  }
);

// Mark message as read
// export const markMessageAsRead = asyncHandler(
//   async (req: AuthenticatedRequest, res: Response): Promise<void> => {
//     const { messageId } = req.params;
//     const userId = req.user!.id;

//     // Check if message exists and user is a member of the group
//     const message = await prisma.chatGroupMessage.findUnique({
//       where: { id: messageId },
//       include: {
//         group: {
//           include: {
//             members: {
//               where: {
//                 userId,
//                 status: 'ACTIVE',
//               },
//             },
//           },
//         },
//       },
//     });

//     if (!message || message.group.members.length === 0) {
//       res.status(404).json({
//         success: false,
//         message: 'Message not found or you are not a member of this group',
//       });
//       return;
//     }

//     // Create or update read receipt
//     await prisma.chatMessageRead.upsert({
//       where: {
//         messageId_userId: {
//           messageId,
//           userId,
//         },
//       },
//       create: {
//         messageId,
//         userId,
//       },
//       update: {
//         readAt: new Date(),
//       },
//     });

//     res.json({
//       success: true,
//       message: 'Message marked as read',
//     });
//   }
// );
