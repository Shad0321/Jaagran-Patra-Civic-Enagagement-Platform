import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { APIProvider } from './contexts/APIContext';
import { useAuth } from './hooks/useAuth';

// Components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import LoginForm from './components/auth/LoginForm';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import MLAManagement from './pages/MLAManagement';
import MemberManagement from './pages/MemberManagement';
import IssueManagement from './pages/IssueManagement';
import NewsManagement from './pages/NewsManagement';
import AnalyticsReports from './pages/AnalyticsReports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

// Placeholder components for pages not yet created
const NotificationManagement = () => <div className="p-6"><h1 className="text-2xl font-bold">Notification Management</h1><p>Coming soon...</p></div>;
const SessionManagement = () => <div className="p-6"><h1 className="text-2xl font-bold">Session Management</h1><p>Coming soon...</p></div>;
const ChatbotManagement = () => <div className="p-6"><h1 className="text-2xl font-bold">Chatbot Management</h1><p>Coming soon...</p></div>;

// Styles
import './App.css';
import './styles/components.css';
import Loader from './components/common/Loader';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <Loader/>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={
              <ProtectedRoute roles={['ADMIN']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute roles={['ADMIN']}>
                <UserManagement />
              </ProtectedRoute>
            } />
            <Route path="/mlas" element={
              <ProtectedRoute roles={['ADMIN']}>
                <MLAManagement />
              </ProtectedRoute>
            } />
            <Route path="/members" element={
              <ProtectedRoute roles={['ADMIN']}>
                <MemberManagement />
              </ProtectedRoute>
            } />
            <Route path="/issues" element={
              <ProtectedRoute roles={['ADMIN']}>
                <IssueManagement />
              </ProtectedRoute>
            } />
            <Route path="/news" element={
              <ProtectedRoute roles={['ADMIN']}>
                <NewsManagement />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute roles={['ADMIN']}>
                <NotificationManagement />
              </ProtectedRoute>
            } />
            <Route path="/sessions" element={
              <ProtectedRoute roles={['ADMIN']}>
                <SessionManagement />
              </ProtectedRoute>
            } />
            <Route path="/chatbot" element={
              <ProtectedRoute roles={['ADMIN']}>
                <ChatbotManagement />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute roles={['ADMIN']}>
                <AnalyticsReports />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute roles={['ADMIN']}>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute roles={['ADMIN']}>
                <Profile />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
      
      {/* Toast notifications */}
      <Toaster position="top-right" />
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <APIProvider>
          <AppContent />
        </APIProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
