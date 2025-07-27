import { Request, Response } from 'express';
import { PrismaClient, UserRole, NotificationStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Create notification helper function
export const createNotification = async (
  title: string,
  message: string,
  type: string,
  sentById: string,
  recipientIds: string[],
  targetRole?: UserRole,
  targetStateId?: string,
  data?: any
) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        sentById,
        targetRole,
        targetStateId,
        data,
        recipients: {
          create: recipientIds.map((userId) => ({
            userId,
            status: NotificationStatus.PENDING,
          })),
        },
      },
      include: {
        recipients: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Create assignment notification
export const createAssignmentNotification = async (
  issueId: string,
  issueTitle: string,
  assigneeId: string,
  assignerId: string,
  assignerName: string
) => {
  try {
    const result = await createNotification(
      'New Issue Assigned',
      `A new issue "${issueTitle}" has been assigned to you by ${assignerName}`,
      'ISSUE_ASSIGNMENT',
      assignerId,
      [assigneeId],
      undefined,
      undefined,
      { issueId, action: 'assigned' }
    );

    return result;
  } catch (error) {
    console.error('❌ Error creating assignment notification:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    // Don't re-throw - we don't want notification failure to prevent issue creation
  }
};

// Create issue update notification for citizen
export const createIssueUpdateNotification = async (
  issueId: string,
  issueTitle: string,
  citizenId: string,
  updaterId: string,
  updaterName: string,
  updateMessage: string,
  newStatus?: string
) => {
  try {
    let message = `Your issue "${issueTitle}" has been updated by ${updaterName}`;
    if (newStatus) {
      message += `. Status: ${newStatus}`;
    }
    if (updateMessage) {
      message += `. Update: ${updateMessage}`;
    }

    await createNotification(
      'Issue Update',
      message,
      'ISSUE_UPDATE',
      updaterId,
      [citizenId],
      undefined,
      undefined,
      { issueId, updateMessage, newStatus, action: 'updated' }
    );
  } catch (error) {
    console.error('Error creating issue update notification:', error);
  }
};

// Get notifications for authenticated user
export const getNotifications = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const whereClause: any = {
      userId: userId,
    };

    if (unreadOnly === 'true') {
      whereClause.readAt = null;
    }

    const notifications = await prisma.notificationRecipient.findMany({
      where: whereClause,
      include: {
        notification: {
          include: {
            sentBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        notification: {
          createdAt: 'desc',
        },
      },
      skip: offset,
      take: limitNum,
    });

    const totalCount = await prisma.notificationRecipient.count({
      where: whereClause,
    });

    const unreadCount = await prisma.notificationRecipient.count({
      where: {
        userId: userId,
        readAt: null,
      },
    });

    res.json({
      success: true,
      data: {
        notifications: notifications.map((recipient) => ({
          id: recipient.id,
          notificationId: recipient.notificationId,
          title: recipient.notification.title,
          message: recipient.notification.message,
          type: recipient.notification.type,
          data: recipient.notification.data,
          sentBy: recipient.notification.sentBy,
          status: recipient.status,
          readAt: recipient.readAt,
          createdAt: recipient.notification.createdAt,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum),
        },
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
    });
  }
};

// Mark notification as read
export const markAsRead = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { notificationId } = req.params;

    const updated = await prisma.notificationRecipient.updateMany({
      where: {
        notificationId,
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
        status: NotificationStatus.DELIVERED,
      },
    });

    if (updated.count === 0) {
      res.status(404).json({
        success: false,
        error: 'Notification not found or already read',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;

    await prisma.notificationRecipient.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
        status: NotificationStatus.DELIVERED,
      },
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read',
    });
  }
};

// Get notification count for user
export const getNotificationCount = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const unreadCount = await prisma.notificationRecipient.count({
      where: {
        userId,
        readAt: null,
      },
    });

    const totalCount = await prisma.notificationRecipient.count({
      where: {
        userId,
      },
    });

    res.json({
      success: true,
      data: {
        unreadCount,
        totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification count',
    });
  }
};
