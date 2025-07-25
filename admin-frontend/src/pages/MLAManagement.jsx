import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Users, Plus, Search, Edit, Trash2, Filter, MapPin, Phone, Mail, RefreshCw, Camera, Upload, X } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "your_cloud_name"; // Replace with your Cloudinary cloud name
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "your_upload_preset"; // Replace with your upload preset

const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'mla_avatars'); // Optional: organize uploads in folders

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return data.secure_url; // This is the Cloudinary URL
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

const MLAModal = ({
  isOpen,
  onClose,
  title,
  onSubmit,
  mla,
  formData,
  setFormData,
  partyOptions,
  states,
  constituencies,
  loadingStates,
  loadingConstituencies,
  onStateChange,
  onInitializeData
}) => {
  const [avatarPreview, setAvatarPreview] = useState(mla?.avatar || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  // Social Links field definitions
  const socialLinksList = [
    { key: 'facebook', label: 'Facebook', placeholder: 'Facebook profile URL' },
    { key: 'twitter', label: 'Twitter', placeholder: 'Twitter profile URL' },
    { key: 'instagram', label: 'Instagram', placeholder: 'Instagram profile URL' },
    { key: 'linkedin', label: 'LinkedIn', placeholder: 'LinkedIn profile URL' },
    { key: 'website', label: 'Website', placeholder: 'Personal/Official website URL' }
  ];

  useEffect(() => {
    if (mla && mla.avatar) {
      setAvatarPreview(mla.avatar);
    } else {
      setAvatarPreview(null);
    }
    // Defensive parsing for socialLinks
    if (mla) {
      let parsedSocialLinks = {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: '',
        website: ''
      };
      if (mla.socialLinks) {
        if (typeof mla.socialLinks === 'string' && mla.socialLinks.trim() !== '') {
          try {
            const temp = JSON.parse(mla.socialLinks);
            parsedSocialLinks = { ...parsedSocialLinks, ...temp };
          } catch (error) {
            console.error('Error parsing social links:', error);
            // fallback to empty fields
          }
        } else if (typeof mla.socialLinks === 'object') {
          parsedSocialLinks = { ...parsedSocialLinks, ...mla.socialLinks };
        }
      }
      setFormData(prev => ({
        ...prev,
        socialLinks: parsedSocialLinks
      }));
    }
  }, [mla, setFormData]);

  if (!isOpen) return null;

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, or GIF)');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('File size should be less than 5MB');
        return;
      }

      // Create preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload to Cloudinary
      try {
        setIsUploadingAvatar(true);
        toast.loading('Uploading image...', { id: 'avatar-upload' });
        
        const cloudinaryUrl = await uploadToCloudinary(file);
        
        // Update form data with Cloudinary URL
        setFormData(prev => ({ ...prev, avatar: cloudinaryUrl }));
        setAvatarPreview(cloudinaryUrl);
        
        toast.success('Image uploaded successfully!', { id: 'avatar-upload' });
      } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        toast.error('Failed to upload image. Please try again.', { id: 'avatar-upload' });
        // Reset preview on error
        setAvatarPreview(mla?.avatar || null);
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setFormData(prev => ({ ...prev, avatar: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    // Validate required fields
    if (!formData.name || !formData.email || !formData.stateId || !formData.constituencyId || !formData.party) {
      toast.error('Please fill all required fields');
      setIsUploading(false);
      return;
    }

    try {
      // Create regular object instead of FormData since we're not uploading files anymore
      const submitData = {
        name: formData.name,
        email: formData.email,
        stateId: formData.stateId,
        constituencyId: formData.constituencyId,
        party: formData.party,
        isActive: formData.isActive,
        phone: formData.phone || '',
        position: formData.position || '',
        tenure: formData.tenure || '',
        address: formData.address || '',
        bio: formData.bio || '',
        achievements: formData.achievements || '',
        avatar: formData.avatar || null, // Cloudinary URL or null
      };

      // Handle password based on option
      if (formData.passwordOption === 'custom' && formData.password) {
        submitData.password = formData.password;
      }

      // Add socialLinks if any field is filled
      if (formData.socialLinks && Object.values(formData.socialLinks).some(v => v)) {
        submitData.socialLinks = JSON.stringify(formData.socialLinks);
      }

      // Call the onSubmit function with the data object
      await onSubmit(submitData);
      // Reset avatar states after successful submission
      setAvatarPreview(null);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsUploading(false);
    }
  };

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

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Avatar Upload Section */}
            <div className="border-b pb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">Profile Picture</label>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {avatarPreview ? (
                    <div className="relative">
                      <img
                        src={avatarPreview}
                        alt="Avatar Preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                      />
                      {!isUploadingAvatar && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X size={12} />
                        </button>
                      )}
                      {isUploadingAvatar && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                      {isUploadingAvatar ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                      ) : (
                        <Camera size={24} className="text-gray-400" />
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col space-y-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                    disabled={isUploadingAvatar}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload size={16} />
                    <span>{isUploadingAvatar ? 'Uploading...' : 'Upload Photo'}</span>
                  </button>
                  <p className="text-xs text-gray-500">
                    JPG, PNG or GIF. Max size 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Social Links Section */}
            <div className="border-b pb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">Social Links</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {socialLinksList.map(link => (
                  <div key={link.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{link.label}</label>
                    <input
                      type="url"
                      value={formData.socialLinks?.[link.key] || ''}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        socialLinks: {
                          ...prev.socialLinks,
                          [link.key]: e.target.value
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={link.placeholder}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Add links to MLA's social media or website (optional).</p>
            </div>

            {/* Rest of your form fields remain the same */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Cabinet Minister, Chief Minister"
                />
              </div>
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
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        passwordOption: e.target.value,
                        password: ''
                      }))}
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
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        passwordOption: e.target.value
                      }))}
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
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter custom password (min 6 characters)"
                      minLength="6"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <select
                  value={formData.stateId}
                  onChange={(e) => {
                    const stateId = e.target.value;
                    setFormData(prev => ({ ...prev, stateId, constituencyId: '' }));
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
                  onChange={(e) => setFormData(prev => ({ ...prev, constituencyId: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, party: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, tenure: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2017-2022"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief biography or description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Achievements</label>
              <textarea
                value={formData.achievements}
                onChange={(e) => setFormData(prev => ({ ...prev, achievements: e.target.value }))}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Key achievements and accomplishments..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
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
              disabled={isUploading || isUploadingAvatar}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || isUploadingAvatar}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <span>{mla ? 'Update' : 'Add'} MLA</span>
              )}
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
  const [generatedPassword, setGeneratedPassword] = useState(null);

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
    isActive: true,
    passwordOption: 'auto', // 'auto' or 'custom'
    password: ''
  });

  const partyOptions = [
    'BJP', 'INC', 'AAP', 'BSP', 'SP', 'JDU', 'RJD', 'TMC', 'DMK', 'AIADMK', 'Independent', 'Other'
  ];

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
      await api.post('/admin/initialize-location-data');
      toast.success('Assembly data loaded successfully');
      fetchStates();
    } catch (error) {
      toast.error('Failed to initialize location data');
      console.error('Error initializing location data:', error);
    }
  };

  useEffect(() => {
    fetchMLAs();
    fetchStates();
  }, [fetchMLAs]);

  const handleAddMLA = async (formData) => {
    try {
      // No need to prepare data here since it's already in FormData format
      const response = await api.post('/admin/mlas', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Show success message
      if (response.data.data.password && response.data.data.isGenerated) {
        setGeneratedPassword({
          password: response.data.data.password,
          userName: formData.get('name'), // Get name from FormData
          userType: 'MLA'
        });
      } else {
        toast.success('MLA added successfully');
      }

      setShowAddModal(false);
      resetForm();
      fetchMLAs();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to add MLA';
      toast.error(errorMessage);
      console.error('Error adding MLA:', error);
    }
  };

  const handleUpdateMLA = async (submitData) => { // <-- Accepts FormData object
    try {
      // Send the FormData object with the correct headers for file upload
      await api.put(`/admin/mlas/${selectedMLA.id}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('MLA updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchMLAs();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update MLA';
      toast.error(errorMessage);
      console.error('Error updating MLA:', error);
    }
  };

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
    // Defensive parsing for socialLinks
    let parsedSocialLinks = {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: '',
      website: ''
    };
    if (mla.socialLinks) {
      if (typeof mla.socialLinks === 'string' && mla.socialLinks.trim() !== '') {
        try {
          const temp = JSON.parse(mla.socialLinks);
          parsedSocialLinks = { ...parsedSocialLinks, ...temp };
        } catch (error) {
          console.error('Error parsing social links:', error);
          // fallback to empty fields
        }
      } else if (typeof mla.socialLinks === 'object') {
        parsedSocialLinks = { ...parsedSocialLinks, ...mla.socialLinks };
      }
    }
    setFormData({
      name: mla.name,
      email: mla.email,
      phone: mla.phone || '',
      stateId: mla.stateId || '',
      constituencyId: mla.constituencyId || '',
      party: mla.party || '',
      position: mla.position || '',
      tenure: mla.tenure || '',
      address: mla.address || '',
      bio: mla.bio || '',
      achievements: mla.achievements || '',
      isActive: mla.isActive,
      socialLinks: parsedSocialLinks
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
      isActive: true,
      passwordOption: 'auto',
      password: '',
      socialLinks: {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: '',
        website: ''
      }
    });
    setSelectedMLA(null);
    setConstituencies([]);
    setGeneratedPassword(null);
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
          <Loader/>
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
                    {
                      mla.avatar
                        ? <img src={mla.avatar} alt={mla.name} className="w-full h-full rounded-full object-cover" />
                        :
                        <Users className="h-6 w-6 text-blue-600" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{mla.name}</h3>
                    <p className="text-sm text-gray-600">{mla?.party || 'No Party'}</p>
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
                  {mla.constituency || 'No Constituency'}
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
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${mla.isActive
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
                className={`px-3 py-2 text-sm font-medium rounded-md ${currentPage === page
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

      {/* Password Display Modal */}
      <PasswordDisplayModal
        isOpen={generatedPassword !== null}
        onClose={() => setGeneratedPassword(null)}
        password={generatedPassword?.password}
        userType={generatedPassword?.userType}
        userName={generatedPassword?.userName}
      />
    </div>
  );
};

export default MLAManagement;
