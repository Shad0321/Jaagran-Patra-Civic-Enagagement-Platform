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
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedFilters(filters);
      setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
    }, 1000);

    // Cleanup function
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
        maximumAge: 300000, // 5 minutes
      }
    );
  }, []);

  // Fetch nearby issues
  const fetchNearbyIssues = useCallback(async () => {
    // Don't make API call if location is not available
    if (
      !location ||
      !location.latitude ||
      !location.longitude ||
      typeof location.latitude !== 'number' ||
      typeof location.longitude !== 'number' ||
      isNaN(location.latitude) ||
      isNaN(location.longitude)
    ) {
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

      const fullUrl =
        import.meta.env.VITE_API_URL + `/issues/nearby?${queryParams}`;

      const response = await fetch(fullUrl);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch nearby issues');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setIssues(result.data.issues || []);
        setPagination((prev) => ({
          ...prev,
          total: result.data.pagination?.total || 0,
          totalPages: result.data.pagination?.pages || 0,
        }));
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching nearby issues:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [location, debouncedFilters, pagination.page, pagination.limit]);

  // Get location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  // Fetch issues when location or debounced filters change
  useEffect(() => {
    if (
      location &&
      location.latitude &&
      location.longitude &&
      typeof location.latitude === 'number' &&
      typeof location.longitude === 'number' &&
      !isNaN(location.latitude) &&
      !isNaN(location.longitude)
    ) {
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
      // Fetch comments if not already loaded
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
      // Use the nearby issue details endpoint for better access control
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

      // Use different endpoints based on user role
      if (user.role === 'CITIZEN' || user.role === 'MEMBER') {
        // For citizens and members, use the nearby comment endpoint
        response = await api.post(`/issues/citizen/${issueId}/nearby-comment`, {
          message: commentText,
        });
      } else {
        // For MLAs and other roles (ADMIN), use the regular comment endpoint
        response = await api.post(`/issues/${issueId}/progress`, {
          message: commentText,
          updateType: 'MEMBER_UPDATE',
        });
      }

      if (response.data.success) {
        // Add the new comment to the local state
        setIssueComments((prev) => ({
          ...prev,
          [issueId]: [response.data.update, ...(prev[issueId] || [])],
        }));

        // Clear the comment input
        setNewComments((prev) => ({
          ...prev,
          [issueId]: '',
        }));

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
      PENDING: { color: 'text-yellow-600 bg-yellow-100', icon: Clock },
      IN_PROGRESS: { color: 'text-primary bg-primary/10', icon: AlertCircle },
      RESOLVED: { color: 'text-green-600 bg-green-100', icon: CheckCircle },
      REJECTED: { color: 'text-red-600 bg-red-100', icon: XCircle },
    };
    return statusConfig[status] || statusConfig.PENDING;
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const priorityColors = {
      LOW: 'text-gray-600',
      MEDIUM: 'text-yellow-600',
      HIGH: 'text-orange-600',
      URGENT: 'text-red-600',
    };
    return priorityColors[priority] || priorityColors.MEDIUM;
  };

  if (locationError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Location Access Required
          </h3>
          <p className="mt-1 text-sm text-gray-500">{locationError}</p>
          <div className="mt-6">
            <button
              onClick={getCurrentLocation}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/70 cursor-pointer transition-all"
            >
              <MapPin className="mr-2 h-4 w-4" />
              Enable Location Access
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Getting your location...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center flex-wrap gap-2">
          <MapPin className="mr-2 sm:mr-3 h-7 w-7 sm:h-8 sm:w-8 text-primary" />
          Nearby Issues
        </h1>
        <p className="mt-2 text-gray-600 text-sm sm:text-base">
          Issues within {filters.radius}km of your current location
          {debouncedFilters.radius !== filters.radius && (
            <span className="text-xs sm:text-sm text-primary ml-2">
              (searching for {debouncedFilters.radius}km...)
            </span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6 border border-gray-100">
        {/* Show debouncing indicator */}
        {JSON.stringify(filters) !== JSON.stringify(debouncedFilters) && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
              <span className="text-xs sm:text-sm text-primary/80">
                Updating search results in{' '}
                <span className="font-medium">1 second</span>...
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Search */}
          <div className="sm:col-span-2">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Search Issues
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search by title or description..."
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Radius */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
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
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
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
      {!location && !locationError ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Getting your location...</p>
        </div>
      ) : loading ? (
          <Loader/>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Error loading issues
          </h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={() => {
              if (location && location.latitude && location.longitude) {
                fetchNearbyIssues();
              } else {
                getCurrentLocation();
              }
            }}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/80"
          >
            {location && location.latitude && location.longitude
              ? 'Try Again'
              : 'Get Location'}
          </button>
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No issues found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            No issues found within {filters.radius}km of your location with the
            current filters.
          </p>
        </div>
      ) : (
        <>
          {/* Issues List */}
          <div className="bg-white shadow rounded-lg overflow-hidden border border-primary/20">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-primary/20">
              <h3 className="text-base sm:text-lg font-medium text-primary">
                {pagination.total} issue{pagination.total !== 1 ? 's' : ''}{' '}
                found
              </h3>
            </div>
            <div className="divide-y divide-primary/10">
              {issues.map((issue) => {
                const statusDisplay = getStatusDisplay(issue.status);
                const StatusIcon = statusDisplay.icon;

                return (
                  <div key={issue.id} className="p-4 sm:p-6 hover:bg-primary/5">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-0">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center space-x-2 sm:space-x-3 mb-2 gap-y-1">
                          <h4 className="text-base sm:text-lg font-medium text-primary">
                            {issue.title}
                          </h4>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusDisplay.color}`}
                          >
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {issue.status.replace('_', ' ')}
                          </span>
                          <span
                            className={`text-xs sm:text-sm font-medium ${getPriorityColor(issue.priority)}`}
                          >
                            {issue.priority}
                          </span>
                        </div>

                        <p className="text-gray-600 mb-2 sm:mb-3 line-clamp-2 text-xs sm:text-base">
                          {issue.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-500">
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
                          {issueComments[issue.id] &&
                            issueComments[issue.id].length > 0 && (
                              <span className="flex items-center">
                                <MessageSquare className="mr-1 h-4 w-4" />
                                {issueComments[issue.id].length} comment
                                {issueComments[issue.id].length !== 1
                                  ? 's'
                                  : ''}
                              </span>
                            )}
                        </div>

                        {issue.reportedBy && (
                          <div className="mt-2 text-xs sm:text-sm text-gray-500">
                            Reported by: {issue.reportedBy.name}
                          </div>
                        )}

                        {issue.assignedTo && (
                          <div className="mt-1 text-xs sm:text-sm text-gray-500">
                            Assigned to: {issue.assignedTo.name}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Comments Section */}
                    <div className="mt-4">
                      <button
                        onClick={() => toggleIssueComments(issue.id)}
                        className="flex items-center text-sm font-medium text-primary hover:text-primary-dark"
                        disabled={loadingComments.has(issue.id)}
                      >
                        <MessageSquare className="mr-1 h-4 w-4" />
                        {loadingComments.has(issue.id) ? (
                          <>
                            <span>Loading...</span>
                          </>
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

                      {expandedIssues.has(issue.id) && (
                        <div className="mt-3 bg-gray-50 rounded-lg p-4">
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
                                    className="bg-white rounded-lg p-3 border border-gray-200"
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
                                                ? 'text-primary'
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
                                              className={`ml-2 text-xs px-2 py-1 rounded-full font-normal ${
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
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
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
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/80 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {commentingIssues.has(issue.id) ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                      Posting...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="mr-2 h-4 w-4" />
                                      <span className='hidden sm:inline'>
                                        Post Comment
                                      </span>
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
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
                of {pagination.total} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NearbyIssues;
