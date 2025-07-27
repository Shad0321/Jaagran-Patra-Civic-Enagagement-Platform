import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import zoomService from '../services/zoomService';
import emailService from '../services/emailService';
import { config } from '../config/environment';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export class ZoomController {
  /**
   * Create an instant meeting
   */
  static async createInstantMeeting(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { topic, agenda } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Verify user is MLA
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { mlaProfile: true },
      });

      if (!user || user.role !== 'MLA') {
        res.status(403).json({ error: 'Only MLAs can create meetings' });
        return;
      }

      // Create meeting on Zoom using master account
      const zoomMeeting = await zoomService.createInstantMeeting(
        config.zoom.masterUserId,
        topic,
        agenda
      );

      // Store meeting in database
      const session = await prisma.session.create({
        data: {
          title: topic,
          description: agenda,
          scheduledAt: new Date(),
          duration: 60, // Default duration for instant meetings
          status: 'ONGOING',
          meetingLink: zoomMeeting.join_url,
          agenda: agenda,
          hostId: userId,
          // Store Zoom meeting data as JSON
          zoomMeetingId: zoomMeeting.id.toString(),
          zoomMeetingData: zoomMeeting as any,
        },
      });

      res.json({
        success: true,
        data: {
          session,
          zoomMeeting: {
            id: zoomMeeting.id,
            topic: zoomMeeting.topic,
            join_url: zoomMeeting.join_url,
            start_url: zoomMeeting.start_url,
            password: zoomMeeting.password,
            start_time: zoomMeeting.start_time,
            duration: zoomMeeting.duration,
          },
        },
      });
    } catch (error: any) {
      console.error('Error creating instant meeting:', error);
      res
        .status(500)
        .json({ error: error.message || 'Failed to create instant meeting' });
    }
  }

  /**
   * Create a scheduled meeting
   */
  static async createScheduledMeeting(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const {
        topic,
        agenda,
        startTime,
        duration,
        timezone = 'UTC',
        invitees = [],
        settings = {},
        isOpenToAll = false,
      } = req.body;

      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Verify user is MLA
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          mlaProfile: true,
          members: true, // Get MLA's members
        },
      });

      if (!user || user.role !== 'MLA') {
        res.status(403).json({ error: 'Only MLAs can create meetings' });
        return;
      }

      // Validate start time
      const scheduledDate = new Date(startTime);
      if (scheduledDate <= new Date()) {
        res.status(400).json({ error: 'Start time must be in the future' });
        return;
      }

      // Prepare invitees list
      let allInvitees = [...invitees];

      // If open to all, add all members of the MLA
      if (isOpenToAll) {
        const memberEmails = user.members.map((member) => member.email);
        allInvitees = [...allInvitees, ...memberEmails];
      }

      // Remove duplicates
      allInvitees = Array.from(new Set(allInvitees));

      // Create meeting on Zoom using master account
      const zoomMeeting = await zoomService.createScheduledMeeting(
        config.zoom.masterUserId,
        topic,
        startTime,
        duration,
        timezone,
        agenda,
        allInvitees,
        settings
      );

      // Store meeting in database
      const session = await prisma.session.create({
        data: {
          title: topic,
          description: agenda,
          scheduledAt: scheduledDate,
          duration: duration,
          status: 'SCHEDULED',
          meetingLink: zoomMeeting.join_url,
          agenda: agenda,
          hostId: userId,
          zoomMeetingId: zoomMeeting.id.toString(),
          zoomMeetingData: zoomMeeting as any,
          isOpenToAll: isOpenToAll,
        },
      });

      // Add participants to session
      const participantsData = allInvitees.map((email) => ({
        sessionId: session.id,
        email: email,
        status: 'INVITED',
      }));

      // Find users by email and create participant records
      for (const email of allInvitees) {
        const invitedUser = await prisma.user.findUnique({
          where: { email },
        });

        if (invitedUser) {
          await prisma.sessionParticipant.create({
            data: {
              sessionId: session.id,
              userId: invitedUser.id,
              status: 'INVITED',
            },
          });
        }
      }

      res.json({
        success: true,
        data: {
          session,
          zoomMeeting: {
            id: zoomMeeting.id,
            topic: zoomMeeting.topic,
            join_url: zoomMeeting.join_url,
            start_url: zoomMeeting.start_url,
            password: zoomMeeting.password,
            start_time: zoomMeeting.start_time,
            duration: zoomMeeting.duration,
            timezone: zoomMeeting.timezone,
          },
          invitees: allInvitees,
        },
      });
    } catch (error: any) {
      console.error('Error creating scheduled meeting:', error);
      res
        .status(500)
        .json({ error: error.message || 'Failed to create scheduled meeting' });
    }
  }

  /**
   * Create a recurring meeting
   */
  static async createRecurringMeeting(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const {
        topic,
        agenda,
        startTime,
        duration,
        recurrenceType, // 1: Daily, 2: Weekly, 3: Monthly
        repeatInterval,
        endTimes,
        endDateTime,
        timezone = 'UTC',
        invitees = [],
        settings = {},
        isOpenToAll = false,
      } = req.body;

      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Verify user is MLA
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          mlaProfile: true,
          members: true,
        },
      });

      if (!user || user.role !== 'MLA') {
        res.status(403).json({ error: 'Only MLAs can create meetings' });
        return;
      }

      // Validate start time
      const scheduledDate = new Date(startTime);
      if (scheduledDate <= new Date()) {
        res.status(400).json({ error: 'Start time must be in the future' });
        return;
      }

      // Prepare invitees list
      let allInvitees = [...invitees];

      if (isOpenToAll) {
        const memberEmails = user.members.map((member) => member.email);
        allInvitees = [...allInvitees, ...memberEmails];
      }

      allInvitees = Array.from(new Set(allInvitees));

      // Create meeting on Zoom using master account
      const zoomMeeting = await zoomService.createRecurringMeeting(
        config.zoom.masterUserId,
        topic,
        startTime,
        duration,
        recurrenceType,
        repeatInterval,
        endTimes,
        endDateTime,
        timezone,
        agenda,
        allInvitees,
        settings
      );

      // Store meeting in database
      const session = await prisma.session.create({
        data: {
          title: topic,
          description: agenda,
          scheduledAt: scheduledDate,
          duration: duration,
          status: 'SCHEDULED',
          meetingLink: zoomMeeting.join_url,
          agenda: agenda,
          hostId: userId,
          zoomMeetingId: zoomMeeting.id.toString(),
          zoomMeetingData: zoomMeeting as any,
          isOpenToAll: isOpenToAll,
          isRecurring: true,
          recurrenceData: {
            type: recurrenceType,
            repeatInterval,
            endTimes,
            endDateTime,
          } as any,
        },
      });

      // Add participants to session
      for (const email of allInvitees) {
        const invitedUser = await prisma.user.findUnique({
          where: { email },
        });

        if (invitedUser) {
          await prisma.sessionParticipant.create({
            data: {
              sessionId: session.id,
              userId: invitedUser.id,
              status: 'INVITED',
            },
          });
        }
      }

      res.json({
        success: true,
        data: {
          session,
          zoomMeeting: {
            id: zoomMeeting.id,
            topic: zoomMeeting.topic,
            join_url: zoomMeeting.join_url,
            start_url: zoomMeeting.start_url,
            password: zoomMeeting.password,
            start_time: zoomMeeting.start_time,
            duration: zoomMeeting.duration,
            timezone: zoomMeeting.timezone,
            recurrence: zoomMeeting.recurrence,
            occurrences: zoomMeeting.occurrences,
          },
          invitees: allInvitees,
        },
      });
    } catch (error: any) {
      console.error('Error creating recurring meeting:', error);
      res
        .status(500)
        .json({ error: error.message || 'Failed to create recurring meeting' });
    }
  }

  /**
   * Get all meetings for the authenticated user
   */
  static async getUserMeetings(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { type = 'all', page = 1, limit = 10 } = req.query;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      let whereClause: any = {};

      if (user.role === 'MLA') {
        // MLAs can see meetings they host
        whereClause.hostId = userId;
      } else {
        // Other users can see meetings they're invited to
        whereClause.participants = {
          some: { userId: userId },
        };
      }

      // Filter by type
      if (type === 'upcoming') {
        whereClause.scheduledAt = { gte: new Date() };
        whereClause.status = { in: ['SCHEDULED', 'ONGOING'] };
      } else if (type === 'past') {
        whereClause.OR = [
          { scheduledAt: { lt: new Date() } },
          { status: 'COMPLETED' },
        ];
      } else if (type === 'ongoing') {
        whereClause.status = 'ONGOING';
      }

      const sessions = await prisma.session.findMany({
        where: whereClause,
        include: {
          host: {
            select: {
              id: true,
              name: true,
              email: true,
              mlaProfile: true,
            },
          },
          participants: {
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
        orderBy: { scheduledAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      });

      const totalCount = await prisma.session.count({
        where: whereClause,
      });

      res.json({
        success: true,
        data: {
          sessions,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: totalCount,
            totalPages: Math.ceil(totalCount / Number(limit)),
          },
        },
      });
    } catch (error: any) {
      console.error('Error getting user meetings:', error);
      res
        .status(500)
        .json({ error: error.message || 'Failed to get meetings' });
    }
  }

  /**
   * Get meeting details
   */
  static async getMeetingDetails(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { meetingId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const session = await prisma.session.findUnique({
        where: { id: meetingId },
        include: {
          host: {
            select: {
              id: true,
              name: true,
              email: true,
              mlaProfile: true,
            },
          },
          participants: {
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

      if (!session) {
        res.status(404).json({ error: 'Meeting not found' });
        return;
      }

      // Check if user has access to this meeting
      const hasAccess =
        session.hostId === userId ||
        session.participants.some((p) => p.userId === userId);

      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Get latest Zoom meeting data if available
      // Define ZoomMeetingResponse type as any for now (replace with actual type if available)
      let zoomMeetingData: any = null;
      if (session.zoomMeetingId) {
        try {
          zoomMeetingData = await zoomService.getMeeting(session.zoomMeetingId);
        } catch (error) {
          console.warn('Could not fetch Zoom meeting data:', error);
        }
      }

      res.json({
        success: true,
        data: {
          session,
          zoomMeetingData,
        },
      });
    } catch (error: any) {
      console.error('Error getting meeting details:', error);
      res
        .status(500)
        .json({ error: error.message || 'Failed to get meeting details' });
    }
  }

  /**
   * Update meeting
   */
  static async updateMeeting(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { meetingId } = req.params;
      const userId = req.user?.id;
      const updateData = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const session = await prisma.session.findUnique({
        where: { id: meetingId },
      });

      if (!session) {
        res.status(404).json({ error: 'Meeting not found' });
        return;
      }

      // Only host can update meeting
      if (session.hostId !== userId) {
        res
          .status(403)
          .json({ error: 'Only meeting host can update the meeting' });
        return;
      }

      // Update Zoom meeting if needed
      if (
        session.zoomMeetingId &&
        (updateData.topic || updateData.agenda || updateData.startTime)
      ) {
        const zoomUpdateData: any = {};

        if (updateData.topic) zoomUpdateData.topic = updateData.topic;
        if (updateData.agenda) zoomUpdateData.agenda = updateData.agenda;
        if (updateData.startTime)
          zoomUpdateData.start_time = updateData.startTime;
        if (updateData.duration) zoomUpdateData.duration = updateData.duration;

        await zoomService.updateMeeting(session.zoomMeetingId, zoomUpdateData);
      }

      // Update session in database
      const updatedSession = await prisma.session.update({
        where: { id: meetingId },
        data: {
          title: updateData.topic || session.title,
          description: updateData.agenda || session.description,
          scheduledAt: updateData.startTime
            ? new Date(updateData.startTime)
            : session.scheduledAt,
          duration: updateData.duration || session.duration,
          agenda: updateData.agenda || session.agenda,
        },
        include: {
          host: {
            select: {
              id: true,
              name: true,
              email: true,
              mlaProfile: true,
            },
          },
          participants: {
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

      res.json({
        success: true,
        data: updatedSession,
      });
    } catch (error: any) {
      console.error('Error updating meeting:', error);
      res
        .status(500)
        .json({ error: error.message || 'Failed to update meeting' });
    }
  }

  /**
   * Delete meeting
   */
  static async deleteMeeting(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { meetingId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const session = await prisma.session.findUnique({
        where: { id: meetingId },
      });

      if (!session) {
        res.status(404).json({ error: 'Meeting not found' });
        return;
      }

      // Only host can delete meeting
      if (session.hostId !== userId) {
        res
          .status(403)
          .json({ error: 'Only meeting host can delete the meeting' });
        return;
      }

      // Delete Zoom meeting
      if (session.zoomMeetingId) {
        try {
          await zoomService.deleteMeeting(session.zoomMeetingId);
        } catch (error) {
          console.warn('Could not delete Zoom meeting:', error);
        }
      }

      // Delete session from database
      await prisma.session.delete({
        where: { id: meetingId },
      });

      res.json({
        success: true,
        message: 'Meeting deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting meeting:', error);
      res
        .status(500)
        .json({ error: error.message || 'Failed to delete meeting' });
    }
  }

  /**
   * Join meeting
   */
  static async joinMeeting(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { meetingId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const session = await prisma.session.findUnique({
        where: { id: meetingId },
        include: {
          participants: true,
        },
      });

      if (!session) {
        res.status(404).json({ error: 'Meeting not found' });
        return;
      }

      // Check if user has access to this meeting
      const hasAccess =
        session.hostId === userId ||
        session.participants.some((p) => p.userId === userId) ||
        session.isOpenToAll;

      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Update participant status
      await prisma.sessionParticipant.upsert({
        where: {
          sessionId_userId: {
            sessionId: meetingId,
            userId: userId,
          },
        },
        create: {
          sessionId: meetingId,
          userId: userId,
          status: 'JOINED',
        },
        update: {
          status: 'JOINED',
        },
      });

      res.json({
        success: true,
        data: {
          meetingLink: session.meetingLink,
          meetingId: session.zoomMeetingId,
        },
      });
    } catch (error: any) {
      console.error('Error joining meeting:', error);
      res
        .status(500)
        .json({ error: error.message || 'Failed to join meeting' });
    }
  }

  /**
   * End meeting
   */
  static async endMeeting(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { meetingId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const session = await prisma.session.findUnique({
        where: { id: meetingId },
      });

      if (!session) {
        res.status(404).json({ error: 'Meeting not found' });
        return;
      }

      // Only host can end meeting
      if (session.hostId !== userId) {
        res
          .status(403)
          .json({ error: 'Only meeting host can end the meeting' });
        return;
      }

      // End Zoom meeting
      if (session.zoomMeetingId) {
        try {
          await zoomService.updateMeetingStatus(session.zoomMeetingId, 'end');
        } catch (error) {
          console.warn('Could not end Zoom meeting:', error);
        }
      }

      // Update session status
      await prisma.session.update({
        where: { id: meetingId },
        data: {
          status: 'COMPLETED',
        },
      });

      res.json({
        success: true,
        message: 'Meeting ended successfully',
      });
    } catch (error: any) {
      console.error('Error ending meeting:', error);
      res.status(500).json({ error: error.message || 'Failed to end meeting' });
    }
  }

  /**
   * Get meeting participants
   */
  static async getMeetingParticipants(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { meetingId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const session = await prisma.session.findUnique({
        where: { id: meetingId },
        include: {
          participants: {
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

      if (!session) {
        res.status(404).json({ error: 'Meeting not found' });
        return;
      }

      // Check if user has access to this meeting
      const hasAccess =
        session.hostId === userId ||
        session.participants.some((p) => p.userId === userId);

      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Get Zoom participants if meeting is ongoing
      let zoomParticipants: any = null;
      if (session.status === 'ONGOING' && session.zoomMeetingId) {
        try {
          zoomParticipants = await zoomService.getMeetingParticipants(
            session.zoomMeetingId
          );
        } catch (error) {
          console.warn('Could not fetch Zoom participants:', error);
        }
      }

      res.json({
        success: true,
        data: {
          participants: session.participants,
          zoomParticipants,
        },
      });
    } catch (error: any) {
      console.error('Error getting meeting participants:', error);
      res
        .status(500)
        .json({ error: error.message || 'Failed to get meeting participants' });
    }
  }

  /**
   * Get meeting invitations
   */
  static async getMeetingInvitations(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { meetingId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const session = await prisma.session.findUnique({
        where: { id: meetingId },
        include: {
          participants: {
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

      if (!session) {
        res.status(404).json({ error: 'Meeting not found' });
        return;
      }

      // Check if user has access to this meeting (host or participant)
      const hasAccess =
        session.hostId === userId ||
        session.participants.some((p) => p.userId === userId);

      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Return invitations with user details and invitation status
      const invitations = session.participants.map((participant) => ({
        id: participant.id,
        userId: participant.userId,
        email: participant.user.email,
        name: participant.user.name,
        role: participant.user.role,
        invitedAt: participant.invitedAt,
        respondedAt: participant.respondedAt,
        status: participant.status,
      }));

      res.json({
        success: true,
        data: {
          invitations,
          total: invitations.length,
        },
      });
    } catch (error: any) {
      console.error('Error getting meeting invitations:', error);
      res
        .status(500)
        .json({ error: error.message || 'Failed to get meeting invitations' });
    }
  }

  /**
   * Invite users to meeting
   */
  static async inviteToMeeting(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { meetingId } = req.params;
      const { invitees } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const session = await prisma.session.findUnique({
        where: { id: meetingId },
        include: {
          host: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!session) {
        res.status(404).json({ error: 'Meeting not found' });
        return;
      }

      // Only host can invite users
      if (session.hostId !== userId) {
        res.status(403).json({ error: 'Only meeting host can invite users' });
        return;
      }

      // Send Zoom invitation (if available)
      if (session.zoomMeetingId) {
        try {
          await zoomService.sendMeetingInvitation(
            session.zoomMeetingId,
            invitees
          );
        } catch (error) {
          console.warn('Could not send Zoom invitation:', error);
        }
      }

      // Add participants to session and send SMTP emails
      const newParticipants: any[] = [];
      const emailPromises: any[] = [];

      for (const email of invitees) {
        const invitedUser = await prisma.user.findUnique({
          where: { email },
        });

        if (invitedUser) {
          const participant = await prisma.sessionParticipant.upsert({
            where: {
              sessionId_userId: {
                sessionId: meetingId,
                userId: invitedUser.id,
              },
            },
            create: {
              sessionId: meetingId,
              userId: invitedUser.id,
              status: 'INVITED',
            },
            update: {
              status: 'INVITED',
            },
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
          });

          newParticipants.push(participant);

          // Send SMTP email invitation
          const emailData = {
            recipientEmail: invitedUser.email,
            recipientName: invitedUser.name,
            meetingTitle: session.title,
            meetingDescription: session.description || undefined,
            startTime: session.scheduledAt.toISOString(),
            duration: session.duration,
            joinUrl:
              session.meetingLink ||
              `http://localhost:3000/meetings/${meetingId}`,
            meetingId: meetingId,
            hostName: session.host.name,
            hostEmail: session.host.email,
            agenda: session.agenda || undefined,
            timezone: 'IST',
          };

          emailPromises.push(emailService.sendMeetingInvitation(emailData));
        }
      }

      // Send all emails concurrently
      try {
        await Promise.all(emailPromises);
      } catch (error) {
        console.error('Error sending email invitations:', error);
        // Continue even if email sending fails
      }

      res.json({
        success: true,
        data: {
          newParticipants,
          message: 'Invitations sent successfully',
        },
      });
    } catch (error: any) {
      console.error('Error inviting to meeting:', error);
      res
        .status(500)
        .json({ error: error.message || 'Failed to invite users' });
    }
  }
}

export default ZoomController;
