# JagranPatra Admin Frontend

A comprehensive admin dashboard for the JagranPatra citizen issue management system. This React-based admin interface provides full administrative control over users, MLAs, members, issues, news, analytics, and system settings.

## Features

### Core Administrative Features

- **Dashboard**: Overview of system statistics, recent activity, and quick actions
- **User Management**: Complete CRUD operations for all system users
- **MLA Management**: Manage MLA profiles, constituencies, and assignments
- **Member Management**: Handle member registration and MLA assignments
- **Issue Management**: Track, categorize, and manage citizen issues
- **News Management**: Create, edit, and publish news articles and announcements
- **Analytics & Reports**: Comprehensive analytics with charts and exportable reports
- **Settings**: System configuration and administrative preferences
- **Profile Management**: Admin profile management with password changes

### Authentication & Security

- **Role-based Access Control**: Admin-only access with protected routes
- **JWT Authentication**: Secure token-based authentication
- **Session Management**: Automatic token refresh and session handling
- **Secure API Communication**: Axios interceptors for request/response handling

### User Interface

- **Responsive Design**: Mobile-friendly responsive layout
- **Modern UI Components**: Clean, professional interface using Tailwind CSS
- **Interactive Charts**: Data visualization using Recharts
- **Toast Notifications**: User feedback with react-hot-toast
- **Modal Systems**: Popup forms and confirmations
- **Search & Filtering**: Advanced search and filtering capabilities
- **Pagination**: Efficient data loading with pagination

## Technology Stack

- **Frontend Framework**: React 18
- **Routing**: React Router DOM
- **UI Framework**: Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Forms**: React Hook Form with Yup validation
- **Date Handling**: date-fns

## Project Structure

```
admin-frontend/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   └── layout/
│   │       ├── Header.jsx
│   │       └── Sidebar.jsx
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   └── APIContext.jsx
│   ├── hooks/
│   │   └── useAuth.js
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── UserManagement.jsx
│   │   ├── MLAManagement.jsx
│   │   ├── MemberManagement.jsx
│   │   ├── IssueManagement.jsx
│   │   ├── NewsManagement.jsx
│   │   ├── AnalyticsReports.jsx
│   │   ├── Settings.jsx
│   │   └── Profile.jsx
│   ├── utils/
│   │   └── api.js
│   ├── App.jsx
│   └── main.jsx
├── public/
├── package.json
└── README.md
```

## Installation & Setup

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Backend API server running

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jp-web-app/admin-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the admin-frontend directory:
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## Usage

### Admin Login

1. Access the admin dashboard at `http://localhost:5173`
2. Login with admin credentials
3. Navigate through different sections using the sidebar

### Key Features Usage

#### Dashboard
- View system statistics and recent activity
- Access quick actions for common tasks
- Monitor system health and performance

#### User Management
- Add new users with different roles (USER, MLA, ADMIN)
- Edit user profiles and permissions
- Deactivate or delete users
- Export user data

#### MLA Management
- Create MLA profiles with constituency information
- Manage MLA details including party affiliation
- Track MLA performance and issue resolution

#### Member Management
- Register new members under specific MLAs
- Assign members to constituencies
- Manage member profiles and contact information

#### Issue Management
- View all citizen issues with filtering options
- Update issue status and priority
- Assign issues to MLAs
- Track resolution progress
- Add responses and updates

#### News Management
- Create and publish news articles
- Categorize news (announcements, alerts, events)
- Schedule publication dates
- Manage draft and published content

#### Analytics & Reports
- View comprehensive system analytics
- Generate reports with date range filters
- Export data in CSV/PDF formats
- Monitor MLA performance metrics
- Track issue resolution trends

#### System Settings
- Configure general system settings
- Manage notification preferences
- Set security parameters
- Configure email settings
- Database maintenance options

## API Integration

The admin frontend communicates with the backend API through:

- **Base URL**: Configured via environment variables
- **Authentication**: JWT tokens with automatic refresh
- **Error Handling**: Centralized error handling with user notifications
- **Request Interceptors**: Automatic token attachment
- **Response Interceptors**: Token refresh and error processing

### Key API Endpoints

- `GET /admin/dashboard` - Dashboard statistics
- `GET /admin/users` - User management
- `GET /admin/mlas` - MLA management
- `GET /admin/members` - Member management
- `GET /admin/issues` - Issue management
- `GET /admin/news` - News management
- `GET /admin/analytics` - Analytics data
- `GET /admin/settings` - System settings

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- ESLint configuration for React
- Consistent component structure
- Context-based state management
- Utility-first CSS with Tailwind

### Component Guidelines

- Functional components with hooks
- Proper error handling and loading states
- Responsive design principles
- Accessibility considerations
- Reusable component patterns

## Deployment

### Production Build

```bash
npm run build
```

### Deployment Options

- **Static Hosting**: Deploy to Netlify, Vercel, or similar
- **Server Deployment**: Deploy to Apache, Nginx, or Node.js server
- **CDN Integration**: Use with CloudFront or similar CDN

### Environment Variables

For production deployment, ensure proper environment variables:

```env
VITE_API_BASE_URL=https://your-api-domain.com
```

## Security Considerations

- **Authentication**: Secure JWT implementation
- **Authorization**: Role-based access control
- **Data Protection**: Sensitive data handling
- **Input Validation**: Form validation and sanitization
- **HTTPS**: Secure communication in production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

## Changelog

### v1.0.0
- Initial release with core admin features
- User, MLA, and Member management
- Issue tracking and management
- News and content management
- Analytics and reporting
- System settings and configuration
