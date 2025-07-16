import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  AlertCircle,
  CheckCircle,
  Upload,
  Calendar,
  TrendingUp,
  Clock as ClockIcon,
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const ProgressUpdateModal = ({ isOpen, onClose, issue, onUpdate }) => {
  const [formData, setFormData] = useState({
    status: 'PENDING',
    progressUpdate: '',
    estimatedCompletion: '',
    progressPercentage: '',
    hoursWorked: '',
    nextSteps: '',
    attachments: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when issue changes
  useEffect(() => {
    if (issue) {
      setFormData({
        status: issue.status === 'PENDING' ? 'IN_PROGRESS' : issue.status,
        progressUpdate: '',
        estimatedCompletion: issue.expectedResolutionDate
          ? new Date(issue.expectedResolutionDate).toISOString().split('T')[0]
          : '',
        progressPercentage: '',
        hoursWorked: '',
        nextSteps: '',
        attachments: [],
      });
    }
  }, [issue]);

  const statusOptions = [
    {
      value: 'PENDING',
      label: 'Pending',
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800',
    },
    {
      value: 'IN_PROGRESS',
      label: 'In Progress',
      icon: AlertCircle,
      color: 'bg-blue-100 text-blue-800',
    },
    {
      value: 'RESOLVED',
      label: 'Resolved',
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800',
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.progressUpdate.trim()) {
      toast.error('Progress update is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = {
        ...formData,
        progressPercentage: formData.progressPercentage
          ? parseInt(formData.progressPercentage)
          : undefined,
        hoursWorked: formData.hoursWorked
          ? parseFloat(formData.hoursWorked)
          : undefined,
      };

      await api.put(`/issues/${issue.id}/update-progress`, updateData);

      toast.success('Issue progress updated successfully');
      onUpdate && onUpdate();
      onClose();

      // Reset form
      setFormData({
        status: 'IN_PROGRESS',
        progressUpdate: '',
        estimatedCompletion: '',
        progressPercentage: '',
        hoursWorked: '',
        nextSteps: '',
        attachments: [],
      });
    } catch (error) {
      console.error('Error updating issue progress:', error);
      toast.error(
        error.response?.data?.error || 'Failed to update issue progress'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
  };

  const removeAttachment = (index) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  if (!isOpen || !issue) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Update Issue Progress
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Issue Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">{issue.title}</h3>
          <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>Category: {issue.category}</span>
            <span>Priority: {issue.priority}</span>
            <span>
              Reported: {new Date(issue.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status and Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Progress Percentage
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progressPercentage}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      progressPercentage: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0-100"
                />
                <TrendingUp className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Progress Update */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Progress Update *
            </label>
            <textarea
              value={formData.progressUpdate}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  progressUpdate: e.target.value,
                }))
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the progress made on this issue..."
              required
            />
          </div>

          {/* Hours Worked and Estimated Completion */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hours Worked
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.hoursWorked}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      hoursWorked: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0"
                />
                <ClockIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Completion
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.estimatedCompletion}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      estimatedCompletion: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Next Steps
            </label>
            <textarea
              value={formData.nextSteps}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, nextSteps: e.target.value }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the next steps for this issue..."
            />
          </div>

          {/* File Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <Upload className="h-4 w-4 mr-2" />
                <span className="text-sm">Upload Files</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                />
              </label>
              <span className="text-sm text-gray-500">
                {formData.attachments.length} file(s) selected
              </span>
            </div>

            {formData.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                  >
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.progressUpdate.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update Progress'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProgressUpdateModal;
