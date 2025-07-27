import React, { useState, useEffect } from 'react';
import {
  Building,
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Users,
  CheckCircle,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import AddBodyModal from '../components/AddBodyModal';
import EditBodyModal from '../components/EditBodyModal';
import Loader from '../components/common/Loader';

const BodyManagement = () => {
  const [bodies, setBodies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBodyType, setSelectedBodyType] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBody, setSelectedBody] = useState(null);
  const [stats, setStats] = useState({
    totalBodies: 0,
    activeBodies: 0,
    totalMembers: 0,
  });

  const bodyTypes = [
    { value: 'SHAKTI_KENDRA', label: 'Shakti Kendra' },
    { value: 'PANNA_PRAMUKH', label: 'Panna Pramukh' },
    { value: 'LOCAL_BODY', label: 'Local Body' },
    { value: 'POLLING_BOOTH', label: 'Polling Booth' },
    { value: 'WARD', label: 'Ward' },
    { value: 'BLOCK', label: 'Block' },
    { value: 'MANDAL', label: 'Mandal' },
    { value: 'TEHSIL', label: 'Tehsil' },
    { value: 'GRAM_PANCHAYAT', label: 'Gram Panchayat' },
    { value: 'MUNICIPALITY', label: 'Municipality' },
    { value: 'CORPORATION', label: 'Corporation' },
    { value: 'OTHER', label: 'Other' },
  ];

  useEffect(() => {
    fetchBodies();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchBodies = async () => {
    try {
      setLoading(true);
      const [bodiesResponse, membersResponse] = await Promise.all([
        api.get('/auth/bodies', {
          params: {
            type: selectedBodyType || undefined,
          },
        }),
        api.get('/auth/members', { params: { limit: 1000 } }),
      ]);

      const bodiesData = bodiesResponse.data.bodies || [];
      const membersData = membersResponse.data.members || [];

      // Add member count to each body
      const bodiesWithMembers = bodiesData.map((body) => ({
        ...body,
        memberCount: membersData.filter((m) => m.body?.id === body.id).length,
      }));

      setBodies(bodiesWithMembers);

      // Calculate stats
      const activeBodies = bodiesWithMembers.filter((b) => b.isActive).length;
      const totalMembers = membersData.length;

      setStats({
        totalBodies: bodiesWithMembers.length,
        activeBodies,
        totalMembers,
      });
    } catch (error) {
      console.error('Error fetching bodies:', error);
      toast.error('Failed to fetch bodies');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBody = () => {
    setShowAddModal(true);
  };

  const handleEditBody = (body) => {
    setSelectedBody(body);
    setShowEditModal(true);
  };

  const handleDeleteBody = async (bodyId) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this body? This will unassign all members from it.'
      )
    ) {
      return;
    }

    try {
      await api.delete(`/auth/bodies/${bodyId}`);
      toast.success('Body deleted successfully');
      fetchBodies();
    } catch (error) {
      console.error('Error deleting body:', error);
      toast.error(error.response?.data?.error || 'Failed to delete body');
    }
  };

  const filteredBodies = bodies.filter((body) => {
    const matchesSearch =
      body.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      body.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBodyType = !selectedBodyType || body.type === selectedBodyType;
    return matchesSearch && matchesBodyType;
  });

  const getBodyTypeLabel = (type) => {
    const bodyType = bodyTypes.find((bt) => bt.value === type);
    return bodyType ? bodyType.label : type.replace(/_/g, ' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
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
                  Constituency Management
                </h1>
                <p className="text-gray-600">
                  Manage political and administrative bodies in your
                  constituency
                </p>
              </div>
              <button
                onClick={handleAddBody}
                className="bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-2.5 rounded-lg hover:shadow-md transition-all duration-200 flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                <span>Add Constituency</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Constituencies
                </p>
                <p className="text-2xl font-bold text-primary">
                  {stats.totalBodies}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
                <Building className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-emerald-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Constituencies
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.activeBodies}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-purple-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Members
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.totalMembers}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Constituencies ({filteredBodies.length})
              </h2>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search bodies..."
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
                    <option value="">All Constituency Types</option>
                    {bodyTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bodies Grid */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 overflow-hidden">
          <div className="p-6">
            {filteredBodies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBodies.map((body) => (
                  <div
                    key={body.id}
                    className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl p-5 hover:bg-white/80 transition-all duration-300 hover:shadow-md group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center border border-primary/20">
                          <Building className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                            {body.name}
                          </h3>
                          <p className="text-sm text-gray-600">{body.code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {body.isActive ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <button
                          onClick={() => handleEditBody(body)}
                          className="p-1.5 text-gray-400 hover:text-primary transition-colors hover:bg-primary/10 rounded-lg"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBody(body.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors hover:bg-red-500/10 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-primary/70" />
                        <span>{getBodyTypeLabel(body.type)}</span>
                      </div>
                      {body.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary/70" />
                          <span>{body.address}</span>
                        </div>
                      )}
                      {body.contactEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-primary/70" />
                          <span>{body.contactEmail}</span>
                        </div>
                      )}
                      {body.contactPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-primary/70" />
                          <span>{body.contactPhone}</span>
                        </div>
                      )}
                      {body.description && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                          {body.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200/50">
                      <div className="flex justify-between text-xs">
                        <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                          Members: {body.memberCount || 0}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full ${
                            body.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          Status: {body.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <Building className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No constituencies found
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  {searchTerm || selectedBodyType
                    ? 'Try adjusting your search or filters'
                    : 'Add your first constituency to get started'}
                </p>
                <button
                  onClick={handleAddBody}
                  className="px-4 py-2 bg-gradient-to-r from-primary to-primary/80 text-white text-sm font-medium rounded-lg hover:shadow-md transition-all duration-200 inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add New Constituency
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <AddBodyModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            fetchBodies();
            setShowAddModal(false);
          }}
        />

        <EditBodyModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedBody(null);
          }}
          body={selectedBody}
          onSuccess={() => {
            fetchBodies();
            setShowEditModal(false);
            setSelectedBody(null);
          }}
        />
      </div>
    </div>
  );
};

export default BodyManagement;
