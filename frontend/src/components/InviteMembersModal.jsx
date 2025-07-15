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
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

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
      
      // Handle the response structure: response.data.members (direct) or response.data.data.members (nested)
      const allMembers = response.data?.members || response.data?.data?.members || [];
      
      // Filter members to show only those under the current MLA's constituency
      const filteredMembers = Array.isArray(allMembers) ? allMembers : [];
      
      setMembers(filteredMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load members');
      setMembers([]); // Ensure members is always an array
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

  const filteredMembers = Array.isArray(members) ? members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const handleMemberSelect = (member) => {
    const isAlreadyInvited = currentInvitations.some(inv => inv.userId === member.id);
    if (isAlreadyInvited) {
      toast.error('This member has already been invited');
      return;
    }

    if (selectedMembers.find(m => m.id === member.id)) {
      setSelectedMembers(selectedMembers.filter(m => m.id !== member.id));
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

    const isAlreadyInvited = currentInvitations.some(inv => inv.email === newEmail);
    if (isAlreadyInvited) {
      toast.error('This email has already been invited');
      return;
    }

    setEmailInvites([...emailInvites, newEmail]);
    setNewEmail('');
  };

  const handleEmailRemove = (emailToRemove) => {
    setEmailInvites(emailInvites.filter(email => email !== emailToRemove));
  };

  const handleSendInvitations = async () => {
    const selectedCount = Array.isArray(selectedMembers) ? selectedMembers.length : 0;
    const emailCount = Array.isArray(emailInvites) ? emailInvites.length : 0;
    
    if (selectedCount === 0 && emailCount === 0) {
      toast.error('Please select at least one member or add an email');
      return;
    }

    try {
      setSendingInvitations(true);
      
      // Combine member emails and custom emails into single invitees array
      const memberEmails = Array.isArray(selectedMembers) ? selectedMembers.map(m => m.email) : [];
      const customEmails = Array.isArray(emailInvites) ? emailInvites.filter(email => email.trim()) : [];
      const allInvitees = [...memberEmails, ...customEmails];
      
      const invitationData = {
        invitees: allInvitees,
      };

      const response = await api.post(`/meetings/${meeting.id}/invite`, invitationData);
      
      const totalInvites = allInvitees.length;
      toast.success(`Invitations sent to ${totalInvites} recipients`);
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
          bgColor: 'bg-blue-100',
          label: 'Sent'
        };
      case 'ACCEPTED':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: 'Accepted'
        };
      case 'DECLINED':
        return {
          icon: <XCircle className="w-4 h-4" />,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          label: 'Declined'
        };
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          label: 'Pending'
        };
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Invite Members to Meeting
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Meeting Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-1">{meeting.title}</h3>
            <p className="text-sm text-blue-700">
              {new Date(meeting.scheduledAt).toLocaleString()}
            </p>
          </div>

          {/* Current Invitations */}
          {currentInvitations.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Current Invitations ({currentInvitations.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {currentInvitations.map((invitation) => {
                  const status = getInvitationStatus(invitation);
                  return (
                    <div key={invitation.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {invitation.user?.name || invitation.email}
                        </p>
                        <p className="text-xs text-gray-500">
                          {invitation.user?.email || invitation.email}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full gap-1 ${status.bgColor} ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search Members */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Select Members</h4>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredMembers.map((member) => {
                  const isSelected = selectedMembers.find(m => m.id === member.id);
                  const isAlreadyInvited = currentInvitations.some(inv => inv.userId === member.id);
                  
                  return (
                    <div
                      key={member.id}
                      onClick={() => !isAlreadyInvited && handleMemberSelect(member)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        isAlreadyInvited 
                          ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
                          : isSelected
                          ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                      {isAlreadyInvited ? (
                        <span className="text-xs text-gray-500">Already invited</span>
                      ) : isSelected ? (
                        <Check className="w-4 h-4 text-blue-600" />
                      ) : (
                        <div className="w-4 h-4 border border-gray-300 rounded"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Email Invitations */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Email Invitations</h4>
            <div className="flex gap-2 mb-3">
              <input
                type="email"
                placeholder="Enter email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleEmailAdd()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleEmailAdd}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {emailInvites.length > 0 && (
              <div className="space-y-2 mb-4">
                {emailInvites.map((email) => (
                  <div key={email} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <Mail className="w-4 h-4 text-gray-600" />
                    <span className="flex-1 text-sm">{email}</span>
                    <button
                      onClick={() => handleEmailRemove(email)}
                      className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Members Summary */}
          {Array.isArray(selectedMembers) && selectedMembers.length > 0 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-green-900 mb-2">
                Selected Members ({selectedMembers.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map((member) => (
                  <span
                    key={member.id}
                    className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full gap-1"
                  >
                    {member.name}
                    <button
                      onClick={() => handleMemberSelect(member)}
                      className="text-green-600 hover:text-green-800 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-gray-600">
              {selectedMembers.length + emailInvites.length} recipients selected
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvitations}
                disabled={sendingInvitations || (selectedMembers.length === 0 && emailInvites.length === 0)}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                {sendingInvitations ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
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
