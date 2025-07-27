import React, { useState, useEffect, useCallback } from 'react';
// import { useSelector } from 'react-redux';
import {
  Video,
  Calendar,
  Clock,
  Users,
  Plus,
  Eye,
  Trash2,
  Play,
  Square,
  UserPlus,
  Globe,
  Copy,
  ExternalLink,
  CalendarDays,
  History,
  Filter,
  Search,
  ChevronDown,
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import CreateMeetingModal from '../components/CreateMeetingModal';
import MeetingDetailsModal from '../components/MeetingDetailsModal';
import InviteMembersModal from '../components/InviteMembersModal';
import Loader from '../components/common/Loader';

const MeetingManagement = () => {
  // const { user } = useSelector((state) => state.user);
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
      setMeetings(Array.isArray(sessionsData) ? sessionsData : []);
      setPagination(
        (prev) =>
          response.data?.data?.pagination || response.data?.pagination || prev
      );
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast.error('Failed to load meetings');
      setMeetings([]);
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

  // if(!loading && (!user || !user.role || user.role !== 'MLA') ) {
  //   return (
  //     <div className="flex items-center justify-center h-screen">
  //       <div className="text-center">
  //         <h1 className="text-2xl font-bold">Access Denied</h1>
  //         <p>You do not have permission to view this page.</p>
  //       </div>
  //     </div>
  //   );
  // }

  const copyMeetingLink = (meetingLink) => {
    navigator.clipboard.writeText(meetingLink);
    toast.success('Meeting link copied to clipboard');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ONGOING':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ONGOING':
        return <Play className="w-4 h-4 text-emerald-600" />;
      case 'SCHEDULED':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'COMPLETED':
        return <Square className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredMeetings = Array.isArray(meetings)
    ? meetings.filter(
        (meeting) =>
          meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          meeting.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

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
      <Loader className="w-screen h-screen flex items-center justify-center" />
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
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-primary/10">
            <div className="flex justify-between items-center flex-wrap space-y-2">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2 pt-2">
                  Meeting Management
                </h1>
                <p className="text-gray-600">
                  Create and manage virtual meetings for your constituency
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-2.5 rounded-lg hover:shadow-md transition-all duration-200 flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                <span>Create Meeting</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search meetings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 bg-white/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 appearance-none"
              >
                <option value="all">All Meetings</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="past">Past</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 -ml-6" />
            </div>
          </div>
        </div>

        {/* Meeting Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Meetings
                </p>
                <p className="text-2xl font-bold text-primary">
                  {pagination.total}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
                <CalendarDays className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-blue-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Array.isArray(meetings)
                    ? meetings.filter((m) => m.status === 'SCHEDULED').length
                    : 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-emerald-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ongoing</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {Array.isArray(meetings)
                    ? meetings.filter((m) => m.status === 'ONGOING').length
                    : 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
                <Play className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-600">
                  {Array.isArray(meetings)
                    ? meetings.filter((m) => m.status === 'COMPLETED').length
                    : 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center shadow-lg">
                <History className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Meetings List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 overflow-hidden">
          {filteredMeetings.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Video className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No meetings found
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                {searchTerm
                  ? 'No meetings match your search.'
                  : 'Create your first meeting to get started.'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-primary to-primary/80 text-white text-sm font-medium rounded-lg hover:shadow-md transition-all duration-200 inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Meeting
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-primary/5">
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
                  <tbody className="bg-white/80 divide-y divide-gray-200/50">
                    {filteredMeetings.map((meeting) => (
                      <tr
                        key={meeting.id}
                        className="hover:bg-primary/5 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                <Video className="w-5 h-5 text-primary" />
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
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gap-1 border ${getStatusColor(meeting.status)}`}
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
                                className="w-4 h-4 text-emerald-500 ml-1"
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
                              className="text-primary hover:text-primary/80 p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {meeting.status === 'ONGOING' && (
                              <button
                                onClick={() => handleJoinMeeting(meeting.id)}
                                className="text-emerald-600 hover:text-emerald-800 p-1.5 rounded-lg hover:bg-emerald-100/50 transition-colors"
                                title="Join Meeting"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            )}

                            {meeting.status === 'SCHEDULED' && (
                              <button
                                onClick={() => handleJoinMeeting(meeting.id)}
                                className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-100/50 transition-colors"
                                title="Start Meeting"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            )}

                            {meeting.status === 'ONGOING' && (
                              <button
                                onClick={() => handleEndMeeting(meeting.id)}
                                className="text-red-600 hover:text-red-800 p-1.5 rounded-lg hover:bg-red-100/50 transition-colors"
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
                              className="text-purple-600 hover:text-purple-800 p-1.5 rounded-lg hover:bg-purple-100/50 transition-colors"
                              title="Invite Members"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>

                            {meeting.meetingLink && (
                              <button
                                onClick={() =>
                                  copyMeetingLink(meeting.meetingLink)
                                }
                                className="text-gray-600 hover:text-gray-800 p-1.5 rounded-lg hover:bg-gray-100/50 transition-colors"
                                title="Copy Meeting Link"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            )}

                            {meeting.status !== 'COMPLETED' && (
                              <button
                                onClick={() => handleDeleteMeeting(meeting.id)}
                                className="text-red-600 hover:text-red-800 p-1.5 rounded-lg hover:bg-red-100/50 transition-colors"
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

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-3 bg-primary/5 border-t border-primary/10">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total
                      )}{' '}
                      of {pagination.total} meetings
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            page: prev.page - 1,
                          }))
                        }
                        disabled={pagination.page === 1}
                        className="px-3 py-1 text-sm bg-white/80 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            page: prev.page + 1,
                          }))
                        }
                        disabled={pagination.page === pagination.totalPages}
                        className="px-3 py-1 text-sm bg-white/80 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
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
    </div>
  );
};

export default MeetingManagement;
