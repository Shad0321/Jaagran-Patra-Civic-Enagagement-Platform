import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapPin,
  Filter,
  Search,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  User,
  RefreshCw,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSelector } from 'react-redux';
import api from '../utils/api';
import { toast } from 'react-toastify';
import Loader from '../components/common/Loader';

const NearbyIssues = () => {
  const { user } = useSelector((state) => state.user);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');

  // Comment-related state
  const [expandedIssues, setExpandedIssues] = useState(new Set());
  const [issueComments, setIssueComments] = useState({});
  const [newComments, setNewComments] = useState({});
  const [commentingIssues, setCommentingIssues] = useState(new Set());
  const [loadingComments, setLoadingComments] = useState(new Set());

  // Filters for UI (immediate updates)
  const [filters, setFilters] = useState({
    radius: 5,
    status: '',
    priority: '',
    category: '',
    search: '',
  });

  // Debounced filters for API calls
  const [debouncedFilters, setDebouncedFilters] = useState({
    radius: 5,
    status: '',
    priority: '',
    category: '',
    search: '',
  });

  // Debounce timer ref
  const debounceTimerRef = useRef(null);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Debounce effect for filters
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedFilters(filters);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 1000);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filters]);

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(newLocation);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied by user');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out');
            break;
          default:
            setLocationError('An unknown error occurred');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, []);

  // Fetch nearby issues
  const fetchNearbyIssues = useCallback(async () => {
    if (!location || !location.latitude || !location.longitude) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams({
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
        radius: debouncedFilters.radius.toString(),
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(debouncedFilters.status && { status: debouncedFilters.status }),
        ...(debouncedFilters.priority && {
          priority: debouncedFilters.priority,
        }),
        ...(debouncedFilters.category && {
          category: debouncedFilters.category,
        }),
        ...(debouncedFilters.search && { search: debouncedFilters.search }),
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/issues/nearby?${queryParams}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch nearby issues');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setIssues(result.data.issues || []);
        setPagination({
          ...pagination,
          total: result.data.pagination?.total || 0,
          totalPages: result.data.pagination?.pages || 0,
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching nearby issues:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [location, debouncedFilters, pagination.page, pagination.limit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  // Fetch issues when location or debounced filters change
  useEffect(() => {
    if (location?.latitude && location?.longitude) {
      fetchNearbyIssues();
    }
  }, [fetchNearbyIssues, location]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  // Comment-related functions
  const toggleIssueComments = async (issueId) => {
    const newExpanded = new Set(expandedIssues);

    if (expandedIssues.has(issueId)) {
      newExpanded.delete(issueId);
    } else {
      newExpanded.add(issueId);
      if (!issueComments[issueId]) {
        await fetchIssueComments(issueId);
      }
    }

    setExpandedIssues(newExpanded);
  };

  const fetchIssueComments = async (issueId) => {
    const newLoading = new Set(loadingComments);
    newLoading.add(issueId);
    setLoadingComments(newLoading);

    try {
      const response = await api.get(`/issues/nearby/${issueId}/details`);
      if (response.data.success) {
        setIssueComments((prev) => ({
          ...prev,
          [issueId]: response.data.issue.updates || [],
        }));
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      const newLoading = new Set(loadingComments);
      newLoading.delete(issueId);
      setLoadingComments(newLoading);
    }
  };

  const handleCommentSubmit = async (issueId) => {
    const commentText = newComments[issueId]?.trim();
    if (!commentText) return;

    const newCommenting = new Set(commentingIssues);
    newCommenting.add(issueId);
    setCommentingIssues(newCommenting);

    try {
      let response;
      if (user.role === 'CITIZEN' || user.role === 'MEMBER') {
        response = await api.post(`/issues/citizen/${issueId}/nearby-comment`, {
          message: commentText,
        });
      } else {
        response = await api.post(`/issues/${issueId}/progress`, {
          message: commentText,
          updateType: 'MEMBER_UPDATE',
        });
      }

      if (response.data.success) {
        setIssueComments((prev) => ({
          ...prev,
          [issueId]: [response.data.update, ...(prev[issueId] || [])],
        }));
        setNewComments((prev) => ({ ...prev, [issueId]: '' }));
        toast.success('Comment added successfully');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error(error.response?.data?.error || 'Failed to add comment');
    } finally {
      const newCommenting = new Set(commentingIssues);
      newCommenting.delete(issueId);
      setCommentingIssues(newCommenting);
    }
  };

  const handleCommentChange = (issueId, value) => {
    setNewComments((prev) => ({
      ...prev,
      [issueId]: value,
    }));
  };

  // Get status color and icon
  const getStatusDisplay = (status) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      IN_PROGRESS: { color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
      RESOLVED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };
    return statusConfig[status] || statusConfig.PENDING;
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const priorityColors = {
      LOW: 'bg-blue-100 text-blue-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800',
    };
    return priorityColors[priority] || priorityColors.MEDIUM;
  };

  if (locationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-slate-50 to-primary/10 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-8 text-center max-w-md">
          <MapPin className="mx-auto h-12 w-12 text-primary" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            Location Access Required
          </h3>
          <p className="mt-1 text-gray-600">{locationError}</p>
          <button
            onClick={getCurrentLocation}
            className="mt-6 bg-gradient-to-r from-primary to-primary/80 text-white px-6 py-2 rounded-lg hover:shadow-md transition-all duration-200 inline-flex items-center gap-2"
          >
            <MapPin className="h-5 w-5" />
            Enable Location Access
          </button>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-slate-50 to-primary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Getting your location...</p>
        </div>
      </div>
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
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-primary/10 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent flex items-center gap-3">
                <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                Nearby Issues
              </h1>
              <p className="mt-2 text-gray-600">
                Issues within {filters.radius}km of your current location
                {debouncedFilters.radius !== filters.radius && (
                  <span className="text-primary ml-2 text-sm">
                    (searching for {debouncedFilters.radius}km...)
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={fetchNearbyIssues}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-6 mb-8">
          {JSON.stringify(filters) !== JSON.stringify(debouncedFilters) && (
            <div className="mb-4 p-3 bg-blue-50/50 border border-blue-200 rounded-md">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                <span className="text-sm text-primary/80">
                  Updating search results in{' '}
                  <span className="font-medium">1 second</span>...
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Issues
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search by title or description..."
                  className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary/50 focus:border-primary/30"
                />
              </div>
            </div>

            {/* Radius */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Radius (km)
              </label>
              <input
                type="number"
                min="0.1"
                max="50"
                step="0.1"
                value={filters.radius}
                onChange={(e) =>
                  handleFilterChange('radius', parseFloat(e.target.value) || 5)
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary/50 focus:border-primary/30"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary/50 focus:border-primary/30"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary/50 focus:border-primary/30"
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-8 text-center">
            <Loader />
            <p className="mt-4 text-gray-600">Loading nearby issues...</p>
          </div>
        ) : error ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              Error loading issues
            </h3>
            <p className="mt-1 text-gray-600">{error}</p>
            <button
              onClick={() =>
                location ? fetchNearbyIssues() : getCurrentLocation()
              }
              className="mt-6 bg-gradient-to-r from-primary to-primary/80 text-white px-6 py-2 rounded-lg hover:shadow-md transition-all duration-200 inline-flex items-center gap-2"
            >
              {location ? 'Try Again' : 'Get Location'}
            </button>
          </div>
        ) : issues.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-8 text-center">
            <MapPin className="mx-auto h-12 w-12 text-primary" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No issues found
            </h3>
            <p className="mt-1 text-gray-600">
              No issues found within {filters.radius}km of your location with
              the current filters.
            </p>
          </div>
        ) : (
          <>
            {/* Issues List */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-primary/20">
                <h3 className="text-lg font-medium text-primary">
                  {pagination.total} issue{pagination.total !== 1 ? 's' : ''}{' '}
                  found
                </h3>
              </div>
              <div className="divide-y divide-primary/10">
                {issues.map((issue) => {
                  const statusDisplay = getStatusDisplay(issue.status);
                  const StatusIcon = statusDisplay.icon;

                  return (
                    <div
                      key={issue.id}
                      className="p-6 hover:bg-primary/5 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <h4 className="text-lg font-medium text-gray-900">
                              {issue.title}
                            </h4>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.color}`}
                            >
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {issue.status.replace('_', ' ')}
                            </span>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)}`}
                            >
                              {issue.priority}
                            </span>
                          </div>

                          <p className="text-gray-600 mb-4 line-clamp-2">
                            {issue.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                            <span className="flex items-center">
                              <MapPin className="mr-1 h-4 w-4" />
                              {issue.distance}km away
                            </span>
                            {issue.address && (
                              <span className="truncate max-w-xs">
                                📍 {issue.address}
                              </span>
                            )}
                            <span>Category: {issue.category}</span>
                            <span>
                              {formatDistanceToNow(new Date(issue.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>

                          {issue.reportedBy && (
                            <div className="mt-3 text-sm text-gray-500">
                              Reported by: {issue.reportedBy.name}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => toggleIssueComments(issue.id)}
                          className="flex items-center text-sm font-medium text-primary hover:text-primary/80"
                          disabled={loadingComments.has(issue.id)}
                        >
                          <MessageSquare className="mr-1 h-4 w-4" />
                          {loadingComments.has(issue.id) ? (
                            'Loading...'
                          ) : expandedIssues.has(issue.id) ? (
                            <>
                              <ChevronUp className="mr-1 h-4 w-4" />
                              Hide Comments
                            </>
                          ) : (
                            <>
                              <ChevronDown className="mr-1 h-4 w-4" />
                              View Comments
                              {issueComments[issue.id] && (
                                <span className="ml-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                  {issueComments[issue.id].length}
                                </span>
                              )}
                            </>
                          )}
                        </button>
                      </div>

                      {/* Comments Section */}
                      {expandedIssues.has(issue.id) && (
                        <div className="mt-6 bg-gray-50/50 rounded-lg p-4 border border-gray-200/30">
                          {/* Comments List */}
                          <div className="max-h-60 overflow-y-auto">
                            {loadingComments.has(issue.id) ? (
                              <div className="flex justify-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                              </div>
                            ) : issueComments[issue.id]?.length > 0 ? (
                              <div className="space-y-3">
                                {issueComments[issue.id].map((comment) => (
                                  <div
                                    key={comment.id}
                                    className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50"
                                  >
                                    <div className="flex items-start">
                                      <div className="flex-shrink-0 mr-3">
                                        <div
                                          className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                            comment.user.role === 'CITIZEN'
                                              ? 'bg-blue-100'
                                              : comment.user.role === 'MLA'
                                                ? 'bg-purple-100'
                                                : comment.user.role === 'MEMBER'
                                                  ? 'bg-green-100'
                                                  : 'bg-gray-100'
                                          }`}
                                        >
                                          <User
                                            className={`h-5 w-5 ${
                                              comment.user.role === 'CITIZEN'
                                                ? 'text-blue-600'
                                                : comment.user.role === 'MLA'
                                                  ? 'text-purple-600'
                                                  : comment.user.role ===
                                                      'MEMBER'
                                                    ? 'text-green-600'
                                                    : 'text-gray-600'
                                            }`}
                                          />
                                        </div>
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                          <div className="text-sm font-medium text-gray-900">
                                            {comment.user.name}
                                            <span
                                              className={`ml-2 text-xs px-2 py-1 rounded-full ${
                                                comment.user.role === 'CITIZEN'
                                                  ? 'bg-blue-100 text-blue-800'
                                                  : comment.user.role === 'MLA'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : comment.user.role ===
                                                        'MEMBER'
                                                      ? 'bg-green-100 text-green-800'
                                                      : 'bg-gray-100 text-gray-800'
                                              }`}
                                            >
                                              {comment.user.role}
                                            </span>
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {formatDistanceToNow(
                                              new Date(comment.createdAt),
                                              {
                                                addSuffix: true,
                                              }
                                            )}
                                          </div>
                                        </div>
                                        <div className="mt-1 text-sm text-gray-700">
                                          {comment.message}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-gray-500">
                                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm">No comments yet</p>
                                <p className="text-xs">
                                  Be the first to comment on this issue
                                </p>
                              </div>
                            )}
                          </div>

                          {/* New Comment Input */}
                          {user && (
                            <div className="mt-4 border-t border-gray-200 pt-4">
                              <textarea
                                value={newComments[issue.id] || ''}
                                onChange={(e) =>
                                  handleCommentChange(issue.id, e.target.value)
                                }
                                placeholder="Share your thoughts about this issue..."
                                rows="3"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary/50 focus:border-primary/30 resize-none"
                              ></textarea>
                              <div className="flex justify-between items-center mt-3">
                                <div className="text-xs text-gray-500">
                                  Comments are visible to the public
                                </div>
                                <button
                                  onClick={() => handleCommentSubmit(issue.id)}
                                  disabled={
                                    !newComments[issue.id]?.trim() ||
                                    commentingIssues.has(issue.id)
                                  }
                                  className="bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {commentingIssues.has(issue.id) ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                      Posting...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="mr-2 h-4 w-4" />
                                      Post Comment
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}

                          {!user && (
                            <div className="mt-4 text-center text-sm text-gray-500 border-t border-gray-200 pt-4">
                              <p>Please sign in to comment on issues</p>
                              <p className="mt-1 text-xs">
                                <span className="text-primary cursor-pointer hover:underline">
                                  Sign in
                                </span>{' '}
                                to join the conversation
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-700">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{' '}
                  of {pagination.total} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white/80 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-700">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white/80 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NearbyIssues;
