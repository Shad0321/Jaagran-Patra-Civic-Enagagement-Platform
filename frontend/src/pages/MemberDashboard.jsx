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
  ChevronDown,
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import ProgressUpdateModal from '../components/ProgressUpdateModal';
import Loader from '../components/common/Loader';

const MemberDashboard = () => {
  const { user } = useSelector((state) => state.user);
  const [stats, setStats] = useState({
    totalAssignedIssues: 0,
    pendingIssues: 0,
    inProgressIssues: 0,
    resolvedIssues: 0,
    localIssues: 0,
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
      const issuesResponse = await api.get('/issues/assigned-to-me');
      const issues = issuesResponse.data.data.issues || [];

      const stats = {
        totalAssignedIssues: issues.length,
        pendingIssues: issues.filter((issue) => issue.status === 'PENDING')
          .length,
        inProgressIssues: issues.filter(
          (issue) => issue.status === 'IN_PROGRESS'
        ).length,
        resolvedIssues: issues.filter((issue) => issue.status === 'RESOLVED')
          .length,
        localIssues: issues.filter((issue) => issue.bodyId === user.bodyId)
          .length,
      };

      setStats(stats);
      setAssignedIssues(issues.slice(0, 10));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateIssue = async () => {
    fetchDashboardData();
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
      <Loader className="min-h-screen flex items-center justify-center bg-white" />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-slate-50 to-primary/10 relative overflow-hidden">
      {/* Background Graphics */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-primary/8 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 right-10 w-56 h-56 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_0)] bg-[size:20px_20px]"></div>
      </div>

      <div className="relative z-10 p-2 sm:p-6 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-primary/10 mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2 pt-1">
            Member Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back,{' '}
            <span className="font-medium text-primary">{user?.name}</span>.
            Manage assigned issues and support your local community as a{' '}
            {user?.memberProfile?.designation || 'Member'}.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Issues
                </p>
                <p className="text-2xl font-bold text-primary">
                  {stats.totalAssignedIssues}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-yellow-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pendingIssues}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center shadow-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-blue-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.inProgressIssues}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-green-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.resolvedIssues}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center shadow-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-purple-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Local Issues
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.localIssues}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                <MapPin className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Role Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50 p-6 mb-8 backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <div className="min-h-12 min-w-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
              <UserCheck className="min-h-6 min-w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                {user?.memberProfile?.designation || 'Community Member'}
              </h3>
              <p className="text-blue-800">
                {user?.body?.name ? `${user.body.name} - ` : ''}
                {user?.memberProfile?.bodyType || 'Local Body'}
              </p>
              <p className="text-sm text-blue-700">
                Working under MLA: {user?.mla?.name || 'Not assigned'}
              </p>
            </div>
          </div>
        </div>

        {/* Assigned Issues */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Assigned Issues
              </h2>
              <a
                href="/issues"
                className="text-primary hover:text-primary/70 text-sm font-medium flex items-center gap-1"
              >
                View All
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </a>
            </div>
          </div>

          <div className="p-6">
            {assignedIssues.length > 0 ? (
              <div className="space-y-4">
                {assignedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.01] cursor-pointer"
                    onClick={() => openUpdateModal(issue)}
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-2">
                          {issue.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {issue.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
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
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full mb-3">
                            {issue.category.replace('_', ' ')}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(issue.priority)}`}
                        >
                          {issue.priority}
                        </span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(issue.status)}
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(issue.status)}`}
                          >
                            {issue.status.replace('_', ' ')}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openUpdateModal(issue);
                          }}
                          className="px-3 py-1 bg-gradient-to-r from-primary to-primary/80 text-white text-xs rounded-md hover:shadow-md transition-all duration-200"
                        >
                          Update
                        </button>
                      </div>
                    </div>

                    {issue.progressUpdates &&
                      issue.progressUpdates.length > 0 && (
                        <div className="mt-4 p-3 bg-gray-50/50 rounded-md border border-gray-200/30">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Latest Update:
                          </p>
                          <p className="text-sm text-gray-600">
                            {
                              issue.progressUpdates[
                                issue.progressUpdates.length - 1
                              ].message
                            }
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(
                              issue.progressUpdates[
                                issue.progressUpdates.length - 1
                              ].createdAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <AlertCircle className="h-8 w-8 text-primary" />
                </div>
                <p className="text-gray-900 mb-1">No issues assigned yet</p>
                <p className="text-gray-500 text-sm">
                  Issues will appear here when they are assigned to you by your
                  MLA
                </p>
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
    </div>
  );
};

export default MemberDashboard;
