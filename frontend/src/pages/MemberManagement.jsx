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
import Loader from '../components/common/Loader';

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
      // const memberIssues = membersData.reduce(
      //   (sum, m) => sum + (m.assignedIssuesCount || 0),
      //   0
      // );

      // Add MLA's own assigned issues to the total count
      const mlaIssues = mlaIssuesResponse.data.data?.issues?.length || 0;
      const totalIssues = mlaIssues;

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
      return <Clock className="h-4 w-4 text-amber-500" />;
    return <CheckCircle className="h-4 w-4 text-emerald-500" />;
  };

  if (!user) {
    return (
      <Loader
        className={'w-screen h-screen flex items-center justify-center'}
      />
    );
  }

  if (loading) {
    return (
      <Loader
        className={'w-screen h-screen flex items-center justify-center'}
      />
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
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
                  Member Management
                </h1>
                <p className="text-gray-600">
                  Manage members and view organizational hierarchy
                </p>
              </div>
              <button
                onClick={handleAddMember}
                className="bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-2.5 rounded-lg hover:shadow-md transition-all duration-200 flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Add Member</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Members
                </p>
                <p className="text-2xl font-bold text-primary">
                  {stats.totalMembers}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-emerald-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Members
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.activeMembers}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-purple-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Constituencies
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.totalBodies}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                <Building className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-amber-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Issues Assigned
                </p>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.totalIssuesAssigned}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg flex items-center justify-center shadow-lg">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Toggle and Filters */}
        <div className="mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  List View
                </button>
                <button
                  onClick={() => setViewMode('hierarchy')}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'hierarchy'
                      ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  Hierarchy View
                </button>
              </div>

              {viewMode === 'list' && (
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30"
                    />
                  </div>

                  {/* Body Type Filter */}
                  <div className="relative flex-1">
                    <select
                      value={selectedBodyType}
                      onChange={(e) => setSelectedBodyType(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 bg-white/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 appearance-none"
                    >
                      <option value="">All Body Types</option>
                      {bodyTypes.map((type) => (
                        <option key={type} value={type}>
                          {type.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'hierarchy' ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-6">
            <HierarchyTreeView
              data={hierarchyData}
              onEditMember={handleEditMember}
              onDeleteMember={handleDeleteMember}
            />
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 overflow-hidden">
            <div className="p-6 border-b border-primary/10">
              <h2 className="text-xl font-semibold text-gray-900">
                Members ({filteredMembers.length})
              </h2>
            </div>

            <div className="p-6">
              {filteredMembers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl p-5 hover:bg-white/80 transition-all duration-300 hover:shadow-md group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center border border-primary/20">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                              {member.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {member.designation || 'Member'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(member)}
                          <button
                            onClick={() => handleEditMember(member)}
                            className="p-1.5 text-gray-400 hover:text-primary transition-colors hover:bg-primary/10 rounded-lg"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors hover:bg-red-500/10 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-primary/70" />
                          <span>{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-primary/70" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-primary/70" />
                          <span>
                            {member.bodyType?.replace(/_/g, ' ') ||
                              'No Body Type'}
                          </span>
                        </div>
                        {member.body && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary/70" />
                            <span>{member.body.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-200/50">
                        <div className="flex justify-between text-xs">
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                            Issues: {member.assignedIssuesCount || 0}
                          </span>
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">
                            Resolved: {member.resolvedIssues || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-gray-200/50 shadow-sm">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      No members found
                    </h3>
                    <p className="text-gray-500 text-sm mb-4">
                      {searchTerm || selectedBodyType
                        ? 'Try adjusting your search or filters'
                        : 'Add your first member to get started'}
                    </p>
                    <button
                      onClick={handleAddMember}
                      className="px-4 py-2 bg-gradient-to-r from-primary to-primary/80 text-white text-sm font-medium rounded-lg hover:shadow-md transition-all duration-200"
                    >
                      Add New Member
                    </button>
                  </div>
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
    </div>
  );
};

export default MemberManagement;
