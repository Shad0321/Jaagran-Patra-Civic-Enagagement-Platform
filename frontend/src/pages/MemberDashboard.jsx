import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Users, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  MapPin, 
  Calendar, 
  MessageSquare,
  TrendingUp,
  UserCheck,
  X
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ProgressUpdateModal from '../components/ProgressUpdateModal';

const MemberDashboard = () => {
  const { user } = useSelector((state) => state.user);
  const [stats, setStats] = useState({
    totalAssignedIssues: 0,
    pendingIssues: 0,
    inProgressIssues: 0,
    resolvedIssues: 0,
    localIssues: 0
  });
  const [assignedIssues, setAssignedIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch assigned issues
      const issuesResponse = await api.get('/issues/assigned-to-me');
      const issues = issuesResponse.data.data.issues || [];
      
      // Calculate stats
      const stats = {
        totalAssignedIssues: issues.length,
        pendingIssues: issues.filter(issue => issue.status === 'PENDING').length,
        inProgressIssues: issues.filter(issue => issue.status === 'IN_PROGRESS').length,
        resolvedIssues: issues.filter(issue => issue.status === 'RESOLVED').length,
        localIssues: issues.filter(issue => issue.bodyId === user.bodyId).length
      };
      
      setStats(stats);
      setAssignedIssues(issues.slice(0, 10)); // Show latest 10 issues
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateIssue = async () => {
    // This function is now handled by the ProgressUpdateModal component
    fetchDashboardData(); // Refresh data after update
  };

  const openUpdateModal = (issue) => {
    setSelectedIssue(issue);
    setShowUpdateModal(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'IN_PROGRESS':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'RESOLVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'LOW':
        return 'bg-blue-100 text-blue-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Member Dashboard - {user?.name}
        </h1>
        <p className="text-gray-600">
          Manage assigned issues and support your local community as a {user?.memberProfile?.designation || 'Member'}.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Issues</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAssignedIssues}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingIssues}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgressIssues}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolvedIssues}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Local Issues</p>
              <p className="text-2xl font-bold text-purple-600">{stats.localIssues}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <MapPin className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Role Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <UserCheck className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900">
              {user?.memberProfile?.designation || 'Community Member'}
            </h3>
            <p className="text-blue-800">
              {user?.body?.name ? `${user.body.name} - ` : ''}{user?.memberProfile?.bodyType || 'Local Body'}
            </p>
            <p className="text-sm text-blue-700">
              Working under MLA: {user?.mla?.name || 'Not assigned'}
            </p>
          </div>
        </div>
      </div>

      {/* Assigned Issues */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Assigned Issues</h2>
            <a 
              href="/issues" 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All
            </a>
          </div>
        </div>
        
        <div className="p-6">
          {assignedIssues.length > 0 ? (
            <div className="space-y-4">
              {assignedIssues.map((issue) => (
                <div key={issue.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{issue.title}</h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{issue.description}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {issue.address || 'Location not specified'}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </div>
                        <div>
                          Reported by: {issue.reportedBy?.name || 'Unknown'}
                        </div>
                      </div>

                      {issue.category && (
                        <div className="mb-2">
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                            {issue.category.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3 ml-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(issue.priority)}`}>
                        {issue.priority}
                      </span>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(issue.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(issue.status)}`}>
                          {issue.status.replace('_', ' ')}
                        </span>
                      </div>
                      <button
                        onClick={() => openUpdateModal(issue)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                  
                  {issue.progressUpdates && issue.progressUpdates.length > 0 && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm font-medium text-gray-700 mb-1">Latest Update:</p>
                      <p className="text-sm text-gray-600">
                        {issue.progressUpdates[issue.progressUpdates.length - 1].message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(issue.progressUpdates[issue.progressUpdates.length - 1].createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No issues assigned yet</p>
              <p className="text-sm">Issues will appear here when they are assigned to you by your MLA</p>
            </div>
          )}
        </div>
      </div>

      {/* Progress Update Modal */}
      <ProgressUpdateModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        issue={selectedIssue}
        onUpdate={handleUpdateIssue}
      />
    </div>
  );
};

export default MemberDashboard;
