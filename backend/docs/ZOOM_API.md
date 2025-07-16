# Zoom Meeting API Documentation

This document describes the Zoom meeting API endpoints that allow MLAs to create, manage, and conduct meetings with their members and other participants.

## Base URL

```
/meetings
```

## Authentication

All endpoints require authentication using JWT tokens. Only users with the `MLA` role can create meetings.

## Endpoints

### 1. Create Instant Meeting

**POST** `/meetings/instant`

Creates an instant meeting that starts immediately.

**Request Body:**

```json
{
  "topic": "Emergency Community Meeting",
  "agenda": "Discuss recent infrastructure issues"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "session": {
      "id": "session-id",
      "title": "Emergency Community Meeting",
      "description": "Discuss recent infrastructure issues",
      "scheduledAt": "2025-07-15T10:00:00Z",
      "duration": 60,
      "status": "ONGOING",
      "meetingLink": "https://zoom.us/j/123456789",
      "hostId": "user-id",
      "zoomMeetingId": "123456789"
    },
    "zoomMeeting": {
      "id": 123456789,
      "topic": "Emergency Community Meeting",
      "join_url": "https://zoom.us/j/123456789",
      "start_url": "https://zoom.us/s/123456789",
      "password": "123456",
      "start_time": "2025-07-15T10:00:00Z",
      "duration": 60
    }
  }
}
```

### 2. Create Scheduled Meeting

**POST** `/meetings/scheduled`

Creates a scheduled meeting for a future date and time.

**Request Body:**

```json
{
  "topic": "Monthly Community Review",
  "agenda": "Review progress on pending issues and plan next month's activities",
  "startTime": "2025-07-20T14:00:00Z",
  "duration": 90,
  "timezone": "Asia/Kolkata",
  "invitees": ["member1@example.com", "member2@example.com"],
  "isOpenToAll": false,
  "settings": {
    "host_video": true,
    "participant_video": true,
    "join_before_host": false,
    "mute_upon_entry": true,
    "waiting_room": true,
    "auto_recording": "cloud"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "session": {
      "id": "session-id",
      "title": "Monthly Community Review",
      "description": "Review progress on pending issues and plan next month's activities",
      "scheduledAt": "2025-07-20T14:00:00Z",
      "duration": 90,
      "status": "SCHEDULED",
      "meetingLink": "https://zoom.us/j/987654321",
      "hostId": "user-id",
      "zoomMeetingId": "987654321"
    },
    "zoomMeeting": {
      "id": 987654321,
      "topic": "Monthly Community Review",
      "join_url": "https://zoom.us/j/987654321",
      "start_url": "https://zoom.us/s/987654321",
      "password": "654321",
      "start_time": "2025-07-20T14:00:00Z",
      "duration": 90,
      "timezone": "Asia/Kolkata"
    },
    "invitees": ["member1@example.com", "member2@example.com"]
  }
}
```

### 3. Create Recurring Meeting

**POST** `/meetings/recurring`

Creates a recurring meeting with a specified pattern.

**Request Body:**

```json
{
  "topic": "Weekly Status Update",
  "agenda": "Review weekly progress and upcoming tasks",
  "startTime": "2025-07-22T10:00:00Z",
  "duration": 60,
  "recurrenceType": 2,
  "repeatInterval": 1,
  "endTimes": 12,
  "timezone": "Asia/Kolkata",
  "invitees": ["team@example.com"],
  "isOpenToAll": true,
  "settings": {
    "waiting_room": false,
    "auto_recording": "none"
  }
}
```

**Parameters:**

- `recurrenceType`: 1 (Daily), 2 (Weekly), 3 (Monthly)
- `repeatInterval`: How often to repeat (e.g., every 2 weeks)
- `endTimes`: Number of occurrences (optional)
- `endDateTime`: End date for recurrence (optional)

**Response:**

```json
{
  "success": true,
  "data": {
    "session": {
      "id": "session-id",
      "title": "Weekly Status Update",
      "scheduledAt": "2025-07-22T10:00:00Z",
      "duration": 60,
      "status": "SCHEDULED",
      "isRecurring": true,
      "recurrenceData": {
        "type": 2,
        "repeatInterval": 1,
        "endTimes": 12
      }
    },
    "zoomMeeting": {
      "id": 555666777,
      "topic": "Weekly Status Update",
      "recurrence": {
        "type": 2,
        "repeat_interval": 1,
        "end_times": 12
      },
      "occurrences": [
        {
          "occurrence_id": "1690200000000",
          "start_time": "2025-07-22T10:00:00Z",
          "duration": 60,
          "status": "available"
        }
      ]
    }
  }
}
```

### 4. Get User Meetings

**GET** `/meetings?type=upcoming&page=1&limit=10`

Retrieves meetings for the authenticated user.

**Query Parameters:**

- `type`: `all`, `upcoming`, `past`, `ongoing` (default: `all`)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response:**

