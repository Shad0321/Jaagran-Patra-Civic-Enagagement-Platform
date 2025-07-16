import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MeetingInvitationData {
  recipientEmail: string;
  recipientName: string;
  meetingTitle: string;
  meetingDescription?: string;
  startTime: string;
  duration: number;
  joinUrl: string;
  meetingId: string;
  hostName: string;
  hostEmail: string;
  password?: string;
  agenda?: string;
  timezone?: string;
}

interface MeetingReminderData {
  recipientEmail: string;
  recipientName: string;
  meetingTitle: string;
  startTime: string;
  joinUrl: string;
  hostName: string;
  agenda?: string;
}

interface MeetingCancellationData {
  recipientEmail: string;
  recipientName: string;
  meetingTitle: string;
  startTime: string;
  hostName: string;
  reason?: string;
}

interface MeetingUpdateData {
  recipientEmail: string;
  recipientName: string;
  meetingTitle: string;
  oldStartTime: string;
  newStartTime: string;
  joinUrl: string;
  hostName: string;
  changes: string[];
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Send meeting invitation email
   */
  async sendMeetingInvitation(data: MeetingInvitationData): Promise<void> {
    const startDateTime = new Date(data.startTime);
    const endDateTime = new Date(
      startDateTime.getTime() + data.duration * 60000
    );

    const formatDate = (date: Date) => {
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

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1f4e79; margin-bottom: 10px;">Meeting Invitation</h1>
          <p style="color: #666; font-size: 14px;">You have been invited to join a meeting</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <h2 style="color: #1f4e79; margin-top: 0; margin-bottom: 15px;">${data.meetingTitle}</h2>
          ${data.meetingDescription ? `<p style="color: #666; margin-bottom: 15px;">${data.meetingDescription}</p>` : ''}
          
          <div style="margin-bottom: 10px;">
            <strong style="color: #333;">Host:</strong> ${data.hostName} (${data.hostEmail})
          </div>
          
          <div style="margin-bottom: 10px;">
            <strong style="color: #333;">Date & Time:</strong> ${formatDate(startDateTime)}
          </div>
          
          <div style="margin-bottom: 10px;">
            <strong style="color: #333;">Duration:</strong> ${data.duration} minutes
          </div>
          
          ${
            data.password
              ? `
            <div style="margin-bottom: 10px;">
              <strong style="color: #333;">Meeting Password:</strong> <code style="background-color: #e9ecef; padding: 2px 4px; border-radius: 3px;">${data.password}</code>
            </div>
          `
              : ''
          }
          
          ${
            data.agenda
              ? `
            <div style="margin-bottom: 10px;">
              <strong style="color: #333;">Agenda:</strong>
              <p style="color: #666; margin-top: 5px; white-space: pre-wrap;">${data.agenda}</p>
            </div>
          `
              : ''
          }
        </div>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${data.joinUrl}" style="display: inline-block; background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Meeting</a>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
          <h3 style="color: #1f4e79; margin-top: 0; margin-bottom: 10px;">Meeting Details</h3>
          <p style="color: #666; margin-bottom: 5px;"><strong>Meeting ID:</strong> ${data.meetingId}</p>
          <p style="color: #666; margin-bottom: 5px;"><strong>Join URL:</strong> <a href="${data.joinUrl}" style="color: #0066cc;">${data.joinUrl}</a></p>
        </div>
        
        <div style="border-top: 1px solid #ddd; padding-top: 15px; color: #666; font-size: 12px;">
          <p style="margin-bottom: 5px;">This invitation was sent by ${data.hostName} through the Jaagran Patra platform.</p>
          <p style="margin-bottom: 0;">If you have any questions, please contact the meeting host directly.</p>
        </div>
      </div>
    `;

    const textContent = `
      Meeting Invitation
      
      You have been invited to join: ${data.meetingTitle}
      ${data.meetingDescription ? `\nDescription: ${data.meetingDescription}` : ''}
      
      Host: ${data.hostName} (${data.hostEmail})
      Date & Time: ${formatDate(startDateTime)}
      Duration: ${data.duration} minutes
      ${data.password ? `Meeting Password: ${data.password}` : ''}
      ${data.agenda ? `\nAgenda:\n${data.agenda}` : ''}
      
      Join the meeting: ${data.joinUrl}
      Meeting ID: ${data.meetingId}
      
      This invitation was sent by ${data.hostName} through the Jaagran Patra platform.
    `;

    await this.transporter.sendMail({
      from: `"Jaagran Patra" <${process.env.SMTP_USER}>`,
      to: data.recipientEmail,
      subject: `Meeting Invitation: ${data.meetingTitle}`,
      text: textContent,
      html: htmlContent,
    });
  }

  /**
   * Send meeting reminder email
   */
  async sendMeetingReminder(data: MeetingReminderData): Promise<void> {
    const startDateTime = new Date(data.startTime);
    const formatDate = (date: Date) => {
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

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1f4e79; margin-bottom: 10px;">Meeting Reminder</h1>
          <p style="color: #666; font-size: 14px;">Your meeting is starting soon</p>
        </div>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
          <h2 style="color: #1f4e79; margin-top: 0; margin-bottom: 15px;">${data.meetingTitle}</h2>
          
          <div style="margin-bottom: 10px;">
            <strong style="color: #333;">Host:</strong> ${data.hostName}
          </div>
          
          <div style="margin-bottom: 10px;">
            <strong style="color: #333;">Starting:</strong> ${formatDate(startDateTime)}
          </div>
          
          ${
            data.agenda
              ? `
            <div style="margin-bottom: 10px;">
              <strong style="color: #333;">Agenda:</strong>
              <p style="color: #666; margin-top: 5px; white-space: pre-wrap;">${data.agenda}</p>
            </div>
          `
              : ''
          }
        </div>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${data.joinUrl}" style="display: inline-block; background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Meeting Now</a>
        </div>
        
        <div style="border-top: 1px solid #ddd; padding-top: 15px; color: #666; font-size: 12px;">
          <p style="margin-bottom: 0;">This reminder was sent by the Jaagran Patra platform.</p>
        </div>
      </div>
    `;

    const textContent = `
      Meeting Reminder
      
      Your meeting "${data.meetingTitle}" is starting soon!
      
      Host: ${data.hostName}
      Starting: ${formatDate(startDateTime)}
      ${data.agenda ? `\nAgenda:\n${data.agenda}` : ''}
      
      Join the meeting: ${data.joinUrl}
      
      This reminder was sent by the Jaagran Patra platform.
    `;

    await this.transporter.sendMail({
      from: `"Jaagran Patra" <${process.env.SMTP_USER}>`,
      to: data.recipientEmail,
      subject: `Reminder: ${data.meetingTitle} starting soon`,
      text: textContent,
      html: htmlContent,
    });
  }

  /**
   * Send meeting cancellation email
   */
  async sendMeetingCancellation(data: MeetingCancellationData): Promise<void> {
    const startDateTime = new Date(data.startTime);
    const formatDate = (date: Date) => {
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

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc3545; margin-bottom: 10px;">Meeting Cancelled</h1>
          <p style="color: #666; font-size: 14px;">The following meeting has been cancelled</p>
        </div>
        
        <div style="background-color: #f8d7da; padding: 20px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #dc3545;">
          <h2 style="color: #721c24; margin-top: 0; margin-bottom: 15px;">${data.meetingTitle}</h2>
          
          <div style="margin-bottom: 10px;">
            <strong style="color: #333;">Host:</strong> ${data.hostName}
          </div>
          
          <div style="margin-bottom: 10px;">
            <strong style="color: #333;">Originally scheduled:</strong> ${formatDate(startDateTime)}
          </div>
          
          ${
            data.reason
              ? `
            <div style="margin-bottom: 10px;">
              <strong style="color: #333;">Reason:</strong>
              <p style="color: #666; margin-top: 5px; white-space: pre-wrap;">${data.reason}</p>
            </div>
          `
              : ''
          }
        </div>
        
        <div style="border-top: 1px solid #ddd; padding-top: 15px; color: #666; font-size: 12px;">
          <p style="margin-bottom: 5px;">This cancellation notice was sent by ${data.hostName} through the Jaagran Patra platform.</p>
          <p style="margin-bottom: 0;">If you have any questions, please contact the meeting host directly.</p>
        </div>
      </div>
    `;

    const textContent = `
      Meeting Cancelled
      
      The following meeting has been cancelled: ${data.meetingTitle}
      
      Host: ${data.hostName}
      Originally scheduled: ${formatDate(startDateTime)}
      ${data.reason ? `\nReason: ${data.reason}` : ''}
      
      This cancellation notice was sent by ${data.hostName} through the Jaagran Patra platform.
    `;

    await this.transporter.sendMail({
      from: `"Jaagran Patra" <${process.env.SMTP_USER}>`,
      to: data.recipientEmail,
      subject: `Cancelled: ${data.meetingTitle}`,
      text: textContent,
      html: htmlContent,
    });
  }

  /**
   * Send meeting update email
   */
  async sendMeetingUpdate(data: MeetingUpdateData): Promise<void> {
    const oldStartDateTime = new Date(data.oldStartTime);
    const newStartDateTime = new Date(data.newStartTime);
    const formatDate = (date: Date) => {
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

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #fd7e14; margin-bottom: 10px;">Meeting Updated</h1>
          <p style="color: #666; font-size: 14px;">The following meeting has been updated</p>
        </div>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
          <h2 style="color: #1f4e79; margin-top: 0; margin-bottom: 15px;">${data.meetingTitle}</h2>
          
          <div style="margin-bottom: 10px;">
            <strong style="color: #333;">Host:</strong> ${data.hostName}
          </div>
          
          <div style="margin-bottom: 10px;">
            <strong style="color: #333;">Previous time:</strong> <span style="text-decoration: line-through; color: #666;">${formatDate(oldStartDateTime)}</span>
          </div>
          
          <div style="margin-bottom: 10px;">
            <strong style="color: #333;">New time:</strong> <span style="color: #28a745; font-weight: bold;">${formatDate(newStartDateTime)}</span>
          </div>
          
          ${
            data.changes.length > 0
              ? `
            <div style="margin-bottom: 10px;">
              <strong style="color: #333;">Changes made:</strong>
              <ul style="color: #666; margin-top: 5px;">
                ${data.changes.map((change) => `<li>${change}</li>`).join('')}
              </ul>
            </div>
          `
              : ''
          }
        </div>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${data.joinUrl}" style="display: inline-block; background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Meeting</a>
        </div>
        
        <div style="border-top: 1px solid #ddd; padding-top: 15px; color: #666; font-size: 12px;">
          <p style="margin-bottom: 5px;">This update was sent by ${data.hostName} through the Jaagran Patra platform.</p>
          <p style="margin-bottom: 0;">If you have any questions, please contact the meeting host directly.</p>
        </div>
      </div>
    `;

    const textContent = `
      Meeting Updated
      
      The following meeting has been updated: ${data.meetingTitle}
      
      Host: ${data.hostName}
      Previous time: ${formatDate(oldStartDateTime)}
      New time: ${formatDate(newStartDateTime)}
      
      ${data.changes.length > 0 ? `Changes made:\n${data.changes.map((change) => `- ${change}`).join('\n')}` : ''}
      
      Join the meeting: ${data.joinUrl}
      
      This update was sent by ${data.hostName} through the Jaagran Patra platform.
    `;

    await this.transporter.sendMail({
      from: `"Jaagran Patra" <${process.env.SMTP_USER}>`,
      to: data.recipientEmail,
      subject: `Updated: ${data.meetingTitle}`,
      text: textContent,
      html: htmlContent,
    });
  }

  /**
   * Send bulk invitations
   */
  async sendBulkInvitations(
    invitations: MeetingInvitationData[]
  ): Promise<void> {
    const promises = invitations.map((invitation) =>
      this.sendMeetingInvitation(invitation)
    );
    await Promise.all(promises);
  }

  /**
   * Send bulk reminders
   */
  async sendBulkReminders(reminders: MeetingReminderData[]): Promise<void> {
    const promises = reminders.map((reminder) =>
      this.sendMeetingReminder(reminder)
    );
    await Promise.all(promises);
  }

  /**
   * Send bulk cancellations
   */
  async sendBulkCancellations(
    cancellations: MeetingCancellationData[]
  ): Promise<void> {
    const promises = cancellations.map((cancellation) =>
      this.sendMeetingCancellation(cancellation)
    );
    await Promise.all(promises);
  }

  /**
   * Send bulk updates
   */
  async sendBulkUpdates(updates: MeetingUpdateData[]): Promise<void> {
    const promises = updates.map((update) => this.sendMeetingUpdate(update));
    await Promise.all(promises);
  }
}

export default new EmailService();
export {
  MeetingInvitationData,
  MeetingReminderData,
  MeetingCancellationData,
  MeetingUpdateData,
};
