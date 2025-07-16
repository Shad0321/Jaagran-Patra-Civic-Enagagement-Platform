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
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const IssueAssignmentModal = ({ isOpen, onClose, issue, onSuccess }) => {
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBodyType, setFilterBodyType] = useState('');
  const [assignmentReason, setAssignmentReason] = useState('');

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
      const response = await api.get('/auth/members');
      setMembers(response.data.members || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to fetch members');
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

  if (!isOpen || !issue) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Assign Issue to Member
              </h2>
              <p className="text-sm text-gray-600">Issue #{issue.ticketId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Issue Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Issue Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900">{issue.title}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {issue.description}
                </p>
                <div className="flex items-center space-x-2 mt-2">
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
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  {issue.address || 'No address provided'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  Created: {new Date(issue.createdAt).toLocaleDateString()}
                </div>
                {issue.assignedTo && (
                  <div className="flex items-center text-sm text-green-600">
                    <User className="h-4 w-4 mr-2" />
                    Currently assigned to: {issue.assignedTo.name}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">
              Select Member to Assign
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={filterBodyType}
                  onChange={(e) => setFilterBodyType(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Body Types</option>
                  {bodyTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Member Selection */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedMember === member.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedMember(member.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {member.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {member.email}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {member.bodyType?.replace(/_/g, ' ')}
                            </span>
                            {member.body && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                {member.body.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {member.designation || 'Member'}
                        </p>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {member.assignedIssuesCount || 0} issues
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No members found</p>
                  <p className="text-sm">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Assignment Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Reason (Optional)
            </label>
            <textarea
              value={assignmentReason}
              onChange={(e) => setAssignmentReason(e.target.value)}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter reason for assignment..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
              {issue.assignedTo && (
                <button
                  onClick={handleUnassign}
                  disabled={loading}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  Reassign to Me
                </button>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={loading || !selectedMember}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
