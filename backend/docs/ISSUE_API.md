# Issue Management API Documentation

## Overview

The Issue Management system in JagranPatra allows MLAs to create, assign, and track issues within their constituencies. The system supports multimedia content (voice, images) and provides real-time updates through two main channels:

- **Member Updates**: Updates from assigned MEMBER personnel
- **Citizen Comments**: Comments and feedback from citizens

## Table of Contents

1. [Authentication](#authentication)
2. [Issue Endpoints](#issue-endpoints)
3. [Data Models](#data-models)
4. [Error Handling](#error-handling)
5. [Examples](#examples)

## Authentication

All endpoints require Bearer token authentication:

```
Authorization: Bearer <your-jwt-token>
```

## Issue Endpoints

### 1. Create Issue (MLA Only)

**POST** `/issues`

Creates a new issue that can be assigned to subordinate members.

**Access**: MLA role only

**Request Body**:

```json
{
  "title": "Road repair needed in Sector 12",
  "description": "The main road in Sector 12 has multiple potholes causing traffic issues",
  "category": "Infrastructure",
  "priority": "HIGH",
  "isUrgent": true,
  "assignedToId": "member-uuid-here",
  "address": "Sector 12, Main Road, City Name",
  "latitude": 28.6139,
  "longitude": 77.209,
  "stateId": "state-uuid-here",
  "districtId": "district-uuid-here",
  "constituencyId": "constituency-uuid-here",
  "bodyId": "body-uuid-here",
  "voiceNote": "https://example.com/voice-recording.mp3",
  "images": "[\"https://example.com/image1.jpg\", \"https://example.com/image2.jpg\"]"
}
```

**Required Fields**:

- `title` (string): Issue title
- `description` (string): Detailed description
- `category` (string): Issue category
- `stateId` (string): State identifier

**Optional Fields**:

- `priority` (enum): LOW, MEDIUM, HIGH, URGENT (default: MEDIUM)
- `isUrgent` (boolean): Mark as urgent (default: false)
- `assignedToId` (string): UUID of the member to assign
- `address` (string): Physical address
- `latitude` (number): GPS latitude
- `longitude` (number): GPS longitude
- `districtId` (string): District identifier
- `constituencyId` (string): Constituency identifier
- `bodyId` (string): Local body identifier
- `voiceNote` (string): URL to voice recording
- `images` (string): JSON array of image URLs

**Response**:

```json
{
  "message": "Issue created successfully",
  "issue": {
    "id": "issue-uuid-here",
    "title": "Road repair needed in Sector 12",
    "description": "The main road in Sector 12 has multiple potholes causing traffic issues",
    "category": "Infrastructure",
    "status": "PENDING",
    "priority": "HIGH",
    "isUrgent": true,
    "voiceNote": "https://example.com/voice-recording.mp3",
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    "address": "Sector 12, Main Road, City Name",
    "latitude": 28.6139,
    "longitude": 77.209,
    "reportedBy": {
      "id": "mla-uuid-here",
      "name": "MLA Name",
      "email": "mla@example.com",
      "role": "MLA"
    },
    "assignedTo": {
      "id": "member-uuid-here",
      "name": "Member Name",
      "email": "member@example.com",
      "role": "MEMBER"
    },
    "state": {
      "id": "state-uuid-here",
      "name": "State Name"
    },
    "district": {
      "id": "district-uuid-here",
      "name": "District Name"
    },
    "constituency": {
      "id": "constituency-uuid-here",
      "name": "Constituency Name"
    },
    "body": {
      "id": "body-uuid-here",
      "name": "Body Name",
      "type": "SHAKTI_KENDRA"
    },
    "createdAt": "2025-07-11T09:00:00Z",
    "updatedAt": "2025-07-11T09:00:00Z"
  }
}
```

### 2. Get Issues

**GET** `/issues`

Retrieves issues based on user role and permissions.

**Access**: All authenticated users

**Query Parameters**:

- `status` (optional): PENDING, IN_PROGRESS, RESOLVED, REJECTED
- `priority` (optional): LOW, MEDIUM, HIGH, URGENT
- `category` (optional): String filter for category
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search in title and description

**Example**: `/issues?status=PENDING&priority=HIGH&page=1&limit=20`

**Response**:

```json
{
  "issues": [
    {
      "id": "issue-uuid-here",
      "title": "Road repair needed in Sector 12",
      "description": "The main road in Sector 12 has multiple potholes causing traffic issues",
      "category": "Infrastructure",
      "status": "PENDING",
      "priority": "HIGH",
      "isUrgent": true,
      "reportedBy": {
        "id": "mla-uuid-here",
        "name": "MLA Name",
        "email": "mla@example.com",
        "role": "MLA"
      },
      "assignedTo": {
        "id": "member-uuid-here",
        "name": "Member Name",
        "email": "member@example.com",
        "role": "MEMBER"
      },
      "updates": [
        {
          "id": "update-uuid-here",
          "message": "Issue assigned to Member Name",
          "updateType": "ASSIGNMENT",
          "createdAt": "2025-07-11T09:00:00Z",
          "user": {
            "id": "mla-uuid-here",
            "name": "MLA Name",
            "role": "MLA"
          }
        }
      ],
      "createdAt": "2025-07-11T09:00:00Z",
      "updatedAt": "2025-07-11T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### 3. Get Issue by ID

**GET** `/issues/:id`

Retrieves detailed information about a specific issue.

**Access**: Users with access to the issue

**Response**:

```json
{
  "issue": {
    "id": "issue-uuid-here",
    "title": "Road repair needed in Sector 12",
    "description": "The main road in Sector 12 has multiple potholes causing traffic issues",
    "category": "Infrastructure",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "isUrgent": true,
    "voiceNote": "https://example.com/voice-recording.mp3",
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    "address": "Sector 12, Main Road, City Name",
    "latitude": 28.6139,
    "longitude": 77.209,
    "reportedBy": {
      "id": "mla-uuid-here",
      "name": "MLA Name",
      "email": "mla@example.com",
      "role": "MLA"
    },
    "assignedTo": {
      "id": "member-uuid-here",
      "name": "Member Name",
      "email": "member@example.com",
      "role": "MEMBER"
    },
    "state": {
      "id": "state-uuid-here",
      "name": "State Name"
    },
    "updates": [
      {
        "id": "update-uuid-1",
        "message": "Work started on the road repair",
        "status": "IN_PROGRESS",
        "updateType": "MEMBER_UPDATE",
        "mediaType": "AUDIO",
        "audioUrl": "https://example.com/progress-audio.mp3",
        "hoursWorked": 4.5,
        "progressPercentage": 25,
        "nextSteps": "Continue with filling potholes tomorrow",
        "createdAt": "2025-07-11T14:30:00Z",
        "user": {
          "id": "member-uuid-here",
          "name": "Member Name",
          "role": "MEMBER"
        }
      },
      {
        "id": "update-uuid-2",
        "message": "Great to see progress on this issue!",
        "updateType": "CITIZEN_COMMENT",
        "mediaType": "TEXT",
        "createdAt": "2025-07-11T16:00:00Z",
        "user": {
          "id": "citizen-uuid-here",
          "name": "Citizen Name",
          "role": "CITIZEN"
        }
      }
    ],
    "createdAt": "2025-07-11T09:00:00Z",
    "updatedAt": "2025-07-11T14:30:00Z"
  }
}
```

### 4. Add Issue Update/Comment

**POST** `/issues/:id/updates`

Adds an update or comment to an existing issue.

**Access**: All authenticated users (with appropriate permissions)

**Request Body**:

```json
{
  "message": "Work is progressing well, about 50% complete",
  "status": "IN_PROGRESS",
  "updateType": "MEMBER_UPDATE",
  "mediaType": "AUDIO",
  "audioUrl": "https://example.com/progress-update.mp3",
  "imageUrls": ["https://example.com/progress-image.jpg"],
  "hoursWorked": 6.0,
  "progressPercentage": 50,
  "nextSteps": "Complete remaining work by tomorrow"
}
```

**Fields**:

- `message` (optional): Text update message
- `status` (optional): Update issue status (PENDING, IN_PROGRESS, RESOLVED, REJECTED)
- `updateType` (optional): MEMBER_UPDATE, CITIZEN_COMMENT, STATUS_CHANGE, ASSIGNMENT
- `mediaType` (optional): TEXT, AUDIO, IMAGE, VIDEO, DOCUMENT (default: TEXT)
- `audioUrl` (optional): URL to audio recording
- `imageUrls` (optional): Array of image URLs
- `hoursWorked` (optional): Hours worked (for member updates)
- `progressPercentage` (optional): Progress percentage (0-100)
- `nextSteps` (optional): Next steps description

**Response**:

```json
{
  "message": "Update added successfully",
  "update": {
    "id": "update-uuid-here",
    "message": "Work is progressing well, about 50% complete",
    "status": "IN_PROGRESS",
    "updateType": "MEMBER_UPDATE",
    "mediaType": "AUDIO",
    "audioUrl": "https://example.com/progress-update.mp3",
    "imageUrls": ["https://example.com/progress-image.jpg"],
    "hoursWorked": 6.0,
    "progressPercentage": 50,
    "nextSteps": "Complete remaining work by tomorrow",
    "createdAt": "2025-07-11T15:30:00Z",
    "user": {
      "id": "member-uuid-here",
      "name": "Member Name",
      "role": "MEMBER"
    }
  }
}
```

### 5. Update Issue

**PUT** `/issues/:id`

Updates issue details (assignment, priority, status, etc.).

**Access**: MLA, MEMBER, ADMIN

**Request Body**:

```json
{
  "title": "Updated issue title",
  "description": "Updated description",
  "category": "Updated category",
  "priority": "URGENT",
  "isUrgent": true,
  "assignedToId": "new-member-uuid-here",
  "status": "IN_PROGRESS",
  "expectedResolutionDate": "2025-07-15T00:00:00Z",
  "resolutionNotes": "Expected to be completed by next week"
}
```

**Response**:

```json
{
  "message": "Issue updated successfully",
  "issue": {
    "id": "issue-uuid-here",
    "title": "Updated issue title",
    "description": "Updated description",
    "category": "Updated category",
    "priority": "URGENT",
    "isUrgent": true,
    "status": "IN_PROGRESS",
    "expectedResolutionDate": "2025-07-15T00:00:00Z",
    "resolutionNotes": "Expected to be completed by next week",
    "reportedBy": {
      "id": "mla-uuid-here",
      "name": "MLA Name",
      "email": "mla@example.com",
      "role": "MLA"
    },
    "assignedTo": {
      "id": "new-member-uuid-here",
      "name": "New Member Name",
      "email": "newmember@example.com",
      "role": "MEMBER"
    },
    "updatedAt": "2025-07-11T16:00:00Z"
  }
}
```

### 6. Get Issue Statistics

**GET** `/issues/stats`

Retrieves issue statistics for dashboard display.

**Access**: All authenticated users

**Response**:

```json
{
  "stats": {
    "total": 156,
    "pending": 45,
    "inProgress": 67,
    "resolved": 38,
    "urgent": 12,
    "resolutionRate": "24.36"
  },
  "charts": {
    "priorityDistribution": [
      {
        "priority": "LOW",
        "count": 23
      },
      {
        "priority": "MEDIUM",
        "count": 89
      },
      {
        "priority": "HIGH",
        "count": 32
      },
      {
        "priority": "URGENT",
        "count": 12
      }
    ],
    "categoryDistribution": [
      {
        "category": "Infrastructure",
        "count": 67
      },
      {
        "category": "Water Supply",
        "count": 34
      },
      {
        "category": "Electricity",
        "count": 28
      },
      {
        "category": "Public Safety",
        "count": 27
      }
    ]
  },
  "recentIssues": [
    {
      "id": "issue-uuid-1",
      "title": "Street light repair needed",
      "status": "PENDING",
      "priority": "MEDIUM",
      "isUrgent": false,
      "assignedTo": {
        "id": "member-uuid-here",
        "name": "Member Name"
      },
      "createdAt": "2025-07-11T18:00:00Z"
    }
  ]
}
```

### 7. Delete Issue

**DELETE** `/issues/:id`

Deletes an issue (Admin and MLA who created it only).

**Access**: ADMIN, MLA (who created the issue)

**Response**:

```json
{
  "message": "Issue deleted successfully"
}
```

## Data Models

### Issue Status

- `PENDING`: Issue is created but not yet started
- `IN_PROGRESS`: Work has begun on the issue
- `RESOLVED`: Issue has been completed
- `REJECTED`: Issue has been rejected or cancelled

### Issue Priority

- `LOW`: Low priority issue
- `MEDIUM`: Medium priority issue (default)
- `HIGH`: High priority issue
- `URGENT`: Urgent issue requiring immediate attention

### Update Types

- `MEMBER_UPDATE`: Official updates from assigned members
- `CITIZEN_COMMENT`: Comments from citizens
- `STATUS_CHANGE`: System-generated status changes
- `ASSIGNMENT`: Assignment notifications

### Media Types

- `TEXT`: Text-only update
- `AUDIO`: Audio recording
- `IMAGE`: Image attachment
- `VIDEO`: Video attachment
- `DOCUMENT`: Document attachment

### Body Types (for Members)

- `SHAKTI_KENDRA`: Shakti Kendra representative
- `PANNA_PRAMUKH`: Panna Pramukh representative
- `LOCAL_BODY`: Local body representative
- `POLLING_BOOTH`: Polling booth representative
- `WARD`: Ward representative
- `BLOCK`: Block representative
- `MANDAL`: Mandal representative
- `TEHSIL`: Tehsil representative
- `GRAM_PANCHAYAT`: Gram Panchayat representative
- `MUNICIPALITY`: Municipality representative
- `CORPORATION`: Corporation representative
- `OTHER`: Other body type

## Error Handling

### Common Error Responses

**400 Bad Request**:

```json
{
  "error": "Missing required fields: title, description, category, stateId"
}
```

**401 Unauthorized**:

```json
{
  "error": "Access denied. No token provided."
}
```

**403 Forbidden**:

```json
{
  "error": "Only MLAs can create issues"
}
```

**404 Not Found**:

```json
{
  "error": "Issue not found"
}
```

**500 Internal Server Error**:

```json
{
  "error": "Failed to create issue",
  "details": "Error details here"
}
```

### Validation Errors

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "type": "field",
      "value": "",
      "msg": "Title is required",
      "path": "title",
      "location": "body"
    }
  ]
}
```

## Examples

### Example 1: MLA Creates and Assigns Issue

1. **Create Issue**:

```bash
curl -X POST https://api.jagranpatra.com/issues \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Water pipe burst in Sector 5",
    "description": "Main water pipe has burst causing water shortage in the area",
    "category": "Water Supply",
    "priority": "HIGH",
    "isUrgent": true,
    "assignedToId": "member-uuid-here",
    "address": "Sector 5, Main Street",
    "stateId": "state-uuid-here",
    "voiceNote": "https://example.com/voice-note.mp3"
  }'
```

2. **Member Adds Progress Update**:

```bash
curl -X POST https://api.jagranpatra.com/issues/ISSUE_ID/updates \
  -H "Authorization: Bearer MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Repair work started, plumber team deployed",
    "status": "IN_PROGRESS",
    "updateType": "MEMBER_UPDATE",
    "mediaType": "AUDIO",
    "audioUrl": "https://example.com/progress-audio.mp3",
    "hoursWorked": 2.5,
    "progressPercentage": 30,
    "nextSteps": "Complete pipe replacement tomorrow"
  }'
```

3. **Citizen Adds Comment**:

```bash
curl -X POST https://api.jagranpatra.com/issues/ISSUE_ID/updates \
  -H "Authorization: Bearer CITIZEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Thank you for the quick response! Water supply is partially restored.",
    "updateType": "CITIZEN_COMMENT",
    "mediaType": "TEXT"
  }'
```

### Example 2: Get Issues with Filters

```bash
curl -X GET "https://api.jagranpatra.com/issues?status=PENDING&priority=HIGH&category=Infrastructure&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 3: Get Issue Statistics

```bash
curl -X GET https://api.jagranpatra.com/issues/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Integration Notes

1. **File Upload**: For voice notes and images, first upload files to your file storage service, then include the URLs in the API requests.

2. **Real-time Updates**: Consider implementing WebSocket connections for real-time issue updates.

3. **Notifications**: The system automatically creates notifications for assignments and status changes.

4. **Performance Tracking**: Member and MLA performance metrics are automatically updated based on issue resolution.

5. **Location Services**: Include GPS coordinates for better issue tracking and mapping.

6. **Multimedia Support**: The system supports various media types for rich issue reporting and updates.

---

**Note**: Replace `YOUR_TOKEN`, `ISSUE_ID`, and other placeholder values with actual values from your system.
