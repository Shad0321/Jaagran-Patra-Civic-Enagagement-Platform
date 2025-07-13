import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Plus, Search, Filter, AlertCircle, Clock, CheckCircle, X, MapPin, Mic, MicOff, Camera, Upload, Volume2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ProgressUpdateModal from '../components/ProgressUpdateModal';
import MediaDisplay from '../components/common/MediaDisplay';
import UpdateMediaDisplay from '../components/common/UpdateMediaDisplay';

// eslint-disable-next-line no-unused-vars
const IssueModal = ({ isOpen, onClose, title, onSubmit, formData, setFormData, nearbyBodies, loadingBodies }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);

  const categoryOptions = [
    { value: 'INFRASTRUCTURE', label: 'Infrastructure' },
    { value: 'WATER_SUPPLY', label: 'Water Supply' },
    { value: 'ELECTRICITY', label: 'Electricity' },
    { value: 'SANITATION', label: 'Sanitation' },
    { value: 'ROADS', label: 'Roads' },
    { value: 'HEALTH', label: 'Health' },
    { value: 'EDUCATION', label: 'Education' },
    { value: 'POLLUTION', label: 'Pollution' },
    { value: 'SAFETY', label: 'Safety' },
    { value: 'OTHER', label: 'Other' }
  ];

  const priorityOptions = [
    { value: 'LOW', label: 'Low', color: 'bg-blue-100 text-blue-800' },
    { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setFormData(prev => ({ ...prev, voiceNote: blob }));
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
        console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(prev => [...prev, ...files]);
    setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...files] }));
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({ 
      ...prev, 
      images: prev.images?.filter((_, i) => i !== index) || []
    }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          toast.success('Location captured successfully');
        },
        (error) => {
            console.error('Error getting location:', error);
          toast.error('Could not get location');
        }
      );
    } else {
      toast.error('Geolocation not supported');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        
        <form onSubmit={onSubmit}>
          <div className="space-y-4">
            {/* Title and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the issue"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Category</option>
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority and Assign to Body */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Body</label>
                <select
                  value={formData.bodyId}
                  onChange={(e) => setFormData(prev => ({ ...prev, bodyId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loadingBodies}
                >
                  <option value="">Select Body (Optional)</option>
                  {nearbyBodies.map(body => (
                    <option key={body.id} value={body.id}>
                      {body.name} - {body.constituency?.name || 'Unknown'}
                    </option>
                  ))}
                </select>
              </div> */}
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter the location address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="w-full px-3 py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {formData.latitude && formData.longitude 
                      ? `${formData.latitude.toFixed(4)}, ${formData.longitude.toFixed(4)}`
                      : 'Click to capture location'
                    }
                  </div>
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Provide detailed description of the issue"
                required
              />
            </div>

            {/* Audio Recording */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Voice Note</label>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`flex items-center px-4 py-2 rounded-md ${
                    isRecording 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {isRecording ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </button>
                
                {audioBlob && (
                  <div className="flex items-center space-x-2">
                    <Volume2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Audio recorded</span>
                    <audio controls className="h-8">
                      <source src={URL.createObjectURL(audioBlob)} type="audio/webm" />
                    </audio>
                  </div>
                )}
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <label className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md cursor-pointer hover:bg-gray-200">
                    <Camera className="h-4 w-4 mr-2" />
                    Add Images
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-sm text-gray-500">Max 5 images</span>
                </div>
                
                {selectedImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
              Submit Issue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const IssueDetailsModal = ({ isOpen, onClose, issue, newComment, setNewComment, onAddComment, addingComment, user, onUpdateProgress }) => {
  if (!isOpen || !issue) return null;

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'RESOLVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'LOW': 'bg-blue-100 text-blue-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'URGENT': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getUpdateTypeColor = (updateType) => {
    const colors = {
      'CITIZEN_COMMENT': 'bg-gray-100 text-gray-800',
      'MEMBER_UPDATE': 'bg-blue-100 text-blue-800',
      'STATUS_CHANGE': 'bg-green-100 text-green-800',
      'ASSIGNMENT': 'bg-purple-100 text-purple-800'
    };
    return colors[updateType] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{issue.title}</h2>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(issue.status)}`}>
                {issue.status}
              </span>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(issue.priority)}`}>
                {issue.priority}
              </span>
              <span className="text-sm text-gray-500">{issue.category}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Issue Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600">Description</label>
                <p className="text-gray-900">{issue.description}</p>
              </div>
              
              {/* Media Display */}
              <MediaDisplay issue={issue} className="my-4" />
              
              {issue.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Location</label>
                  <div className="flex items-center text-gray-900">
                    <MapPin className="h-4 w-4 mr-1" />
                    {issue.address}
                  </div>
                </div>
              )}

              {(issue.latitude && issue.longitude) && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Coordinates</label>
                  <p className="text-gray-900">{issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-600">Submitted</label>
                <p className="text-gray-900">{new Date(issue.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Assignment Details</h3>
            <div className="space-y-3">
              {issue.assignedTo ? (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Assigned to</label>
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="font-medium text-blue-900">{issue.assignedTo.name}</p>
                    <p className="text-sm text-blue-700">{issue.assignedTo.role}</p>
                    {issue.assignedTo.mlaProfile && (
                      <div className="mt-2 text-sm text-blue-600">
                        <p>Party: {issue.assignedTo.mlaProfile.partyName}</p>
                        <p>Position: {issue.assignedTo.mlaProfile.position}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Status</label>
                  <p className="text-gray-500">Not assigned yet</p>
                </div>
              )}

              {issue.constituency && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Constituency</label>
                  <p className="text-gray-900">{issue.constituency.name} ({issue.constituency.type})</p>
                </div>
              )}

              {issue.state && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">State</label>
                  <p className="text-gray-900">{issue.state.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Updates Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Updates & Comments</h3>
          {issue.updates && issue.updates.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {issue.updates.map((update, index) => (
                <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{update.user.name}</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getUpdateTypeColor(update.updateType)}`}>
                        {update.updateType.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(update.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{update.message}</p>
                  
                  {/* Update Media Display */}
                  <UpdateMediaDisplay update={update} className="mt-2" />
                  
                  {update.progressPercentage && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{update.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${update.progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  {update.nextSteps && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Next Steps:</span> {update.nextSteps}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No updates yet.</p>
          )}
        </div>

        {/* Add Comment Section */}
        <div className="border-t pt-4">
          <h4 className="text-md font-semibold mb-3">
            {user?.role === 'MLA' || user?.role === 'MEMBER' ? 'Update Progress' : 'Add Comment'}
          </h4>
          
          {user?.role === 'MLA' || user?.role === 'MEMBER' ? (
            <div className="text-center">
              <button
                onClick={() => onUpdateProgress(issue)}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Update Issue Progress
              </button>
            </div>
          ) : (
            <form onSubmit={onAddComment}>
              <div className="flex space-x-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows="3"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add your comment..."
                  disabled={addingComment}
                />
                <button
                  type="submit"
                  disabled={addingComment || !newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingComment ? 'Adding...' : 'Comment'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const IssueManagement = () => {
  const { user } = useSelector((state) => state.user);
  const [issues, setIssues] = useState([]);
  const [nearbyBodies, setNearbyBodies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingBodies, setLoadingBodies] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'MEDIUM',
    address: '',
    latitude: null,
    longitude: null,
    stateId: 'cmcyt0pwn0000gen8kkequkpi', // Default to UK state
    constituencyId: '',
    bodyId: '',
    voiceNote: null,
    images: []
  });

  // Initialize constituency from user profile if available
  useEffect(() => {
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    if (userProfile.constituencyId) {
      setFormData(prev => ({
        ...prev,
        constituencyId: userProfile.constituencyId,
        stateId: userProfile.stateId || 'cmcyt0pwn0000gen8kkequkpi'
      }));
    }
  }, []);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'PENDING', label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
    { value: 'RESOLVED', label: 'Resolved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { value: 'REJECTED', label: 'Rejected', color: 'bg-red-100 text-red-800', icon: X }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priority' },
    { value: 'LOW', label: 'Low', color: 'bg-blue-100 text-blue-800' },
    { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  const fetchIssues = useCallback(async () => {
    // Don't fetch if user data is not available
    if (!user) {
      console.log('🔍 fetchIssues - User not available, skipping');
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterPriority !== 'all') params.append('priority', filterPriority);

      let endpoint = '/issues/citizen/my-issues'; // Default for citizens
      
      // Use different endpoints based on user role
      if (user?.role === 'MLA' || user?.role === 'MEMBER') {
        endpoint = '/issues/assigned-to-me';
      }

      console.log('🔍 fetchIssues - User role:', user?.role, 'Endpoint:', endpoint);
      
      const response = await api.get(`${endpoint}?${params}`);
      setIssues(response.data.data.issues || []);
      setTotalPages(response.data.data.pagination?.pages || 1);
    } catch (error) {
      toast.error('Failed to fetch issues');
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterStatus, filterPriority, user]);

  const fetchNearbyBodies = useCallback(async () => {
    // Don't fetch if user data is not available
    if (!user) {
      console.log('🔍 fetchNearbyBodies - User not available, skipping');
      return;
    }

    try {
      setLoadingBodies(true);
      console.log('🔍 fetchNearbyBodies - User role:', user?.role);
      
      // Get user's location data from localStorage or API
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      const stateId = userProfile.stateId || 'cmcyt0pwn0000gen8kkequkpi'; // Default to UK state
      
      const params = new URLSearchParams({ stateId });
      if (userProfile.constituencyId) params.append('constituencyId', userProfile.constituencyId);

      const response = await api.get(`/issues/citizen/nearby-bodies?${params}`);
      setNearbyBodies(response.data.data || []);
    } catch (error) {
      console.error('Error fetching nearby bodies:', error);
      setNearbyBodies([]);
    } finally {
      setLoadingBodies(false);
    }
  }, [user]);

  useEffect(() => {
    console.log('🔍 IssueManagement useEffect - User role:', user?.role, 'User available:', !!user);
    
    // Don't make API calls if user data is not loaded yet
    if (!user) {
      console.log('🔍 User not loaded yet, skipping API calls');
      return;
    }
    
    fetchIssues();
    
    // Only fetch nearby bodies for citizens who can report issues
    if (user?.role === 'CITIZEN') {
      console.log('🔍 Fetching nearby bodies for CITIZEN');
      fetchNearbyBodies();
    } else {
      console.log('🔍 Skipping nearby bodies for role:', user?.role);
    }
  }, [fetchIssues, fetchNearbyBodies, user]);

  const handleAddIssue = async (e) => {
    e.preventDefault();
    try {
      // Debug: Check if token exists
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token);
      
      if (!token) {
        toast.error('You are not logged in. Please login first.');
        return;
      }

      const submitData = new FormData();
      
      // Add text fields
      Object.keys(formData).forEach(key => {
        if (key === 'images') {
          formData.images?.forEach(image => {
            submitData.append('images', image);
          });
        } else if (key === 'voiceNote' && formData.voiceNote) {
          submitData.append('voiceNote', formData.voiceNote);
        } else if (formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });

      // Set default state if not provided
      if (!formData.stateId) {
        submitData.append('stateId', 'cmcyt0pwn0000gen8kkequkpi'); // Default UK state
      }

      console.log('Submitting issue with data:', Array.from(submitData.entries()));

      const response = await api.post('/issues/citizen', submitData);
      
      // Show success message with assignment info if available
      let successMessage = 'Issue submitted successfully';
      if (response.data.issue?.assignedTo) {
        successMessage += ` and assigned to ${response.data.issue.assignedTo.name}`;
      }
      
      toast.success(successMessage);
      setShowAddModal(false);
      resetForm();
      fetchIssues();
    } catch (error) {
      console.error('Error submitting issue:', error);
      toast.error(error.response?.data?.error || 'Failed to submit issue');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      priority: 'MEDIUM',
      address: '',
      latitude: null,
      longitude: null,
      stateId: 'cmcyt0pwn0000gen8kkequkpi', // Default to UK state
      constituencyId: '',
      bodyId: '',
      voiceNote: null,
      images: []
    });
  };

  const getStatusIcon = (status) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    if (statusConfig && statusConfig.icon) {
      const Icon = statusConfig.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <Clock className="h-4 w-4" />;
  };

  const getStatusColor = (status) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    return statusConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const priorityConfig = priorityOptions.find(p => p.value === priority);
    return priorityConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const handleViewDetails = async (issueId) => {
    try {
      let endpoint = `/issues/citizen/${issueId}/details`; // Default for citizens
      
      // Use different endpoints based on user role
      if (user?.role === 'MLA' || user?.role === 'MEMBER') {
        endpoint = `/issues/${issueId}`; // Generic endpoint for MLAs and Members
      }

      const response = await api.get(endpoint);
      setSelectedIssue(response.data.issue);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching issue details:', error);
      toast.error('Failed to fetch issue details');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    // This function is only for citizens now
    if (user?.role !== 'CITIZEN') return;

    try {
      setAddingComment(true);
      await api.post(`/issues/citizen/${selectedIssue.id}/comment`, {
        message: newComment.trim()
      });
      
      toast.success('Comment added successfully');
      setNewComment('');
      // Refresh issue details
      handleViewDetails(selectedIssue.id);
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setAddingComment(false);
    }
  };

  // Get title and description based on user role
  const getPageTitle = () => {
    switch (user?.role) {
      case 'MLA':
        return 'Assigned Issues';
      case 'MEMBER':
        return 'My Assigned Issues';
      default:
        return 'My Issues';
    }
  };

  const getPageDescription = () => {
    switch (user?.role) {
      case 'MLA':
        return 'Manage and track issues assigned to you and your team';
      case 'MEMBER':
        return 'Manage and track issues assigned to you';
      default:
        return 'Track and manage your submitted issues';
    }
  };

  const canReportIssue = () => {
    // Only citizens can report new issues
    return user?.role === 'CITIZEN' || !user?.role;
  };

  const handleUpdateProgress = (issue) => {
    setSelectedIssue(issue);
    setShowProgressModal(true);
  };

  const handleProgressUpdate = () => {
    setShowProgressModal(false);
    fetchIssues(); // Refresh the issues list
    if (showDetailsModal) {
      // If details modal is open, refresh the issue details
      handleViewDetails(selectedIssue.id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
          <p className="text-gray-600">{getPageDescription()}</p>
        </div>
        {canReportIssue() && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Report Issue
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No issues found</p>
          </div>
        ) : (
          issues.map((issue) => (
            <div key={issue.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{issue.title}</h3>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(issue.status)}`}>
                      {getStatusIcon(issue.status)}
                      <span className="ml-1">{issue.status}</span>
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(issue.priority)}`}>
                      {issue.priority}
                    </span>
                    <span className="text-xs text-gray-500">{issue.category}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </p>
                  {issue.assignedTo && (
                    <p className="text-sm text-blue-600">
                      Assigned to: {issue.assignedTo.name}
                    </p>
                  )}
                </div>
              </div>
              
              <p className="text-gray-700 mb-3">{issue.description}</p>
              
              {/* Media Display */}
              <MediaDisplay issue={issue} className="mb-3" />
              
              {issue.address && (
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  {issue.address}
                </div>
              )}
              
              {issue.updates && issue.updates.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Updates</h4>
                  <div className="space-y-2">
                    {issue.updates.slice(0, 2).map((update, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        <span className="font-medium">{update.createdBy?.name}:</span> {update.message}
                        <span className="text-xs text-gray-500 ml-2">
                          {new Date(update.createdAt).toLocaleDateString()}
                        </span>
                        <UpdateMediaDisplay update={update} className="mt-1" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Created: {new Date(issue.createdAt).toLocaleDateString()}
                </div>
                <button
                  onClick={() => handleViewDetails(issue.id)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  View Details
                </button>
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
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Issue Modal - Only for Citizens */}
      {canReportIssue() && (
        <IssueModal
          isOpen={showAddModal}
          onClose={() => { setShowAddModal(false); resetForm(); }}
          title="Report New Issue"
          onSubmit={handleAddIssue}
          formData={formData}
          setFormData={setFormData}
          nearbyBodies={nearbyBodies}
          loadingBodies={loadingBodies}
        />
      )}

      {/* Issue Details Modal */}
      <IssueDetailsModal
        isOpen={showDetailsModal}
        onClose={() => { setShowDetailsModal(false); setSelectedIssue(null); setNewComment(''); }}
        issue={selectedIssue}
        newComment={newComment}
        setNewComment={setNewComment}
        onAddComment={handleAddComment}
        addingComment={addingComment}
        user={user}
        onUpdateProgress={handleUpdateProgress}
      />

      {/* Progress Update Modal */}
      <ProgressUpdateModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        issue={selectedIssue}
        onUpdate={handleProgressUpdate}
      />
    </div>
  );
};

export default IssueManagement;
