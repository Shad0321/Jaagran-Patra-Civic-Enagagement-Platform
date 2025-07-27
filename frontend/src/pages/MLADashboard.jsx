import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Users,
  AlertCircle,
  Clock,
  CheckCircle,
  MapPin,
  Calendar,
  TrendingUp,
  UserCheck,
  X,
  Settings,
  Plus,
  Building,
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import ProgressUpdateModal from '../components/ProgressUpdateModal';
import IssueAssignmentModal from '../components/IssueAssignmentModal';
import MediaDisplay from '../components/common/MediaDisplay';
import UpdateMediaDisplay from '../components/common/UpdateMediaDisplay';
import Loader from '../components/common/Loader';

const MLADashboard = () => {
  const { user } = useSelector((state) => state.user);
  const [stats, setStats] = useState({
    totalAssignedIssues: 0,
    pendingIssues: 0,
    inProgressIssues: 0,
    resolvedIssues: 0,
    totalMembers: 0,
    activeCitizens: 0,
    inactiveMembers: 0,
  });
  const [assignedIssues, setAssignedIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch assigned issues
      const issuesResponse = await api.get('/issues/assigned-to-me');
      const issues = issuesResponse.data.data.issues || [];

      // Fetch members under this MLA
      const membersResponse = await api.get('/admin/members?mlaId=' + user.id);
      const members = membersResponse.data?.data?.members || [];

      // Calculate stats
      const stats = {
        totalAssignedIssues: issues.length,
        pendingIssues: issues.filter((issue) => issue.status === 'PENDING')
          .length,
        inProgressIssues: issues.filter(
          (issue) => issue.status === 'IN_PROGRESS'
        ).length,
        resolvedIssues: issues.filter((issue) => issue.status === 'RESOLVED')
          .length,
        totalMembers: members.length,
        activeCitizens: new Set(issues.map((issue) => issue.reportedById)).size,
        inactiveMembers: members.filter((member) => !member.isActive).length,
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
    fetchDashboardData(); // Refresh data after update
  };

  const openUpdateModal = (issue) => {
    setSelectedIssue(issue);
    setShowUpdateModal(true);
  };

  const openAssignmentModal = (issue) => {
    setSelectedIssue(issue);
    setShowAssignmentModal(true);
  };

  const handleAssignmentSuccess = () => {
    fetchDashboardData();
    setShowAssignmentModal(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'IN_PROGRESS':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'RESOLVED':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'LOW':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'HIGH':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'URGENT':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Loader
        className={'w-screen h-screen flex items-center justify-center'}
      />
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
        <div className="mb-8 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-primary/10">
            <h1 className="py-2 text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-3">
              MLA Dashboard
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Welcome back, {user?.name}
            </p>
            <p className="text-gray-500">
              Manage assigned issues and track progress in your constituency.
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
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
              <div className="h-12 min-w-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-amber-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.pendingIssues}
                </p>
              </div>
              <div className="h-12 min-w-12 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg flex items-center justify-center shadow-lg">
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
              <div className="h-12 min-w-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-emerald-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.resolvedIssues}
                </p>
              </div>
              <div className="h-12 min-w-12 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-purple-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Members
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.totalMembers}
                </p>
              </div>
              <div className="h-12 min-w-12 bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Citizens
                </p>
                <p className="text-2xl font-bold text-primary">
                  {stats.activeCitizens}
                </p>
              </div>
              <div className="h-12 min-w-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <Link
            to="/member-management"
            className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                  Member Management
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add and manage members under your constituency
                </p>
                <div className="flex items-center space-x-2 text-primary">
                  <Plus className="h-4 w-4" />
                  <span className="text-sm font-medium">Manage Members</span>
                </div>
              </div>
              <div className="h-12 min-w-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </Link>

          <Link
            to="/body-management"
            className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                  Constituency Management
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Create and manage political constituencies and organizations
                </p>
                <div className="flex items-center space-x-2 text-primary">
                  <Building className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Manage Constituencies
                  </span>
                </div>
              </div>
              <div className="h-12 min-w-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                <Building className="h-6 w-6 text-white" />
              </div>
            </div>
          </Link>

          <Link
            to="/issue-assignment"
            className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                  Issue Assignment
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Assign issues to your team members for resolution
                </p>
                <div className="flex items-center space-x-2 text-primary">
                  <UserCheck className="h-4 w-4" />
                  <span className="text-sm font-medium">Assign Issues</span>
                </div>
              </div>
              <div className="h-12 min-w-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
            </div>
          </Link>

          <Link
            to="/settings"
            className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                  Settings
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Configure your profile and preferences
                </p>
                <div className="flex items-center space-x-2 text-primary">
                  <Settings className="h-4 w-4" />
                  <span className="text-sm font-medium">Manage Settings</span>
                </div>
              </div>
              <div className="h-12 min-w-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                <Settings className="h-6 w-6 text-white" />
              </div>
            </div>
          </Link>
        </div>

        {/* Assigned Issues */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 mb-8">
          <div className="p-6 border-b border-primary/10">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Assigned Issues
              </h2>
              <Link
                to="/issues"
                className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
              >
                View All
              </Link>
            </div>
          </div>

          <div className="p-6">
            {assignedIssues.length > 0 ? (
              <div className="grid gap-4">
                {assignedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/70 shadow-sm hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="p-5">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        {/* Left Content */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {getStatusIcon(issue.status)}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                                {issue.title}
                              </h3>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {issue.description}
                              </p>
                            </div>
                          </div>

                          {/* Media Display */}
                          {issue.media && issue.media.length > 0 && (
                            <MediaDisplay
                              issue={issue}
                              className="rounded-lg border border-gray-200/50 overflow-hidden"
                            />
                          )}

                          {/* Meta Information */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                            <div className="flex items-center">
                              <MapPin className="h-3.5 w-3.5 mr-1.5 text-primary/70" />
                              <span>
                                {issue.address || 'Location not specified'}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1.5 text-primary/70" />
                              <span>
                                {new Date(issue.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span>
                                Reported by:{' '}
                                {issue.reportedBy?.name || 'Unknown'}
                              </span>
                            </div>
                            {issue.assignedTo && (
                              <div className="flex items-center text-primary">
                                <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                                <span>
                                  Assigned to: {issue.assignedTo.name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Content */}
                        <div className="flex flex-col items-end gap-3">
                          <div className="flex flex-wrap justify-end gap-2">
                            <span
                              className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getPriorityColor(issue.priority)}`}
                            >
                              {issue.priority}
                            </span>
                            <span
                              className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(issue.status)}`}
                            >
                              {issue.status.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              onClick={() => openUpdateModal(issue)}
                              className="px-3 py-1.5 bg-gradient-to-r from-primary to-primary/80 text-white text-xs font-medium rounded-lg hover:shadow-md transition-all duration-200 flex items-center gap-1 cursor-pointer"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M12 20h9"></path>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                              </svg>
                              Update
                            </button>
                            <button
                              onClick={() => openAssignmentModal(issue)}
                              className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-medium rounded-lg hover:shadow-md transition-all duration-200 flex items-center gap-1 cursor-pointer"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              Assign
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Progress Updates */}
                      {issue.progressUpdates &&
                        issue.progressUpdates.length > 0 && (
                          <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                            <div className="flex items-center gap-2 mb-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-primary"
                              >
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                              <h4 className="text-sm font-medium text-gray-700">
                                Latest Update
                              </h4>
                              <span className="text-xs text-gray-500 ml-auto">
                                {new Date(
                                  issue.progressUpdates[
                                    issue.progressUpdates.length - 1
                                  ].createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 pl-2">
                              {
                                issue.progressUpdates[
                                  issue.progressUpdates.length - 1
                                ].message
                              }
                            </p>
                            <UpdateMediaDisplay
                              update={
                                issue.progressUpdates[
                                  issue.progressUpdates.length - 1
                                ]
                              }
                              className="mt-2"
                            />
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-gray-200/50 shadow-sm">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                    <AlertCircle className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No issues assigned yet
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Issues will appear here when citizens report them in your
                    constituency
                  </p>
                  <button className="mt-4 px-4 py-2 bg-gradient-to-r from-primary to-primary/80 text-white text-sm font-medium rounded-lg hover:shadow-md transition-all duration-200">
                    Check for new issues
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Member Management Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10">
          <div className="p-6 border-b border-primary/10">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Member Management
              </h2>
              <Link
                to="/member-management"
                className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
              >
                View All
              </Link>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Members
                    </p>
                    <p className="text-xl font-bold text-primary">
                      {stats.totalMembers}
                    </p>
                  </div>
                  <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-100/50 to-emerald-50/50 p-4 rounded-lg border border-emerald-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Active Members
                    </p>
                    <p className="text-xl font-bold text-emerald-600">
                      {stats.totalMembers - (stats.inactiveMembers || 0)}
                    </p>
                  </div>
                  <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-100/50 to-red-50/50 p-4 rounded-lg border border-red-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Inactive Members
                    </p>
                    <p className="text-xl font-bold text-red-600">
                      {stats.inactiveMembers || 0}
                    </p>
                  </div>
                  <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                    <X className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/member-management"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Member
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Update Modal */}
      <ProgressUpdateModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        issue={selectedIssue}
        onUpdate={handleUpdateIssue}
      />

      {/* Issue Assignment Modal */}
      <IssueAssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        issue={selectedIssue}
        onSuccess={handleAssignmentSuccess}
      />
    </div>
  );
};

export default MLADashboard;
