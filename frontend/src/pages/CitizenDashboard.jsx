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
import Loader from '../components/common/Loader';

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
    return <Loader className="w-full h-96 flex justify-center items-center" />;
  }

  return (
    <div className="p-2 pt-20 sm:p-4 md:px-20 w-full mx-auto min-h-screen bg-gradient-to-br from-primary/10 via-white to-primary/5">
      {/* Welcome Section */}
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-bold text-black mb-2 drop-shadow-sm">
          Welcome back, <span className="text-primary">{user?.name}!</span>
        </h1>
        <p className="text-gray-600 text-base md:text-lg">
          Here's an overview of your reported issues and community updates.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-primary/20 p-6 flex flex-col items-center hover:shadow-xl transition-all">
          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <AlertCircle className="h-7 w-7 text-primary" />
          </div>
          <p className="text-sm font-medium text-gray-600">Total Issues</p>
          <p className="text-2xl font-extrabold text-primary">
            {stats.totalIssues}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-primary/20 p-6 flex flex-col items-center hover:shadow-xl transition-all">
          <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
            <Clock className="h-7 w-7 text-yellow-600" />
          </div>
          <p className="text-sm font-medium text-gray-600">Pending</p>
          <p className="text-2xl font-extrabold text-yellow-600">
            {stats.pendingIssues}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-primary/20 p-6 flex flex-col items-center hover:shadow-xl transition-all">
          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
            <AlertCircle className="h-7 w-7 text-blue-600" />
          </div>
          <p className="text-sm font-medium text-gray-600">In Progress</p>
          <p className="text-2xl font-extrabold text-blue-600">
            {stats.inProgressIssues}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-primary/20 p-6 flex flex-col items-center hover:shadow-xl transition-all">
          <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
            <CheckCircle className="h-7 w-7 text-green-600" />
          </div>
          <p className="text-sm font-medium text-gray-600">Resolved</p>
          <p className="text-2xl font-extrabold text-green-600">
            {stats.resolvedIssues}
          </p>
        </div>
      </div>

      {/* Recent Issues */}
      <div className="mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-primary/20 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
            <h2 className="text-lg md:text-xl font-bold text-primary">
              Recent Issues & Community Updates
            </h2>
            <a
              href="/issues"
              className="text-primary hover:text-primary/80 text-sm font-semibold underline underline-offset-2"
            >
              View All
            </a>
          </div>

          {recentIssues.length > 0 ? (
            <div className="space-y-4">
              {recentIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="border border-primary/10 rounded-xl p-4 bg-white hover:bg-primary/5 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-2 gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {issue.title}
                      </h3>
                      {issue.reportedBy.id !== user?.id && (
                        <p className="text-xs text-gray-500 mt-1">
                          Reported by: {issue.reportedBy.name}
                          {issue.distance && (
                            <span className="text-primary ml-2">
                              ({issue.distance} km away)
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-0 md:ml-4">
                      {getStatusIcon(issue.status)}
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(issue.status)}`}
                      >
                        {issue.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {issue.description}
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 gap-2">
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
                      className={`px-2 py-1 rounded-full font-semibold ${getPriorityColor(issue.priority)}`}
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
                      className="flex items-center space-x-1 text-primary hover:text-primary/80 text-sm font-semibold"
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

      {/* Quick Actions & News */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="lg:col-span-2">
          {/* Latest News Widget */}
          <div className="bg-gradient-to-br from-primary/10 to-white rounded-2xl shadow-lg border-2 border-primary/30 p-0 md:p-0 overflow-hidden">
            <div className="p-2 sm:p-6">
              <LatestNews
                userState={user?.state?.name || 'all'}
                limit={4}
                showFull={false}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-lg border border-primary/20 p-6">
            <h2 className="text-lg font-bold text-primary mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <a
                href="/issues"
                className="flex items-center p-3 bg-primary/10 rounded-xl hover:bg-primary/20 transition-all group"
              >
                <Plus className="h-5 w-5 text-primary mr-3 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-primary group-hover:underline">
                  Report New Issue
                </span>
              </a>
              <a
                href="/issues"
                className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-primary/10 transition-all group"
              >
                <MessageSquare className="h-5 w-5 text-primary mr-3 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-primary group-hover:text-primary group-hover:underline">
                  View My Issues
                </span>
              </a>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-6">
            <h3 className="text-lg font-bold text-primary mb-3">
              💡 Tips for Better Results
            </h3>
            <ul className="space-y-2 text-sm text-primary">
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
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
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
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 disabled:bg-primary/60 transition-all"
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
