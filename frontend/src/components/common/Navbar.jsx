import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../redux/slices/userSlice';
import { clearLanguage } from '../../redux/slices/languageSlice';
import NotificationDropdown from './NotificationDropdown';
import { getNavigationItems, getIcon } from '../../utils/navigation.jsx';
import { toast } from 'react-toastify';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.user);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Don't show navbar on login, signup, choose-language, forgot-password, and reset-password pages
  if (
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname === '/choose-language' ||
    location.pathname === '/forgot-password' ||
    location.pathname === '/reset-password'
  ) {
    return null;
  }

  // Don't show navbar if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      dispatch(clearLanguage());
      setIsProfileDropdownOpen(false);
      setIsSidebarOpen(false);
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Function to toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Function to toggle profile dropdown
  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  return (
    <div>
      {/* Mobile Toggle Button (Visible on small screens) */}
      <div className="flex w-full justify-between items-center p-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="py-2 px-3 inline-flex justify-center items-center gap-x-2 text-start bg-gray-800 border border-gray-800 text-white text-sm font-medium rounded-lg shadow-2xs align-middle hover:bg-gray-950 focus:outline-none focus:bg-gray-900 transition-all duration-200 cursor-pointer"
            aria-haspopup="dialog"
            aria-expanded={isSidebarOpen}
            aria-controls="hs-sidebar-footer"
            aria-label="Toggle navigation"
            onClick={toggleSidebar}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
            >
              <path
                fill="currentColor"
                fillRule="evenodd"
                d="M3 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1m0 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1m0 5a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <Link
            className="hidden sm:flex flex-col leading-7 font-semibold text-2xl focus:outline-none focus:opacity-80 transition-opacity duration-200 cursor-pointer"
            to="/"
            aria-label="Brand"
          >
            <span className="text-dark font-dmsans">Jaagran</span>
            <span className="text-primary">Patra.</span>
          </Link>
        </div>
        <div className="flex gap-2 items-center">
          {user?.name && (
            <span className="text-gray-700 text-xs sm:text-sm">
              Welcome,
              <span className="!font-bold">
                {' '}
                {user?.name.split(' ')[0].slice(0, 30)}
              </span>
            </span>
          )}
          <NotificationDropdown />
          <Link
            to={'/my-account'}
            className="relative w-10 h-10 rounded-full border-3 border-primary"
          >
            <img
              className="object-cover w-full h-full rounded-full"
              src={
                user?.avatar
                  ? user.avatar
                  : 'https://img.freepik.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3407.jpg'
              }
              alt="Avatar"
            />
          </Link>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/20 bg-opacity-50"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-50 w-64 h-full bg-primary transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hs-sidebar-footer-label"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <header className="p-4 border-b border-light">
            <div className="flex items-center justify-between">
              <Link
                className="flex flex-col leading-7 font-semibold text-xl text-dark focus:outline-none focus:opacity-80 transition-opacity duration-200 cursor-pointer"
                to="/"
                onClick={() => setIsSidebarOpen(false)}
              >
                <span>Jaagran</span>
                <span className="text-light">Patra.</span>
              </Link>
              <button
                type="button"
                className="text-primary bg-light rounded-full focus:outline-none p-1 cursor-pointer hover:scale-105 transition-transform duration-200"
                onClick={() => setIsSidebarOpen(false)}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </header>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {getNavigationItems(user?.role || 'CITIZEN').map((item) => (
                <li key={item.id}>
                  <Link
                    className={`flex items-center gap-x-3 py-2 px-3 text-sm rounded-lg transition-all duration-200 cursor-pointer ${
                      location.pathname === item.path
                        ? 'bg-white text-black'
                        : 'text-white hover:bg-white/20'
                    }`}
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    {getIcon(item.icon)}
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer with User Info */}
          <footer className="p-4 border-t border-gray-700">
            <div className="relative">
              <button
                type="button"
                className="w-full flex items-center gap-x-3 py-2 px-3 text-sm text-white rounded-lg hover:bg-white/20 hover:text-white transition-all duration-200"
                onClick={toggleProfileDropdown}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img
                    className="w-full h-full object-cover"
                    src={
                      user?.avatar ||
                      'https://img.freepik.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3407.jpg'
                    }
                    alt="Profile"
                  />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{user?.name}</div>
                  <div className="text-xs text-white/80">{user?.role}</div>
                </div>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isProfileDropdownOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Profile Dropdown */}
              {isProfileDropdownOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg">
                  <div className="p-2">
                    <Link
                      to="/my-account"
                      className="block px-4 py-2 text-sm text-black hover:bg-black/10 rounded-lg"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setIsSidebarOpen(false);
                      }}
                    >
                      View Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm  text-black hover:bg-black/10 rounded-lg"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setIsSidebarOpen(false);
                      }}
                    >
                      Settings
                    </Link>
                    <hr className="my-2" />
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-black/10 rounded-lg"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
