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
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import AddBodyModal from '../components/AddBodyModal';
import EditBodyModal from '../components/EditBodyModal';

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
              Body Management
            </h1>
            <p className="text-gray-600">
              Manage political and administrative bodies in your constituency
            </p>
          </div>
          <button
            onClick={handleAddBody}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Body</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bodies</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalBodies}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Bodies</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.activeBodies}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.totalMembers}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Bodies ({filteredBodies.length})
        </h2>

        <div className="flex space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search bodies..."
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
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bodies Grid */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          {filteredBodies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBodies.map((body) => (
                <div
                  key={body.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Building className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {body.name}
                        </h3>
                        <p className="text-sm text-gray-600">{body.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {body.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <button
                        onClick={() => handleEditBody(body)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBody(body.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4" />
                      <span>{getBodyTypeLabel(body.type)}</span>
                    </div>
                    {body.address && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>{body.address}</span>
                      </div>
                    )}
                    {body.contactEmail && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>{body.contactEmail}</span>
                      </div>
                    )}
                    {body.contactPhone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>{body.contactPhone}</span>
                      </div>
                    )}
                    {body.description && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                        {body.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Members: {body.memberCount || 0}</span>
                      <span>
                        Status: {body.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Building className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No bodies found</p>
              <p className="text-sm">
                {searchTerm || selectedBodyType
                  ? 'Try adjusting your search or filters'
                  : 'Add your first body to get started'}
              </p>
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
  );
};

export default BodyManagement;
