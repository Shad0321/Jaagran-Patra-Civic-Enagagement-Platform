# Enhanced Authentication API Documentation

## Overview

This document describes the enhanced authentication API endpoints for the MLA Dashboard application. The API supports profile management, subordinate management, admin operations, and location-based services.

## Base URL

All endpoints are prefixed with `/auth`

## Authentication

Most endpoints require Bearer token authentication in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Role-Based Access Control

- **ADMIN**: Full system access
- **MLA**: Access to subordinate management and profile features
- **MEMBER**: Basic profile access
- **CITIZEN**: Public endpoints only

## Endpoints

### Profile Management

#### GET /profile

Get current user's profile information.

**Authentication**: Required  
**Authorization**: Any authenticated user

**Response**:

```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "MLA",
    "avatar": "avatar_url",
    "currentLatitude": 28.6139,
    "currentLongitude": 77.2090,
    "currentAddress": "New Delhi, India",
    "state": { "id": "state_id", "name": "Delhi", "code": "DL" },
    "district": { "id": "district_id", "name": "Central Delhi", "code": "CD" },
    "constituency": { "id": "const_id", "name": "New Delhi", "code": "ND" },
    "mlaProfile": { ... }
  }
}
```

#### PUT /profile

Update current user's profile.

**Authentication**: Required  
**Authorization**: Any authenticated user

**Request Body**:

```json
{
  "name": "Updated Name",
  "phone": "+919876543210",
  "avatar": "new_avatar_url",
  "stateId": "state_id",
  "districtId": "district_id",
  "constituencyId": "constituency_id"
}
```

#### POST /change-password

Change user's password.

**Authentication**: Required  
**Authorization**: Any authenticated user

**Request Body**:

```json
{
  "currentPassword": "current_password",
  "newPassword": "new_password"
}
```

#### POST /update-location

Update user's current location.

**Authentication**: Required  
**Authorization**: Any authenticated user

**Request Body**:

```json
{
  "latitude": 28.6139,
  "longitude": 77.209,
  "address": "New Delhi, India"
}
```

### Subordinate Management

#### GET /subordinates

Get list of subordinates for MLA/Admin.

**Authentication**: Required  
**Authorization**: MLA, ADMIN

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `type`: Filter by subordinate type (DIRECT, INDIRECT, TEMPORARY)
- `isActive`: Filter by active status (true/false)

**Response**:

