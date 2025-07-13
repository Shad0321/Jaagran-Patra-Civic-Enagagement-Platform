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

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'choose-language', element: <ChooseLanguage /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'reset-password', element: <ResetPassword /> },
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
      //   { path: "*", element: <NotFound /> },
    ],
  },
]);

export default router;
