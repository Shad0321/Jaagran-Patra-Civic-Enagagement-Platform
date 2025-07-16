import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Video,
  Calendar,
  Clock,
  Users,
  Plus,
  Settings,
  Eye,
  Edit3,
  Trash2,
  Play,
  Square,
  UserPlus,
  Mail,
  Globe,
  Copy,
  ExternalLink,
  CalendarDays,
  History,
  Filter,
  Search,
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import CreateMeetingModal from '../components/CreateMeetingModal';
import MeetingDetailsModal from '../components/MeetingDetailsModal';
import InviteMembersModal from '../components/InviteMembersModal';

const MeetingManagement = () => {
  const { user } = useSelector((state) => state.user);
  console.log('Current user:', user); // Using user to avoid lint warning
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/meetings', {
        params: {
          type: filterType,
          page: pagination.page,
          limit: pagination.limit,
        },
      });

      const sessionsData =
        response.data?.data?.sessions || response.data?.sessions || [];
      console.log('Fetched sessions:', sessionsData); // Debug log
      setMeetings(Array.isArray(sessionsData) ? sessionsData : []);
      setPagination(
        (prev) =>
          response.data?.data?.pagination || response.data?.pagination || prev
      );
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast.error('Failed to load meetings');
      setMeetings([]); // Ensure meetings is always an array
    } finally {
      setLoading(false);
    }
  }, [filterType, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleDeleteMeeting = async (meetingId) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) {
      return;
    }

    try {
      await api.delete(`/meetings/${meetingId}`);
      toast.success('Meeting deleted successfully');
      fetchMeetings();
    } catch (error) {
      console.error('Error deleting meeting:', error);
      toast.error('Failed to delete meeting');
    }
  };

  const handleJoinMeeting = async (meetingId) => {
    try {
      const response = await api.post(`/meetings/${meetingId}/join`);
      console.log('Join meeting response:', response.data); // Debug log

      // Handle nested response structure
      const meetingLink =
        response.data?.data?.meetingLink || response.data?.meetingLink;

      if (meetingLink) {
        window.open(meetingLink, '_blank');
        toast.success('Joining meeting...');
      } else {
        toast.error('Meeting link not found in response');
      }
    } catch (error) {
      console.error('Error joining meeting:', error);
      toast.error('Failed to join meeting');
    }
  };

  const handleEndMeeting = async (meetingId) => {
    if (!window.confirm('Are you sure you want to end this meeting?')) {
      return;
    }

    try {
      await api.post(`/meetings/${meetingId}/end`);
      toast.success('Meeting ended successfully');
      fetchMeetings();
    } catch (error) {
      console.error('Error ending meeting:', error);
      toast.error('Failed to end meeting');
    }
  };

  const copyMeetingLink = (meetingLink) => {
    navigator.clipboard.writeText(meetingLink);
    toast.success('Meeting link copied to clipboard');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ONGOING':
        return 'bg-green-100 text-green-800';
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ONGOING':
        return <Play className="w-4 h-4" />;
      case 'SCHEDULED':
        return <Calendar className="w-4 h-4" />;
      case 'COMPLETED':
        return <Square className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredMeetings = Array.isArray(meetings)
    ? meetings.filter(
        (meeting) =>
          meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          meeting.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  console.log('Meetings state:', meetings); // Debug log
  console.log('Filtered meetings:', filteredMeetings); // Debug log

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Video className="w-6 h-6 text-blue-600" />
            Meeting Management
          </h1>
          <p className="text-gray-600 mt-1">
            Create and manage Zoom meetings for your constituency
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Meeting
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search meetings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Meetings</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="past">Past</option>
            </select>
          </div>
        </div>
      </div>

      {/* Meeting Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Meetings
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {pagination.total}
              </p>
            </div>
            <CalendarDays className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-blue-600">
                {Array.isArray(meetings)
                  ? meetings.filter((m) => m.status === 'SCHEDULED').length
                  : 0}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ongoing</p>
              <p className="text-2xl font-bold text-green-600">
                {Array.isArray(meetings)
                  ? meetings.filter((m) => m.status === 'ONGOING').length
                  : 0}
              </p>
            </div>
            <Play className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-600">
                {Array.isArray(meetings)
                  ? meetings.filter((m) => m.status === 'COMPLETED').length
                  : 0}
              </p>
            </div>
            <History className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Meetings List */}
      <div className="bg-white rounded-lg shadow-sm border">
        {filteredMeetings.length === 0 ? (
          <div className="text-center py-12">
            <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No meetings found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm
                ? 'No meetings match your search.'
                : 'Create your first meeting to get started.'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Meeting
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Meeting
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMeetings.map((meeting) => (
                  <tr key={meeting.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Video className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {meeting.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {meeting.description || 'No description'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gap-1 ${getStatusColor(meeting.status)}`}
                      >
                        {getStatusIcon(meeting.status)}
                        {meeting.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(meeting.scheduledAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {meeting.duration} minutes
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        {meeting.participants?.length || 0}
                        {meeting.isOpenToAll && (
                          <Globe
                            className="w-4 h-4 text-green-500 ml-1"
                            title="Open to all"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedMeeting(meeting);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {meeting.status === 'ONGOING' && (
                          <button
                            onClick={() => handleJoinMeeting(meeting.id)}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Join Meeting"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}

                        {meeting.status === 'SCHEDULED' && (
                          <button
                            onClick={() => handleJoinMeeting(meeting.id)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Start Meeting"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}

                        {meeting.status === 'ONGOING' && (
                          <button
                            onClick={() => handleEndMeeting(meeting.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="End Meeting"
                          >
                            <Square className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedMeeting(meeting);
                            setShowInviteModal(true);
                          }}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded"
                          title="Invite Members"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>

                        {meeting.meetingLink && (
                          <button
                            onClick={() => copyMeetingLink(meeting.meetingLink)}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded"
                            title="Copy Meeting Link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}

                        {meeting.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleDeleteMeeting(meeting.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Delete Meeting"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
                of {pagination.total} meetings
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateMeetingModal
          onClose={() => setShowCreateModal(false)}
          onMeetingCreated={fetchMeetings}
        />
      )}

      {showDetailsModal && selectedMeeting && (
        <MeetingDetailsModal
          meeting={selectedMeeting}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedMeeting(null);
          }}
          onMeetingUpdated={fetchMeetings}
        />
      )}

      {showInviteModal && selectedMeeting && (
        <InviteMembersModal
          meeting={selectedMeeting}
          onClose={() => {
            setShowInviteModal(false);
            setSelectedMeeting(null);
          }}
          onInvitesSent={fetchMeetings}
        />
      )}
    </div>
  );
};

export default MeetingManagement;
