import { PrismaClient } from '@prisma/client';
import emailService from '../services/emailService';

const prisma = new PrismaClient();

export interface MeetingScheduleData {
  title: string;
  description?: string;
  startTime: Date;
  duration: number;
  hostId: string;
  invitees: string[];
  isOpenToAll?: boolean;
  settings?: {
    waitingRoom?: boolean;
    recordingEnabled?: boolean;
    requireRegistration?: boolean;
    maxParticipants?: number;
  };
}

export interface RecurringMeetingData extends MeetingScheduleData {
  recurrence: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
    occurrences?: number;
  };
}

export class MeetingScheduler {
  /**
   * Validate meeting time
   */
  static validateMeetingTime(
    startTime: Date,
    duration: number
  ): { isValid: boolean; error?: string } {
    const now = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60000);

    // Check if start time is in the past
    if (startTime <= now) {
      return {
        isValid: false,
        error: 'Meeting start time must be in the future',
      };
    }

    // Check if meeting is too long (max 8 hours)
    if (duration > 480) {
      return {
        isValid: false,
        error: 'Meeting duration cannot exceed 8 hours',
      };
    }

    // Check if meeting is too short (min 1 minute)
    if (duration < 1) {
      return {
        isValid: false,
        error: 'Meeting duration must be at least 1 minute',
      };
    }

