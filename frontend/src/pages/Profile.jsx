import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getUserProfile } from '../redux/slices/userSlice';

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
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-xl'>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className='min-h-screen bg-gray-50'>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='bg-white rounded-lg shadow p-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-6'>My Profile</h1>
          
          {user && (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='bg-gray-50 p-4 rounded-lg'>
                <h2 className='text-lg font-semibold text-gray-800 mb-4'>Profile Information</h2>
                <div className='space-y-2'>
                  <p><span className='font-medium'>Name:</span> {user.name}</p>
                  <p><span className='font-medium'>Email:</span> {user.email}</p>
                  <p><span className='font-medium'>Phone:</span> {user.phone || 'Not provided'}</p>
                  <p><span className='font-medium'>Role:</span> {user.role}</p>
                  <p><span className='font-medium'>Status:</span> {user.isActive ? 'Active' : 'Inactive'}</p>
                  <p><span className='font-medium'>Verified:</span> {user.isVerified ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
