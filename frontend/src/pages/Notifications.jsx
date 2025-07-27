import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../utils/api';
import Loader from '../components/common/Loader';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(
    async (reset = false) => {
      try {
        setLoading(true);
        const currentPage = reset ? 1 : page;
        const unreadOnly = filter === 'unread';

        const response = await api.get(
          `/notifications?page=${currentPage}&limit=20&unreadOnly=${unreadOnly}`
        );

        if (response.data.success) {
          const newNotifications = response.data.data.notifications;

          if (reset) {
            setNotifications(newNotifications);
            setPage(2);
          } else {
            setNotifications((prev) => [...prev, ...newNotifications]);
            setPage((prev) => prev + 1);
          }

          setHasMore(newNotifications.length === 20);
          setUnreadCount(response.data.data.unreadCount);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    },
    [filter, page]
  );

  useEffect(() => {
    fetchNotifications(true);
  }, [filter, fetchNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.notificationId === notificationId
            ? { ...notif, readAt: new Date().toISOString() }
            : notif
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');

      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, readAt: new Date().toISOString() }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.readAt) {
      markAsRead(notification.notificationId);
    }

    // Handle navigation based on notification type
    if (
      notification.type === 'ISSUE_ASSIGNMENT' ||
      notification.type === 'ISSUE_UPDATE'
    ) {
      const issueId = notification.data?.issueId;
      if (issueId) {
        window.location.href = `/issues`;
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ISSUE_ASSIGNMENT':
        return '📋';
      case 'ISSUE_UPDATE':
        return '🔄';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'ISSUE_ASSIGNMENT':
        return 'bg-blue-100 text-blue-800';
      case 'ISSUE_UPDATE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'unread') return !notification.readAt;
    if (filter === 'read') return notification.readAt;
    return true;
  });
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

      <div className="relative z-10 p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-primary/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg mr-4">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Notifications
                  </h1>
                  {unreadCount > 0 && (
                    <span className="text-sm text-gray-600">
                      {unreadCount} unread notifications
                    </span>
                  )}
                </div>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all duration-200 flex items-center gap-2"
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark all as read
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative flex-1">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-white/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 appearance-none"
                >
                  <option value="all">All Notifications</option>
                  <option value="unread">Unread Only</option>
                  <option value="read">Read Only</option>
                </select>
                <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>
                  Showing {filteredNotifications?.length} of{' '}
                  {notifications?.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {loading && notifications.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-8 text-center">
              <Loader />
              <p className="mt-4 text-gray-600">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Bell className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'unread'
                  ? 'No unread notifications'
                  : 'No notifications yet'}
              </h3>
              <p className="text-gray-500">
                {filter === 'unread'
                  ? 'All caught up! No new notifications to read.'
                  : 'When you receive notifications, they will appear here.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border ${
                  !notification.readAt
                    ? 'border-primary/20 hover:border-primary/30'
                    : 'border-gray-200/50'
                } p-6 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.01]`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-3">
                      <h3
                        className={`text-lg font-semibold ${!notification.readAt ? 'text-gray-900' : 'text-gray-700'}`}
                      >
                        {notification.title}
                      </h3>
                      {!notification.readAt && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.notificationId);
                          }}
                          className="p-1.5 text-gray-400 hover:text-primary transition-colors hover:bg-primary/10 rounded-lg"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <p className="text-gray-700 mb-4">{notification.message}</p>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${getNotificationColor(notification.type)}`}
                        >
                          {notification.type.replace('_', ' ')}
                        </span>
                        <span className="text-gray-500">
                          From: {notification.sentBy.name}
                        </span>
                      </div>
                      <span className="text-gray-500">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button */}
        {hasMore && filteredNotifications.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => fetchNotifications(false)}
              disabled={loading}
              className="px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-md"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
