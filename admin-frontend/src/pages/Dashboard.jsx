import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import { Users, FileText, AlertCircle, Calendar, MessageSquare, TrendingUp } from 'lucide-react';
import Loader from '../components/common/Loader';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMLAs: 0,
    totalMembers: 0,
    totalIssues: 0,
    pendingIssues: 0,
    resolvedIssues: 0,
    totalSessions: 0,
    upcomingSessions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch dashboard statistics from single endpoint
      const response = await api.get('/admin/dashboard');
      
      if (response.data.success) {
        const { stats, recentIssues, recentUsers } = response.data.data;
        setStats({
          totalUsers: stats.totalUsers || 0,
          totalMLAs: stats.totalMlas || 0,
          totalMembers: stats.totalMembers || 0,
          totalIssues: stats.totalIssues || 0,
          pendingIssues: stats.pendingIssues || 0,
          resolvedIssues: stats.resolvedIssues || 0,
          totalSessions: 0, // Not implemented yet
          upcomingSessions: 0 // Not implemented yet
        });

        // Convert recent issues to activity format
        const activity = [
          ...(recentIssues || []).map(issue => ({
            description: `New issue: ${issue.title}`,
            timestamp: new Date(issue.createdAt).toLocaleString()
          })),
          ...(recentUsers || []).map(user => ({
            description: `New user registered: ${user.name}`,
            timestamp: new Date(user.createdAt).toLocaleString()
          }))
        ].slice(0, 5);

        setRecentActivity(activity);
      }
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <Icon className="h-8 w-8" style={{ color }} />
      </div>
    </div>
  );

  if (loading) {
    return (
      <Loader/>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name || 'Admin'}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="#3B82F6"
        />
        <StatCard
          title="MLAs"
          value={stats.totalMLAs}
          icon={Users}
          color="#10B981"
        />
        <StatCard
          title="Members"
          value={stats.totalMembers}
          icon={Users}
          color="#F59E0B"
        />
        <StatCard
          title="Issues"
          value={stats.totalIssues}
          icon={FileText}
          color="#EF4444"
          subtitle={`${stats.pendingIssues} pending`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Pending Issues"
          value={stats.pendingIssues}
          icon={AlertCircle}
          color="#F59E0B"
        />
        <StatCard
          title="Resolved Issues"
          value={stats.resolvedIssues}
          icon={FileText}
          color="#10B981"
        />
        <StatCard
          title="Total Sessions"
          value={stats.totalSessions}
          icon={Calendar}
          color="#8B5CF6"
        />
        <StatCard
          title="Upcoming Sessions"
          value={stats.upcomingSessions}
          icon={Calendar}
          color="#EC4899"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {(recentActivity || []).length > 0 ? (
              (recentActivity || []).map((activity, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded-md">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
              <Users className="h-6 w-6 text-blue-600 mb-2" />
              <p className="text-sm font-medium text-blue-900">Manage Users</p>
            </button>
            <button className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
              <FileText className="h-6 w-6 text-green-600 mb-2" />
              <p className="text-sm font-medium text-green-900">View Issues</p>
            </button>
            <button className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
              <Calendar className="h-6 w-6 text-purple-600 mb-2" />
              <p className="text-sm font-medium text-purple-900">Schedule Session</p>
            </button>
            <button className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors">
              <TrendingUp className="h-6 w-6 text-orange-600 mb-2" />
              <p className="text-sm font-medium text-orange-900">View Analytics</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
