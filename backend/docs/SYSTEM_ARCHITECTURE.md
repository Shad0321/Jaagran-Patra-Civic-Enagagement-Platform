# JagranPatra Issue Management System Architecture

## System Overview

The JagranPatra Issue Management System is designed to facilitate efficient communication and issue resolution between MLAs, their subordinate members, and citizens. The system supports multimedia content and provides two distinct channels for updates and feedback.

## Architecture Components

### 1. User Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│                              ADMIN                                  │
│                          (System Admin)                            │
├─────────────────────────────────────────────────────────────────────┤
│                               MLA                                   │
│                    (Member of Legislative Assembly)                 │
├─────────────────────────────────────────────────────────────────────┤
│                             MEMBER                                  │
│     (Shakti Kendra, Panna Pramukh, Local Body Representatives)     │
├─────────────────────────────────────────────────────────────────────┤
│                             CITIZEN                                 │
│                         (General Public)                           │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. Issue Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   PENDING   │───▶│IN_PROGRESS  │───▶│  RESOLVED   │    │  REJECTED   │
│             │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      │                   │                   │                   │
      │                   │                   │                   │
      └───────────────────┼───────────────────┼───────────────────┘
                          │                   │
                          ▼                   ▼
                  ┌─────────────┐    ┌─────────────┐
                  │   MEMBER    │    │   CITIZEN   │
                  │   UPDATE    │    │   COMMENT   │
                  └─────────────┘    └─────────────┘
```

### 3. Data Models

#### Core Models

**User Model**:

```typescript
interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  role: 'ADMIN' | 'MLA' | 'MEMBER' | 'CITIZEN';
  avatar?: string;
  isActive: boolean;
  isVerified: boolean;

  // Location
  stateId?: string;
  districtId?: string;
  constituencyId?: string;
  bodyId?: string;

  // Relationships
  mlaId?: string; // For members under MLA
  mlaProfile?: MlaProfile;
  memberProfile?: MemberProfile;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}
