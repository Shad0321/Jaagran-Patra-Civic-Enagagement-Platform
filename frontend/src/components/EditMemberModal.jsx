import React, { useState, useEffect } from 'react';
import { X, Users, Building, Check, Edit, ChevronDown } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import Loader from './common/Loader';

const EditMemberModal = ({ isOpen, onClose, member, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bodyType: '',
    bodyId: '',
    designation: '',
    description: '',
    canReceiveIssues: true,
    canUpdateIssues: true,
    canCreateSessions: false,
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [availableBodies, setAvailableBodies] = useState([]);
  const [loadingBodies, setLoadingBodies] = useState(false);

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

  useEffect(() => {
    if (isOpen && member) {
      setFormData({
        name: member.name || '',
        phone: member.phone || '',
        bodyType: member.bodyType || '',
        bodyId: member.body?.id || '',
        designation: member.designation || '',
        description: member.memberProfile?.description || '',
        canReceiveIssues: member.memberProfile?.canReceiveIssues ?? true,
        canUpdateIssues: member.memberProfile?.canUpdateIssues ?? true,
        canCreateSessions: member.memberProfile?.canCreateSessions ?? false,
        isActive: member.isActive ?? true,
      });
      fetchBodies();
    }
  }, [isOpen, member]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (formData.bodyType) {
      fetchBodies();
    }
  }, [formData.bodyType]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchBodies = async () => {
    try {
      setLoadingBodies(true);
      const params = {};
      if (formData.bodyType) params.type = formData.bodyType;

      const response = await api.get('/auth/bodies', { params });
      setAvailableBodies(response.data.bodies || []);
    } catch (error) {
      console.error('Error fetching bodies:', error);
      toast.error('Failed to fetch bodies');
    } finally {
      setLoadingBodies(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.bodyType) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      await api.put(`/auth/profile`, {
        name: formData.name,
        phone: formData.phone,
        isActive: formData.isActive,
      });

      await api.put(`/auth/members/${member.id}`, {
        bodyType: formData.bodyType,
        bodyId: formData.bodyId,
        designation: formData.designation,
        description: formData.description,
        canReceiveIssues: formData.canReceiveIssues,
        canUpdateIssues: formData.canUpdateIssues,
        canCreateSessions: formData.canCreateSessions,
      });

      toast.success('Member updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating member:', error);
      toast.error(error.response?.data?.error || 'Failed to update member');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center  z-50 p-4 pb-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-primary/10 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
              <Edit className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Member</h2>
              <p className="text-sm text-primary/80">
                Update member information and permissions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={member.email}
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg bg-gray-50/80 text-gray-600"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="isActive"
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={(e) =>
                    handleInputChange({
                      target: {
                        name: 'isActive',
                        value: e.target.value === 'active',
                        type: 'select',
                      },
                    })
                  }
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80 appearance-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary/70" />
              </div>
            </div>
          </div>

          {/* Role & Body Information */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
            <h3 className="font-bold text-gray-900 mb-4">
              Role & Body Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Body Type *
                </label>
                <select
                  name="bodyType"
                  value={formData.bodyType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80 appearance-none"
                  required
                >
                  <option value="">Select body type</option>
                  {bodyTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary/70" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Body/Organization
                </label>
                <select
                  name="bodyId"
                  value={formData.bodyId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80 appearance-none"
                  disabled={loadingBodies}
                >
                  <option value="">Select body (optional)</option>
                  {availableBodies.map((body) => (
                    <option key={body.id} value={body.id}>
                      {body.name} ({body.type.replace(/_/g, ' ')})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary/70" />
                {loadingBodies && (
                  <p className="text-xs text-gray-500 mt-1">
                    Loading Constituencies...
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Designation
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                  placeholder="e.g., Secretary, President, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                  placeholder="Brief description of role and responsibilities"
                />
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Permissions</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="canReceiveIssues"
                  checked={formData.canReceiveIssues}
                  onChange={handleInputChange}
                  className="h-5 w-5 text-primary focus:ring-primary/50 border-primary/30 rounded"
                />
                <label className="ml-3 text-sm font-medium text-gray-700">
                  Can receive and be assigned issues
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="canUpdateIssues"
                  checked={formData.canUpdateIssues}
                  onChange={handleInputChange}
                  className="h-5 w-5 text-primary focus:ring-primary/50 border-primary/30 rounded"
                />
                <label className="ml-3 text-sm font-medium text-gray-700">
                  Can update issue status and add progress notes
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="canCreateSessions"
                  checked={formData.canCreateSessions}
                  onChange={handleInputChange}
                  className="h-5 w-5 text-primary focus:ring-primary/50 border-primary/30 rounded"
                />
                <label className="ml-3 text-sm font-medium text-gray-700">
                  Can create and manage sessions
                </label>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                <p className="text-sm text-gray-600">Total Issues</p>
                <p className="text-lg font-semibold text-gray-900">
                  {member.assignedIssuesCount || 0}
                </p>
              </div>
              <div className="bg-green-100/80 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-lg font-semibold text-green-700">
                  {member.resolvedIssues || 0}
                </p>
              </div>
              <div className="bg-yellow-100/80 rounded-lg p-4 border border-yellow-200">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-lg font-semibold text-yellow-700">
                  {member.pendingIssues || 0}
                </p>
              </div>
              <div className="bg-blue-100/80 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="text-lg font-semibold text-blue-700">
                  {new Date(member.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-primary/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200 hover:shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Update Member
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMemberModal;
