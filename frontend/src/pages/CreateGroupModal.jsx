import React, { useState } from 'react';
import { X, Users, Lock, Globe, Loader2 } from 'lucide-react';
import api from '../utils/api';

const GROUP_TYPES = [
  {
    value: 'PUBLIC_MLA_GROUP',
    label: 'Public MLA Group',
    description: 'Anyone can join this group',
    icon: <Globe className="h-4 w-4 text-blue-500" />,
  },
  {
    value: 'PRIVATE_MLA_GROUP',
    label: 'Private MLA Group',
    description: 'Only MLAs and approved members can join',
    icon: <Lock className="h-4 w-4 text-purple-500" />,
  },
];

const CreateGroupModal = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState(GROUP_TYPES[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/chat/groups', { name, description, type });
      setSuccess('Group created successfully!');
      setName('');
      setDescription('');
      setType(GROUP_TYPES[0].value);
      if (onCreated) onCreated(res.data.data);
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1500);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Failed to create group. Only MLAs can create groups.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center  z-50 p-4 pb-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-md relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-800">
              Create New Group
            </h2>
          </div>
          <button
            className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onClose}
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
          {/* Group Name */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Group Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              placeholder="Enter group name"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Description (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              placeholder="What's this group about?"
            />
          </div>

          {/* Group Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Group Type
            </label>
            <div className="space-y-2">
              {GROUP_TYPES.map((group) => (
                <div
                  key={group.value}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    type === group.value
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setType(group.value)}
                >
                  <div className="mt-0.5">{group.icon}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">
                      {group.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {group.description}
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      type === group.value
                        ? 'border-primary bg-primary'
                        : 'border-gray-300'
                    }`}
                  >
                    {type === group.value && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <X className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg flex items-center gap-2">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
              disabled={loading || !name.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Group'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
