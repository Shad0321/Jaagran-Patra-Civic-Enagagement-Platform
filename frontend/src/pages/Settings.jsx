import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setLanguage } from '../redux/slices/languageSlice';
import {
  updateUserProfile,
  changePassword,
  clearError,
} from '../redux/slices/userSlice';
import { Check, User, Lock, Globe, Save, MapPin, Navigation, Image } from 'lucide-react';
import { toast } from 'react-toastify';
import { changeGoogleTranslateLanguage } from '../utils/googletranslatehelper';
import { languages } from '../utils/constants';

const Settings = () => {
  const dispatch = useDispatch();
  const { selectedLanguage } = useSelector((state) => state.language);
  const { user, loading, error } = useSelector((state) => state.user);

  // Location state
  const [addressSelected, setAddressSelected] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const addressInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  // Show backend error as toast
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const [currentLanguage, setCurrentLanguage] = useState(selectedLanguage);
  const [activeTab, setActiveTab] = useState('profile');
  const [successMessage, setSuccessMessage] = useState('');

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    avatar: '',
    dateOfBirth: '',
    gender: '',
    currentAddress: '',
    currentLatitude: '',
    currentLongitude: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (window.google && addressInputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: 'IN' },
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

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(
          autocompleteRef.current
        );
        autocompleteRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        gender: user.gender || '',
        currentAddress: user.currentAddress || '',
        currentLatitude: user.currentLatitude || '',
        currentLongitude: user.currentLongitude || '',
      });
      setAvatarPreview(user.avatar || '');
      setAvatarFile(null);
      setAddressSelected(!!(user.currentAddress && user.currentLatitude && user.currentLongitude));
    }
  }, [user]);

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current.getPlace();

    if (place.geometry) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      setProfileData((prev) => ({
        ...prev,
        currentAddress: place.formatted_address,
        currentLatitude: lat.toString(),
        currentLongitude: lng.toString(),
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
    setProfileData((prev) => ({
      ...prev,
      currentAddress: value,
      currentLatitude: '',
      currentLongitude: '',
    }));
    setAddressSelected(false);
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
            setProfileData((prev) => ({
              ...prev,
              currentAddress: results[0].formatted_address,
              currentLatitude: lat.toString(),
              currentLongitude: lng.toString(),
            }));
            setAddressSelected(true);
            toast.success('Current location detected!');
          } else {
            setProfileData((prev) => ({
              ...prev,
              currentAddress: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`,
              currentLatitude: lat.toString(),
              currentLongitude: lng.toString(),
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

  const handleLanguageChange = async (language) => {
    try {
      setCurrentLanguage(language);
      dispatch(setLanguage(language));
      const selectedLangObj = languages.find((lang) => lang.value === language);
      if (selectedLangObj) {
        await changeGoogleTranslateLanguage(selectedLangObj.code);
      }
    } catch (error) {
      console.error('Error setting language:', error);
    }
    setSuccessMessage('Language updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleProfileChange = (e) => {
    const { name, value, type, files } = e.target;
    if (name === 'avatar' && type === 'file') {
      const file = files[0];
      if (file) {
        if (file.size > 1024 * 1024) {
          toast.error('Photo size should not exceed 1MB');
          setAvatarFile(null);
          setAvatarPreview(profileData.avatar || '');
          return;
        }
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setAvatarPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setAvatarFile(null);
        setAvatarPreview(profileData.avatar || '');
      }
    } else {
      setProfileData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPasswordError('');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      let payload,
        isFormData = false;
      if (avatarFile) {
        payload = new FormData();
        payload.append('name', profileData.name);
        payload.append('phone', profileData.phone);
        payload.append('avatar', avatarFile);
        isFormData = true;
      } else {
        payload = { ...profileData };
      }
      await dispatch(updateUserProfile({ data: payload, isFormData })).unwrap();
      setSuccessMessage('Profile updated successfully!');
      toast.success('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Profile update failed:', error);
    }
  };

  const validatePasswordForm = () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setPasswordError('All fields are required');
      return false;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return false;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return false;
    }

    return true;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    try {
      await dispatch(
        changePassword({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        })
      ).unwrap();
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setSuccessMessage('Password changed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Password change failed:', error);
    }
  };

  const clearErrorHandler = () => {
    dispatch(clearError());
    setPasswordError('');
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'language', name: 'Language', icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">
            Manage your account preferences and security
          </p>
        </div>

        {successMessage && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Check className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 cursor-pointer`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Profile Information
                </h3>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={profileData.name}
                        onChange={handleProfileChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="dateOfBirth"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        id="dateOfBirth"
                        name="dateOfBirth"
                        value={profileData.dateOfBirth}
                        onChange={handleProfileChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="gender"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Gender
                      </label>
                      <select
                        id="gender"
                        name="gender"
                        value={profileData.gender}
                        onChange={handleProfileChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  {/* Location Information Section */}
                  <div className="space-y-4">
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary/80" />
                        Location Information
                      </h4>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Current Address
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
                        name="currentAddress"
                        value={profileData.currentAddress}
                        onChange={handleAddressChange}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 bg-white ${addressSelected
                            ? 'border-green-300 bg-green-50/50'
                            : 'border-gray-300'
                          }`}
                        placeholder="Start typing address... (Google suggestions will appear)"
                      />
                      {addressSelected && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                          <Check className="h-3 w-3" />
                          Valid address selected
                        </div>
                      )}
                      {profileData.currentAddress && !addressSelected && (
                        <div className="mt-1 text-xs text-amber-600">
                          Please select an address from Google suggestions
                        </div>
                      )}
                    </div>

                    {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Latitude
                        </label>
                        <input
                          type="text"
                          name="currentLatitude"
                          value={profileData.currentLatitude}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 sm:text-sm"
                          placeholder="Auto-filled from address"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Longitude
                        </label>
                        <input
                          type="text"
                          name="currentLongitude"
                          value={profileData.currentLongitude}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 sm:text-sm"
                          placeholder="Auto-filled from address"
                        />
                      </div>
                    </div> */}
                  </div>

                  <div>
                    <label
                      htmlFor="avatar"
                      className="font-medium text-gray-700 flex justify-start items-center gap-1"
                    >
                      <Image className="inline-block mr-1 text-primary" size={18} />
                      Avatar
                    </label>
                    <div className="flex items-center gap-4 mt-1">
                      <input
                        type="file"
                        id="avatar"
                        name="avatar"
                        accept="image/*"
                        onChange={handleProfileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                      />
                      {avatarPreview && (
                        <img
                          src={avatarPreview}
                          alt="Avatar Preview"
                          className="w-12 h-12 rounded-full object-cover border"
                        />
                      )}
                    </div>
                    {!avatarPreview && profileData.avatar && (
                      <div className="mt-2 text-xs text-gray-500 break-all">
                        Current: {profileData.avatar}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Change Password
                </h3>

                {passwordError && (
                  <div className="mb-6 rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          {passwordError}
                        </h3>
                      </div>
                      <div className="ml-auto pl-3">
                        <button
                          type="button"
                          onClick={clearErrorHandler}
                          className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 cursor-pointer"
                        >
                          <span className="sr-only">Dismiss</span>
                          <svg
                            className="h-3 w-3"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="currentPassword"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-sm font-medium text-gray-700"
                    >
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={
                        loading ||
                        !passwordData.currentPassword ||
                        !passwordData.newPassword ||
                        !passwordData.confirmPassword
                      }
                      className="flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      {loading ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Language Tab */}
            {activeTab === 'language' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Language Preference
                </h3>

                <div className="space-y-3">
                  {languages.map((language) => (
                    <button
                      key={language.id}
                      onClick={() => handleLanguageChange(language.value)}
                      className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 flex items-center justify-between ${currentLanguage === language.value
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                        } cursor-pointer`}
                    >
                      <span className="font-medium">{language.name}</span>
                      {currentLanguage === language.value && (
                        <Check className="w-5 h-5" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Current Language:</strong> {currentLanguage}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Language changes are saved automatically
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;