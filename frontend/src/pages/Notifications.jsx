import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, Trash2, Filter } from 'lucide-react';
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
        return 'text-blue-600';
      case 'ISSUE_UPDATE':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'unread') return !notification.readAt;
    if (filter === 'read') return notification.readAt;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="ml-3 bg-red-500 text-white text-sm rounded-full px-2 py-1">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all as read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-4">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              {
                key: 'read',
                label: 'Read',
                count: notifications.length - unreadCount,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === tab.key
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 text-sm">({tab.count})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {loading && notifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Loader/>
              <p className="mt-4 text-gray-600">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'unread'
                  ? 'No unread notifications'
                  : 'No notifications yet'}
              </h3>
              <p className="text-gray-600">
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
                className={`bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow ${!notification.readAt
                    ? 'border-l-4 border-blue-500 bg-blue-50'
                    : ''
                  }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="text-3xl">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {notification.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {!notification.readAt && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!notification.readAt) {
                              markAsRead(notification.notificationId);
                            }
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-3">{notification.message}</p>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span
                          className={`font-medium ${getNotificationColor(notification.type)}`}
                        >
                          {notification.type.replace('_', ' ')}
                        </span>
                        <span>From: {notification.sentBy.name}</span>
                      </div>
                      <span>
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
              className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
