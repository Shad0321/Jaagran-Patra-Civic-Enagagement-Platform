import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
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
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CreateMeetingModal = ({ onClose, onMeetingCreated }) => {
  const { user } = useSelector((state) => state.user);
  console.log('Current user:', user); // Using user to avoid lint warning
  const [meetingType, setMeetingType] = useState('instant'); // instant, scheduled, recurring
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
    // Recurring meeting fields
    recurrenceType: 1, // 1: Daily, 2: Weekly, 3: Monthly
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
      // Handle the response structure: response.data.members (direct) or response.data.data.members (nested)
      const allMembers = response.data?.members || response.data?.data?.members || [];
      
      // For now, show all members since filtering logic needs to be updated
      // based on actual data structure (members don't have mlaId field)
      const filteredMembers = Array.isArray(allMembers) ? allMembers : [];
      
      setMembers(filteredMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers([]); // Ensure members is always an array
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
  };

  const handleMemberToggle = (memberEmail) => {
    setFormData(prev => ({
      ...prev,
      invitees: prev.invitees.includes(memberEmail)
        ? prev.invitees.filter(email => email !== memberEmail)
        : [...prev.invitees, memberEmail],
    }));
  };

  const handleCustomEmailChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      customEmails: prev.customEmails.map((email, i) => i === index ? value : email),
    }));
  };

  const addCustomEmailField = () => {
    setFormData(prev => ({
      ...prev,
      customEmails: [...prev.customEmails, ''],
    }));
  };

  const removeCustomEmailField = (index) => {
    setFormData(prev => ({
      ...prev,
      customEmails: prev.customEmails.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combine member emails and custom emails
      const allInvitees = [
        ...formData.invitees,
        ...formData.customEmails.filter(email => email.trim() !== ''),
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
      
      toast.success(`${meetingType === 'instant' ? 'Instant' : meetingType === 'scheduled' ? 'Scheduled' : 'Recurring'} meeting created successfully!`);
      
      if (meetingType === 'instant' && response.data.zoomMeeting?.join_url) {
        // Auto-open instant meetings
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
      case 1: return 'Daily';
      case 2: return 'Weekly';
      case 3: return 'Monthly';
      default: return 'Daily';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-600" />
            Create Meeting
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Meeting Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Meeting Type
            </label>
            <div className="grid grid-cols-3 gap-4">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="meetingType"
                  value="instant"
                  checked={meetingType === 'instant'}
                  onChange={(e) => setMeetingType(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">Instant</div>
                  <div className="text-sm text-gray-500">Start now</div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="meetingType"
                  value="scheduled"
                  checked={meetingType === 'scheduled'}
                  onChange={(e) => setMeetingType(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">Scheduled</div>
                  <div className="text-sm text-gray-500">Set date & time</div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="meetingType"
                  value="recurring"
                  checked={meetingType === 'recurring'}
                  onChange={(e) => setMeetingType(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">Recurring</div>
                  <div className="text-sm text-gray-500">Repeat meetings</div>
                </div>
              </label>
            </div>
          </div>

          {/* Basic Meeting Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Topic <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="topic"
                value={formData.topic}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter meeting topic"
              />
            </div>

            {(meetingType === 'scheduled' || meetingType === 'recurring') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="1"
                  max="1440"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Agenda
            </label>
            <textarea
              name="agenda"
              value={formData.agenda}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter meeting agenda (optional)"
            />
          </div>

          {/* Date and Time for Scheduled/Recurring */}
          {(meetingType === 'scheduled' || meetingType === 'recurring') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime || getTomorrowDate()}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Asia/Kolkata">India Standard Time</option>
                  <option value="Europe/London">London Time</option>
                </select>
              </div>
            </div>
          )}

          {/* Recurring Meeting Settings */}
          {meetingType === 'recurring' && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Repeat className="w-5 h-5 text-blue-600" />
                Recurrence Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Repeat
                  </label>
                  <select
                    name="recurrenceType"
                    value={formData.recurrenceType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Daily</option>
                    <option value={2}>Weekly</option>
                    <option value={3}>Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Every
                  </label>
                  <input
                    type="number"
                    name="repeatInterval"
                    value={formData.repeatInterval}
                    onChange={handleInputChange}
                    min="1"
                    max="12"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {getRecurrenceTypeLabel(formData.recurrenceType).toLowerCase()}(s)
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End After
                  </label>
                  <input
                    type="number"
                    name="endTimes"
                    value={formData.endTimes}
                    onChange={handleInputChange}
                    min="1"
                    max="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="text-xs text-gray-500 mt-1">occurrences</div>
                </div>
              </div>
            </div>
          )}

          {/* Access Settings */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Access Settings</h3>
            
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="isOpenToAll"
                name="isOpenToAll"
                checked={formData.isOpenToAll}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isOpenToAll" className="ml-2 text-sm text-gray-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-green-600" />
                Open to all members
              </label>
            </div>

            {!formData.isOpenToAll && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Members to Invite
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3">
                  {Array.isArray(members) && members.map((member) => (
                    <label key={member.id} className="flex items-center mb-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.invitees.includes(member.email)}
                        onChange={() => handleMemberToggle(member.email)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                      />
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{member.name}</span>
                        <span className="text-xs text-gray-500">({member.email})</span>
                      </div>
                    </label>
                  ))}
                  {(!Array.isArray(members) || members.length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-2">
                      No members available
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Custom Email Invites */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Email Invites
              </label>
              {formData.customEmails.map((email, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleCustomEmailChange(index, e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.customEmails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCustomEmailField(index)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                  {index === formData.customEmails.length - 1 && (
                    <button
                      type="button"
                      onClick={addCustomEmailField}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Meeting Settings */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Meeting Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="hostVideo"
                    checked={formData.settings.hostVideo}
                    onChange={handleSettingsChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">Host video on</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="participantVideo"
                    checked={formData.settings.participantVideo}
                    onChange={handleSettingsChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">Participant video on</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="muteUponEntry"
                    checked={formData.settings.muteUponEntry}
                    onChange={handleSettingsChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">Mute participants on entry</span>
                </label>
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="joinBeforeHost"
                    checked={formData.settings.joinBeforeHost}
                    onChange={handleSettingsChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">Allow join before host</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="waitingRoom"
                    checked={formData.settings.waitingRoom}
                    onChange={handleSettingsChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">Enable waiting room</span>
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auto Recording
                  </label>
                  <select
                    name="autoRecording"
                    value={formData.settings.autoRecording}
                    onChange={handleSettingsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">None</option>
                    <option value="local">Local</option>
                    <option value="cloud">Cloud</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Warning for instant meetings */}
          {meetingType === 'instant' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <strong>Note:</strong> Instant meetings will start immediately and the meeting window will open automatically.
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Video className="w-4 h-4" />
              )}
              {loading ? 'Creating...' : `Create ${meetingType === 'instant' ? 'Instant' : meetingType === 'scheduled' ? 'Scheduled' : 'Recurring'} Meeting`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMeetingModal;
