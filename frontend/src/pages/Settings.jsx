import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setLanguage } from '../redux/slices/languageSlice';
import {
  updateUserProfile,
  changePassword,
  clearError,
} from '../redux/slices/userSlice';
import { Check, User, Lock, Globe, Save } from 'lucide-react';
import { toast } from 'react-toastify';

const Settings = () => {
  const dispatch = useDispatch();
  const { selectedLanguage } = useSelector((state) => state.language);
  const { user, loading, error } = useSelector((state) => state.user);

  // Show backend error as toast
  useEffect(() => {
    if (error) {
      console.log('API Error:', error);
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
    avatar: '', // This will be the URL string
  });
  const [avatarFile, setAvatarFile] = useState(null); // For file upload
  const [avatarPreview, setAvatarPreview] = useState('');

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
      });
      setAvatarPreview(user.avatar || '');
      setAvatarFile(null);
    }
  }, [user]);

  const languages = [
    { id: 'hindi', name: 'हिंदी', value: 'हिंदी' },
    { id: 'english', name: 'English', value: 'English' },
  ];

  const handleLanguageChange = (language) => {
    setCurrentLanguage(language);
    dispatch(setLanguage(language));
    setSuccessMessage('Language updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleProfileChange = (e) => {
    const { name, value, type, files } = e.target;
    if (name === 'avatar' && type === 'file') {
      const file = files[0];
      setAvatarFile(file);
      console.log('Selected avatar file:', file);
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAvatarPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
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
      console.log('Submitting profile update. avatarFile:', avatarFile);
      if (avatarFile) {
        payload = new FormData();
        payload.append('name', profileData.name);
        payload.append('phone', profileData.phone);
        payload.append('avatar', avatarFile);
        isFormData = true;
        // Debug: log FormData content
        for (let pair of payload.entries()) {
          console.log('FormData:', pair[0], pair[1]);
        }
      } else {
        payload = { ...profileData };
        console.log('Payload (no avatar):', payload);
      }
      // Pass a flag to the thunk so it can set headers
      await dispatch(updateUserProfile({ data: payload, isFormData })).unwrap();
      setSuccessMessage('Profile updated successfully!');
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
                  className={`${
                    activeTab === tab.id
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

                  <div>
                    <label
                      htmlFor="avatar"
                      className="block text-sm font-medium text-gray-700"
                    >
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
                    {/* Optionally show current avatar URL as fallback */}
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

                {/* Backend error is now shown as toast, not inline */}
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
                      className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 flex items-center justify-between ${
                        currentLanguage === language.value
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