```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "session-id",
        "title": "Monthly Community Review",
        "scheduledAt": "2025-07-20T14:00:00Z",
        "duration": 90,
        "status": "SCHEDULED",
        "meetingLink": "https://zoom.us/j/987654321",
        "host": {
          "id": "user-id",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "participants": [
          {
            "id": "participant-id",
            "status": "INVITED",
            "user": {
              "id": "user-id",
              "name": "Jane Smith",
              "email": "jane@example.com"
            }
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

### 5. Get Meeting Details

**GET** `/meetings/{meetingId}`

Retrieves detailed information about a specific meeting.

**Response:**

```json
{
  "success": true,
  "data": {
    "session": {
      "id": "session-id",
      "title": "Monthly Community Review",
      "description": "Review progress on pending issues",
      "scheduledAt": "2025-07-20T14:00:00Z",
      "duration": 90,
      "status": "SCHEDULED",
      "meetingLink": "https://zoom.us/j/987654321",
      "agenda": "1. Review pending issues\n2. Plan next month",
      "host": {
        "id": "user-id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "participants": [
        {
          "id": "participant-id",
          "status": "INVITED",
          "invitedAt": "2025-07-15T10:00:00Z",
          "user": {
            "id": "user-id",
            "name": "Jane Smith",
            "email": "jane@example.com"
          }
        }
      ]
    },
    "zoomMeetingData": {
      "id": 987654321,
      "topic": "Monthly Community Review",
      "join_url": "https://zoom.us/j/987654321",
      "password": "654321"
    }
  }
}
```

### 6. Update Meeting

**PUT** `/meetings/{meetingId}`

Updates an existing meeting. Only the host can update meetings.

**Request Body:**

```json
{
  "topic": "Updated Meeting Title",
  "agenda": "Updated agenda",
  "startTime": "2025-07-20T15:00:00Z",
  "duration": 120
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "session-id",
    "title": "Updated Meeting Title",
    "scheduledAt": "2025-07-20T15:00:00Z",
    "duration": 120,
    "agenda": "Updated agenda"
  }
}
```

### 7. Delete Meeting

**DELETE** `/meetings/{meetingId}`

Deletes a meeting. Only the host can delete meetings.

**Response:**

```json
{
  "success": true,
  "message": "Meeting deleted successfully"
}
```

### 8. Join Meeting

**POST** `/meetings/{meetingId}/join`

Allows a user to join a meeting.

**Response:**

```json
{
  "success": true,
  "data": {
    "meetingLink": "https://zoom.us/j/987654321",
    "meetingId": "987654321"
  }
}
```

### 9. End Meeting

**POST** `/meetings/{meetingId}/end`

Ends an ongoing meeting. Only the host can end meetings.

**Response:**

```json
{
  "success": true,
  "message": "Meeting ended successfully"
}
```

### 10. Get Meeting Participants

**GET** `/meetings/{meetingId}/participants`

Retrieves the list of participants for a meeting.

**Response:**

```json
{
  "success": true,
  "data": {
    "participants": [
      {
        "id": "participant-id",
        "status": "JOINED",
        "invitedAt": "2025-07-15T10:00:00Z",
        "user": {
          "id": "user-id",
          "name": "Jane Smith",
          "email": "jane@example.com",
          "role": "MEMBER"
        }
      }
    ],
    "zoomParticipants": [
      {
        "id": "zoom-participant-id",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "join_time": "2025-07-20T14:05:00Z",
        "leave_time": null
      }
    ]
  }
}
```

### 11. Invite to Meeting

**POST** `/meetings/{meetingId}/invite`

Invites additional users to a meeting. Only the host can invite users.

**Request Body:**

```json
{
  "invitees": ["newuser1@example.com", "newuser2@example.com"]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "newParticipants": [
      {
        "id": "participant-id",
        "status": "INVITED",
        "user": {
          "id": "user-id",
          "name": "New User",
          "email": "newuser1@example.com"
        }
      }
    ],
    "message": "Invitations sent successfully"
  }
}
```

## Error Responses

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

## Common Error Codes

- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Insufficient permissions (e.g., non-MLA trying to create meeting)
- `404 Not Found`: Meeting not found
- `400 Bad Request`: Invalid request data
- `500 Internal Server Error`: Server error

## Meeting Settings

The `settings` object in meeting creation requests can include:

```json
{
  "host_video": true,
  "participant_video": true,
  "join_before_host": false,
  "mute_upon_entry": true,
  "use_pmi": false,
  "approval_type": 0,
  "auto_recording": "cloud",
  "waiting_room": true,
  "meeting_authentication": false,
  "email_notification": true,
  "registrants_email_notification": true,
  "registrants_confirmation_email": true
}
```

## Best Practices

1. **Schedule meetings in advance**: Avoid creating meetings with start times in the past
2. **Use appropriate duration**: Keep meetings within reasonable time limits
3. **Set clear agendas**: Provide detailed agendas to help participants prepare
4. **Manage invitations**: Use `isOpenToAll` for public meetings, specific invites for private ones
5. **Enable recordings**: Use `auto_recording` for important meetings
6. **Use waiting rooms**: Enable waiting rooms for better meeting control

## Rate Limits

- Meeting creation: 100 requests per day per user
- Other endpoints: Standard API rate limits apply

## Environment Variables Required

```env
ZOOM_ACCOUNT_ID=your_zoom_account_id
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```
