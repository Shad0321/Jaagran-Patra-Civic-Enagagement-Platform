import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapPin,
  Filter,
  Search,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const NearbyIssues = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');

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
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
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
    if (!location) return;

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
        `http://localhost:3001/issues/nearby?${queryParams}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch nearby issues');
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
    if (location) {
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

  // Get status color and icon
  const getStatusDisplay = (status) => {
    const statusConfig = {
      PENDING: { color: 'text-yellow-600 bg-yellow-100', icon: Clock },
      IN_PROGRESS: { color: 'text-blue-600 bg-blue-100', icon: AlertCircle },
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
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Getting your location...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <MapPin className="mr-3 h-8 w-8 text-blue-600" />
          Nearby Issues
        </h1>
        <p className="mt-2 text-gray-600">
          Issues within {filters.radius}km of your current location
          {debouncedFilters.radius !== filters.radius && (
            <span className="text-sm text-gray-400 ml-2">
              (searching for {debouncedFilters.radius}km...)
            </span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        {/* Show debouncing indicator */}
        {JSON.stringify(filters) !== JSON.stringify(debouncedFilters) && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-sm text-blue-700">
                Updating search results in{' '}
                <span className="font-medium">1 second</span>...
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
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
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
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
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading nearby issues...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Error loading issues
          </h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={fetchNearbyIssues}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Try Again
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
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {pagination.total} issue{pagination.total !== 1 ? 's' : ''}{' '}
                found
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {issues.map((issue) => {
                const statusDisplay = getStatusDisplay(issue.status);
                const StatusIcon = statusDisplay.icon;

                return (
                  <div key={issue.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
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
                            className={`text-sm font-medium ${getPriorityColor(issue.priority)}`}
                          >
                            {issue.priority}
                          </span>
                        </div>

                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {issue.description}
                        </p>

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
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
                          <div className="mt-2 text-sm text-gray-500">
                            Reported by: {issue.reportedBy.name}
                          </div>
                        )}

                        {issue.assignedTo && (
                          <div className="mt-1 text-sm text-gray-500">
                            Assigned to: {issue.assignedTo.name}
                          </div>
                        )}
                      </div>
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
