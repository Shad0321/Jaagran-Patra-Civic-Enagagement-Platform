import React from 'react';
import { useSelector } from 'react-redux';
import CitizenDashboard from './CitizenDashboard';
import MLADashboard from './MLADashboard';
import MemberDashboard from './MemberDashboard';
import Loader from '../components/common/Loader';

const Dashboard = () => {
  const { user, loading } = useSelector((state) => state.user);

  // Show loading if user data is being fetched or not yet available
  if (loading || !user) {
    return <Loader />;
  }

  // Route to appropriate dashboard based on user role
  switch (user.role) {
    case 'CITIZEN':
      return <CitizenDashboard />;
    case 'MLA':
      return <MLADashboard />;
    case 'MEMBER':
      return <MemberDashboard />;
    default:
      return (
        <div className="p-6 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome, {user.name}!
            </h1>
            <p className="text-gray-600">
              Your account role ({user.role}) doesn't have a specific dashboard
              configured.
            </p>
          </div>
        </div>
      );
  }
};

export default Dashboard;
