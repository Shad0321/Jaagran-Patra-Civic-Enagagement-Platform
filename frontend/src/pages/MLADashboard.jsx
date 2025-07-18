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
  MessageSquare,
  TrendingUp,
  BarChart3,
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
      console.log('membersResponse', membersResponse.data);

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
        <Loader className={"w-screen h-screen"}/>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          MLA Dashboard - {user?.name}
        </h1>
        <p className="text-gray-600">
          Manage assigned issues and track progress in your constituency.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Issues</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalAssignedIssues}
              </p>
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
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pendingIssues}
              </p>
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
              <p className="text-2xl font-bold text-blue-600">
                {stats.inProgressIssues}
              </p>
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
              <p className="text-2xl font-bold text-green-600">
                {stats.resolvedIssues}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.totalMembers}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Active Citizens
              </p>
              <p className="text-2xl font-bold text-indigo-600">
                {stats.activeCitizens}
              </p>
            </div>
            <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Link
          to="/member-management"
          className="bg-white rounded-lg shadow-sm border p-6 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Member Management
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Add and manage members under your constituency
              </p>
              <div className="flex items-center space-x-2 text-blue-600">
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">Manage Members</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Link>

        <Link
          to="/body-management"
          className="bg-white rounded-lg shadow-sm border p-6 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Body Management
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Create and manage political bodies and organizations
              </p>
              <div className="flex items-center space-x-2 text-purple-600">
                <Building className="h-4 w-4" />
                <span className="text-sm font-medium">Manage Bodies</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Building className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Link>

        <Link
          to="/issue-assignment"
          className="bg-white rounded-lg shadow-sm border p-6 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Issue Assignment
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Assign issues to your team members for resolution
              </p>
              <div className="flex items-center space-x-2 text-green-600">
                <UserCheck className="h-4 w-4" />
                <span className="text-sm font-medium">Assign Issues</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Link>

        <Link
          to="/settings"
          className="bg-white rounded-lg shadow-sm border p-6 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Settings
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Configure your profile and preferences
              </p>
              <div className="flex items-center space-x-2 text-gray-600">
                <Settings className="h-4 w-4" />
                <span className="text-sm font-medium">Manage Settings</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Settings className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </Link>
      </div>

      {/* Assigned Issues */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Assigned Issues
            </h2>
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
                <div
                  key={issue.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {issue.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {issue.description}
                      </p>

                      {/* Media Display */}
                      <MediaDisplay issue={issue} className="mb-2" />

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
                        {issue.assignedTo && (
                          <div className="flex items-center text-blue-600">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Assigned to: {issue.assignedTo.name}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 ml-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(issue.priority)}`}
                      >
                        {issue.priority}
                      </span>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(issue.status)}
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(issue.status)}`}
                        >
                          {issue.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openUpdateModal(issue)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Update
                        </button>
                      </div>
                      <button
                        onClick={() => openAssignmentModal(issue)}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                      >
                        Assign
                      </button>
                    </div>
                  </div>

                  {issue.progressUpdates &&
                    issue.progressUpdates.length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
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
                        <UpdateMediaDisplay
                          update={
                            issue.progressUpdates[
                              issue.progressUpdates.length - 1
                            ]
                          }
                          className="mt-1"
                        />
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
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No issues assigned yet</p>
              <p className="text-sm">
                Issues will appear here when citizens report them in your
                constituency
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Member Management Section */}
      <div className="bg-white rounded-lg shadow-sm border mt-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Member Management
            </h2>
            <Link
              to="/member-management"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All
            </Link>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Members
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.totalMembers}
                </p>
              </div>
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-purple-600" />
              </div>
            </div>

            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Members
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {stats?.totalMembers - stats?.inactiveMembers || 0}
                </p>
              </div>
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>

            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Inactive Members
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.inactiveMembers || 0}
                </p>
              </div>
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                <X className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Link
              to="/member-management"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Member
            </Link>
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

      {/* Issue Assignment Modal */}
      <IssueAssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        issue={selectedIssue}
        onAssign={handleAssignmentSuccess}
      />
    </div>
  );
};

export default MLADashboard;
