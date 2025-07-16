import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  MapPin,
  Mail,
  Phone,
  Building,
  UserCheck,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import AddMemberModal from '../components/AddMemberModal';
import EditMemberModal from '../components/EditMemberModal';
import HierarchyTreeView from '../components/HierarchyTreeView';

const MemberManagement = () => {
  const { user } = useSelector((state) => state.user);
  const [members, setMembers] = useState([]);
  const [hierarchyData, setHierarchyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBodyType, setSelectedBodyType] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'hierarchy'
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalBodies: 0,
    totalIssuesAssigned: 0,
  });

  const bodyTypes = [
    'SHAKTI_KENDRA',
    'PANNA_PRAMUKH',
    'LOCAL_BODY',
    'POLLING_BOOTH',
    'WARD',
    'BLOCK',
    'MANDAL',
    'TEHSIL',
    'GRAM_PANCHAYAT',
    'MUNICIPALITY',
    'CORPORATION',
    'OTHER',
  ];

  useEffect(() => {
    if (user && user.id) {
      fetchMembers();
      fetchHierarchyData();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMembers = async () => {
    if (!user || !user.id) {
      console.log('User data not available yet');
      return;
    }

    try {
      setLoading(true);

      // Fetch both members and MLA's own assigned issues
      const [membersResponse, mlaIssuesResponse] = await Promise.all([
        api.get('/auth/members', {
          params: {
            limit: 100,
            bodyType: selectedBodyType || undefined,
            search: searchTerm || undefined,
          },
        }),
        api.get('/issues/assigned-to-me'),
      ]);

      setMembers(membersResponse.data.members || []);

      // Calculate stats
      const membersData = membersResponse.data.members || [];
      const activeMembers = membersData.filter((m) => m.isActive).length;
      const uniqueBodies = new Set(
        membersData.map((m) => m.body?.id).filter(Boolean)
      ).size;
      const memberIssues = membersData.reduce(
        (sum, m) => sum + (m.assignedIssuesCount || 0),
        0
      );

      // Add MLA's own assigned issues to the total count
      const mlaIssues = mlaIssuesResponse.data.data?.issues?.length || 0;
      const totalIssues = memberIssues + mlaIssues;

      setStats({
        totalMembers: membersData.length,
        activeMembers,
        totalBodies: uniqueBodies,
        totalIssuesAssigned: totalIssues,
      });
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  const fetchHierarchyData = async () => {
    if (!user || !user.id) {
      console.log('User data not available yet');
      return;
    }

    try {
      // Fetch hierarchy data: MLA -> Bodies -> Members
      const [bodiesResponse, membersResponse] = await Promise.all([
        api.get('/auth/bodies'),
        api.get('/auth/members', { params: { limit: 1000 } }),
      ]);

      const allBodies = bodiesResponse.data.bodies || [];
      const allMembers = membersResponse.data.members || [];

      // Group members by body
      const membersByBody = allMembers.reduce((acc, member) => {
        const bodyId = member.body?.id || 'unassigned';
        if (!acc[bodyId]) acc[bodyId] = [];
        acc[bodyId].push(member);
        return acc;
      }, {});

      console.log('Members by body:', membersByBody);
      console.log('All members:', allMembers);
      console.log('All bodies:', allBodies);

      // Filter bodies to only include those that have members under this MLA
      const bodiesWithMembers = allBodies.filter((body) => {
        const membersInBody = membersByBody[body.id] || [];
        return membersInBody.length > 0;
      });

      // Create hierarchy structure
      const hierarchy = {
        mla: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'MLA',
          totalMembers: allMembers.length,
        },
        bodies: bodiesWithMembers.map((body) => ({
          ...body,
          members: membersByBody[body.id] || [],
          memberCount: (membersByBody[body.id] || []).length,
        })),
        unassignedMembers: membersByBody.unassigned || [],
      };

      setHierarchyData(hierarchy);
    } catch (error) {
      console.error('Error fetching hierarchy data:', error);
      toast.error('Failed to fetch hierarchy data');
    }
  };

  const handleAddMember = () => {
    setShowAddModal(true);
  };

  const handleEditMember = (member) => {
    setSelectedMember(member);
    setShowEditModal(true);
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to delete this member?')) {
      return;
    }

    try {
      await api.delete(`/auth/members/${memberId}`);
      toast.success('Member deleted successfully');
      fetchMembers();
      fetchHierarchyData();
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('Failed to delete member');
    }
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBodyType =
      !selectedBodyType || member.bodyType === selectedBodyType;
    return matchesSearch && matchesBodyType;
  });

  const getStatusIcon = (member) => {
    if (!member.isActive)
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (member.assignedIssuesCount > 0)
      return <Clock className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading user data...</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Member Management
            </h1>
            <p className="text-gray-600">
              Manage members and view organizational hierarchy
            </p>
          </div>
          <button
            onClick={handleAddMember}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalMembers}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Active Members
              </p>
              <p className="text-2xl font-bold text-green-600">
                {stats.activeMembers}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bodies</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.totalBodies}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Building className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Issues Assigned
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.totalIssuesAssigned}
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex space-x-4">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('hierarchy')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'hierarchy'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Hierarchy View
          </button>
        </div>

        {viewMode === 'list' && (
          <div className="flex space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Body Type Filter */}
            <select
              value={selectedBodyType}
              onChange={(e) => setSelectedBodyType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Body Types</option>
              {bodyTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === 'hierarchy' ? (
        <HierarchyTreeView
          data={hierarchyData}
          onEditMember={handleEditMember}
          onDeleteMember={handleDeleteMember}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Members ({filteredMembers.length})
            </h2>
          </div>

          <div className="p-6">
            {filteredMembers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {member.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {member.designation || 'Member'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(member)}
                        <button
                          onClick={() => handleEditMember(member)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>{member.email}</span>
                      </div>
                      {member.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4" />
                        <span>
                          {member.bodyType?.replace(/_/g, ' ') ||
                            'No Body Type'}
                        </span>
                      </div>
                      {member.body && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>{member.body.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Issues: {member.assignedIssuesCount || 0}</span>
                        <span>Resolved: {member.resolvedIssues || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No members found</p>
                <p className="text-sm">
                  {searchTerm || selectedBodyType
                    ? 'Try adjusting your search or filters'
                    : 'Add your first member to get started'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <AddMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          fetchMembers();
          fetchHierarchyData();
          setShowAddModal(false);
        }}
      />

      <EditMemberModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
        onSuccess={() => {
          fetchMembers();
          fetchHierarchyData();
          setShowEditModal(false);
          setSelectedMember(null);
        }}
      />
    </div>
  );
};

export default MemberManagement;
