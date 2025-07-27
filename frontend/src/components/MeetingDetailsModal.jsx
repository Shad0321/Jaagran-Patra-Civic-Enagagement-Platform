import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Video,
  Calendar,
  Clock,
  Users,
  Globe,
  MapPin,
  Edit3,
  ExternalLink,
  Copy,
  Mail,
  User,
  Settings,
  Play,
  Square,
  Repeat,
  ChevronDown,
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const MeetingDetailsModal = ({ meeting, onClose, onMeetingUpdated }) => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    topic: meeting.title || '',
    agenda: meeting.description || '',
    duration: meeting.duration || 60,
  });

  const fetchParticipants = useCallback(async () => {
    try {
      const response = await api.get(`/meetings/${meeting.id}/participants`);
      setParticipants(response.data.data.participants || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  }, [meeting.id]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const handleJoinMeeting = async () => {
    try {
      const response = await api.post(`/meetings/${meeting.id}/join`);
      if (response.data.meetingLink) {
        window.open(response.data.meetingLink, '_blank');
      }
      toast.success('Joining meeting...');
    } catch (error) {
      console.error('Error joining meeting:', error);
      toast.error('Failed to join meeting');
    }
  };

  const handleEndMeeting = async () => {
    if (!window.confirm('Are you sure you want to end this meeting?')) {
      return;
    }

    try {
      setLoading(true);
      await api.post(`/meetings/${meeting.id}/end`);
      toast.success('Meeting ended successfully');
      onMeetingUpdated();
      onClose();
    } catch (error) {
      console.error('Error ending meeting:', error);
      toast.error('Failed to end meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMeeting = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.put(`/meetings/${meeting.id}`, editData);
      toast.success('Meeting updated successfully');
      onMeetingUpdated();
      setEditMode(false);
    } catch (error) {
      console.error('Error updating meeting:', error);
      toast.error('Failed to update meeting');
    } finally {
      setLoading(false);
    }
  };

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(meeting.meetingLink);
    toast.success('Meeting link copied to clipboard');
  };

  const copyMeetingId = () => {
    navigator.clipboard.writeText(meeting.zoomMeetingId);
    toast.success('Meeting ID copied to clipboard');
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center  z-50 p-4 pb-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-primary/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
              <Video className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Meeting Details
              </h2>
              <p className="text-sm text-primary/80">
                {meeting.title || 'Meeting information'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Meeting Status */}
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium gap-2 ${getStatusColor(meeting.status)}`}
            >
              {getStatusIcon(meeting.status)}
              {meeting.status}
            </span>

            {meeting.status === 'ONGOING' && (
              <div className="flex gap-2">
                <button
                  onClick={handleJoinMeeting}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:shadow-md transition-all duration-200 flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Join Meeting
                </button>
                <button
                  onClick={handleEndMeeting}
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:shadow-md transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  End Meeting
                </button>
              </div>
            )}

            {meeting.status === 'SCHEDULED' && (
              <button
                onClick={handleJoinMeeting}
                className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:shadow-md transition-all duration-200 flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Start Meeting
              </button>
            )}
          </div>

          {/* Meeting Information */}
          {editMode ? (
            <form
              onSubmit={handleUpdateMeeting}
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Meeting Topic *
                </label>
                <input
                  type="text"
                  value={editData.topic}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, topic: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Agenda
                </label>
                <textarea
                  value={editData.agenda}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, agenda: e.target.value }))
                  }
                  rows="3"
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  value={editData.duration}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      duration: parseInt(e.target.value),
                    }))
                  }
                  min="1"
                  max="1440"
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200 hover:shadow-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">
                  {meeting.title}
                </h3>
                {meeting.status !== 'COMPLETED' && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="p-2 text-primary hover:text-primary/80 rounded-lg hover:bg-primary/10 transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {meeting.description && (
                <p className="text-gray-600">{meeting.description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-lg border border-primary/10">
                  <Calendar className="h-5 w-5 text-primary/80" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Date & Time
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDateTime(meeting.scheduledAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-lg border border-primary/10">
                  <Clock className="h-5 w-5 text-primary/80" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Duration
                    </p>
                    <p className="text-sm text-gray-600">
                      {meeting.duration} minutes
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-lg border border-primary/10">
                  <Users className="h-5 w-5 text-primary/80" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Participants
                    </p>
                    <p className="text-sm text-gray-600">
                      {participants.length} invited
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-lg border border-primary/10">
                  {meeting.isOpenToAll ? (
                    <Globe className="h-5 w-5 text-primary/80" />
                  ) : (
                    <Mail className="h-5 w-5 text-primary/80" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Access
                    </p>
                    <p className="text-sm text-gray-600">
                      {meeting.isOpenToAll ? 'Open to all' : 'Invitation only'}
                    </p>
                  </div>
                </div>
              </div>

              {meeting.isRecurring && (
                <div className="flex items-center gap-3 p-3 bg-blue-50/80 rounded-lg border border-primary/10">
                  <Repeat className="h-5 w-5 text-primary/80" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      Recurring Meeting
                    </p>
                    <p className="text-sm text-blue-600">
                      This is a recurring meeting
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Meeting Links */}
          {meeting.meetingLink && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Meeting Links
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={meeting.meetingLink}
                    readOnly
                    className="flex-1 px-4 py-2.5 bg-gray-50/80 border border-primary/20 rounded-lg text-sm"
                  />
                  <button
                    onClick={copyMeetingLink}
                    className="p-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border border-primary/10"
                    title="Copy meeting link"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleJoinMeeting}
                    className="p-2.5 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg transition-colors border border-primary/10"
                    title="Open meeting"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>

                {meeting.zoomMeetingId && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={`Meeting ID: ${meeting.zoomMeetingId}`}
                      readOnly
                      className="flex-1 px-4 py-2.5 bg-gray-50/80 border border-primary/20 rounded-lg text-sm"
                    />
                    <button
                      onClick={copyMeetingId}
                      className="p-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border border-primary/10"
                      title="Copy meeting ID"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Participants */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Participants ({participants.length})
            </h4>
            {participants.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50/80 rounded-lg border border-primary/10"
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {participant.user?.name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {participant.user?.email}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        participant.status === 'JOINED'
                          ? 'bg-green-100 text-green-800'
                          : participant.status === 'INVITED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {participant.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No participants yet</p>
            )}
          </div>

          {/* Host Information */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Host</h4>
            <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-lg border border-primary/10">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {meeting.host?.name || 'Unknown Host'}
                </p>
                <p className="text-xs text-gray-500">{meeting.host?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingDetailsModal;
