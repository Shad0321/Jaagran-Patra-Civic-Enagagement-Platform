import React, { useState, useEffect } from 'react';
import { X, Users, Building, Check, Edit } from 'lucide-react';
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

      // Update user basic info
      await api.put(`/auth/profile`, {
        name: formData.name,
        phone: formData.phone,
        isActive: formData.isActive,
      });

      // Update member profile
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Edit className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Member
              </h2>
              <p className="text-sm text-gray-600">
                Update member information and permissions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={member.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Role & Body Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Role & Body Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Body Type *
                </label>
                <select
                  name="bodyType"
                  value={formData.bodyType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select body type</option>
                  {bodyTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Body/Organization
                </label>
                <select
                  name="bodyId"
                  value={formData.bodyId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loadingBodies}
                >
                  <option value="">Select body (optional)</option>
                  {availableBodies.map((body) => (
                    <option key={body.id} value={body.id}>
                      {body.name} ({body.type.replace(/_/g, ' ')})
                    </option>
                  ))}
                </select>
                {loadingBodies && (
                  <p className="text-xs text-gray-500 mt-1">
                    Loading bodies...
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Designation
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Secretary, President, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of role and responsibilities"
                />
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Permissions
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="canReceiveIssues"
                  checked={formData.canReceiveIssues}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Can receive and be assigned issues
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="canUpdateIssues"
                  checked={formData.canUpdateIssues}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Can update issue status and add progress notes
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="canCreateSessions"
                  checked={formData.canCreateSessions}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Can create and manage sessions
                </label>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Total Issues</p>
                <p className="text-lg font-semibold text-gray-900">
                  {member.assignedIssuesCount || 0}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-lg font-semibold text-green-600">
                  {member.resolvedIssues || 0}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-lg font-semibold text-yellow-600">
                  {member.pendingIssues || 0}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(member.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader/>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Update Member</span>
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