    return { isValid: true };
  }

  /**
   * Check for scheduling conflicts
   */
  static async checkSchedulingConflicts(
    hostId: string,
    startTime: Date,
    duration: number,
    excludeSessionId?: string
  ): Promise<{ hasConflict: boolean; conflictingSessions?: any[] }> {
    const endTime = new Date(startTime.getTime() + duration * 60000);

    const whereClause: any = {
      hostId,
      status: { in: ['SCHEDULED', 'ONGOING'] },
      AND: [
        {
          OR: [
            // Session starts within the proposed time
            {
              scheduledAt: {
                gte: startTime,
                lt: endTime,
              },
            },
            // Session ends within the proposed time
            {
              scheduledAt: {
                lt: startTime,
              },
              // Calculate end time using duration
              // This is a simplified check - you might want to add actual end time field
            },
          ],
        },
      ],
    };

    if (excludeSessionId) {
      whereClause.id = { not: excludeSessionId };
    }

    const conflictingSessions = await prisma.session.findMany({
      where: whereClause,
      include: {
        host: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      hasConflict: conflictingSessions.length > 0,
      conflictingSessions:
        conflictingSessions.length > 0 ? conflictingSessions : undefined,
    };
  }

  /**
   * Generate recurring meeting dates
   */
  static generateRecurringDates(
    startTime: Date,
    recurrence: RecurringMeetingData['recurrence']
  ): Date[] {
    const dates: Date[] = [];
    let currentDate = new Date(startTime);
    let count = 0;
    const maxOccurrences = recurrence.occurrences || 52; // Default to 52 weeks

    while (count < maxOccurrences) {
      if (recurrence.endDate && currentDate > recurrence.endDate) {
        break;
      }

      dates.push(new Date(currentDate));
      count++;

      // Calculate next occurrence
      switch (recurrence.type) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + recurrence.interval);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7 * recurrence.interval);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + recurrence.interval);
          break;
      }
    }

    return dates;
  }

  /**
   * Get optimal meeting time suggestions
   */
  static async getOptimalMeetingTimes(
    hostId: string,
    participantIds: string[],
    duration: number,
    preferredDate?: Date
  ): Promise<Date[]> {
    const suggestions: Date[] = [];
    const baseDate = preferredDate || new Date();
    baseDate.setHours(9, 0, 0, 0); // Start from 9 AM

    // Check for available slots in the next 7 days
    for (let day = 0; day < 7; day++) {
      const checkDate = new Date(baseDate);
      checkDate.setDate(baseDate.getDate() + day);

      // Check hourly slots from 9 AM to 5 PM
      for (let hour = 9; hour < 17; hour++) {
        checkDate.setHours(hour, 0, 0, 0);

        const { hasConflict } = await this.checkSchedulingConflicts(
          hostId,
          checkDate,
          duration
        );

        if (!hasConflict) {
          suggestions.push(new Date(checkDate));
        }

        if (suggestions.length >= 5) break; // Return top 5 suggestions
      }

      if (suggestions.length >= 5) break;
    }

    return suggestions;
  }

  /**
   * Calculate meeting timezone offset
   */
  static calculateTimezoneOffset(timezone: string): number {
    const now = new Date();
    const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);

    try {
      const targetTime = new Date(
        utc.toLocaleString('en-US', { timeZone: timezone })
      );
      return (targetTime.getTime() - utc.getTime()) / (1000 * 60 * 60);
    } catch (error) {
      console.warn('Invalid timezone:', timezone);
      return 0;
    }
  }

  /**
   * Format meeting duration
   */
  static formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins} minute${mins !== 1 ? 's' : ''}`;
    } else if (mins === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Generate meeting summary
   */
  static generateMeetingSummary(sessionData: any): string {
    const startTime = new Date(sessionData.scheduledAt);
    const endTime = new Date(
      startTime.getTime() + sessionData.duration * 60000
    );

    const formatTime = (date: Date) => {
      return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      });
    };

    let summary = `Meeting: ${sessionData.title}\n`;
    summary += `Host: ${sessionData.host.name} (${sessionData.host.email})\n`;
    summary += `Date & Time: ${formatTime(startTime)}\n`;
    summary += `Duration: ${this.formatDuration(sessionData.duration)}\n`;

    if (sessionData.description) {
      summary += `Description: ${sessionData.description}\n`;
    }

    if (sessionData.agenda) {
      summary += `Agenda: ${sessionData.agenda}\n`;
    }

    if (sessionData.participants && sessionData.participants.length > 0) {
      summary += `Participants: ${sessionData.participants.length}\n`;
    }

    if (sessionData.meetingLink) {
      summary += `Join URL: ${sessionData.meetingLink}\n`;
    }

    return summary;
  }

  /**
   * Send meeting notifications
   */
  static async sendMeetingNotifications(
    sessionId: string,
    type: 'invitation' | 'reminder' | 'cancellation' | 'update',
    additionalData?: any
  ): Promise<void> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
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

    if (!session) {
      throw new Error('Session not found');
    }

    // Extract Zoom meeting data if available
    const zoomData = session.zoomMeetingData as any;
    const zoomPassword = zoomData?.password;

    switch (type) {
      case 'invitation':
        const invitations = session.participants.map((participant) => ({
          recipientEmail: participant.user.email,
          recipientName: participant.user.name,
          meetingTitle: session.title,
          meetingDescription: session.description || undefined,
          startTime: session.scheduledAt.toISOString(),
          duration: session.duration,
          joinUrl: session.meetingLink || '',
          meetingId: session.zoomMeetingId || session.id,
          hostName: session.host.name,
          hostEmail: session.host.email,
          password: zoomPassword,
          agenda: session.agenda || undefined,
        }));
        await emailService.sendBulkInvitations(invitations);
        break;

      case 'reminder':
        const reminders = session.participants.map((participant) => ({
          recipientEmail: participant.user.email,
          recipientName: participant.user.name,
          meetingTitle: session.title,
          startTime: session.scheduledAt.toISOString(),
          joinUrl: session.meetingLink || '',
          hostName: session.host.name,
          agenda: session.agenda || undefined,
        }));
        await emailService.sendBulkReminders(reminders);
        break;

      case 'cancellation':
        const cancellations = session.participants.map((participant) => ({
          recipientEmail: participant.user.email,
          recipientName: participant.user.name,
          meetingTitle: session.title,
          startTime: session.scheduledAt.toISOString(),
          hostName: session.host.name,
          reason: additionalData?.reason,
        }));
        await emailService.sendBulkCancellations(cancellations);
        break;

      case 'update':
        const updates = session.participants.map((participant) => ({
          recipientEmail: participant.user.email,
          recipientName: participant.user.name,
          meetingTitle: session.title,
          oldStartTime: additionalData?.oldStartTime,
          newStartTime: session.scheduledAt.toISOString(),
          joinUrl: session.meetingLink || '',
          hostName: session.host.name,
          changes: additionalData?.changes || [],
        }));
        await emailService.sendBulkUpdates(updates);
        break;
    }
  }

  /**
   * Schedule meeting reminders
   */
  static async scheduleReminders(sessionId: string): Promise<void> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const meetingTime = new Date(session.scheduledAt);
    const now = new Date();

    // Schedule reminders at different intervals
    const reminderIntervals = [
      { minutes: 60, label: '1 hour' },
      { minutes: 30, label: '30 minutes' },
      { minutes: 15, label: '15 minutes' },
      { minutes: 5, label: '5 minutes' },
    ];

    for (const interval of reminderIntervals) {
      const reminderTime = new Date(
        meetingTime.getTime() - interval.minutes * 60000
      );

      if (reminderTime > now) {
        // Here you would integrate with a job scheduler like Bull, Agenda, or node-cron
        // For now, we'll just log the reminder schedule
        console.log(
          `Reminder scheduled for ${reminderTime.toISOString()} (${interval.label} before meeting)`
        );
      }
    }
  }

  /**
   * Get meeting statistics
   */
  static async getMeetingStatistics(
    hostId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<any> {
    const whereClause: any = { hostId };

    if (dateRange) {
      whereClause.scheduledAt = {
        gte: dateRange.start,
        lte: dateRange.end,
      };
    }

    const totalMeetings = await prisma.session.count({
      where: whereClause,
    });

    const completedMeetings = await prisma.session.count({
      where: {
        ...whereClause,
        status: 'COMPLETED',
      },
    });

    const cancelledMeetings = await prisma.session.count({
      where: {
        ...whereClause,
        status: 'CANCELLED',
      },
    });

    const upcomingMeetings = await prisma.session.count({
      where: {
        ...whereClause,
        status: 'SCHEDULED',
        scheduledAt: { gt: new Date() },
      },
    });

    const avgDuration = await prisma.session.aggregate({
      where: {
        ...whereClause,
        status: 'COMPLETED',
      },
      _avg: {
        duration: true,
      },
    });

    const totalParticipants = await prisma.sessionParticipant.count({
      where: {
        session: whereClause,
      },
    });

    return {
      totalMeetings,
      completedMeetings,
      cancelledMeetings,
      upcomingMeetings,
      averageDuration: avgDuration._avg.duration || 0,
      totalParticipants,
      completionRate:
        totalMeetings > 0 ? (completedMeetings / totalMeetings) * 100 : 0,
    };
  }
}

export default MeetingScheduler;
