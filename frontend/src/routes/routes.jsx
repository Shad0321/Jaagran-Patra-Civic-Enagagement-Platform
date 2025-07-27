import { createBrowserRouter } from 'react-router-dom';
import App from '../App.jsx';
import Home from '../pages/Home.jsx';
import Login from '../pages/Login.jsx';
import SignUp from '../pages/SignUp.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import ChooseLanguage from '../pages/ChooseLanguage.jsx';
import ForgotPassword from '../pages/ForgotPassword.jsx';
import ResetPassword from '../pages/ResetPassword.jsx';
import ProtectedRoute from '../components/common/ProtectedRoute.jsx';
import Settings from '../pages/Settings.jsx';
import Profile from '../pages/Profile.jsx';
import IssueManagement from '../pages/IssueManagement.jsx';
import NotificationsPage from '../pages/Notifications.jsx';
import NearbyIssues from '../pages/NearbyIssues.jsx';
import InteractiveElectionMap from '../pages/InteractiveElectionMap.jsx';
import NewsPage from '../pages/NewsPage.jsx';
import NewsDetail from '../pages/NewsDetail.jsx';
import MemberManagement from '../pages/MemberManagement.jsx';
import MeetingManagement from '../pages/MeetingManagement.jsx';
import BodyManagement from '../pages/BodyManagement.jsx';
import IssueAssignmentManagement from '../pages/IssueAssignmentManagement.jsx';
import AnalyticsReport from '../pages/AnalyticsReport.jsx';
import VerifyEmail from '../pages/VerifyEmail.jsx';
import MLAProfiles from '../pages/MLAProfiles.jsx';
import ChatPage from '../pages/ChatPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'choose-language', element: <ChooseLanguage /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'reset-password', element: <ResetPassword /> },
      { path: 'reset-my-password', element: <ResetPassword /> },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'signup',
        element: <SignUp />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        ),
      },
      {
        path: 'my-account',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: 'issues',
        element: (
          <ProtectedRoute>
            <IssueManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'nearby-issues',
        element: (
          <ProtectedRoute>
            <NearbyIssues />
          </ProtectedRoute>
        ),
      },
      {
        path: 'election-map',
        element: (
          <ProtectedRoute>
            <InteractiveElectionMap />
          </ProtectedRoute>
        ),
      },
      {
        path: 'news',
        element: (
          <ProtectedRoute>
            <NewsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'news/:id',
        element: (
          <ProtectedRoute>
            <NewsDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: 'member-management',
        element: (
          <ProtectedRoute requiredRole="MLA">
            <MemberManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'meeting-management',
        element: (
          <ProtectedRoute requiredRole="MLA">
            <MeetingManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'body-management',
        element: (
          <ProtectedRoute requiredRole="MLA">
            <BodyManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'issue-assignment',
        element: (
          <ProtectedRoute requiredRole="MLA">
            <IssueAssignmentManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'analytics',
        element: (
          <ProtectedRoute requiredRole="MLA">
            <AnalyticsReport />
          </ProtectedRoute>
        ),
      },
      { path: 'verify-email', element: <VerifyEmail /> },
      { path: 'mla-profiles', element: <MLAProfiles /> },
      {
        path: 'chat',
        element: (
          <ProtectedRoute requiredRole="MLA">
            <ChatPage />
          </ProtectedRoute>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default router;