```

**Issue Model**:

```typescript
interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  isUrgent: boolean;

  // Location
  address?: string;
  latitude?: number;
  longitude?: number;
  stateId: string;
  districtId?: string;
  constituencyId?: string;
  bodyId?: string;

  // Multimedia
  voiceNote?: string;
  images?: string[];

  // Assignment
  reportedById: string;
  assignedToId?: string;

  // Tracking
  expectedResolutionDate?: Date;
  actualResolutionDate?: Date;
  resolutionNotes?: string;

  // Relationships
  updates: IssueUpdate[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

**IssueUpdate Model**:

```typescript
interface IssueUpdate {
  id: string;
  issueId: string;
  userId: string;
  message?: string;
  status?: IssueStatus;
  updateType:
    | 'MEMBER_UPDATE'
    | 'CITIZEN_COMMENT'
    | 'STATUS_CHANGE'
    | 'ASSIGNMENT';
  mediaType: 'TEXT' | 'AUDIO' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';

  // Media
  audioUrl?: string;
  imageUrls?: string[];

  // Member-specific tracking
  hoursWorked?: number;
  progressPercentage?: number;
  nextSteps?: string;

  // Timestamps
  createdAt: Date;
}
```

#### Supporting Models

**MlaProfile Model**:

```typescript
interface MlaProfile {
  id: string;
  userId: string;
  constituencyId: string;
  partyName?: string;
  position?: string;
  tenure?: string;
  bio?: string;
  achievements?: string;
  contactEmail?: string;
  contactPhone?: string;
  socialLinks?: object;

  // Performance metrics
  totalIssues: number;
  resolvedIssues: number;
  pendingIssues: number;
  avgResolutionTime: number;
}
```

**MemberProfile Model**:

```typescript
interface MemberProfile {
  id: string;
  userId: string;
  bodyType: BodyType;
  designation?: string;
  description?: string;

  // Permissions
  canReceiveIssues: boolean;
  canUpdateIssues: boolean;
  canCreateSessions: boolean;

  // Performance metrics
  totalIssues: number;
  resolvedIssues: number;
  pendingIssues: number;
  avgResolutionTime: number;
}
```

**Body Model**:

```typescript
interface Body {
  id: string;
  name: string;
  code: string;
  type: BodyType;
  description?: string;

  // Hierarchy
  stateId?: string;
  districtId?: string;
  constituencyId?: string;
  parentBodyId?: string;

  // Location
  address?: string;
  latitude?: number;
  longitude?: number;

  // Contact
  headName?: string;
  contactEmail?: string;
  contactPhone?: string;

  isActive: boolean;
}
```

### 4. API Architecture

#### REST API Endpoints

**Authentication Endpoints**:

- `POST /auth/register` - Citizen registration
- `POST /auth/login` - User login
- `POST /auth/create-mla` - Admin creates MLA
- `POST /auth/add-member` - MLA/Admin adds member
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile
- `GET /auth/members` - Get members list
- `GET /auth/bodies` - Get bodies list

**Issue Management Endpoints**:

- `POST /issues` - Create issue (MLA only)
- `GET /issues` - Get issues list
- `GET /issues/stats` - Get issue statistics
- `GET /issues/:id` - Get specific issue
- `PUT /issues/:id` - Update issue
- `POST /issues/:id/updates` - Add update/comment
- `DELETE /issues/:id` - Delete issue

#### Database Schema

**Geographic Hierarchy**:

```sql
States (1) ──┐
             ├─── Districts (N) ──┐
             │                    ├─── Constituencies (N)
             └─── Bodies (N) ──────┘
```

**User Relationships**:

```sql
MLA (1) ────── Members (N)
│
├─── Issues Created (N)
│
└─── Constituency (1)
```

**Issue Relationships**:

```sql
Issue (1) ────── Updates (N)
│
├─── Reported By (User)
├─── Assigned To (User)
├─── State (1)
├─── District (0..1)
├─── Constituency (0..1)
└─── Body (0..1)
```

### 5. Permission Matrix

| Action              | ADMIN | MLA     | MEMBER       | CITIZEN |
| ------------------- | ----- | ------- | ------------ | ------- |
| Create Issue        | ✓     | ✓       | ✗            | ✗       |
| View Own Issues     | ✓     | ✓       | ✓            | ✓       |
| View All Issues     | ✓     | ✗       | ✗            | ✗       |
| Update Issue        | ✓     | ✓ (own) | ✓ (assigned) | ✗       |
| Delete Issue        | ✓     | ✓ (own) | ✗            | ✗       |
| Add Member Update   | ✓     | ✓       | ✓            | ✗       |
| Add Citizen Comment | ✓     | ✓       | ✓            | ✓       |
| Assign Issue        | ✓     | ✓       | ✗            | ✗       |
| Create MLA          | ✓     | ✗       | ✗            | ✗       |
| Add Member          | ✓     | ✓       | ✗            | ✗       |

### 6. Business Rules

#### Issue Creation Rules

1. **Only MLAs can create issues**
2. **Issues must have**: title, description, category, stateId
3. **Assignment validation**: Assigned member must be under the MLA's supervision
4. **Geographic validation**: State, district, constituency must exist and be valid
5. **Media support**: Voice notes and images are optional but encouraged

#### Update Rules

1. **Member Updates**:
   - Only assigned members can add official updates
   - Can include progress tracking (hours worked, percentage complete)
   - Can be audio or text-based
   - Can change issue status

2. **Citizen Comments**:
   - Any citizen can comment on issues
   - Comments are text-based feedback
   - Cannot change issue status
   - Visible to all stakeholders

3. **Status Changes**:
   - Auto-generated when status is modified
   - Tracked in update history
   - Notifications sent to relevant parties

#### Performance Tracking

1. **Automatic metrics calculation**:
   - Total issues handled
   - Resolution rate
   - Average resolution time
   - Pending issues count

2. **Performance indicators**:
   - Response time to assignments
   - Update frequency
   - Completion rate
   - Citizen satisfaction (future feature)

### 7. Security Considerations

#### Authentication & Authorization

- **JWT-based authentication**
- **Role-based access control (RBAC)**
- **Token expiration and refresh**
- **Email verification for accounts**

#### Data Protection

- **Input validation and sanitization**
- **SQL injection prevention (Prisma ORM)**
- **XSS protection**
- **Rate limiting on API endpoints**
- **CORS configuration**

#### Privacy

- **Personal data protection**
- **Location data handling**
- **Media file access control**
- **Audit logging**

### 8. Scalability Features

#### Database Optimization

- **Indexed queries on frequently accessed fields**
- **Pagination for large result sets**
- **Efficient relationship loading**
- **Connection pooling**

#### Performance Monitoring

- **API response time tracking**
- **Database query optimization**
- **Error logging and monitoring**
- **Usage analytics**

#### Caching Strategy

- **Redis for session management**
- **API response caching**
- **Database query result caching**
- **Media file CDN integration**

### 9. Integration Points

#### External Services

- **Email service** (SMTP via nodemailer)
- **SMS service** (for notifications)
- **File storage** (AWS S3/Cloudinary)
- **Maps service** (Google Maps/OpenStreetMap)
- **Push notifications** (Firebase/OneSignal)

#### API Integration

- **RESTful API design**
- **JSON data format**
- **Standard HTTP status codes**
- **Comprehensive error handling**

### 10. Deployment Architecture

#### Development Environment

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React/Vite)  │────│   (Node.js)     │────│   (PostgreSQL)  │
│   Port: 3000    │    │   Port: 5000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### Production Environment

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN           │    │   Load Balancer │    │   Database      │
│   (Static Files)│    │   (Multiple     │    │   (Managed DB)  │
│                 │    │   App Instances)│    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 11. Monitoring & Analytics

#### System Metrics

- **API response times**
- **Database query performance**
- **Error rates and types**
- **User activity patterns**

#### Business Metrics

- **Issue resolution rates**
- **Response times by constituency**
- **Member performance tracking**
- **Citizen engagement levels**

#### Alerting

- **System downtime alerts**
- **Performance degradation warnings**
- **Error threshold notifications**
- **Security incident alerts**

### 12. Future Enhancements

#### Planned Features

1. **Real-time notifications** (WebSocket)
2. **Mobile app** (React Native)
3. **Advanced analytics dashboard**
4. **AI-powered issue categorization**
5. **Citizen satisfaction surveys**
6. **Integration with government systems**

#### Scalability Improvements

1. **Microservices architecture**
2. **Event-driven architecture**
3. **Advanced caching strategies**
4. **Database sharding**
5. **Container orchestration**

---

This architecture document provides a comprehensive overview of the JagranPatra Issue Management System, covering all aspects from data models to deployment strategies. The system is designed to be scalable, secure, and user-friendly while maintaining the specific requirements of the Indian political and administrative context.
