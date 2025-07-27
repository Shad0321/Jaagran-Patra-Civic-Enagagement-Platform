import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Mail,
  Users,
  Search,
  Plus,
  Trash2,
  UserPlus,
  Check,
  AlertCircle,
  Send,
  User,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import Loader from './common/Loader';

const InviteMembersModal = ({ meeting, onClose, onInvitesSent }) => {
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [emailInvites, setEmailInvites] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [currentInvitations, setCurrentInvitations] = useState([]);
  const [sendingInvitations, setSendingInvitations] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/members');
      const allMembers =
        response.data?.members || response.data?.data?.members || [];
      const filteredMembers = Array.isArray(allMembers) ? allMembers : [];
      setMembers(filteredMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load members');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCurrentInvitations = useCallback(async () => {
    try {
      const response = await api.get(`/meetings/${meeting.id}/invitations`);
      setCurrentInvitations(response.data?.data?.invitations || []);
    } catch (error) {
      console.error('Error fetching current invitations:', error);
      setCurrentInvitations([]);
    }
  }, [meeting.id]);

  useEffect(() => {
    fetchMembers();
    fetchCurrentInvitations();
  }, [fetchMembers, fetchCurrentInvitations]);

  const filteredMembers = Array.isArray(members)
    ? members.filter(
        (member) =>
          member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleMemberSelect = (member) => {
    const isAlreadyInvited = currentInvitations.some(
      (inv) => inv.userId === member.id
    );
    if (isAlreadyInvited) {
      toast.error('This member has already been invited');
      return;
    }

    if (selectedMembers.find((m) => m.id === member.id)) {
      setSelectedMembers(selectedMembers.filter((m) => m.id !== member.id));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  const handleEmailAdd = () => {
    if (!newEmail.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (emailInvites.includes(newEmail)) {
      toast.error('This email has already been added');
      return;
    }

    const isAlreadyInvited = currentInvitations.some(
      (inv) => inv.email === newEmail
    );
    if (isAlreadyInvited) {
      toast.error('This email has already been invited');
      return;
    }

    setEmailInvites([...emailInvites, newEmail]);
    setNewEmail('');
  };

  const handleEmailRemove = (emailToRemove) => {
    setEmailInvites(emailInvites.filter((email) => email !== emailToRemove));
  };

  const handleSendInvitations = async () => {
    const selectedCount = selectedMembers.length;
    const emailCount = emailInvites.length;

    if (selectedCount === 0 && emailCount === 0) {
      toast.error('Please select at least one member or add an email');
      return;
    }

    try {
      setSendingInvitations(true);
      const memberEmails = selectedMembers.map((m) => m.email);
      const customEmails = emailInvites.filter((email) => email.trim());
      const allInvitees = [...memberEmails, ...customEmails];

      const response = await api.post(`/meetings/${meeting.id}/invite`, {
        invitees: allInvitees,
      });

      toast.success(`Invitations sent to ${allInvitees.length} recipients`);
      onInvitesSent(response.data);
      onClose();
    } catch (error) {
      console.error('Error sending invitations:', error);
      toast.error('Failed to send invitations');
    } finally {
      setSendingInvitations(false);
    }
  };

  const getInvitationStatus = (invitation) => {
    switch (invitation.status) {
      case 'SENT':
        return {
          icon: <Clock className="w-4 h-4" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100/80',
          borderColor: 'border-blue-200',
          label: 'Sent',
        };
      case 'ACCEPTED':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'text-green-600',
          bgColor: 'bg-green-100/80',
          borderColor: 'border-green-200',
          label: 'Accepted',
        };
      case 'DECLINED':
        return {
          icon: <XCircle className="w-4 h-4" />,
          color: 'text-red-600',
          bgColor: 'bg-red-100/80',
          borderColor: 'border-red-200',
          label: 'Declined',
        };
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100/80',
          borderColor: 'border-gray-200',
          label: 'Pending',
        };
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-primary/10 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Invite Members to Meeting
              </h2>
              <p className="text-sm text-primary/80">{meeting.title}</p>
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
          {/* Meeting Info */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Meeting Details</h3>
              <div className="flex items-center text-sm text-primary">
                <Clock className="w-4 h-4 mr-1" />
                {new Date(meeting.scheduledAt).toLocaleString()}
              </div>
            </div>
            <p className="text-gray-600">
              {meeting.description || 'No description provided'}
            </p>
          </div>

          {/* Current Invitations */}
          {currentInvitations.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
              <h3 className="font-bold text-gray-900 mb-4">
                Current Invitations ({currentInvitations.length})
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {currentInvitations.map((invitation) => {
                  const status = getInvitationStatus(invitation);
                  return (
                    <div
                      key={invitation.id}
                      className={`flex items-center gap-4 p-4 border rounded-xl ${status.borderColor} ${status.bgColor}`}
                    >
                      <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-white">
                        {invitation.user?.name?.charAt(0).toUpperCase() ||
                          invitation.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {invitation.user?.name || invitation.email}
                        </h4>
                        <p className="text-sm text-gray-600 truncate">
                          {invitation.user?.email || invitation.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-3 py-1 text-xs rounded-full border ${status.borderColor} ${status.color}`}
                        >
                          {status.icon}
                          <span className="ml-1">{status.label}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search Members */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Select Members</h3>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary/70" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader />
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {filteredMembers.map((member) => {
                  const isSelected = selectedMembers.find(
                    (m) => m.id === member.id
                  );
                  const isAlreadyInvited = currentInvitations.some(
                    (inv) => inv.userId === member.id
                  );

                  return (
                    <div
                      key={member.id}
                      onClick={() =>
                        !isAlreadyInvited && handleMemberSelect(member)
                      }
                      className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                        isAlreadyInvited
                          ? 'bg-gray-50/80 border-gray-200 cursor-not-allowed'
                          : isSelected
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-gray-200 hover:border-primary/30 hover:shadow-sm'
                      }`}
                    >
                      <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-white">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {member.name}
                        </h4>
                        <p className="text-sm text-gray-600 truncate">
                          {member.email}
                        </p>
                        {member.designation && (
                          <p className="text-xs text-gray-500 mt-1">
                            {member.designation}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {isAlreadyInvited ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                            Invited
                          </span>
                        ) : isSelected ? (
                          <div className="h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 border-2 border-gray-300 rounded-full"></div>
                        )}
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Email Invitations */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Email Invitations</h3>
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary/70" />
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleEmailAdd()}
                  className="w-full pl-10 pr-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                />
              </div>
              <button
                onClick={handleEmailAdd}
                className="px-4 py-2.5 bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg hover:shadow-md transition-all duration-200 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>

            {emailInvites.length > 0 && (
              <div className="space-y-3">
                {emailInvites.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between p-3 bg-white border border-primary/10 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-primary" />
                      <span className="text-gray-700">{email}</span>
                    </div>
                    <button
                      onClick={() => handleEmailRemove(email)}
                      className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Members Summary */}
          {(selectedMembers.length > 0 || emailInvites.length > 0) && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
              <h3 className="font-bold text-gray-900 mb-3">
                Ready to Send ({selectedMembers.length + emailInvites.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map((member) => (
                  <span
                    key={member.id}
                    className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20"
                  >
                    {member.name}
                    <button
                      onClick={() => handleMemberSelect(member)}
                      className="ml-2 text-primary/70 hover:text-primary"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {emailInvites.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center px-3 py-1 bg-blue-100/80 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
                  >
                    {email}
                    <button
                      onClick={() => handleEmailRemove(email)}
                      className="ml-2 text-blue-600/70 hover:text-blue-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-primary/10">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200 hover:shadow-sm"
            >
              Cancel
            </button>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                {selectedMembers.length + emailInvites.length} selected
              </div>
              <button
                onClick={handleSendInvitations}
                disabled={
                  sendingInvitations ||
                  (selectedMembers.length === 0 && emailInvites.length === 0)
                }
                className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sendingInvitations ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Invitations
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteMembersModal;
