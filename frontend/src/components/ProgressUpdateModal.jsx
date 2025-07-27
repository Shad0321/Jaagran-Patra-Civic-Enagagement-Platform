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
  ChevronDown,
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center  z-50 p-4 pb-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-primary/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Update Issue Progress
              </h2>
              <p className="text-sm text-primary/80">
                Track and update the progress of this issue
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

        {/* Issue Summary */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6 mx-6 mt-6">
          <h3 className="font-bold text-gray-900 mb-2">{issue.title}</h3>
          <p className="text-sm text-gray-600 mb-3">{issue.description}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="px-2 py-1 bg-gray-100 rounded-full">
              Category: {issue.category}
            </span>
            <span className="px-2 py-1 bg-gray-100 rounded-full">
              Priority: {issue.priority}
            </span>
            <span className="px-2 py-1 bg-gray-100 rounded-full">
              Reported: {new Date(issue.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Status and Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status *
              </label>
              <div className="relative">
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80 appearance-none"
                  required
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary/70" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                  placeholder="0-100"
                />
                <TrendingUp className="absolute right-3 top-3 h-4 w-4 text-primary/70" />
              </div>
            </div>
          </div>

          {/* Progress Update */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
              className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
              placeholder="Describe the progress made on this issue..."
              required
            />
          </div>

          {/* Hours Worked and Estimated Completion */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                  placeholder="0.0"
                />
                <ClockIcon className="absolute right-3 top-3 h-4 w-4 text-primary/70" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                />
                <Calendar className="absolute right-3 top-3 h-4 w-4 text-primary/70" />
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Next Steps
            </label>
            <textarea
              value={formData.nextSteps}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, nextSteps: e.target.value }))
              }
              rows={3}
              className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
              placeholder="Describe the next steps for this issue..."
            />
          </div>

          {/* File Attachments */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Attachments
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center px-4 py-2.5 border border-primary/20 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors">
                <Upload className="h-4 w-4 mr-2 text-primary/80" />
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
              <div className="mt-4 space-y-2">
                {formData.attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50/80 rounded-lg border border-primary/10"
                  >
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-primary/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200 hover:shadow-sm"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.progressUpdate.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Update Progress
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProgressUpdateModal;
