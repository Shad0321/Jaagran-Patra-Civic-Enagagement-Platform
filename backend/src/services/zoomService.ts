import axios from 'axios';
import { Buffer } from 'buffer';

interface ZoomAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  api_url: string;
}

interface ZoomMeetingRequest {
  topic: string;
  type: 1 | 2 | 3 | 8; // 1: Instant, 2: Scheduled, 3: Recurring (no fixed time), 8: Recurring (fixed time)
  start_time?: string;
  duration?: number;
  timezone?: string;
  password?: string;
  agenda?: string;
  settings?: {
    host_video?: boolean;
    participant_video?: boolean;
    join_before_host?: boolean;
    mute_upon_entry?: boolean;
    use_pmi?: boolean;
    approval_type?: 0 | 1 | 2; // 0: auto, 1: manually, 2: no registration
    registration_type?: 1 | 2 | 3; // 1: register once, 2: register each time, 3: register once and pick occurrence
    auto_recording?: 'local' | 'cloud' | 'none';
    alternative_hosts?: string;
    close_registration?: boolean;
    waiting_room?: boolean;
    meeting_authentication?: boolean;
    meeting_invitees?: Array<{
      email: string;
    }>;
    email_notification?: boolean;
    registrants_email_notification?: boolean;
    registrants_confirmation_email?: boolean;
  };
  recurrence?: {
    type: 1 | 2 | 3; // 1: Daily, 2: Weekly, 3: Monthly
    repeat_interval: number;
    weekly_days?: string;
    monthly_day?: number;
    monthly_week?: number;
    monthly_week_day?: number;
    end_times?: number;
    end_date_time?: string;
  };
}

interface ZoomMeetingResponse {
  id: number;
  uuid: string;
  host_id: string;
  host_email: string;
  topic: string;
  type: number;
  status: string;
  start_time: string;
  duration: number;
  timezone: string;
  created_at: string;
  start_url: string;
  join_url: string;
  password: string;
  agenda: string;
  settings: {
    host_video: boolean;
    participant_video: boolean;
    join_before_host: boolean;
    mute_upon_entry: boolean;
    use_pmi: boolean;
    approval_type: number;
    registration_type: number;
    auto_recording: string;
    alternative_hosts: string;
    close_registration: boolean;
    waiting_room: boolean;
    meeting_authentication: boolean;
    meeting_invitees: Array<{
      email: string;
    }>;
    email_notification: boolean;
    registrants_email_notification: boolean;
    registrants_confirmation_email: boolean;
  };
  recurrence?: {
    type: number;
    repeat_interval: number;
    weekly_days: string;
    monthly_day: number;
    monthly_week: number;
    monthly_week_day: number;
    end_times: number;
    end_date_time: string;
  };
  occurrences?: Array<{
    occurrence_id: string;
    start_time: string;
    duration: number;
    status: string;
  }>;
}

interface ZoomMeetingListResponse {
  page_count: number;
  page_number: number;
  page_size: number;
  total_records: number;
  meetings: ZoomMeetingResponse[];
}

interface ZoomUser {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  email: string;
  type: number;
  role_name: string;
  pmi: number;
  use_pmi: boolean;
  personal_meeting_url: string;
  timezone: string;
  verified: number;
  dept: string;
  created_at: string;
  last_login_time: string;
  last_client_version: string;
  pic_url: string;
  host_key: string;
  jid: string;
  group_ids: string[];
  im_group_ids: string[];
  account_id: string;
  language: string;
  phone_country: string;
  phone_number: string;
  status: string;
}

class ZoomService {
  private baseURL = 'https://api.zoom.us/v2';
  private tokenURL = 'https://zoom.us/oauth/token';
  private accountId: string;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiryTime: number = 0;

  constructor() {
    this.accountId = process.env.ZOOM_ACCOUNT_ID!;
    this.clientId = process.env.ZOOM_CLIENT_ID!;
    this.clientSecret = process.env.ZOOM_CLIENT_SECRET!;

    if (!this.accountId || !this.clientId || !this.clientSecret) {
      throw new Error('Missing Zoom credentials in environment variables');
    }
  }

