import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Plus,
  AlertCircle,
  Clock,
  CheckCircle,
  MapPin,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import LatestNews from '../components/LatestNews';

const CitizenDashboard = () => {
  const { user } = useSelector((state) => state.user);
  const [stats, setStats] = useState({
    totalIssues: 0,
    pendingIssues: 0,
    inProgressIssues: 0,
    resolvedIssues: 0,
  });
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentModal, setCommentModal] = useState({
    isOpen: false,
    issueId: null,
  });
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCommentSubmit = async (issueId) => {
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      // Find the issue to determine if it's the user's own issue or nearby
      const issue = recentIssues.find((issue) => issue.id === issueId);
      const isOwnIssue = issue?.reportedBy.id === user?.id;

      const endpoint = isOwnIssue
        ? `/issues/citizen/${issueId}/comment`
        : `/issues/citizen/${issueId}/nearby-comment`;

      await api.post(endpoint, {
        message: commentText,
      });

      toast.success('Comment added successfully');
      setCommentText('');
      setCommentModal({ isOpen: false, issueId: null });

      // Refresh recent issues
      fetchDashboardData();
    } catch (error) {
      console.error('Error adding comment:', error);
      if (error.response?.status === 403) {
        toast.error('You can only comment on issues from your area');
      } else {
        toast.error('Failed to add comment');
      }
    }
  };

  const openCommentModal = (issueId) => {
    setCommentModal({ isOpen: true, issueId });
    setCommentText('');
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user's issues
      const issuesResponse = await api.get(
        '/issues/citizen/my-issues?page=1&limit=10'
      );
      const userIssues = issuesResponse.data.data.issues || [];

      // Calculate stats from user's issues
      const stats = {
        totalIssues: userIssues.length,
        pendingIssues: userIssues.filter((issue) => issue.status === 'PENDING')
          .length,
        inProgressIssues: userIssues.filter(
          (issue) => issue.status === 'IN_PROGRESS'
        ).length,
        resolvedIssues: userIssues.filter(
          (issue) => issue.status === 'RESOLVED'
        ).length,
      };

      setStats(stats);

      // Try to fetch nearby issues to show community issues
      try {
        // Use default location if user location not available
        const defaultLocation = {
          latitude: Number(user?.currentLatitude) || 28.6139,
          longitude: Number(user?.currentLongitude) || 77.209,
        };

        const nearbyResponse = await api.get('/issues/nearby', {
          params: {
            latitude: defaultLocation.latitude,
            longitude: defaultLocation.longitude,
            radius: 10, // 10km radius
            limit: 10,
          },
        });

        if (nearbyResponse.data.success) {
          const nearbyIssues = nearbyResponse.data.data.issues || [];

          // Combine user's issues with nearby issues, remove duplicates
          const allIssues = [...userIssues];

          // Add nearby issues that are not already in user's issues
          nearbyIssues.forEach((nearbyIssue) => {
            if (
              !allIssues.find((userIssue) => userIssue.id === nearbyIssue.id)
            ) {
              allIssues.push(nearbyIssue);
            }
          });

          // Sort by creation date (newest first) and take first 10
          allIssues.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          setRecentIssues(allIssues.slice(0, 10));
        } else {
          // If nearby issues fail, just use user's issues
          setRecentIssues(userIssues.slice(0, 10));
        }
      } catch (nearbyError) {
        console.error('Error fetching nearby issues:', nearbyError);
        // If nearby issues fail, just use user's issues
        setRecentIssues(userIssues.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error details:', error.response?.data);

      // Show more specific error message
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Please check your permissions.');
      } else {
        toast.error('Failed to load dashboard data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'IN_PROGRESS':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'RESOLVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">
          Here's an overview of your reported issues and community updates.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Issues</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalIssues}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pendingIssues}
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.inProgressIssues}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.resolvedIssues}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Issues */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Issues & Community Updates
            </h2>
            <a
              href="/issues"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All
            </a>
          </div>

          {recentIssues.length > 0 ? (
            <div className="space-y-4">
              {recentIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {issue.title}
                      </h3>
                      {issue.reportedBy.id !== user?.id && (
                        <p className="text-xs text-gray-500 mt-1">
                          Reported by: {issue.reportedBy.name}
                          {issue.distance && (
                            <span className="text-blue-600 ml-2">
                              ({issue.distance} km away)
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {getStatusIcon(issue.status)}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(issue.status)}`}
                      >
                        {issue.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {issue.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {issue.address || 'Location not specified'}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full ${getPriorityColor(issue.priority)}`}
                    >
                      {issue.priority}
                    </span>
                  </div>

                  {issue.assignedTo && (
                    <div className="mt-2 text-xs text-gray-600">
                      Assigned to: {issue.assignedTo.name} (
                      {issue.assignedTo.role})
                    </div>
                  )}

                  {/* Comment Button */}
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => openCommentModal(issue.id)}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <MessageSquare className="h-3 w-3" />
                      <span>Add Comment</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No issues reported yet</p>
              <p className="text-sm">
                Start by reporting your first issue to your local
                representatives
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          {/* Latest News Widget */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <LatestNews
              userState={user?.state?.name || 'all'}
              limit={4}
              showFull={false}
            />
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <a
                href="/issues"
                className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Plus className="h-5 w-5 text-blue-600 mr-3" />
                <span className="font-medium text-blue-900">
                  Report New Issue
                </span>
              </a>
              <a
                href="/issues"
                className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <MessageSquare className="h-5 w-5 text-gray-600 mr-3" />
                <span className="font-medium text-gray-900">
                  View My Issues
                </span>
              </a>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              💡 Tips for Better Results
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Provide clear photos and descriptions</li>
              <li>• Include exact location details</li>
              <li>• Set appropriate priority levels</li>
              <li>• Follow up on your issues regularly</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      {commentModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add Comment
            </h3>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write your comment here..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() =>
                  setCommentModal({ isOpen: false, issueId: null })
                }
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCommentSubmit(commentModal.issueId)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenDashboard;
