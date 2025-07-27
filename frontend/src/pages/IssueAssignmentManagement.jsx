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
  ChevronDown,
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import IssueAssignmentModal from '../components/IssueAssignmentModal';
import Loader from '../components/common/Loader';

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
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RESOLVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
      <Loader className="w-screen h-screen flex items-center justify-center" />
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
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-primary/10">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
                Issue Assignment Management
              </h1>
              <p className="text-gray-600">
                Manage issue assignments to your team members
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Issues
                </p>
                <p className="text-2xl font-bold text-primary">{stats.total}</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-emerald-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assigned</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.assigned}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-red-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unassigned</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.unassigned}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-red-400 to-red-500 rounded-lg flex items-center justify-center shadow-lg">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-blue-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.inProgress}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                <RotateCcw className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 bg-white/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-3 pr-8 py-2 bg-white/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 appearance-none"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
            </div>
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full pl-3 pr-8 py-2 bg-white/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 appearance-none"
              >
                <option value="">All Priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
            </div>
            <div className="relative">
              <select
                value={assignmentFilter}
                onChange={(e) => setAssignmentFilter(e.target.value)}
                className="w-full pl-3 pr-8 py-2 bg-white/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 appearance-none"
              >
                <option value="">All Issues</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 overflow-hidden">
          <div className="p-6 border-b border-primary/10">
            <h2 className="text-xl font-semibold text-gray-900">
              Issues ({filteredIssues.length})
            </h2>
          </div>

          {filteredIssues.length > 0 ? (
            <div className="divide-y divide-gray-200/50">
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="p-6 hover:bg-primary/5 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h3 className="font-semibold text-gray-900">
                          {issue.title}
                        </h3>
                        <span className="text-sm text-gray-500">
                          #{issue.ticketId}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(issue.status)}`}
                          >
                            {issue.status.replace('_', ' ')}
                          </span>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(issue.priority)}`}
                          >
                            {issue.priority}
                          </span>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {issue.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-primary/70" />
                          <span>{issue.address || 'No address'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-primary/70" />
                          <span>
                            {new Date(issue.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {issue.assignedTo ? (
                          <div className="flex items-center gap-1 text-emerald-600">
                            <User className="h-4 w-4" />
                            <span>Assigned to: {issue.assignedTo.name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <span>Unassigned</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 md:ml-4">
                      <button
                        onClick={() => openAssignmentModal(issue)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          issue.assignedTo
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
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
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No issues found
              </h3>
              <p className="text-gray-500 text-sm">
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
    </div>
  );
};

export default IssueAssignmentManagement;
