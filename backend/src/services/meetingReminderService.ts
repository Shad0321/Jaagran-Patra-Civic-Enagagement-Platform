import { PrismaClient } from '@prisma/client';
import { MeetingScheduler } from '../utils/meetingScheduler';
import cron from 'node-cron';

const prisma = new PrismaClient();

export class MeetingReminderService {
  private static instance: MeetingReminderService;
  private isRunning = false;

  private constructor() {}

  static getInstance(): MeetingReminderService {
    if (!MeetingReminderService.instance) {
      MeetingReminderService.instance = new MeetingReminderService();
    }
    return MeetingReminderService.instance;
  }

  /**
   * Start the meeting reminder service
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // Schedule reminder checks every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      try {
        await this.checkAndSendReminders();
      } catch (error) {
        console.error('Error in meeting reminder service:', error);
      }
    });

    // Schedule daily cleanup at midnight
    cron.schedule('0 0 * * *', async () => {
      try {
        await this.cleanupExpiredMeetings();
      } catch (error) {
        console.error('Error in meeting cleanup:', error);
      }
    });
  }

  /**
   * Stop the meeting reminder service
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    // Note: node-cron doesn't provide a direct way to stop all scheduled tasks
    // You might want to store task references and destroy them here
  }

  /**
   * Check for upcoming meetings and send reminders
   */
  private async checkAndSendReminders(): Promise<void> {
    const now = new Date();
    const reminderIntervals = [
      { minutes: 60, label: '1 hour' },
      { minutes: 30, label: '30 minutes' },
      { minutes: 15, label: '15 minutes' },
      { minutes: 5, label: '5 minutes' },
    ];

    for (const interval of reminderIntervals) {
      const reminderTime = new Date(now.getTime() + interval.minutes * 60000);

      // Find meetings that start within the next interval (±2 minutes for tolerance)
      const upcomingMeetings = await prisma.session.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: {
            gte: new Date(reminderTime.getTime() - 2 * 60000), // 2 minutes before
            lte: new Date(reminderTime.getTime() + 2 * 60000), // 2 minutes after
          },
        },
        include: {
          host: {
            select: {
              name: true,
              email: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      // Send reminders for each meeting
      for (const meeting of upcomingMeetings) {
        try {
          // Check if reminder was already sent for this interval
          const reminderKey = `${meeting.id}_${interval.minutes}`;
          const existingReminder = await this.checkReminderSent(reminderKey);

          if (!existingReminder) {
            await MeetingScheduler.sendMeetingNotifications(
              meeting.id,
              'reminder'
            );

            await this.markReminderSent(reminderKey);
          }
        } catch (error) {
          console.error(
            `❌ Error sending reminder for meeting ${meeting.id}:`,
            error
          );
        }
      }
    }
  }

  /**
   * Clean up expired meetings and update statuses
   */
  private async cleanupExpiredMeetings(): Promise<void> {
    const now = new Date();

    try {
      // Update completed meetings
      const completedMeetings = await prisma.session.updateMany({
        where: {
          status: 'ONGOING',
          scheduledAt: {
            lt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24 hours ago
          },
        },
        data: {
          status: 'COMPLETED',
        },
      });

      // Cancel scheduled meetings that are more than 1 hour past their start time
      const expiredMeetings = await prisma.session.updateMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: {
            lt: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
          },
        },
        data: {
          status: 'CANCELLED',
        },
      });

      // Clean up old reminder records (older than 7 days)
      const cleanupDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      await prisma.meetingReminder.deleteMany({
        where: {
          createdAt: {
            lt: cleanupDate,
          },
        },
      });
    } catch (error) {
      console.error('❌ Error in cleanup process:', error);
    }
  }

  /**
   * Check if a reminder has already been sent
   */
  private async checkReminderSent(reminderKey: string): Promise<boolean> {
    try {
      const reminder = await prisma.meetingReminder.findUnique({
        where: { reminderKey },
      });
      return !!reminder;
    } catch (error) {
      // If the table doesn't exist, return false
      return false;
    }
  }

  /**
   * Mark a reminder as sent
   */
  private async markReminderSent(reminderKey: string): Promise<void> {
    try {
      await prisma.meetingReminder.create({
        data: {
          reminderKey,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error marking reminder as sent:', error);
    }
  }

  /**
   * Send immediate reminder for a specific meeting
   */
  async sendImmediateReminder(sessionId: string): Promise<void> {
    try {
      await MeetingScheduler.sendMeetingNotifications(sessionId, 'reminder');
    } catch (error) {
      console.error(
        `❌ Error sending immediate reminder for meeting ${sessionId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get reminder statistics
   */
  async getReminderStatistics(): Promise<any> {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        remindersLast24Hours,
        remindersLast7Days,
        totalReminders,
        upcomingMeetings,
      ] = await Promise.all([
        prisma.meetingReminder.count({
          where: {
            sentAt: { gte: last24Hours },
          },
        }),
        prisma.meetingReminder.count({
          where: {
            sentAt: { gte: last7Days },
          },
        }),
        prisma.meetingReminder.count(),
        prisma.session.count({
          where: {
            status: 'SCHEDULED',
            scheduledAt: { gte: now },
          },
        }),
      ]);

      return {
        remindersLast24Hours,
        remindersLast7Days,
        totalReminders,
        upcomingMeetings,
        serviceStatus: this.isRunning ? 'running' : 'stopped',
      };
    } catch (error) {
      console.error('Error getting reminder statistics:', error);
      return {
        error: 'Failed to get statistics',
        serviceStatus: this.isRunning ? 'running' : 'stopped',
      };
    }
  }
}

export default MeetingReminderService.getInstance();