  /**
   * Generate access token using server-to-server OAuth
   */
  private async generateAccessToken(): Promise<string> {
    try {
      // Check if token is still valid (with 5 minute buffer)
      if (this.accessToken && Date.now() < this.tokenExpiryTime - 300000) {
        return this.accessToken;
      }

      // Encode client credentials in base64
      const credentials = Buffer.from(
        `${this.clientId}:${this.clientSecret}`
      ).toString('base64');

      const response = await axios.post(
        this.tokenURL,
        new URLSearchParams({
          grant_type: 'account_credentials',
          account_id: this.accountId,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${credentials}`,
          },
        }
      );

      const tokenData: ZoomAccessToken = response.data;
      this.accessToken = tokenData.access_token;
      this.tokenExpiryTime = Date.now() + tokenData.expires_in * 1000;

      return this.accessToken;
    } catch (error: any) {
      console.error(
        'Error generating Zoom access token:',
        error.response?.data || error.message
      );
      throw new Error('Failed to generate Zoom access token');
    }
  }

  /**
   * Make authenticated request to Zoom API
   */
  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<T> {
    const token = await this.generateAccessToken();

    try {
      const response = await axios({
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data,
      });

      return response.data;
    } catch (error: any) {
      console.error(
        `Error making Zoom API request to ${endpoint}:`,
        error.response?.data || error.message
      );
      throw new Error(
        `Zoom API request failed: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<ZoomUser> {
    return this.makeRequest<ZoomUser>('GET', '/users/me');
  }

  /**
   * Create a new meeting
   */
  async createMeeting(
    userId: string,
    meetingData: ZoomMeetingRequest
  ): Promise<ZoomMeetingResponse> {
    return this.makeRequest<ZoomMeetingResponse>(
      'POST',
      `/users/${userId}/meetings`,
      meetingData
    );
  }

  /**
   * Create instant meeting
   */
  async createInstantMeeting(
    userId: string,
    topic: string,
    agenda?: string
  ): Promise<ZoomMeetingResponse> {
    const meetingData: ZoomMeetingRequest = {
      topic,
      type: 1, // Instant meeting
      agenda,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        use_pmi: false,
        approval_type: 0, // Automatically approve
        auto_recording: 'none',
        waiting_room: false,
        email_notification: true,
        registrants_email_notification: true,
        registrants_confirmation_email: true,
      },
    };

    return this.createMeeting(userId, meetingData);
  }

  /**
   * Create scheduled meeting
   */
  async createScheduledMeeting(
    userId: string,
    topic: string,
    startTime: string,
    duration: number,
    timezone: string = 'UTC',
    agenda?: string,
    invitees?: string[],
    settings?: Partial<ZoomMeetingRequest['settings']>
  ): Promise<ZoomMeetingResponse> {
    const meetingData: ZoomMeetingRequest = {
      topic,
      type: 2, // Scheduled meeting
      start_time: startTime,
      duration,
      timezone,
      agenda,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        use_pmi: false,
        approval_type: 0, // Automatically approve
        auto_recording: 'none',
        waiting_room: false,
        email_notification: true,
        registrants_email_notification: true,
        registrants_confirmation_email: true,
        meeting_invitees: invitees?.map((email) => ({ email })),
        ...settings,
      },
    };

    return this.createMeeting(userId, meetingData);
  }

  /**
   * Create recurring meeting
   */
  async createRecurringMeeting(
    userId: string,
    topic: string,
    startTime: string,
    duration: number,
    recurrenceType: 1 | 2 | 3, // 1: Daily, 2: Weekly, 3: Monthly
    repeatInterval: number,
    endTimes?: number,
    endDateTime?: string,
    timezone: string = 'UTC',
    agenda?: string,
    invitees?: string[],
    settings?: Partial<ZoomMeetingRequest['settings']>
  ): Promise<ZoomMeetingResponse> {
    const meetingData: ZoomMeetingRequest = {
      topic,
      type: 8, // Recurring meeting with fixed time
      start_time: startTime,
      duration,
      timezone,
      agenda,
      recurrence: {
        type: recurrenceType,
        repeat_interval: repeatInterval,
        end_times: endTimes,
        end_date_time: endDateTime,
      },
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        use_pmi: false,
        approval_type: 0, // Automatically approve
        auto_recording: 'none',
        waiting_room: false,
        email_notification: true,
        registrants_email_notification: true,
        registrants_confirmation_email: true,
        meeting_invitees: invitees?.map((email) => ({ email })),
        ...settings,
      },
    };

    return this.createMeeting(userId, meetingData);
  }

  /**
   * Get meeting details
   */
  async getMeeting(meetingId: string): Promise<ZoomMeetingResponse> {
    return this.makeRequest<ZoomMeetingResponse>(
      'GET',
      `/meetings/${meetingId}`
    );
  }

  /**
   * Update meeting
   */
  async updateMeeting(
    meetingId: string,
    meetingData: Partial<ZoomMeetingRequest>
  ): Promise<void> {
    await this.makeRequest('PATCH', `/meetings/${meetingId}`, meetingData);
  }

  /**
   * Delete meeting
   */
  async deleteMeeting(meetingId: string): Promise<void> {
    await this.makeRequest('DELETE', `/meetings/${meetingId}`);
  }

  /**
   * List meetings for a user
   */
  async listMeetings(
    userId: string,
    type: 'scheduled' | 'live' | 'upcoming' | 'previous' = 'scheduled',
    pageSize: number = 30,
    pageNumber: number = 1
  ): Promise<ZoomMeetingListResponse> {
    return this.makeRequest<ZoomMeetingListResponse>(
      'GET',
      `/users/${userId}/meetings?type=${type}&page_size=${pageSize}&page_number=${pageNumber}`
    );
  }

  /**
   * Get meeting participants
   */
  async getMeetingParticipants(meetingId: string): Promise<any> {
    return this.makeRequest('GET', `/meetings/${meetingId}/participants`);
  }

  /**
   * Get meeting recordings
   */
  async getMeetingRecordings(meetingId: string): Promise<any> {
    return this.makeRequest('GET', `/meetings/${meetingId}/recordings`);
  }

  /**
   * Add meeting registrant
   */
  async addMeetingRegistrant(
    meetingId: string,
    email: string,
    firstName: string,
    lastName: string
  ): Promise<any> {
    const registrantData = {
      email,
      first_name: firstName,
      last_name: lastName,
    };

    return this.makeRequest(
      'POST',
      `/meetings/${meetingId}/registrants`,
      registrantData
    );
  }

  /**
   * Get meeting registrants
   */
  async getMeetingRegistrants(meetingId: string): Promise<any> {
    return this.makeRequest('GET', `/meetings/${meetingId}/registrants`);
  }

  /**
   * Send meeting invitation
   */
  async sendMeetingInvitation(
    meetingId: string,
    invitees: string[]
  ): Promise<any> {
    const invitationData = {
      meeting_invitees: invitees.map((email) => ({ email })),
    };

    return this.makeRequest(
      'POST',
      `/meetings/${meetingId}/invitation`,
      invitationData
    );
  }

  /**
   * Get meeting invitation
   */
  async getMeetingInvitation(meetingId: string): Promise<any> {
    return this.makeRequest('GET', `/meetings/${meetingId}/invitation`);
  }

  /**
   * Update meeting status (end meeting)
   */
  async updateMeetingStatus(meetingId: string, action: 'end'): Promise<void> {
    await this.makeRequest('PUT', `/meetings/${meetingId}/status`, { action });
  }

  /**
   * Get account settings
   */
  async getAccountSettings(): Promise<any> {
    return this.makeRequest('GET', '/accounts/me/settings');
  }

  /**
   * Get user settings
   */
  async getUserSettings(userId: string): Promise<any> {
    return this.makeRequest('GET', `/users/${userId}/settings`);
  }
}

export default new ZoomService();
