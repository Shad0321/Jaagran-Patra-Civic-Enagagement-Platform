import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Search, Edit, Trash2, Filter, MapPin, Phone, Mail, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const MLAModal = ({ isOpen, onClose, title, onSubmit, mla, formData, setFormData, partyOptions, states, constituencies, loadingStates, loadingConstituencies, onStateChange, onInitializeData }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onInitializeData}
            className="flex items-center space-x-2 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
          >
            <RefreshCw size={16} />
            <span>Load Assembly Data</span>
          </button>
        </div>
        
        <form onSubmit={onSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Cabinet Minister, Chief Minister"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <select
                  value={formData.stateId}
                  onChange={(e) => {
                    const stateId = e.target.value;
                    setFormData({ ...formData, stateId, constituencyId: '' });
                    onStateChange(stateId);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loadingStates}
                >
                  <option value="">Select State</option>
                  {states.map(state => (
                    <option key={state.id} value={state.id}>{state.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Constituency *</label>
                <select
                  value={formData.constituencyId}
                  onChange={(e) => setFormData({ ...formData, constituencyId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loadingConstituencies || !formData.stateId}
                >
                  <option value="">Select Constituency</option>
                  {constituencies.map(constituency => (
                    <option key={constituency.id} value={constituency.id}>
                      {constituency.name} ({constituency.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Party *</label>
                <select
                  value={formData.party}
                  onChange={(e) => setFormData({ ...formData, party: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Party</option>
                  {partyOptions.map(party => (
                    <option key={party} value={party}>{party}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenure</label>
                <input
                  type="text"
                  value={formData.tenure}
                  onChange={(e) => setFormData({ ...formData, tenure: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2017-2022"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief biography or description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Achievements</label>
              <textarea
                value={formData.achievements}
                onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Key achievements and accomplishments..."
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2"
              />
              <label className="text-sm font-medium text-gray-700">Active</label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {mla ? 'Update' : 'Add'} MLA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MLAManagement = () => {
  const [mlas, setMLAs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterParty, setFilterParty] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMLA, setSelectedMLA] = useState(null);
  
  // Location data states
  const [states, setStates] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingConstituencies, setLoadingConstituencies] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    stateId: '',
    constituencyId: '',
    party: '',
    position: '',
    tenure: '',
    address: '',
    bio: '',
    achievements: '',
    isActive: true
  });

  const partyOptions = [
    'BJP', 'INC', 'AAP', 'BSP', 'SP', 'JDU', 'RJD', 'TMC', 'DMK', 'AIADMK', 'Independent', 'Other'
  ];

  useEffect(() => {
    fetchMLAs();
    fetchStates();
  }, [currentPage, searchTerm, filterParty]);

  const fetchStates = async () => {
    try {
      setLoadingStates(true);
      const response = await api.get('/admin/states');
      setStates(response.data.data || []);
    } catch (error) {
      console.error('Error fetching states:', error);
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchConstituencies = async (stateId) => {
    try {
      setLoadingConstituencies(true);
      const response = await api.get(`/admin/constituencies?stateId=${stateId}`);
      setConstituencies(response.data.data || []);
    } catch (error) {
      console.error('Error fetching constituencies:', error);
    } finally {
      setLoadingConstituencies(false);
    }
  };

  const handleStateChange = (stateId) => {
    if (stateId) {
      fetchConstituencies(stateId);
    } else {
      setConstituencies([]);
    }
  };

  const initializeLocationData = async () => {
    try {
      const response = await api.post('/admin/initialize-location-data');
      toast.success('Assembly data loaded successfully');
      fetchStates();
    } catch (error) {
      toast.error('Failed to initialize location data');
      console.error('Error initializing location data:', error);
    }
  };

  const fetchMLAs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        party: filterParty === 'all' ? '' : filterParty
      });

      const response = await api.get(`/admin/mlas?${params}`);
      setMLAs(response.data.data?.mlas || []);
      setTotalPages(response.data.data?.pagination?.pages || 1);
    } catch (error) {
      toast.error('Failed to fetch MLAs');
      console.error('Error fetching MLAs:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterParty]);

  const handleAddMLA = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/mlas', formData);
      toast.success('MLA added successfully');
      setShowAddModal(false);
      resetForm();
      fetchMLAs();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add MLA');
      console.error('Error adding MLA:', error);
    }
  };

  const handleUpdateMLA = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/mlas/${selectedMLA.id}`, formData);
      toast.success('MLA updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchMLAs();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update MLA');
      console.error('Error updating MLA:', error);
    }
  const handleDeleteMLA = async (mlaId) => {
    if (window.confirm('Are you sure you want to delete this MLA? This will also delete all associated data.')) {
      try {
        await api.delete(`/admin/mlas/${mlaId}`);
        toast.success('MLA deleted successfully');
        fetchMLAs();
      } catch (error) {
        toast.error('Failed to delete MLA');
        console.error('Error deleting MLA:', error);
      }
    }
  };

  const handleEditMLA = (mla) => {
    setSelectedMLA(mla);
    setFormData({
      name: mla.name,
      email: mla.email,
      phone: mla.phone || '',
      stateId: mla.stateId || '',
      constituencyId: mla.constituencyId || '',
      party: mla.mlaProfile?.partyName || '',
      position: mla.mlaProfile?.position || '',
      tenure: mla.mlaProfile?.tenure || '',
      address: mla.currentAddress || '',
      bio: mla.mlaProfile?.bio || '',
      achievements: mla.mlaProfile?.achievements || '',
      isActive: mla.isActive
    });
    if (mla.stateId) {
      fetchConstituencies(mla.stateId);
    }
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      stateId: '',
      constituencyId: '',
      party: '',
      position: '',
      tenure: '',
      address: '',
      bio: '',
      achievements: '',
      isActive: true
    });
    setSelectedMLA(null);
    setConstituencies([]);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">MLA Management</h1>
          <p className="text-gray-600">Manage all registered MLAs</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add MLA
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search MLAs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterParty}
              onChange={(e) => setFilterParty(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Parties</option>
              {partyOptions.map(party => (
                <option key={party} value={party}>{party}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* MLAs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (mlas || []).length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No MLAs found</p>
          </div>
        ) : (
          (mlas || []).map((mla) => (
            <div key={mla.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{mla.name}</h3>
                    <p className="text-sm text-gray-600">{mla.mlaProfile?.partyName || 'No Party'}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditMLA(mla)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMLA(mla.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  {mla.constituency?.name || 'No Constituency'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {mla.email}
                </div>
                {mla.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {mla.phone}
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  mla.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {mla.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-gray-500">
                  {mla.mlaProfile?.position || 'MLA'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add MLA Modal */}
      <MLAModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); resetForm(); }}
        title="Add New MLA"
        onSubmit={handleAddMLA}
        formData={formData}
        setFormData={setFormData}
        partyOptions={partyOptions}
        states={states}
        constituencies={constituencies}
        loadingStates={loadingStates}
        loadingConstituencies={loadingConstituencies}
        onStateChange={handleStateChange}
        onInitializeData={initializeLocationData}
      />

      {/* Edit MLA Modal */}
      <MLAModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); resetForm(); }}
        title="Edit MLA"
        onSubmit={handleUpdateMLA}
        mla={selectedMLA}
        formData={formData}
        setFormData={setFormData}
        partyOptions={partyOptions}
        states={states}
        constituencies={constituencies}
        loadingStates={loadingStates}
        loadingConstituencies={loadingConstituencies}
        onStateChange={handleStateChange}
        onInitializeData={initializeLocationData}
      />
    </div>
  );
};

export default MLAManagement;
          </div>
        ) : (
          (mlas || []).map((mla) => (
            <div key={mla.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">{mla.name}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        mla.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {mla.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditMLA(mla)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMLA(mla.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {mla.constituency}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    {mla.party}
                  </div>
                  {mla.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      {mla.email}
                    </div>
                  )}
                  {mla.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {mla.phone}
                    </div>
                  )}
                </div>
                
                {mla.bio && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600 line-clamp-3">{mla.bio}</p>
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Members: {mla.members?.length || 0}</span>
                    <span>Issues: {mla.assignedIssues?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md">
              {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add MLA Modal */}
      <MLAModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Add New MLA"
        onSubmit={handleAddMLA}
        formData={formData}
        setFormData={setFormData}
        partyOptions={partyOptions}
      />

      {/* Edit MLA Modal */}
      <MLAModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title="Edit MLA"
        onSubmit={handleUpdateMLA}
        mla={selectedMLA}
        formData={formData}
        setFormData={setFormData}
        partyOptions={partyOptions}
      />
    </div>
  );
};

export default MLAManagement;
