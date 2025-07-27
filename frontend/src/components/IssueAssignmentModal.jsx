import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  MapPin,
  Clock,
  AlertCircle,
  Users,
  CheckCircle,
  Building,
  Search,
  Filter,
  ChevronDown,
  Bookmark,
  ChevronRight,
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import Loader from './common/Loader';

const IssueAssignmentModal = ({ isOpen, onClose, issue, onSuccess }) => {
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBodyType, setFilterBodyType] = useState('');
  const [assignmentReason, setAssignmentReason] = useState('');
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
      if (issue?.assignedTo?.id) {
        setSelectedMember(issue.assignedTo.id);
      }
    }
  }, [isOpen, issue]);

  const fetchMembers = async () => {
    try {
      setIsFetching(true);
      const response = await api.get('/auth/members');
      setMembers(response.data.members || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to fetch members');
    } finally {
      setIsFetching(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedMember) {
      toast.error('Please select a member to assign');
      return;
    }

    try {
      setLoading(true);
      await api.put(`/issues/${issue.id}`, {
        assignedToId: selectedMember,
        assignmentReason: assignmentReason || `Assigned by MLA`,
      });

      toast.success('Issue assigned successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error assigning issue:', error);
      toast.error(error.response?.data?.error || 'Failed to assign issue');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    try {
      setLoading(true);
      await api.put(`/issues/${issue.id}`, {
        assignedToId: null,
        assignmentReason: 'Reassigned to MLA',
      });

      toast.success('Issue reassigned to MLA successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error reassigning issue:', error);
      toast.error(error.response?.data?.error || 'Failed to reassign issue');
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBodyType =
      !filterBodyType || member.bodyType === filterBodyType;
    return matchesSearch && matchesBodyType;
  });

  const bodyTypes = [
    { value: 'SHAKTI_KENDRA', label: 'Shakti Kendra' },
    { value: 'PANNA_PRAMUKH', label: 'Panna Pramukh' },
    { value: 'LOCAL_BODY', label: 'Local Body' },
    { value: 'POLLING_BOOTH', label: 'Polling Booth' },
    { value: 'WARD', label: 'Ward' },
    { value: 'BLOCK', label: 'Block' },
    { value: 'MANDAL', label: 'Mandal' },
    { value: 'TEHSIL', label: 'Tehsil' },
    { value: 'GRAM_PANCHAYAT', label: 'Gram Panchayat' },
    { value: 'MUNICIPALITY', label: 'Municipality' },
    { value: 'CORPORATION', label: 'Corporation' },
    { value: 'OTHER', label: 'Other' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!isOpen || !issue) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center  z-50 p-4 pb-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-primary/10 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Assign Issue to Member
              </h2>
              <p className="text-sm text-primary/80">Issue #{issue.ticketId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Issue Details */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Issue Details</h3>
              <div className="flex gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(issue.status)}`}
                >
                  {issue.status.replace('_', ' ')}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(issue.priority)}`}
                >
                  {issue.priority}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 text-lg">
                  {issue.title}
                </h4>
                <p className="text-gray-600 mt-1">{issue.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-700">Location</p>
                    <p className="text-gray-600 text-sm">
                      {issue.address || 'No address provided'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-700">Created</p>
                    <p className="text-gray-600 text-sm">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {issue.assignedTo && (
                <div className="flex items-center gap-3 bg-green-50/80 border border-green-200 rounded-lg p-3">
                  <User className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">
                      Currently assigned to
                    </p>
                    <p className="text-green-700 text-sm">
                      {issue.assignedTo.name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
            <h3 className="font-bold text-gray-900 mb-4">
              Select Member to Assign
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary/70" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                />
              </div>

              <div className="relative">
                <select
                  value={filterBodyType}
                  onChange={(e) => setFilterBodyType(e.target.value)}
                  className="pl-10 w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80 appearance-none"
                >
                  <option value="">All Body Types</option>
                  {bodyTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary/70" />
              </div>
            </div>
          </div>

          {/* Member Selection */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
            {isFetching ? (
              <div className="flex justify-center py-8">
                <Loader />
              </div>
            ) : filteredMembers.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-2">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedMember === member.id
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-gray-200 hover:border-primary/30 hover:shadow-sm'
                    }`}
                    onClick={() => setSelectedMember(member.id)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-white">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {member.name}
                            {member.designation && (
                              <span className="text-xs font-normal text-gray-500 ml-2">
                                ({member.designation})
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {member.email}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20">
                              {member.bodyType?.replace(/_/g, ' ')}
                            </span>
                            {member.body && (
                              <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full border border-purple-200">
                                {member.body.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center text-sm text-gray-500">
                          <CheckCircle className="h-4 w-4 mr-1.5 text-green-500" />
                          {member.assignedIssuesCount || 0}
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="font-medium">No members found</p>
                <p className="text-sm mt-1">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </div>

          {/* Assignment Reason */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Assignment Reason (Optional)
            </label>
            <textarea
              value={assignmentReason}
              onChange={(e) => setAssignmentReason(e.target.value)}
              rows="3"
              className="w-full px-4 py-3 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
              placeholder="Enter reason for assignment..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-primary/10">
            <div>
              {issue.assignedTo && (
                <button
                  onClick={handleUnassign}
                  disabled={loading}
                  className="px-5 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 border border-red-200 hover:shadow-sm disabled:opacity-50"
                >
                  Reassign to Me
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200 hover:shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={loading || !selectedMember}
                className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Assigning...' : 'Assign Issue'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueAssignmentModal;