```json
{
  "subordinates": [
    {
      "id": "relation_id",
      "type": "DIRECT",
      "designation": "Shakti Kendra Head",
      "subordinate": {
        "id": "user_id",
        "name": "Subordinate Name",
        "email": "sub@example.com",
        "role": "SHAKTI_KENDRA_HEAD",
        "currentLatitude": 28.6139,
        "currentLongitude": 77.209,
        "state": { "name": "Delhi" }
      },
      "shaktiKendra": { "name": "SK001" }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### POST /subordinates

Add a new subordinate.

**Authentication**: Required  
**Authorization**: MLA, ADMIN

**Request Body**:

```json
{
  "subordinateId": "user_id",
  "type": "DIRECT",
  "designation": "Shakti Kendra Head",
  "permissions": ["manage_issues", "view_reports"],
  "shaktiKendraId": "sk_id",
  "localBodyId": "lb_id"
}
```

#### PUT /subordinates/:id

Update subordinate relationship.

**Authentication**: Required  
**Authorization**: MLA, ADMIN

**Request Body**:

```json
{
  "type": "INDIRECT",
  "designation": "Updated Designation",
  "isActive": false,
  "permissions": ["view_reports"]
}
```

#### DELETE /subordinates/:id

Remove subordinate relationship.

**Authentication**: Required  
**Authorization**: MLA, ADMIN

#### GET /subordinates/hierarchy

Get hierarchical view of subordinates.

**Authentication**: Required  
**Authorization**: MLA, ADMIN

**Response**:

```json
{
  "hierarchy": [
    {
      "id": "relation_id",
      "subordinate": {
        "id": "user_id",
        "name": "Level 1 Subordinate"
      },
      "subordinates": [
        {
          "id": "nested_relation_id",
          "subordinate": {
            "id": "nested_user_id",
            "name": "Level 2 Subordinate"
          },
          "subordinates": []
        }
      ]
    }
  ]
}
```

### Admin Routes

#### GET /users

Get all users (Admin only).

**Authentication**: Required  
**Authorization**: ADMIN

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `role`: Filter by user role
- `isActive`: Filter by active status
- `search`: Search by name or email

#### GET /users/:id

Get specific user by ID.

**Authentication**: Required  
**Authorization**: ADMIN

#### PUT /users/:id

Update user information.

**Authentication**: Required  
**Authorization**: ADMIN

**Request Body**:

```json
{
  "name": "Updated Name",
  "email": "new@example.com",
  "role": "MLA",
  "isActive": true,
  "stateId": "state_id"
}
```

#### DELETE /users/:id

Delete user.

**Authentication**: Required  
**Authorization**: ADMIN

#### POST /users/:id/activate

Activate user account.

**Authentication**: Required  
**Authorization**: ADMIN

#### POST /users/:id/deactivate

Deactivate user account.

**Authentication**: Required  
**Authorization**: ADMIN

### Location and Hierarchy Routes

#### GET /locations/states

Get all states.

**Rate Limit**: General limiter (100 requests per 15 minutes)

**Response**:

```json
{
  "states": [
    {
      "id": "state_id",
      "name": "Delhi",
      "code": "DL",
      "latitude": 28.6139,
      "longitude": 77.209
    }
  ]
}
```

#### GET /locations/districts/:stateId

Get districts by state.

**Rate Limit**: General limiter

#### GET /locations/constituencies/:districtId

Get constituencies by district.

**Rate Limit**: General limiter

#### GET /locations/shakti-kendras/:constituencyId

Get Shakti Kendras by constituency.

**Rate Limit**: General limiter

#### GET /locations/local-bodies/:shaktiKendraId

Get local bodies by Shakti Kendra.

**Rate Limit**: General limiter

#### GET /locations/polling-booths/:localBodyId

Get polling booths by local body.

**Rate Limit**: General limiter

**Response**:

```json
{
  "pollingBooths": [
    {
      "id": "booth_id",
      "name": "Booth 001",
      "code": "B001",
      "address": "Community Center, Block A",
      "latitude": 28.6139,
      "longitude": 77.209,
      "localBody": {
        "id": "lb_id",
        "name": "Local Body Name"
      }
    }
  ]
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details (in development)"
}
```

Common HTTP status codes:

- `200`: Success
- `201`: Created successfully
- `400`: Bad request
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `409`: Conflict (duplicate resource)
- `500`: Internal server error

## Rate Limiting

- **Auth Limiter**: 500 requests per 15 minutes for authentication endpoints
- **General Limiter**: 100 requests per 15 minutes for location endpoints

## Notes

1. **Location Tracking**: Users can update their current location for real-time tracking
2. **Hierarchical Management**: MLAs can manage subordinates across different administrative levels
3. **Flexible Permissions**: Subordinate relationships support custom permissions and designations
4. **Geographic Hierarchy**: Full support for India's administrative structure from state to polling booth level
5. **Real-time Data**: All location and subordinate data includes geographic coordinates for mapping functionality

## Use Cases

### For MLAs:

- Manage team members across different Shakti Kendras
- Track subordinate locations and assignments
- View hierarchical organization structure
- Assign specific roles and permissions

### For Admins:

- Oversee all users in the system
- Manage user accounts and permissions
- View system-wide statistics
- Maintain geographic data

### For Citizens:

- Access public location data
- View MLA performance metrics
- Track local administrative boundaries
