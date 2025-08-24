import React, { useEffect, useState, useRef, useCallback } from 'react'; // Added useCallback
import { useSelector } from 'react-redux';
import api from '../utils/api';
import { socket } from '../utils/socket';
import Loader from '../components/common/Loader';

// Chat group types
const GROUP_TYPE_LABELS = {
  PUBLIC_MLA_GROUP: 'Public MLA Group',
  PRIVATE_MLA_GROUP: 'MLA & Members',
};

// Create Group Modal Component
const CreateGroupModal = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('PUBLIC_MLA_GROUP');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const GROUP_TYPES = [
    { value: 'PUBLIC_MLA_GROUP', label: 'Public MLA Group (Anyone can join)' },
    { value: 'PRIVATE_MLA_GROUP', label: 'MLA & Members Only' },
  ];

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
      setType('PUBLIC_MLA_GROUP');
      if (onCreated) onCreated(res.data.data);
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1000);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-scale-in max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-light transition-colors"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Create New Chat Group
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Group Name
            </label>
            <input
              type="text"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              placeholder="Enter group name"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Description
            </label>
            <textarea
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Enter group description (optional)"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Group Type
            </label>
            <select
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {GROUP_TYPES.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <div className="text-error text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="text-success text-sm bg-green-50 p-3 rounded-lg">
              {success}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-primary text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
              disabled={loading || !name.trim()}
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Group Members Modal Component
const GroupMembersModal = ({ group, onClose, onMemberRemoved }) => {
  const { user } = useSelector((state) => state.user);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/chat/groups/${group.id}/members`);
      setMembers(res.data.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load group members');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      await api.delete(`/chat/groups/${group.id}/members/${userId}`);
      fetchMembers();
      if (onMemberRemoved) onMemberRemoved();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to remove member');
    }
  };

  const isOwner = group.owner?.id === user?.id;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-light transition-colors"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Group Members{(members.length && ` (${members.length})`) || ''}
        </h2>

        {error && (
          <div className="text-error text-sm mb-4 bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <Loader />
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.user.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center">
                    {member.user.avatar ? (
                      <img
                        src={member.user.avatar}
                        alt={member.user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-primary font-semibold text-lg">
                        {member.user.name?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">
                      {member.user.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {member.user.role}
                    </div>
                    {group.owner?.id === member.user.id && (
                      <span className="text-xs bg-primary-light text-primary px-2 py-1 rounded-full font-medium">
                        Owner
                      </span>
                    )}
                  </div>
                </div>

                {isOwner && group.owner?.id !== member.user.id && (
                  <button
                    className="text-error hover:text-red-700 text-sm font-medium transition-colors"
                    onClick={() => handleRemoveMember(member.user.id)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Public Groups Browser Component
const PublicGroupsBrowser = ({ onClose, onGroupJoined }) => {
  const [publicGroups, setPublicGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPublicGroups();
  }, []);

  const fetchPublicGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get('/chat/groups/public');
      setPublicGroups(res.data.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load public groups');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await api.post(`/chat/groups/${groupId}/join`);
      if (onGroupJoined) onGroupJoined();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to join group');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-light transition-colors"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Browse Public Groups
        </h2>

        {error && (
          <div className="text-error text-sm mb-4 bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Loading public groups...
          </div>
        ) : publicGroups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No public groups available
          </div>
        ) : (
          <div className="space-y-4">
            {publicGroups.map((group) => (
              <div
                key={group.id}
                className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4 flex-col sm:flex-row sm:items-center">
                  <div className="flex-1 mb-4 sm:mb-0">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">
                      {group.name}
                    </h3>
                    <p className="text-gray-600 mb-3">{group.description}</p>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                      <span>Owner: {group.owner?.name}</span>
                      <span>•</span>
                      <span>{group._count?.members || 0} members</span>
                      <span>•</span>
                      <span>{group._count?.messages || 0} messages</span>
                    </div>
                  </div>
                  <button
                    className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium self-end sm:self-auto"
                    onClick={() => handleJoinGroup(group.id)}
                  >
                    Join
                  </button>
                </div>

                {group.messages && group.messages[0] && (
                  <div className="bg-gray-50 rounded-lg p-3 mt-4">
                    <div className="text-sm text-gray-600">
                      <strong>Last message:</strong> {group.messages[0].message}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Main Chat Component
const ChatPage = () => {
  const { user } = useSelector((state) => state.user);
  const [memberGroups, setMemberGroups] = useState([]);
  const [publicGroups, setPublicGroups] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showPublicGroupsBrowser, setShowPublicGroupsBrowser] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isGroupListOpen, setIsGroupListOpen] = useState(true); // State for mobile group list visibility
  const isScrollingUp = useRef(false); // New ref to track user's scroll intent

  const selectedGroupRef = useRef(null);

  useEffect(() => {
    selectedGroupRef.current = selectedGroup;
  }, [selectedGroup]);

  // Initialize Socket
  useEffect(() => {
    socket.on('message.new', onMessageReceived);
    socket.on('message.read-ack', onMessageReadAck);

    return () => {
      socket.off('message.new', onMessageReceived);
      socket.off('message.read-ack', onMessageReadAck);
    };
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch groups on mount
  useEffect(() => {
    fetchGroups();
  }, []);

  // Fetch messages when group changes
  useEffect(() => {
    if (selectedGroup) {
      setMessages([]);
      setCurrentPage(1);
      setHasMoreMessages(true);
      fetchMessages(selectedGroup.id, 1, false, true); // Scroll to bottom on initial load

      // Mark previous messages as read
      if (socket) {
        const unreadMessages = messages.filter(
          (message) =>
            message.senderId !== user?.id &&
            ![message.readBy ?? []].some((item) => item.userId === user?.id)
        );

        Promise.all(
          unreadMessages.map((message) =>
            socket.emit('message.read', { messageId: message.id })
          )
        );
      }
    }
  }, [selectedGroup]);

  // Scroll to bottom on new messages (only if user is at the bottom or hasn't scrolled up)
  useEffect(() => {
    if (
      messagesEndRef.current &&
      messages.length > 0 &&
      !isScrollingUp.current
    ) {
      // This is primarily for when new messages arrive while the user is already at the bottom.
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]); // Dependency on messages ensures it runs after messages update

  useEffect(() => {
    // Set the data attribute to hide chat bot only for this page
    document.documentElement.setAttribute('data-hide-bot', 'true');
    document.body.setAttribute('data-hide-bot', 'true');
    
    // Add a specific class to body for this page
    document.body.classList.add('chat-page-active');

    // Force hide any existing chat bot elements
    const hideChatBot = () => {
      const botSelectors = [
        '.embedded-agent-container',
        '.chat-button-variant-2',
        '.noupe-agent',
        '.ai-agent-chat-animation-container',
        '.ai-agent-chat-cover',
        '.isNoupeAgent',
        'iframe[src*="noupe.com"]',
        'iframe[title="Embedded Agent"]',
        'iframe[id="form-agent-helper"]',
        '[class*="chatbot"]',
        '[class*="chat-widget"]',
        '[id*="chatbot"]',
        '[id*="chat-widget"]',
        '.chat-bubble',
        '.floating-chat'
      ];

      botSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            if (element) {
              element.style.setProperty('display', 'none', 'important');
              element.style.setProperty('visibility', 'hidden', 'important');
              element.style.setProperty('opacity', '0', 'important');
              element.style.setProperty('pointer-events', 'none', 'important');
              element.style.setProperty('z-index', '-9999', 'important');
              element.setAttribute('data-hidden-by-chat-page', 'true');
            }
          });
        } catch (error) {
          // Ignore errors
          console.log(error);
        }
      });
    };

    hideChatBot();
    
    // Repeat after a short delay to catch any late-loading elements
    const timeout = setTimeout(hideChatBot, 1000);
    
    // Add MutationObserver to catch dynamically added chat bots (only while on chat page)
    const observer = new MutationObserver(() => {
      // Only hide if we're still on the chat page
      if (document.body.classList.contains('chat-page-active')) {
        hideChatBot();
      }
    });
    
    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
      
      // Clean up: Remove the data attributes and class
      document.documentElement.removeAttribute('data-hide-bot');
      document.body.removeAttribute('data-hide-bot');
      document.body.classList.remove('chat-page-active');
      
      // Restore hidden chat bot elements
      const hiddenElements = document.querySelectorAll('[data-hidden-by-chat-page="true"]');
      hiddenElements.forEach(element => {
        element.style.removeProperty('display');
        element.style.removeProperty('visibility');
        element.style.removeProperty('opacity');
        element.style.removeProperty('pointer-events');
        element.style.removeProperty('z-index');
        element.removeAttribute('data-hidden-by-chat-page');
      });
    };
  }, []);

  // Add scroll event listener to detect when user scrolls up
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      const atBottom =
        container.scrollHeight - container.scrollTop <=
        container.clientHeight + 10;
      // If not at the bottom, user must have scrolled up
      isScrollingUp.current = !atBottom;
    }
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]); // Re-attach listener if handleScroll changes (due to useCallback)

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get('/chat/groups');
      setMemberGroups(res.data.data?.memberGroups || []);
      setPublicGroups(res.data.data?.publicGroups || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (
    groupId,
    page = 1,
    silent = false,
    scrollToBottom = false
  ) => {
    if (!silent) setMessagesLoading(true);
    try {
      const res = await api.get(
        `/chat/groups/${groupId}/messages?page=${page}&limit=20`
      );
      const newMessages = res.data.data.messages || [];

      setMessages((prev) => {
        // Ensure messages are sorted from oldest to newest for consistent display
        const combinedMessages =
          page === 1 ? newMessages : [...newMessages, ...prev];
        // Remove duplicates in case of overlap between pages or refresh
        const uniqueMessages = Array.from(
          new Map(combinedMessages.map((msg) => [msg.id, msg])).values()
        );
        return uniqueMessages.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      });

      setHasMoreMessages(newMessages.length === 20);
      setCurrentPage(page);

      // Only scroll to bottom if explicitly requested or if it's the first page load
      if (scrollToBottom && messagesEndRef.current) {
        // Wait for the DOM to update with new messages before scrolling
        setTimeout(() => {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }, 0); // Use setTimeout to ensure DOM is updated
      }
    } catch (err) {
      if (!silent) {
        setError(err?.response?.data?.message || 'Failed to load messages');
      }
    } finally {
      if (!silent) setMessagesLoading(false);
    }
  };

  const loadMoreMessages = () => {
    if (selectedGroup && hasMoreMessages && !messagesLoading) {
      const container = messagesContainerRef.current;
      const oldScrollHeight = container.scrollHeight; // Capture scroll height BEFORE new messages

      fetchMessages(selectedGroup.id, currentPage + 1).then(() => {
        // After messages are loaded and state is updated, calculate new scroll position
        setTimeout(() => {
          const newScrollHeight = container.scrollHeight;
          // Adjust scroll top to keep the old top message in view
          container.scrollTop = newScrollHeight - oldScrollHeight;
        }, 0); // Ensures DOM has updated before calculating scroll
      });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedGroup) return;

    const tempMessage = {
      id: Date.now(), // Unique ID for temporary message
      message,
      sender: user,
      createdAt: new Date().toISOString(),
      temporary: true,
    };

    setMessages((prev) => [...prev, tempMessage]); // Add temp message to UI immediately
    setMessage(''); // Clear input

    // Ensure we scroll to the bottom when a new message is sent
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    try {
      socket.emit(
        'message.send',
        {
          messageType: 'TEXT',
          message,
          groupId: selectedGroup.id,
        },
        (response) => {
          if (response.success) {
            // After successful send, trigger a full refresh for the latest messages
            // This will replace the temporary message with the actual one from the server
            // and ensure all new messages are caught.
            fetchMessages(selectedGroup.id, 1, true, true); // Silent refresh, scroll to bottom
          }
        }
      );
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send message');
      // Remove the temporary message if sending fails
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await api.post(`/chat/groups/${groupId}/join`);
      fetchGroups();
      setIsGroupListOpen(false); // Hide group list after joining on mobile
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to join group');
    }
  };

  const handleLeaveGroup = async (groupId) => {
    if (!confirm('Are you sure you want to leave this group?')) return;

    try {
      await api.post(`/chat/groups/${groupId}/leave`);
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
      }
      fetchGroups();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to leave group');
    }
  };

  const onMessageReceived = async (newMessage) => {
    const currentGroup = selectedGroupRef.current;
    if (newMessage.groupId !== currentGroup?.id) {
      console.log('Incorrect group!');
      return;
    }

    setMessages((prev) => {
      const combinedMessages = [...prev, newMessage];
      const uniqueMessages = Array.from(
        new Map(combinedMessages.map((msg) => [msg.id, msg])).values()
      );
      return uniqueMessages.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
    });

    // Mark as read if the user is on the group and the tab is active
    if (document.hasFocus() && !document.hidden) {
      socket.emit('message.read', { messageId: newMessage.id });
    }
  };

  const onMessageReadAck = useCallback(
    (payload) => {
      const { messageId, userId, readAt, isFor } = payload;
      if (user?.id !== isFor) return;

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;

          const prevReadBy = Array.isArray(m.readBy) ? m.readBy : [];
          if (prevReadBy.some((r) => r.userId === userId)) return m;

          return {
            ...m,
            readBy: [...prevReadBy, { userId, readAt }],
          };
        })
      );
    },
    [user?.id]
  );

  const renderGroupItem = (group, isMember = true) => (
    <div
      key={group.id}
      className={`p-4 sm:p-5 mb-3 rounded-xl cursor-pointer border-2 transition-all duration-200 ${
        selectedGroup && selectedGroup.id === group.id
          ? 'bg-primary text-white border-primary shadow-lg'
          : 'hover:bg-gray-50 border-gray-200 hover:border-primary'
      }`}
      onClick={() => {
        setSelectedGroup(group);
        setIsGroupListOpen(false); // Close group list on mobile
      }}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        {/* Left content */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-base sm:text-lg mb-1 truncate">
            {group.name}
          </div>

          <div
            className={`text-sm sm:text-base mb-2 ${
              selectedGroup?.id === group.id
                ? 'text-primary-light'
                : 'text-gray-500'
            }`}
          >
            {GROUP_TYPE_LABELS[group.type] || group.type}
          </div>

          <div
            className={`text-xs sm:text-sm flex flex-wrap items-center gap-4 ${
              selectedGroup?.id === group.id
                ? 'text-primary-light'
                : 'text-gray-400'
            }`}
          >
            <span>👥 {group._count?.members || 0} members</span>
            <span>💬 {group._count?.messages || 0} messages</span>
          </div>

          {group.messages?.[0] && (
            <div
              className={`text-xs sm:text-sm mt-2 truncate ${
                selectedGroup?.id === group.id
                  ? 'text-primary-light'
                  : 'text-gray-600'
              }`}
            >
              <strong>Last:</strong>{' '}
              {group.messages[0].message.substring(0, 50)}
              {group.messages[0].message.length > 50 ? '...' : ''}
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex flex-col gap-2 shrink-0 sm:items-end">
          {isMember && group.owner?.id !== user?.id && (
            <button
              className={`text-xs sm:text-sm px-3 py-1 rounded-lg transition-colors ${
                selectedGroup?.id === group.id
                  ? 'text-primary-light hover:bg-white hover:text-primary'
                  : 'text-error hover:bg-red-50'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleLeaveGroup(group.id);
              }}
            >
              Leave
            </button>
          )}

          {!isMember && (
            <button
              className="px-4 py-2 text-xs sm:text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
              onClick={(e) => {
                e.stopPropagation();
                handleJoinGroup(group.id);
              }}
            >
              Join Group
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchGroups();
          }}
        />
      )}

      {showMembersModal && selectedGroup && (
        <GroupMembersModal
          group={selectedGroup}
          onClose={() => setShowMembersModal(false)}
          onMemberRemoved={() => fetchGroups()}
        />
      )}

      {showPublicGroupsBrowser && (
        <PublicGroupsBrowser
          onClose={() => setShowPublicGroupsBrowser(false)}
          onGroupJoined={() => fetchGroups()}
        />
      )}

      <div className="flex flex-col h-[88vh] bg-white rounded-2xl shadow-xl md:flex-row">
        {/* Group List - Hidden on small screens if a group is selected, otherwise full width */}
        <div
          className={`${isGroupListOpen ? 'flex' : 'hidden'} w-full md:w-1/3 border-r border-gray-200 flex-col bg-gray-50 md:flex`}
        >
          <div className="p-4 border-b border-gray-200 bg-white sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">
                Chat Groups
              </h2>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${isOnline ? 'bg-success' : 'bg-error'}`}
                ></div>
                <span className="text-sm text-gray-500">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              {user?.role === 'MLA' && (
                <button
                  className="flex-1 px-3 py-2 text-sm bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium whitespace-nowrap sm:px-4 sm:py-2"
                  onClick={() => setShowCreateModal(true)}
                >
                  + New Group
                </button>
              )}
              <button
                className="flex-1 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium whitespace-nowrap sm:px-4 sm:py-2"
                onClick={() => setShowPublicGroupsBrowser(true)}
              >
                Browse Public
              </button>
            </div>

            {error && (
              <div className="text-error text-sm mt-4 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {loading && (
              <div className="text-center py-8 text-gray-500">
                Loading groups...
              </div>
            )}

            {/* Member Groups */}
            {memberGroups.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-700 mb-4">
                  My Groups
                </h3>
                {memberGroups.map((group) => renderGroupItem(group, true))}
              </div>
            )}

            {/* Available Public Groups */}
            {publicGroups.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-700 mb-4">
                  Available Public Groups
                </h3>
                {publicGroups.map((group) => renderGroupItem(group, false))}
              </div>
            )}

            {!loading &&
              memberGroups.length === 0 &&
              publicGroups.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-5xl mb-4 sm:text-6xl">💬</div>
                  <div className="text-base font-medium mb-2 sm:text-lg">
                    No groups yet
                  </div>
                  <div className="text-xs sm:text-sm">
                    Create a new group or browse public groups to get started.
                  </div>
                  {user && user.role === 'MLA' && (
                    <button
                      className="mt-6 px-5 py-2 sm:px-6 sm:py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium"
                      onClick={() => setShowCreateModal(true)}
                    >
                      Create New Group
                    </button>
                  )}
                </div>
              )}
          </div>
        </div>

        {/* Chat Window */}
        <div
          className={`flex-1 flex-col ${selectedGroup ? 'flex' : 'hidden'} md:flex`}
        >
          {selectedGroup ? (
            <>
              <div className="flex items-center justify-between border-b border-gray-200 p-3 bg-white sm:p-6">
                <div className="flex items-center gap-2 sm:gap-4">
                  {/* Back button for mobile */}
                  <button
                    className="md:hidden p-1.5 rounded-full hover:bg-gray-100"
                    onClick={() => {
                      setSelectedGroup(null);
                      setIsGroupListOpen(true); // Open group list on mobile
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-600 sm:h-6 sm:w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  <div className="w-9 h-9 bg-primary-light rounded-full flex items-center justify-center sm:w-12 sm:h-12">
                    <span className="text-primary font-bold text-sm sm:text-lg">
                      {selectedGroup.name.charAt(0)}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="font-bold text-sm text-gray-800 truncate max-w-[120px] sm:max-w-full sm:text-xl">
                      {selectedGroup.name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 sm:text-sm sm:gap-2 truncate">
                      <span>
                        {GROUP_TYPE_LABELS[selectedGroup.type] ||
                          selectedGroup.type}
                      </span>
                      <span>•</span>
                      <span>{selectedGroup._count?.members || 0} members</span>
                    </div>
                  </div>
                </div>

                <button
                  className="px-2.5 py-1 mr-4 text-xs sm:text-sm text-primary hover:bg-primary-light rounded-lg transition-colors font-medium sm:px-4 sm:py-2 cursor-pointer"
                  onClick={() => setShowMembersModal(true)}
                >
                  View Members
                </button>
              </div>

              {/* Message Display Area */}
              <div
                className="flex-1 min-h-0 max-h-[calc(80dvh_-_72px)] overflow-y-auto p-4 bg-gray-50 flex flex-col"
                ref={messagesContainerRef}
              >
                {hasMoreMessages && (
                  <div className="text-center mb-6">
                    <button
                      className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      onClick={loadMoreMessages}
                      disabled={messagesLoading}
                    >
                      {messagesLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg
                            className="animate-spin h-4 w-4"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Loading...
                        </span>
                      ) : (
                        'Load More Messages'
                      )}
                    </button>
                  </div>
                )}

                {messages.length === 0 && !messagesLoading && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <div className="text-5xl mb-4 sm:text-6xl">💬</div>
                    <div className="text-base font-medium mb-1 sm:text-lg">
                      No messages yet
                    </div>
                    <div className="text-sm">Start the conversation!</div>
                  </div>
                )}
                {/* Messages will be rendered here */}
                <div className="space-y-4 flex-grow">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender?.id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] sm:max-w-xs lg:max-w-md p-3 rounded-2xl shadow-sm transition-all duration-200 ${
                          msg.sender?.id === user?.id
                            ? 'bg-primary text-white rounded-tr-none'
                            : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
                        } ${msg.temporary ? 'opacity-70' : ''}`}
                      >
                        {msg.sender?.id !== user?.id && (
                          <div className="font-semibold text-xs mb-1 flex items-center gap-1 sm:text-sm sm:gap-2">
                            {msg.sender?.avatar ? (
                              <img
                                src={msg.sender.avatar}
                                alt={msg.sender.name}
                                className="w-5 h-5 rounded-full object-cover sm:w-6 sm:h-6"
                              />
                            ) : (
                              <span className="w-5 h-5 rounded-full bg-primary-light text-primary flex items-center justify-center text-xs font-bold sm:w-6 sm:h-6">
                                {msg.sender?.name?.charAt(0)}
                              </span>
                            )}
                            {msg.sender?.name || 'Unknown'}
                          </div>
                        )}
                        <div className="break-words text-sm sm:text-base">
                          {msg.message}
                        </div>
                        <div
                          className={`text-xs mt-1 flex items-center justify-end gap-1 ${
                            msg.sender?.id === user?.id
                              ? 'text-primary-light'
                              : 'text-gray-500'
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {msg.sender?.id === user?.id && (
                            <span>
                              {msg.readBy && msg.readBy.length > 0 ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3 text-blue-300"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3 text-gray-400"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-gray-200 bg-white"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-sm sm:text-base"
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    className="w-10 h-10 bg-primary text-white rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-colors flex items-center justify-center sm:w-12 sm:h-12"
                    disabled={loading || !message.trim()}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 sm:h-6 sm:w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-400">
                <div className="text-7xl mb-6 sm:text-8xl">💬</div>
                <div className="text-xl font-medium mb-2 sm:text-2xl">
                  Select a group to start chatting
                </div>
                <div className="text-sm">
                  Choose from your existing groups or create a new one
                </div>
                {user && user.role === 'MLA' && (
                  <button
                    className="mt-6 px-5 py-2 sm:px-6 sm:py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium"
                    onClick={() => setShowCreateModal(true)}
                  >
                    Create New Group
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Toggle Button for Group List */}
        {!selectedGroup && (
          <div className="fixed bottom-4 right-4 md:hidden z-40">
            <button
              className="bg-primary text-white p-4 rounded-full shadow-lg"
              onClick={() => setIsGroupListOpen(!isGroupListOpen)}
            >
              {isGroupListOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default ChatPage;
