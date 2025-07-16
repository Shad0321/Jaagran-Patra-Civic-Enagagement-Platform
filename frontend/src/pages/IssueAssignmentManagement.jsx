import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  User,
  Calendar,
  FileText,
  ArrowRight,
  UserPlus,
  RotateCcw,
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import IssueAssignmentModal from '../components/IssueAssignmentModal';

const IssueAssignmentManagement = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState('');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    assigned: 0,
    unassigned: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  });

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const response = await api.get('/issues/assigned-to-me');
      const issuesData = response.data.data.issues || [];
      setIssues(issuesData);

      // Calculate stats
      const stats = {
        total: issuesData.length,
        assigned: issuesData.filter((issue) => issue.assignedTo).length,
        unassigned: issuesData.filter((issue) => !issue.assignedTo).length,
        pending: issuesData.filter((issue) => issue.status === 'PENDING')
          .length,
        inProgress: issuesData.filter((issue) => issue.status === 'IN_PROGRESS')
          .length,
        resolved: issuesData.filter((issue) => issue.status === 'RESOLVED')
          .length,
      };
      setStats(stats);
    } catch (error) {
      console.error('Error fetching issues:', error);
      toast.error('Failed to fetch issues');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentSuccess = () => {
    fetchIssues();
    setShowAssignmentModal(false);
    setSelectedIssue(null);
  };

  const openAssignmentModal = (issue) => {
    setSelectedIssue(issue);
    setShowAssignmentModal(true);
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

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.ticketId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || issue.status === statusFilter;
    const matchesPriority =
      !priorityFilter || issue.priority === priorityFilter;

    const matchesAssignment =
      !assignmentFilter ||
      (assignmentFilter === 'assigned' && issue.assignedTo) ||
      (assignmentFilter === 'unassigned' && !issue.assignedTo);

    return (
      matchesSearch && matchesStatus && matchesPriority && matchesAssignment
    );
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Issue Assignment Management
        </h1>
        <p className="text-gray-600 mt-1">
          Manage issue assignments to your team members
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Issues</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Assigned</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.assigned}
              </p>
            </div>
            <UserPlus className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unassigned</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.unassigned}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.inProgress}
              </p>
            </div>
            <RotateCcw className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
          <select
            value={assignmentFilter}
            onChange={(e) => setAssignmentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Issues</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
      </div>

      {/* Issues List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Issues ({filteredIssues.length})
          </h2>
        </div>

        {filteredIssues.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredIssues.map((issue) => (
              <div
                key={issue.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900">
                        {issue.title}
                      </h3>
                      <span className="text-sm text-gray-500">
                        #{issue.ticketId}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}
                        >
                          {issue.status}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)}`}
                        >
                          {issue.priority}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {issue.description}
                    </p>

                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{issue.address || 'No address'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {issue.assignedTo ? (
                        <div className="flex items-center space-x-1 text-green-600">
                          <User className="h-4 w-4" />
                          <span>Assigned to: {issue.assignedTo.name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span>Unassigned</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => openAssignmentModal(issue)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        issue.assignedTo
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {issue.assignedTo ? 'Reassign' : 'Assign'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No issues found</p>
            <p className="text-sm text-gray-400">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      <IssueAssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        issue={selectedIssue}
        onSuccess={handleAssignmentSuccess}
      />
    </div>
  );
};

export default IssueAssignmentManagement;
