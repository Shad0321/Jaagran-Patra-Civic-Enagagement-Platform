import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Building,
  Check,
  MapPin,
  Phone,
  Mail,
  User,
  ChevronDown,
  Navigation,
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import Loader from './common/Loader';

const AddBodyModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    headName: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [loading, setLoading] = useState(false);
  const [addressSelected, setAddressSelected] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const addressInputRef = useRef(null);
  const autocompleteRef = useRef(null);

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

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (
      isOpen &&
      window.google &&
      addressInputRef.current &&
      !autocompleteRef.current
    ) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: 'IN' }, // Restrict to India
          fields: [
            'place_id',
            'geometry',
            'formatted_address',
            'address_components',
          ],
        }
      );

      autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
    }

    // Cleanup on unmount or modal close
    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(
          autocompleteRef.current
        );
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
        latitude: lat.toString(),
        longitude: lng.toString(),
      }));

      setAddressSelected(true);
      toast.success('Address selected successfully!');
    } else {
      toast.error('Please select a valid address from the dropdown');
      setAddressSelected(false);
    }
  };

  // Handle manual address input (reset coordinates when typing)
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

  // Get current location
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
              latitude: lat.toString(),
              longitude: lng.toString(),
            }));
            setAddressSelected(true);
            toast.success('Current location detected!');
          } else {
            // Even if geocoding fails, we can still use the coordinates
            setFormData((prev) => ({
              ...prev,
              address: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`,
              latitude: lat.toString(),
              longitude: lng.toString(),
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.code || !formData.type) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if address is selected and has coordinates
    if (formData.address && (!formData.latitude || !formData.longitude)) {
      toast.error(
        'Please select a valid address from Google suggestions or use current location'
      );
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/bodies', formData);
      toast.success('Body added successfully');
      onSuccess();
      resetForm();
    } catch (error) {
      console.error('Error adding body:', error);
      toast.error(error.response?.data?.error || 'Failed to add body');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      type: '',
      description: '',
      address: '',
      latitude: '',
      longitude: '',
      headName: '',
      contactEmail: '',
      contactPhone: '',
    });
    setAddressSelected(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 pb-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-primary/10 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Add New Constituency
              </h2>
              <p className="text-sm text-primary/80">
                Create a new political/administrative constituency
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                  placeholder="Enter body name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Code *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                  placeholder="Enter unique code"
                  required
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Body Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80 appearance-none"
                  required
                >
                  <option value="">Select body type</option>
                  {bodyTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-10 h-4 w-4 text-primary/70 pointer-events-none" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                  placeholder="Brief description of the body"
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary/80" />
              Location Information
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
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
                  name="address"
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

              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude}
                    readOnly
                    step="any"
                    className="w-full px-4 py-2.5 border border-primary/20 rounded-lg bg-gray-50/80 text-gray-600"
                    placeholder="Auto-filled from address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    name="longitude"
                    value={formData.longitude}
                    readOnly
                    step="any"
                    className="w-full px-4 py-2.5 border border-primary/20 rounded-lg bg-gray-50/80 text-gray-600"
                    placeholder="Auto-filled from address"
                  />
                </div>
              </div> */}
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary/80" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Head/Leader Name
                </label>
                <input
                  type="text"
                  name="headName"
                  value={formData.headName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                  placeholder="Name of the head/leader"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                  placeholder="Contact phone number"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white/80"
                  placeholder="Contact email address"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-primary/10">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-200 hover:shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Add
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBodyModal;
