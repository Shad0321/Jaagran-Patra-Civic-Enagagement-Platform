import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { getUserProfile } from '../redux/slices/userSlice';
import Loader from '../components/common/Loader';

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useSelector((state) => state.user);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Fetch user profile if not already loaded
    if (!user) {
      dispatch(getUserProfile());
    }
  }, [isAuthenticated, user, dispatch, navigate]);

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">
            Manage your account information and preferences
          </p>
        </div>

        {user && (
          <div className="space-y-6">
            {/* Profile Header Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-primary to-primary/80 h-32 relative">
                <div className="absolute inset-0 bg-black/10"></div>
              </div>
              <div className="relative px-6 pb-6">
                {/* Avatar */}
                <div className="flex justify-center -mt-16 mb-4">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-white p-1 shadow-xl">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt="User Avatar"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                          <span className="text-4xl font-bold text-white">
                            {user.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Status Badge */}
                    <div className="absolute -bottom-0 -right-0">
                      <div
                        className={`w-8 h-8 rounded-full border-4 border-white shadow-lg flex items-center justify-center ${
                          user.isActive ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      >
                        <div className="w-3 h-3 rounded-full bg-white"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Name and Role */}
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {user.name}
                  </h2>
                  <div className="flex items-center justify-center gap-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                      {user.role}
                    </span>
                    {user.isVerified && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {user.isActive ? 'Active' : 'Inactive'}
                    </div>
                    <div className="text-sm text-gray-600">Account Status</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {formatDate(user.createdAt).split(',')[0]}
                    </div>
                    <div className="text-sm text-gray-600">Member Since</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {user.lastLogin
                        ? formatDate(user.lastLogin).split(',')[0]
                        : 'Never'}
                    </div>
                    <div className="text-sm text-gray-600">Last Login</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Information Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary text-sm">👤</span>
                    </div>
                    Personal Information
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Full Name</span>
                    <span className="text-gray-900 font-semibold">
                      {user.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">
                      Email Address
                    </span>
                    <span className="text-gray-900 font-semibold">
                      {user.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">
                      Phone Number
                    </span>
                    <span className="text-gray-900 font-semibold">
                      {user.phone || 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Details */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary text-sm">⚙️</span>
                    </div>
                    Account Details
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">
                      Account Status
                    </span>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        user.isActive
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}
                    >
                      {user.isActive ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">
                      Verification Status
                    </span>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        user.isVerified
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      }`}
                    >
                      {user.isVerified ? '✓ Verified' : '⏳ Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">
                      Member Since
                    </span>
                    <span className="text-gray-900 font-semibold">
                      {formatDate(user.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Information (if available) */}
            {(user.state || user.district || user.constituency) && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary text-sm">📍</span>
                    </div>
                    Location Information
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">State</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {user.state?.name || user.state || 'Not set'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">District</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {user.district?.name || user.district || 'Not set'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">
                      Constituency
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {user.constituency?.name ||
                        user.constituency ||
                        'Not set'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 pt-6">
              <Link
                to="/settings"
                className="bg-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
