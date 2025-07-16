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
      console.log('Participants fetched:', response.data.participants);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-600" />
            Meeting Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
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
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Join Meeting
                </button>
                <button
                  onClick={handleEndMeeting}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Square className="w-4 h-4" />
                  End Meeting
                </button>
              </div>
            )}

            {meeting.status === 'SCHEDULED' && (
              <button
                onClick={handleJoinMeeting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Play className="w-4 h-4" />
                Start Meeting
              </button>
            )}
          </div>

          {/* Meeting Information */}
          {editMode ? (
            <form onSubmit={handleUpdateMeeting} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Topic
                </label>
                <input
                  type="text"
                  value={editData.topic}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, topic: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agenda
                </label>
                <textarea
                  value={editData.agenda}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, agenda: e.target.value }))
                  }
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {meeting.title}
                </h3>
                {meeting.status !== 'COMPLETED' && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {meeting.description && (
                <p className="text-gray-600">{meeting.description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Date & Time
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDateTime(meeting.scheduledAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Duration
                    </p>
                    <p className="text-sm text-gray-600">
                      {meeting.duration} minutes
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Users className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Participants
                    </p>
                    <p className="text-sm text-gray-600">
                      {participants.length} invited
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {meeting.isOpenToAll ? (
                    <Globe className="w-5 h-5 text-green-600" />
                  ) : (
                    <Mail className="w-5 h-5 text-gray-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">Access</p>
                    <p className="text-sm text-gray-600">
                      {meeting.isOpenToAll ? 'Open to all' : 'Invitation only'}
                    </p>
                  </div>
                </div>
              </div>

              {meeting.isRecurring && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Repeat className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
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
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Meeting Links
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={meeting.meetingLink}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm"
                  />
                  <button
                    onClick={copyMeetingLink}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                    title="Copy meeting link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleJoinMeeting}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                    title="Open meeting"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>

                {meeting.zoomMeetingId && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={`Meeting ID: ${meeting.zoomMeetingId}`}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm"
                    />
                    <button
                      onClick={copyMeetingId}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                      title="Copy meeting ID"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Participants */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Participants ({participants.length})
            </h4>
            {participants.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-600" />
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
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Host</h4>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
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
