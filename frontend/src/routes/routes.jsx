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
import LanguageGuard from '../components/common/LanguageGuard.jsx';
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
        element: (
          <LanguageGuard>
            <Login />
          </LanguageGuard>
        ),
      },
      {
        path: 'signup',
        element: (
          <LanguageGuard>
            <SignUp />
          </LanguageGuard>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <LanguageGuard>
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </LanguageGuard>
        ),
      },
      {
        path: 'settings',
        element: (
          <LanguageGuard>
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          </LanguageGuard>
        ),
      },
      {
        path: 'my-account',
        element: (
          <LanguageGuard>
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          </LanguageGuard>
        ),
      },
      {
        path: 'issues',
        element: (
          <LanguageGuard>
            <ProtectedRoute>
              <IssueManagement />
            </ProtectedRoute>
          </LanguageGuard>
        ),
      },
      {
        path: 'notifications',
        element: (
          <LanguageGuard>
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          </LanguageGuard>
        ),
      },
      {
        path: 'nearby-issues',
        element: (
          <LanguageGuard>
            <ProtectedRoute>
              <NearbyIssues />
            </ProtectedRoute>
          </LanguageGuard>
        ),
      },
      {
        path: 'election-map',
        element: (
          <LanguageGuard>
            <ProtectedRoute>
              <InteractiveElectionMap />
            </ProtectedRoute>
          </LanguageGuard>
        ),
      },
      {
        path: 'news',
        element: (
          <LanguageGuard>
            <ProtectedRoute>
              <NewsPage />
            </ProtectedRoute>
          </LanguageGuard>
        ),
      },
      {
        path: 'news/:id',
        element: (
          <LanguageGuard>
            <ProtectedRoute>
              <NewsDetail />
            </ProtectedRoute>
          </LanguageGuard>
        ),
      },
      {
        path: 'member-management',
        element: (
          <LanguageGuard>
            <ProtectedRoute requiredRole="MLA">
              <MemberManagement />
            </ProtectedRoute>
          </LanguageGuard>
        ),
      },
      {
        path: 'meeting-management',
        element: (
          <LanguageGuard>
            <ProtectedRoute requiredRole="MLA">
              <MeetingManagement />
            </ProtectedRoute>
          </LanguageGuard>
        ),
      },
      {
        path: 'body-management',
        element: (
          <LanguageGuard>
            <ProtectedRoute requiredRole="MLA">
              <BodyManagement />
            </ProtectedRoute>
          </LanguageGuard>
        ),
      },
      {
        path: 'issue-assignment',
        element: (
          <LanguageGuard>
            <ProtectedRoute requiredRole="MLA">
              <IssueAssignmentManagement />
            </ProtectedRoute>
          </LanguageGuard>
        ),
      },
      {
        path: 'analytics',
        element: (
          <LanguageGuard>
            <ProtectedRoute requiredRole="MLA">
              <AnalyticsReport />
            </ProtectedRoute>
          </LanguageGuard>
        ),
      },
      { path: 'verify-email', element: <VerifyEmail /> },
      { path: 'mla-profiles', element: <MLAProfiles /> },
      //   { path: "*", element: <NotFound /> },
    ],
  },
]);

export default router;
