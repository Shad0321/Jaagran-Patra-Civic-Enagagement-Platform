import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Search, Edit, Trash2, Filter, MapPin, Phone, Mail, Building } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';

// eslint-disable-next-line no-unused-vars
const MemberModal = ({ isOpen, onClose, title, onSubmit, member, formData, setFormData, mlas, bodyTypes, localBodies, onMLAChange, onBodyTypeChange }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Councilor, Ward Member"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Associated MLA *</label>
                <select
                  value={formData.mlaId}
                  onChange={(e) => {
                    const mlaId = e.target.value;
                    setFormData({ ...formData, mlaId });
                    onMLAChange(mlaId);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select MLA *</option>
                  {mlas.map(mla => (
                    <option key={mla.id} value={mla.id}>
                      {mla.name} - {mla?.constituency || 'No Constituency'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body Type</label>
                <select
                  value={formData.bodyType}
                  onChange={(e) => {
                    const bodyType = e.target.value;
                    setFormData({ ...formData, bodyType });
                    onBodyTypeChange(bodyType);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Body Type</option>
                  {bodyTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Local Body Name</label>
                <input
                  type="text"
                  value={formData.localBodyName}
                  onChange={(e) => setFormData({ ...formData, localBodyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter local body name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter city name"
                />
              </div>
            </div>

            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Existing Local Body</label>
              <select
                value={formData.bodyId}
                onChange={(e) => setFormData({ ...formData, bodyId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Existing Local Body (Optional)</option>
                {localBodies.map(body => (
                  <option key={body.id} value={body.id}>
                    {body.name} - {body.type} ({body.constituency?.name || 'No Constituency'})
                  </option>
                ))}
              </select>
            </div> */}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of role and responsibilities..."
              />
            </div>

            {/* Password Section */}
            <div className="border-t pt-4">
              <h3 className="text-md font-medium text-gray-900 mb-3">Password Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="passwordOption"
                      value="auto"
                      checked={formData.passwordOption === 'auto'}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        passwordOption: e.target.value,
                        password: ''
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Auto-generate password</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="passwordOption"
                      value="custom"
                      checked={formData.passwordOption === 'custom'}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        passwordOption: e.target.value 
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Set custom password</span>
                  </label>
                </div>
                
                {formData.passwordOption === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter custom password (min 6 characters)"
                      minLength="6"
                    />
                  </div>
                )}
              </div>
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
              {member ? 'Update' : 'Add'} Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PasswordDisplayModal = ({ isOpen, onClose, password, userType, userName }) => {
  if (!isOpen) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    toast.success('Password copied to clipboard');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Account Created Successfully</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-gray-700">
              {userType} <strong>{userName}</strong> has been created successfully.
            </p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Generated Password
                </h3>
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                      {password}
                    </code>
                    <button
                      onClick={copyToClipboard}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-yellow-700">
                  Please save this password securely. The user will need it to log in.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const MemberManagement = () => {
  const [members, setMembers] = useState([]);
  const [mlas, setMLAs] = useState([]);
  const [localBodies, setLocalBodies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMLA, setFilterMLA] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [generatedPassword, setGeneratedPassword] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    mlaId: '',
    bodyType: '',
    bodyId: '',
    localBodyName: '',
    city: '',
    address: '',
    description: '',
    isActive: true,
    passwordOption: 'auto',
    password: ''
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
    { value: 'OTHER', label: 'Other' }
  ];

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        mlaId: filterMLA === 'all' ? '' : filterMLA
      });

      const response = await api.get(`/admin/members?${params}`);
      setMembers(response.data.data?.members || []);
      setTotalPages(response.data.data?.pagination?.pages || 1);
    } catch (error) {
      toast.error('Failed to fetch members');
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterMLA]);

  const fetchMLAs = async () => {
    try {
      const response = await api.get('/admin/mlas?all=true');
      setMLAs(response.data.data?.mlas || []);
    } catch (error) {
      console.error('Error fetching MLAs:', error);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchMLAs();
  }, [fetchMembers]);

  const fetchLocalBodies = async (stateId, constituencyId) => {
    try {
      const params = new URLSearchParams();
      if (stateId) params.append('stateId', stateId);
      if (constituencyId) params.append('constituencyId', constituencyId);

      const response = await api.get(`/admin/local-bodies?${params}`);
      setLocalBodies(response.data.data || []);
    } catch (error) {
      console.error('Error fetching local bodies:', error);
      setLocalBodies([]);
    }
  };

  const handleMLAChange = (mlaId) => {
    if (mlaId) {
      const selectedMLA = mlas.find(mla => mla.id === mlaId);
      if (selectedMLA) {
        fetchLocalBodies(selectedMLA.stateId, selectedMLA.constituencyId);
      }
    } else {
      setLocalBodies([]);
    }
  };

  const handleBodyTypeChange = (bodyType) => {
    // You can add specific logic based on body type if needed
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!formData.name || !formData.email || !formData.mlaId) {
        toast.error('Please fill in all required fields including MLA selection');
        return;
      }

      // Prepare form data
      const submitData = { ...formData };
      
      // Only include password if custom option is selected and password is provided
      if (formData.passwordOption === 'custom' && formData.password) {
        submitData.password = formData.password;
      }
      
      // Remove password option fields from submit data
      delete submitData.passwordOption;
      if (formData.passwordOption === 'auto') {
        delete submitData.password;
      }

      const response = await api.post('/admin/members', submitData);
      
      // Show success message
      if (response.data.data.password && response.data.data.isGenerated) {
        setGeneratedPassword({
          password: response.data.data.password,
          userName: formData.name,
          userType: 'Member'
        });
      } else {
        toast.success('Member added successfully');
      }
      
      setShowAddModal(false);
      resetForm();
      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add member');
      console.error('Error adding member:', error);
    }
  };

  const handleUpdateMember = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/members/${selectedMember.id}`, formData);
      toast.success('Member updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update member');
      console.error('Error updating member:', error);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        await api.delete(`/admin/members/${memberId}`);
        toast.success('Member deleted successfully');
        fetchMembers();
      } catch (error) {
        toast.error('Failed to delete member');
        console.error('Error deleting member:', error);
      }
    }
  };

  const handleEditMember = (member) => {
    setSelectedMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      designation: member.memberProfile?.designation || '',
      mlaId: member.mlaId || '',
      bodyType: member.memberProfile?.bodyType || '',
      bodyId: member.bodyId || '',
      localBodyName: member.body?.name || '',
      city: '', // Extract from address if needed
      address: member.currentAddress || '',
      description: member.memberProfile?.description || '',
      isActive: member.isActive
    });
    if (member.mlaId) {
      handleMLAChange(member.mlaId);
    }
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      designation: '',
      mlaId: '',
      bodyType: '',
      bodyId: '',
      localBodyName: '',
      city: '',
      address: '',
      description: '',
      isActive: true,
      passwordOption: 'auto',
      password: ''
    });
    setSelectedMember(null);
    setLocalBodies([]);
    setGeneratedPassword(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Member Management</h1>
          <p className="text-gray-600">Manage all registered members</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Member
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
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterMLA}
              onChange={(e) => setFilterMLA(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All MLAs</option>
              {mlas.map(mla => (
                <option key={mla.id} value={mla.id}>{mla.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <Loader/>
        ) : (members || []).length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No members found</p>
          </div>
        ) : (
          (members || []).map((member) => (
            <div key={member.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{member.name}</h3>
                    <p className="text-sm text-gray-600">{member.memberProfile?.designation || 'Member'}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditMember(member)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {member.email}
                </div>
                {member.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {member.phone}
                  </div>
                )}
                {member.body?.name && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Building className="h-4 w-4 mr-2" />
                    {member.body.name}
                  </div>
                )}
                {member.mla?.name && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    MLA: {member.mla.name}
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  member.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {member.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-gray-500">
                  {member.memberProfile?.bodyType || 'MEMBER'}
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

      {/* Add Member Modal */}
      <MemberModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); resetForm(); }}
        title="Add New Member"
        onSubmit={handleAddMember}
        formData={formData}
        setFormData={setFormData}
        mlas={mlas}
        bodyTypes={bodyTypes}
        localBodies={localBodies}
        onMLAChange={handleMLAChange}
        onBodyTypeChange={handleBodyTypeChange}
      />

      {/* Edit Member Modal */}
      <MemberModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); resetForm(); }}
        title="Edit Member"
        onSubmit={handleUpdateMember}
        member={selectedMember}
        formData={formData}
        setFormData={setFormData}
        mlas={mlas}
        bodyTypes={bodyTypes}
        localBodies={localBodies}
        onMLAChange={handleMLAChange}
        onBodyTypeChange={handleBodyTypeChange}
      />

      {/* Password Display Modal */}
      {generatedPassword && (
        <PasswordDisplayModal
          isOpen={!!generatedPassword}
          onClose={() => setGeneratedPassword(null)}
          password={generatedPassword.password}
          userType="Member"
          userName={generatedPassword.userName}
        />
      )}
    </div>
  );
};

export default MemberManagement;
