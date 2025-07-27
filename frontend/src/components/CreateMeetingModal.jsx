import React, { useState, useEffect, useCallback } from 'react';
// import { useSelector } from 'react-redux';
import {
  X,
  Calendar,
  Clock,
  Users,
  Globe,
  Mail,
  Plus,
  Minus,
  Video,
  Repeat,
  AlertCircle,
  ChevronDown,
  User,
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import Loader from './common/Loader';

const CreateMeetingModal = ({ onClose, onMeetingCreated }) => {
  // const { user } = useSelector((state) => state.user);
  const [meetingType, setMeetingType] = useState('instant');
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [formData, setFormData] = useState({
    topic: '',
    agenda: '',
    startTime: '',
    duration: 60,
    timezone: 'UTC',
    isOpenToAll: false,
    invitees: [],
    customEmails: [''],
    recurrenceType: 1,
    repeatInterval: 1,
    endTimes: 10,
    endDateTime: '',
    settings: {
      hostVideo: true,
      participantVideo: true,
      joinBeforeHost: false,
      muteUponEntry: true,
      waitingRoom: false,
      autoRecording: 'none',
    },
  });

  const fetchMembers = useCallback(async () => {
    try {
      const response = await api.get('/auth/members');
      const allMembers =
        response.data?.members || response.data?.data?.members || [];
      setMembers(allMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers([]);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
  };

  const handleMemberToggle = (memberEmail) => {
    setFormData((prev) => ({
      ...prev,
      invitees: prev.invitees.includes(memberEmail)
        ? prev.invitees.filter((email) => email !== memberEmail)
        : [...prev.invitees, memberEmail],
    }));
  };

  const handleCustomEmailChange = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      customEmails: prev.customEmails.map((email, i) =>
        i === index ? value : email
      ),
    }));
  };

  const addCustomEmailField = () => {
    setFormData((prev) => ({
      ...prev,
      customEmails: [...prev.customEmails, ''],
    }));
  };

  const removeCustomEmailField = (index) => {
    setFormData((prev) => ({
      ...prev,
      customEmails: prev.customEmails.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const allInvitees = [
        ...formData.invitees,
        ...formData.customEmails.filter((email) => email.trim() !== ''),
      ];

      const meetingData = {
        topic: formData.topic,
        agenda: formData.agenda,
        isOpenToAll: formData.isOpenToAll,
        invitees: allInvitees,
        settings: formData.settings,
      };

      let endpoint = '/meetings/';
      if (meetingType === 'instant') {
        endpoint += 'instant';
      } else if (meetingType === 'scheduled') {
        endpoint += 'scheduled';
        meetingData.startTime = formData.startTime;
        meetingData.duration = parseInt(formData.duration);
        meetingData.timezone = formData.timezone;
      } else if (meetingType === 'recurring') {
        endpoint += 'recurring';
        meetingData.startTime = formData.startTime;
        meetingData.duration = parseInt(formData.duration);
        meetingData.timezone = formData.timezone;
        meetingData.recurrenceType = parseInt(formData.recurrenceType);
        meetingData.repeatInterval = parseInt(formData.repeatInterval);
        meetingData.endTimes = parseInt(formData.endTimes);
        if (formData.endDateTime) {
          meetingData.endDateTime = formData.endDateTime;
        }
      }

      const response = await api.post(endpoint, meetingData);
      toast.success(
        `${meetingType === 'instant' ? 'Instant' : meetingType === 'scheduled' ? 'Scheduled' : 'Recurring'} meeting created successfully!`
      );

      if (meetingType === 'instant' && response.data.zoomMeeting?.join_url) {
        window.open(response.data.zoomMeeting.join_url, '_blank');
      }

      onMeetingCreated();
      onClose();
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast.error(error.response?.data?.error || 'Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  };

  const getRecurrenceTypeLabel = (type) => {
    switch (type) {
      case 1:
        return 'Daily';
      case 2:
        return 'Weekly';
      case 3:
        return 'Monthly';
      default:
        return 'Daily';
    }
  };

  // if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4  pb-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-primary/10 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
              <Video className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Create Meeting
              </h2>
              <p className="text-sm text-primary/80">
                Schedule or start a new meeting
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Meeting Type */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Meeting Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label
                className={`flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 ${meetingType === 'instant' ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-200 hover:border-primary/30 hover:shadow-sm'} border`}
              >
                <input
                  type="radio"
                  name="meetingType"
                  value="instant"
                  checked={meetingType === 'instant'}
                  onChange={(e) => setMeetingType(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-semibold text-gray-900">Instant</div>
                  <div className="text-sm text-gray-600">Start now</div>
                </div>
              </label>

              <label
                className={`flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 ${meetingType === 'scheduled' ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-200 hover:border-primary/30 hover:shadow-sm'} border`}
              >
                <input
                  type="radio"
                  name="meetingType"
                  value="scheduled"
                  checked={meetingType === 'scheduled'}
                  onChange={(e) => setMeetingType(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-semibold text-gray-900">Scheduled</div>
                  <div className="text-sm text-gray-600">Set date & time</div>
                </div>
              </label>

              <label
                className={`flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 ${meetingType === 'recurring' ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-200 hover:border-primary/30 hover:shadow-sm'} border`}
              >
                <input
                  type="radio"
                  name="meetingType"
                  value="recurring"
                  checked={meetingType === 'recurring'}
                  onChange={(e) => setMeetingType(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-semibold text-gray-900">Recurring</div>
                  <div className="text-sm text-gray-600">Repeat meetings</div>
                </div>
              </label>
            </div>
          </div>

          {/* Basic Meeting Info */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Meeting Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Meeting Topic *
                </label>
                <input
                  type="text"
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                  placeholder="Enter meeting topic"
                />
              </div>

              {(meetingType === 'scheduled' || meetingType === 'recurring') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    min="1"
                    max="1440"
                    required
                    className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                  />
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Meeting Agenda
              </label>
              <textarea
                name="agenda"
                value={formData.agenda}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                placeholder="Enter meeting agenda (optional)"
              />
            </div>
          </div>

          {/* Date and Time for Scheduled/Recurring */}
          {(meetingType === 'scheduled' || meetingType === 'recurring') && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Schedule
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    value={formData.startTime || getTomorrowDate()}
                    onChange={handleInputChange}
                    required
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80 appearance-none"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Asia/Kolkata">India Standard Time</option>
                    <option value="Europe/London">London Time</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary/70" />
                </div>
              </div>
            </div>
          )}

          {/* Recurring Meeting Settings */}
          {meetingType === 'recurring' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Repeat className="h-5 w-5 text-primary" />
                Recurrence Settings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Repeat
                  </label>
                  <select
                    name="recurrenceType"
                    value={formData.recurrenceType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80 appearance-none"
                  >
                    <option value={1}>Daily</option>
                    <option value={2}>Weekly</option>
                    <option value={3}>Monthly</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary/70" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Every
                  </label>
                  <input
                    type="number"
                    name="repeatInterval"
                    value={formData.repeatInterval}
                    onChange={handleInputChange}
                    min="1"
                    max="12"
                    className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {getRecurrenceTypeLabel(
                      formData.recurrenceType
                    ).toLowerCase()}
                    (s)
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End After
                  </label>
                  <input
                    type="number"
                    name="endTimes"
                    value={formData.endTimes}
                    onChange={handleInputChange}
                    min="1"
                    max="50"
                    className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                  />
                  <div className="text-xs text-gray-500 mt-1">occurrences</div>
                </div>
              </div>
            </div>
          )}

          {/* Access Settings */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Access Settings</h3>

            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="isOpenToAll"
                name="isOpenToAll"
                checked={formData.isOpenToAll}
                onChange={handleInputChange}
                className="h-5 w-5 text-primary focus:ring-primary/50 border-primary/30 rounded"
              />
              <label
                htmlFor="isOpenToAll"
                className="ml-3 text-sm font-medium text-gray-700 flex items-center gap-2"
              >
                <Globe className="w-4 h-4 text-green-500" />
                Open to all members
              </label>
            </div>

            {!formData.isOpenToAll && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Members to Invite
                </label>
                <div className="max-h-48 overflow-y-auto border border-primary/20 rounded-lg p-4 bg-white/80">
                  {Array.isArray(members) &&
                    members.map((member) => (
                      <label
                        key={member.id}
                        className="flex items-center mb-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.invitees.includes(member.email)}
                          onChange={() => handleMemberToggle(member.email)}
                          className="h-4 w-4 text-primary focus:ring-primary/50 border-primary/30 rounded mr-3"
                        />
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {member.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  {(!Array.isArray(members) || members.length === 0) && (
                    <div className="text-center py-4 text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No members available</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Custom Email Invites */}
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Additional Email Invites
              </label>
              {formData.customEmails.map((email, index) => (
                <div
                  key={index}
                  className="w-full flex items-center mb-2 gap-1 sm:gap-2"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      handleCustomEmailChange(index, e.target.value)
                    }
                    placeholder="Enter email address"
                    className="flex-1 px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80 max-w-[80%]"
                  />
                  {formData.customEmails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCustomEmailField(index)}
                      className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50 transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  )}
                  {index === formData.customEmails.length - 1 && (
                    <button
                      type="button"
                      onClick={addCustomEmailField}
                      className="p-2 text-primary hover:text-primary/80 rounded-full hover:bg-primary/10 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Meeting Settings */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Meeting Settings</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="hostVideo"
                    checked={formData.settings.hostVideo}
                    onChange={handleSettingsChange}
                    className="h-5 w-5 text-primary focus:ring-primary/50 border-primary/30 rounded"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Host video on
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="participantVideo"
                    checked={formData.settings.participantVideo}
                    onChange={handleSettingsChange}
                    className="h-5 w-5 text-primary focus:ring-primary/50 border-primary/30 rounded"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Participant video on
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="muteUponEntry"
                    checked={formData.settings.muteUponEntry}
                    onChange={handleSettingsChange}
                    className="h-5 w-5 text-primary focus:ring-primary/50 border-primary/30 rounded"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Mute participants on entry
                  </span>
                </label>
              </div>

              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="joinBeforeHost"
                    checked={formData.settings.joinBeforeHost}
                    onChange={handleSettingsChange}
                    className="h-5 w-5 text-primary focus:ring-primary/50 border-primary/30 rounded"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Allow join before host
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="waitingRoom"
                    checked={formData.settings.waitingRoom}
                    onChange={handleSettingsChange}
                    className="h-5 w-5 text-primary focus:ring-primary/50 border-primary/30 rounded"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Enable waiting room
                  </span>
                </label>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Auto Recording
                  </label>
                  <select
                    name="autoRecording"
                    value={formData.settings.autoRecording}
                    onChange={handleSettingsChange}
                    className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80 appearance-none"
                  >
                    <option value="none">None</option>
                    <option value="local">Local</option>
                    <option value="cloud">Cloud</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary/70" />
                </div>
              </div>
            </div>
          </div>

          {/* Warning for instant meetings */}
          {meetingType === 'instant' && (
            <div className="bg-yellow-50/80 backdrop-blur-sm rounded-xl border border-yellow-200 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <strong>Note:</strong> Instant meetings will start immediately
                and the meeting window will open automatically.
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-primary/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200 hover:shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Video className="h-4 w-4" />
                  {`Create ${meetingType === 'instant' ? 'Instant' : meetingType === 'scheduled' ? 'Scheduled' : 'Recurring'} Meeting`}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMeetingModal;
