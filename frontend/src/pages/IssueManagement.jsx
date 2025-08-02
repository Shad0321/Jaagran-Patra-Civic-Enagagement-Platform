import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  Plus,
  Search,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle,
  X,
  MapPin,
  Mic,
  MicOff,
  Camera,
  Upload,
  Volume2,
  Send,
  Navigation, 
  Check,
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import ProgressUpdateModal from '../components/ProgressUpdateModal';
import MediaDisplay from '../components/common/MediaDisplay';
import UpdateMediaDisplay from '../components/common/UpdateMediaDisplay';
import Loader from '../components/common/Loader';

const IssueModal = ({
  isOpen,
  onClose,
  title,
  onSubmit,
  formData,
  setFormData,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [addressSelected, setAddressSelected] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const addressInputRef = useRef(null);
  const autocompleteRef = useRef(null);

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
    { value: 'OTHER', label: 'Other' },
  ];

  // const priorityOptions = [
  //   { value: 'LOW', label: 'Low', color: 'bg-blue-100 text-blue-800' },
  //   { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  //   { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800' },
  //   { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-800' },
  // ];

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (isOpen && window.google && addressInputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: 'IN' },
          fields: ['place_id', 'geometry', 'formatted_address', 'address_components'],
        }
      );

      autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
    }

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [isOpen]);

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current.getPlace();

    if (place.geometry) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      setFormData((prev) => ({
        ...prev,
        address: place.formatted_address,
        latitude: lat,
        longitude: lng,
      }));

      setAddressSelected(true);
      toast.success('Address selected successfully!');
    } else {
      toast.error('Please select a valid address from the dropdown');
      setAddressSelected(false);
    }
  };

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      address: value,
      latitude: '',
      longitude: '',
    }));
    setAddressSelected(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setFormData((prev) => ({ ...prev, voiceNote: blob }));
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
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [...selectedImages, ...files].slice(0, 5);
    setSelectedImages(newImages);
    setFormData((prev) => ({
      ...prev,
      images: newImages,
    }));
  };

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setFormData((prev) => ({
      ...prev,
      images: newImages,
    }));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Reverse geocoding to get address
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          setIsLoadingLocation(false);

          if (status === 'OK' && results[0]) {
            setFormData((prev) => ({
              ...prev,
              address: results[0].formatted_address,
              latitude: lat,
              longitude: lng,
            }));
            setAddressSelected(true);
            toast.success('Current location detected!');
          } else {
            setFormData((prev) => ({
              ...prev,
              address: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`,
              latitude: lat,
              longitude: lng,
            }));
            setAddressSelected(true);
            toast.success('Location coordinates obtained!');
          }
        });
      },
      (error) => {
        setIsLoadingLocation(false);
        toast.error('Error getting current location: ' + error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-primary/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Fill in the details to report a new issue
              </p>
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
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Title and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Issue Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                  placeholder="Brief description of the issue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                  required
                >
                  <option value="">Select Category</option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      priority: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div> */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700">
                  Address
                </label>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isLoadingLocation}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                  {isLoadingLocation ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
                      Getting...
                    </>
                  ) : (
                    <>
                      <Navigation className="h-3 w-3" />
                      Use Current Location
                    </>
                  )}
                </button>
              </div>
              <input
                ref={addressInputRef}
                type="text"
                value={formData.address}
                onChange={handleAddressChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80 ${
                  addressSelected
                    ? 'border-green-300 bg-green-50/50'
                    : 'border-primary/20'
                }`}
                placeholder="Start typing address... (Google suggestions will appear)"
              />
              {addressSelected && (
                <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                  <Check className="h-3 w-3" />
                  Valid address selected
                </div>
              )}
              {formData.address && !addressSelected && (
                <div className="mt-1 text-xs text-amber-600">
                  Please select an address from Google suggestions
                </div>
              )}
            </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location Coordinates
                </label>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="w-full px-4 py-2.5 text-left border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80 hover:bg-gray-50/80 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-primary/80 mr-2" />
                    {formData.latitude && formData.longitude ? (
                      <span className="text-gray-900">
                        {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                      </span>
                    ) : (
                      <span className="text-gray-500">Click to capture location</span>
                    )}
                  </div>
                  {isLoadingLocation && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  )}
                </button>
              </div>
            </div>

            {/* Address with Google Autocomplete */}

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows="4"
                className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                placeholder="Provide detailed description of the issue"
                required
              />
            </div>

            {/* Voice Note */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Voice Note
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`flex items-center px-4 py-2.5 rounded-lg transition-colors ${
                    isRecording
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-5 w-5 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-5 w-5 mr-2" />
                      Start Recording
                    </>
                  )}
                </button>

                {audioBlob && (
                  <div className="flex items-center gap-2 bg-gray-50/80 rounded-lg p-3">
                    <Volume2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-600">Audio recorded</span>
                    <audio controls className="h-8">
                      <source
                        src={URL.createObjectURL(audioBlob)}
                        type="audio/webm"
                      />
                    </audio>
                  </div>
                )}
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Images
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="flex items-center px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                    <Camera className="h-5 w-5 mr-2" />
                    Add Images
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-sm text-gray-500">
                    {selectedImages.length}/5 images
                  </span>
                </div>

                {selectedImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-28 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-primary/10">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200 hover:shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:shadow-md transition-all duration-200 flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Submit Issue
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const IssueDetailsModal = ({
  isOpen,
  onClose,
  issue,
  newComment,
  setNewComment,
  onAddComment,
  addingComment,
  user,
  onUpdateProgress,
}) => {
  if (!isOpen || !issue) return null;

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      RESOLVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: 'bg-blue-100 text-blue-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getUpdateTypeColor = (updateType) => {
    const colors = {
      CITIZEN_COMMENT: 'bg-gray-100 text-gray-800',
      MEMBER_UPDATE: 'bg-blue-100 text-blue-800',
      STATUS_CHANGE: 'bg-green-100 text-green-800',
      ASSIGNMENT: 'bg-purple-100 text-purple-800',
    };
    return colors[updateType] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 mr-1" />;
      case 'IN_PROGRESS':
        return <AlertCircle className="h-4 w-4 mr-1" />;
      case 'RESOLVED':
        return <CheckCircle className="h-4 w-4 mr-1" />;
      default:
        return <Clock className="h-4 w-4 mr-1" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center  z-50 p-4 pb-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-primary/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 line-clamp-1">
                {issue.title}
              </h2>
              <div className="flex items-center flex-wrap gap-2 mt-1">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusColor(issue.status)}`}
                >
                  {getStatusIcon(issue.status)}
                  {issue.status}
                </span>
                <span
                  className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(issue.priority)}`}
                >
                  {issue.priority}
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {issue.category}
                </span>
              </div>
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
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Issue Details */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Issue Details
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Description
                  </label>
                  <p className="text-gray-900 bg-gray-50/80 rounded-lg p-3">
                    {issue.description}
                  </p>
                </div>

                {/* Media Display */}
                <MediaDisplay
                  issue={issue}
                  className="rounded-lg overflow-hidden"
                />

                {issue.address && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Location
                    </label>
                    <div className="flex items-center bg-gray-50/80 rounded-lg p-3">
                      <MapPin className="h-5 w-5 text-primary/80 mr-2" />
                      <span className="text-gray-900">{issue.address}</span>
                    </div>
                  </div>
                )}

                {issue.latitude && issue.longitude && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Coordinates
                    </label>
                    <p className="text-gray-900 bg-gray-50/80 rounded-lg p-3">
                      {issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Submitted
                  </label>
                  <p className="text-gray-900 bg-gray-50/80 rounded-lg p-3">
                    {new Date(issue.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Assignment Details */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Assignment Details
              </h3>

              <div className="space-y-4">
                {issue.assignedTo ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Assigned to
                    </label>
                    <div className="bg-blue-50/80 rounded-lg p-4 border border-blue-100">
                      <p className="font-medium text-blue-900">
                        {issue.assignedTo.name}
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        {issue.assignedTo.role}
                      </p>
                      {issue.assignedTo.mlaProfile && (
                        <div className="mt-3 space-y-1 text-sm text-blue-600">
                          <p className="flex items-center">
                            <span className="font-medium">Party:</span>{' '}
                            {issue.assignedTo.mlaProfile.partyName}
                          </p>
                          <p className="flex items-center">
                            <span className="font-medium">Position:</span>{' '}
                            {issue.assignedTo.mlaProfile.position}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Status
                    </label>
                    <p className="text-gray-500 bg-gray-50/80 rounded-lg p-3">
                      Not assigned yet
                    </p>
                  </div>
                )}

                {issue.constituency && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Constituency
                    </label>
                    <p className="text-gray-900 bg-gray-50/80 rounded-lg p-3">
                      {issue.constituency.name} ({issue.constituency.type})
                    </p>
                  </div>
                )}

                {issue.state && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      State
                    </label>
                    <p className="text-gray-900 bg-gray-50/80 rounded-lg p-3">
                      {issue.state.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Updates Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              Updates & Comments
            </h3>

            {issue.updates && issue.updates.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {issue.updates.map((update, index) => (
                  <div
                    key={index}
                    className="bg-white/90 rounded-lg p-4 border border-primary/10 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-800">
                            {update.user.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {update.user.name}
                          </p>
                          <span
                            className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getUpdateTypeColor(update.updateType)}`}
                          >
                            {update.updateType.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(update.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-3">{update.message}</p>

                    {/* Update Media Display */}
                    <UpdateMediaDisplay
                      update={update}
                      className="rounded-lg overflow-hidden mb-3"
                    />

                    {update.progressPercentage && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium">Progress</span>
                          <span>{update.progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${update.progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {update.nextSteps && (
                      <div className="text-sm bg-gray-50/80 rounded-lg p-3">
                        <span className="font-medium">Next Steps:</span>{' '}
                        {update.nextSteps}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50/80 rounded-lg">
                <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No updates yet</p>
              </div>
            )}
          </div>

          {/* Add Comment/Update Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
            <h4 className="text-md font-bold text-gray-900 mb-3">
              {user?.role === 'MLA' || user?.role === 'MEMBER'
                ? 'Update Progress'
                : 'Add Comment'}
            </h4>

            {user?.role === 'MLA' || user?.role === 'MEMBER' ? (
              <div className="text-center">
                <button
                  onClick={() => onUpdateProgress(issue)}
                  className="px-6 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:shadow-md transition-all duration-200"
                >
                  Update Issue Progress
                </button>
              </div>
            ) : (
              <form onSubmit={onAddComment} className="space-y-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                  placeholder="Add your comment..."
                  disabled={addingComment}
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={addingComment || !newComment.trim()}
                    className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {addingComment ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Adding...
                      </>
                    ) : (
                      'Post Comment'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-primary/10">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200 hover:shadow-sm"
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
    images: [],
  });

  // Initialize constituency from user profile if available
  useEffect(() => {
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    if (userProfile.constituencyId) {
      setFormData((prev) => ({
        ...prev,
        constituencyId: userProfile.constituencyId,
        stateId: userProfile.stateId || 'cmcyt0pwn0000gen8kkequkpi',
      }));
    }
  }, []);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    {
      value: 'PENDING',
      label: 'Pending',
      color: 'bg-yellow-100 text-yellow-800',
      icon: Clock,
    },
    {
      value: 'IN_PROGRESS',
      label: 'In Progress',
      color: 'bg-blue-100 text-blue-800',
      icon: AlertCircle,
    },
    {
      value: 'RESOLVED',
      label: 'Resolved',
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle,
    },
    {
      value: 'REJECTED',
      label: 'Rejected',
      color: 'bg-red-100 text-red-800',
      icon: X,
    },
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priority' },
    { value: 'LOW', label: 'Low', color: 'bg-blue-100 text-blue-800' },
    {
      value: 'MEDIUM',
      label: 'Medium',
      color: 'bg-yellow-100 text-yellow-800',
    },
    { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-800' },
  ];

  const fetchIssues = useCallback(async () => {
    // Don't fetch if user data is not available
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });

      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterPriority !== 'all') params.append('priority', filterPriority);

      let endpoint = '/issues/citizen/my-issues'; // Default for citizens

      // Use different endpoints based on user role
      if (user?.role === 'MLA' || user?.role === 'MEMBER') {
        endpoint = '/issues/assigned-to-me';
      }

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
      return;
    }

    try {
      setLoadingBodies(true);
      // Get user's location data from localStorage or API
      const userProfile = JSON.parse(
        localStorage.getItem('userProfile') || '{}'
      );
      const stateId = userProfile.stateId || 'cmcyt0pwn0000gen8kkequkpi'; // Default to UK state

      const params = new URLSearchParams({ stateId });
      if (userProfile.constituencyId)
        params.append('constituencyId', userProfile.constituencyId);

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
    // Don't make API calls if user data is not loaded yet
    if (!user) {
      return;
    }

    fetchIssues();

    // Only fetch nearby bodies for citizens who can report issues
    if (user?.role === 'CITIZEN') {
      fetchNearbyBodies();
    }
  }, [fetchIssues, fetchNearbyBodies, user]);

  const handleAddIssue = async (e) => {
    e.preventDefault();
    try {
      // Debug: Check if token exists
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You are not logged in. Please login first.');
        return;
      }

      const submitData = new FormData();

      // Add text fields
      Object.keys(formData).forEach((key) => {
        if (key === 'images') {
          formData.images?.forEach((image) => {
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
      const backendMsg =
        error.response?.data?.error || error.response?.data?.message;
      toast.error(backendMsg || 'Failed to submit issue');
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
      images: [],
    });
  };

  const getStatusIcon = (status) => {
    const statusConfig = statusOptions.find((s) => s.value === status);
    if (statusConfig && statusConfig.icon) {
      const Icon = statusConfig.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <Clock className="h-4 w-4" />;
  };

  const getStatusColor = (status) => {
    const statusConfig = statusOptions.find((s) => s.value === status);
    return statusConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const priorityConfig = priorityOptions.find((p) => p.value === priority);
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
        message: newComment.trim(),
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
    <div className="p-2 sm:p-4 md:p-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-1 pt-2 truncate">
            {getPageTitle()}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base truncate">
            {getPageDescription()}
          </p>
        </div>
        {canReportIssue() && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark shadow transition-colors font-semibold w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Report Issue
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow border border-primary/10 mb-6">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary" />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-primary bg-primary/5 min-w-0"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center">
              <Filter className="h-4 w-4 text-primary mr-2" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-primary bg-primary/5 w-full sm:w-auto"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-primary bg-primary/5 w-full sm:w-auto"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {loading ? (
          <Loader />
        ) : issues.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <p className="text-primary/70">No issues found</p>
          </div>
        ) : (
          issues.map((issue) => (
            <div
              key={issue.id}
              className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary/20 flex flex-col overflow-hidden backdrop-blur-sm"
            >
              {/* Main Content Section - Image Left, Details Right */}
              <div className="p-4 sm:p-6 pb-3 sm:pb-4">
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                  {/* Media Display - Left Side */}
                  <div className="lg:w-1/3 flex-shrink-0">
                    <MediaDisplay
                      issue={issue}
                      className="rounded-lg overflow-hidden w-full min-h-48 sm:min-h-56 lg:h-full object-cover"
                    />
                  </div>

                  {/* Details - Right Side */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-4">
                      <div className="flex-1 min-w-0 w-full sm:w-auto">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 leading-tight group-hover:text-primary transition-colors duration-200">
                          {issue.title}
                        </h3>

                        {/* Status and Priority Pills */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span
                            className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${getStatusColor(issue.status)} shadow-sm hover:shadow-md`}
                          >
                            {getStatusIcon(issue.status)}
                            <span className="ml-1.5">{issue.status}</span>
                          </span>
                          <span
                            className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${getPriorityColor(issue.priority)} shadow-sm hover:shadow-md`}
                          >
                            {issue.priority}
                          </span>
                          <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200">
                            {issue.category}
                          </span>
                        </div>
                      </div>

                      {/* Date and Assignment Info */}
                      <div className="sm:text-right min-w-[120px] flex flex-col sm:items-end gap-1">
                        <div className="inline-flex items-center px-2 py-1 bg-gray-50 rounded-md">
                          <p className="text-xs sm:text-sm text-gray-600 font-medium">
                            {new Date(issue.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {issue.assignedTo && (
                          <div className="inline-flex items-center px-2 py-1 bg-blue-50 rounded-md max-w-full">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-1.5"></div>
                            <p className="text-xs sm:text-sm text-blue-700 font-medium truncate">
                              {issue.assignedTo.name}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-700 text-sm sm:text-base leading-relaxed line-clamp-3 break-words mb-4">
                      {issue.description}
                    </p>

                    {/* Address */}
                    {issue.address && (
                      <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors duration-200">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                        <span className="truncate font-medium">
                          {issue.address}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Updates Section */}
              {issue.updates && issue.updates.length > 0 && (
                <div className="px-4 sm:px-6 pb-4">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                      Recent Updates
                    </h4>
                    <div className="space-y-3">
                      {issue.updates.slice(0, 2).map((update, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-lg p-3 shadow-sm"
                        >
                          <div className="text-sm text-gray-700 leading-relaxed break-words">
                            <span className="font-semibold text-primary">
                              {update.createdBy?.name}:
                            </span>{' '}
                            {update.message}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500 font-medium">
                              {new Date(update.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <UpdateMediaDisplay
                            update={update}
                            className="mt-2 rounded-md overflow-hidden"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="mt-auto px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="text-xs sm:text-sm text-gray-500 font-medium">
                    Created: {new Date(issue.createdAt).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => handleViewDetails(issue.id)}
                    className="group/btn px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-all duration-200 font-semibold w-full sm:w-auto shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
                  >
                    <span className="flex items-center justify-center">
                      View Details
                      <svg
                        className="w-4 h-4 ml-2 transition-transform duration-200 group-hover/btn:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap justify-center mt-6 gap-2 w-full">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-xs sm:text-sm font-medium text-primary bg-white border border-primary/20 rounded-md hover:bg-primary/10 disabled:opacity-50 w-full sm:w-auto"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors w-full sm:w-auto ${
                currentPage === page
                  ? 'bg-primary text-white'
                  : 'text-primary bg-white border border-primary/20 hover:bg-primary/10'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-xs sm:text-sm font-medium text-primary bg-white border border-primary/20 rounded-md hover:bg-primary/10 disabled:opacity-50 w-full sm:w-auto"
          >
            Next
          </button>
        </div>
      )}

      {/* Add Issue Modal - Only for Citizens */}
      {canReportIssue() && (
        <IssueModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            resetForm();
          }}
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
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedIssue(null);
          setNewComment('');
        }}
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
