import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../redux/slices/userSlice';
import { clearLanguage } from '../../redux/slices/languageSlice';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.user);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [openSubAccordion, setOpenSubAccordion] = useState(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Don't show navbar on login, signup, choose-language, forgot-password, and reset-password pages
  if (
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
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Function to toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Function to toggle accordion sections
  const toggleAccordion = (id) => {
    setOpenAccordion(openAccordion === id ? null : id);
    // Close any open sub-accordions when parent closes or a different parent opens
    if (openAccordion === id || openAccordion !== id) {
      setOpenSubAccordion(null);
    }
  };

  // Function to toggle sub-accordion sections
  const toggleSubAccordion = (id) => {
    setOpenSubAccordion(openSubAccordion === id ? null : id);
  };

  // Function to toggle profile dropdown
  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  if (window.location.pathname === '/login') {
    return null; // Do not render the Navbar on the login page
  }

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
            <span className="text-dark">Jaagran</span>
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
          <div className="relative bg-blue-400/50 w-fit p-2 text-blue-500 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 16 16"
            >
              <path
                fill="currentColor"
                fillRule="evenodd"
                d="m4.665 7.822l.62-3.096a2.77 2.77 0 0 1 5.43 0l.62 3.096a4.8 4.8 0 0 0 1.305 2.44l.194.193a.567.567 0 0 1-.273.953l-.821.19a16.6 16.6 0 0 1-7.48 0l-.82-.19a.567.567 0 0 1-.274-.953l.194-.193a4.77 4.77 0 0 0 1.305-2.44m-1.47-.294l.619-3.096a4.27 4.27 0 0 1 8.372 0l.62 3.096c.126.634.438 1.216.895 1.673l.194.194a2.066 2.066 0 0 1-.997 3.475l-.821.19q-1.053.24-2.12.358a2 2 0 0 1-3.913 0a18 18 0 0 1-2.12-.359l-.822-.19a2.067 2.067 0 0 1-.997-3.474L2.3 9.2c.457-.457.769-1.04.895-1.673"
                clipRule="evenodd"
              />
            </svg>
            <span className="absolute -top-0 -right-0 bg-blue-500 text-light px-1 text-xs rounded-full animate-pulse">
              4
            </span>
          </div>
          <div className="relative w-10 h-10 rounded-full border-3 border-primary">
            <img
              className="object-cover w-full h-full rounded-full"
              src={
                user?.avatar
                  ? user.avatar
                  : 'https://img.freepik.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3407.jpg'
              }
              alt="Avatar"
            />
          </div>
        </div>
      </div>

      {/* Sidebar Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className={`fixed inset-0 bg-black/20 bg-opacity-50 z-50 transition-opacity duration-300 ${
            isSidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div
        id="hs-sidebar-footer"
        className={`fixed top-0 start-0 bottom-0 z-60 w-64 h-full bg-primary  transition-transform duration-300 ease-in-out rounded-r-2xl
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        tabIndex="-1"
        aria-label="Sidebar"
      >
        <div className="relative flex flex-col h-full max-h-full">
          {/* Header */}
          <header className="p-4 flex justify-between items-center gap-x-2">
            <Link
              className="flex flex-col leading-7 font-semibold text-2xl focus:outline-none focus:opacity-80 transition-opacity duration-200 cursor-pointer"
              to="/"
              aria-label="Brand"
            >
              <span className="text-dark">Jaagran</span>
              <span className="text-light">Patra.</span>
            </Link>

            {/* Close Button for Mobile */}
            <div className="-me-2">
              <button
                type="button"
                className="flex justify-center items-center gap-x-3 size-6 bg-white border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:bg-gray-100 transition-all duration-200 cursor-pointer"
                onClick={toggleSidebar}
              >
                <svg
                  className="shrink-0 size-4"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
                <span className="sr-only">Close</span>
              </button>
            </div>
          </header>

          {/* Navigation */}
          <nav className="h-full overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300">
            <div className="pb-0 px-2 w-full flex flex-col flex-wrap">
              <ul className="space-y-1">
                <li>
                  <Link
                    className="flex items-center gap-x-3.5 py-2 px-2.5 bg-gray-100 text-sm text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition-all duration-200 cursor-pointer"
                    to="/dashboard"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <svg
                      className="size-4"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    Dashboard
                  </Link>
                </li>

                {/* Users Accordion */}
                <li className="relative">
                  <button
                    type="button"
                    className="w-full text-start flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-white rounded-lg hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:bg-gray-100 focus:text-gray-800 transition-all duration-200 cursor-pointer"
                    aria-expanded={openAccordion === 'users-accordion'}
                    onClick={() => toggleAccordion('users-accordion')}
                  >
                    <svg
                      className="size-4"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Users
                    <svg
                      className={`ms-auto size-4 text-current transition-transform duration-300 ${openAccordion === 'users-accordion' ? 'rotate-180' : ''}`}
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {/* Accordion Content */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${openAccordion === 'users-accordion' ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <ul className="pt-1 ps-7 space-y-1">
                      <li className="relative">
                        <button
                          type="button"
                          className="w-full text-start flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-white rounded-lg hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:bg-gray-100 focus:text-gray-800 transition-all duration-200 cursor-pointer"
                          aria-expanded={openSubAccordion === 'users-sub-1'}
                          onClick={() => toggleSubAccordion('users-sub-1')}
                        >
                          Sub Menu 1
                          <svg
                            className={`ms-auto size-4 text-current transition-transform duration-300 ${openSubAccordion === 'users-sub-1' ? 'rotate-180' : ''}`}
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </button>
                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${openSubAccordion === 'users-sub-1' ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
                        >
                          <ul className="pt-1 ps-2 space-y-1">
                            <li>
                              <Link
                                className="flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-white rounded-lg hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:bg-gray-100 focus:text-gray-800 transition-all duration-200 cursor-pointer"
                                to="/users/sub1/link1"
                                onClick={() => setIsSidebarOpen(false)}
                              >
                                Link 1
                              </Link>
                            </li>
                            <li>
                              <Link
                                className="flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-white rounded-lg hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:bg-gray-100 focus:text-gray-800 transition-all duration-200 cursor-pointer"
                                to="/users/sub1/link2"
                                onClick={() => setIsSidebarOpen(false)}
                              >
                                Link 2
                              </Link>
                            </li>
                            <li>
                              <Link
                                className="flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-white rounded-lg hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:bg-gray-100 focus:text-gray-800 transition-all duration-200 cursor-pointer"
                                to="/users/sub1/link3"
                                onClick={() => setIsSidebarOpen(false)}
                              >
                                Link 3
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </li>

                      <li className="relative">
                        <button
                          type="button"
                          className="w-full text-start flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-white rounded-lg hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:bg-gray-100 focus:text-gray-800 transition-all duration-200 cursor-pointer"
                          aria-expanded={openSubAccordion === 'users-sub-2'}
                          onClick={() => toggleSubAccordion('users-sub-2')}
                        >
                          Sub Menu 2
                          <svg
                            className={`ms-auto size-4 text-current transition-transform duration-300 ${openSubAccordion === 'users-sub-2' ? 'rotate-180' : ''}`}
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </button>
                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${openSubAccordion === 'users-sub-2' ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
                        >
                          <ul className="pt-1 ps-2 space-y-1">
                            <li>
                              <Link
                                className="flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-white rounded-lg hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:bg-gray-100 focus:text-gray-800 transition-all duration-200 cursor-pointer"
                                to="/users/sub2/link1"
                                onClick={() => setIsSidebarOpen(false)}
                              >
                                Link 1
                              </Link>
                            </li>
                            <li>
                              <Link
                                className="flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-white rounded-lg hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:bg-gray-100 focus:text-gray-800 transition-all duration-200 cursor-pointer"
                                to="/users/sub2/link2"
                                onClick={() => setIsSidebarOpen(false)}
                              >
                                Link 2
                              </Link>
                            </li>
                            <li>
                              <Link
                                className="flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-white rounded-lg hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:bg-gray-100 focus:text-gray-800 transition-all duration-200 cursor-pointer"
                                to="/users/sub2/link3"
                                onClick={() => setIsSidebarOpen(false)}
                              >
                                Link 3
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </li>
                    </ul>
                  </div>
                </li>

                {/* Account Accordion */}
                <li className="relative">
                  <button
                    type="button"
                    className="w-full text-start flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-white rounded-lg hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:bg-gray-100 focus:text-gray-800 transition-all duration-200 cursor-pointer"
                    aria-expanded={openAccordion === 'account-accordion'}
                    onClick={() => toggleAccordion('account-accordion')}
                  >
                    <svg
                      className="size-4"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="18" cy="15" r="3" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M10 15H6a4 4 0 0 0-4 4v2" />
                      <path d="m21.7 16.4-.9-.3" />
                      <path d="m15.2 13.9-.9-.3" />
                      <path d="m16.6 18.7.3-.9" />
                      <path d="m19.1 12.2.3-.9" />
                      <path d="m19.6 18.7-.4-1" />
                      <path d="m16.8 12.3-.4-1" />
                      <path d="m14.3 16.6 1-.4" />
                      <path d="m20.7 13.8 1-.4" />
                    </svg>
                    Account
                    <svg
                      className={`ms-auto size-4 text-current transition-transform duration-300 ${openAccordion === 'account-accordion' ? 'rotate-180' : ''}`}
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${openAccordion === 'account-accordion' ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <ul className="pt-1 ps-7 space-y-1">
                      <li>
                        <Link
                          className="flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-white rounded-lg hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:bg-gray-100 focus:text-gray-800 transition-all duration-200 cursor-pointer"
                          to="/account/link1"
                          onClick={() => setIsSidebarOpen(false)}
                        >
                          Link 1
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-white rounded-lg hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:bg-gray-100 focus:text-gray-800 transition-all duration-200 cursor-pointer"
                          to="/account/link2"
                          onClick={() => setIsSidebarOpen(false)}
                        >
                          Link 2
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-white rounded-lg hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:bg-gray-100 focus:text-gray-800 transition-all duration-200 cursor-pointer"
                          to="/account/link3"
                          onClick={() => setIsSidebarOpen(false)}
                        >
                          Link 3
                        </Link>
                      </li>
                    </ul>
                  </div>
                </li>

                {/* Projects Accordion */}
                <li className="relative">
                  <button
                    type="button"
                    className="w-full text-start flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-white rounded-lg hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:bg-gray-100 focus:text-gray-800 transition-all duration-200 cursor-pointer"
                    aria-expanded={openAccordion === 'projects-accordion'}
                    onClick={() => toggleAccordion('projects-accordion')}
                  >
                    <svg
                      className="size-4"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8c.4 0 .8-.2 1.1-.5.3-.3.5-.7.5-1.1V6.5L15.5 2z" />
                      <path d="M3 7.6v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8" />
                      <path d="M15 2v5h5" />
                    </svg>
                    Chats/Calls
                    <svg
                      className={`ms-auto size-4 text-current transition-transform duration-300 ${openAccordion === 'projects-accordion' ? 'rotate-180' : ''}`}
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${openAccordion === 'projects-accordion' ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <ul className="pt-1 ps-7 space-y-1">
                      <li>
                        <Link
                          className="flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-white rounded-lg hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:bg-gray-100 focus:text-gray-800 transition-all duration-200 cursor-pointer"
                          to="/projects/link1"
                          onClick={() => setIsSidebarOpen(false)}
                        >
                          Group Chat
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-white rounded-lg hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:bg-gray-100 focus:text-gray-800 transition-all duration-200 cursor-pointer"
                          to="/projects/link2"
                          onClick={() => setIsSidebarOpen(false)}
                        >
                          Video Call
                        </Link>
                      </li>
                    </ul>
                  </div>
                </li>

                <li>
                  <Link
                    className="w-full flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-white rounded-lg hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:bg-gray-100 focus:text-gray-800 transition-all duration-200 cursor-pointer"
                    to="/calendar"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <svg
                      className="size-4"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                      <line x1="16" x2="16" y1="2" y2="6" />
                      <line x1="8" x2="8" y1="2" y2="6" />
                      <line x1="3" x2="21" y1="10" y2="10" />
                      <path d="M8 14h.01" />
                      <path d="M12 14h.01" />
                      <path d="M16 14h.01" />
                      <path d="M8 18h.01" />
                      <path d="M12 18h.01" />
                      <path d="M16 18h.01" />
                    </svg>
                    Calendar{' '}
                    <span className="ms-auto py-0.5 px-1.5 inline-flex items-center gap-x-1.5 text-xs bg-gray-200 text-gray-800 rounded-full">
                      New
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    className="w-full flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-white rounded-lg hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:bg-gray-100 focus:text-gray-800 transition-all duration-200 cursor-pointer"
                    to="/documentation"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <svg
                      className="size-4"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                    About
                  </Link>
                </li>
              </ul>
            </div>
          </nav>

          {/* Footer with Profile Dropdown */}
          <footer className="mt-auto p-2 border-t border-gray-200">
            <div className="relative w-full inline-flex">
              <button
                type="button"
                className="w-full inline-flex shrink-0 items-center gap-x-2 p-2 text-start text-sm text-white rounded-md hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:bg-gray-100 focus:text-gray-800 transition-all duration-200 cursor-pointer"
                aria-haspopup="menu"
                aria-expanded={isProfileDropdownOpen}
                aria-label="Dropdown"
                onClick={toggleProfileDropdown}
              >
                <img
                  className="shrink-0 size-5 rounded-full"
                  src={
                    user?.avatar ||
                    'https://img.freepik.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3407.jpg'
                  }
                  alt="Avatar"
                />
                {user?.name || 'User'}
                <svg
                  className={`shrink-0 size-3.5 ms-auto transition-transform duration-300 ${isProfileDropdownOpen ? 'rotate-180' : ''}`}
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m7 9 5-5 5 5" />
                  <path d="m7 15 5 5 5-5" />
                </svg>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div
                  className={`absolute bottom-full mb-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20 origin-bottom transition-all duration-300 ease-out transform ${
                    isProfileDropdownOpen
                      ? 'scale-100 opacity-100'
                      : 'scale-95 opacity-0'
                  }`}
                  role="menu"
                  aria-orientation="vertical"
                >
                  <div className="p-1">
                    <Link
                      className="flex items-center gap-x-3 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:bg-gray-100 transition-all duration-200 cursor-pointer"
                      to="/my-account"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setIsSidebarOpen(false);
                      }}
                    >
                      My account
                    </Link>
                    <Link
                      className="flex items-center gap-x-3 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:bg-gray-100 transition-all duration-200 cursor-pointer"
                      to="/settings"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setIsSidebarOpen(false);
                      }}
                    >
                      Settings
                    </Link>
                    {/* <Link className="flex items-center gap-x-3 py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:bg-gray-100 transition-all duration-200 cursor-pointer" to="/billing" onClick={() => { setIsProfileDropdownOpen(false); setIsSidebarOpen(false); }}>
                      Billing
                    </Link> */}
                    <button
                      className="flex items-center gap-x-3 py-2 px-3 rounded-lg text-sm text-red-500 hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:bg-gray-100 transition-all duration-200 cursor-pointer"
                      onClick={handleSignOut}
                    >
                      Sign out
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
