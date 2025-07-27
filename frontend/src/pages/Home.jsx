import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ShieldCheck,
  Users,
  MapPinned,
  MessageCircle,
  CalendarClock,
  Newspaper,
  Menu,
  X,
  Home as HomeIcon,
  LogOut,
  ChevronRight,
  Sparkles,
  Award,
  TrendingUp,
} from 'lucide-react';
import logo from '../assets/new_logo/logo.png';
import { logoutUser } from '../redux/slices/userSlice';
import { toast } from 'react-toastify';
import { clearLanguage } from '../redux/slices/languageSlice';

const Home = () => {
  const { isAuthenticated } = useSelector((state) => state.user);
  const { isLanguageSelected } = useSelector((state) => state.language);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isLanguageSelected) {
      navigate('/choose-language');
    }
  }, [isLanguageSelected, navigate]);

  const navItems = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Dashboard', href: '/dashboard', icon: ShieldCheck },
    { name: 'Map View', href: '/election-map', icon: MapPinned },
    { name: 'News', href: '/news', icon: Newspaper },
    { name: 'Sessions', href: '/sessions', icon: CalendarClock },
    { name: 'Chat', href: '/chat', icon: MessageCircle },
  ];

  const features = [
    {
      icon: ShieldCheck,
      title: 'MLA Dashboard',
      description:
        'Track civic issues, assign tasks, and monitor resolutions with priority levels and real-time progress stats.',
      color: 'bg-green-50 text-green-600',
      bgGradient: 'from-green-400 to-emerald-500',
    },
    {
      icon: Users,
      title: 'Citizen Insights',
      description:
        "View local issues, monitor MLA performance, and stay informed about your area's developments.",
      color: 'bg-blue-50 text-blue-600',
      bgGradient: 'from-blue-400 to-cyan-500',
    },
    {
      icon: MapPinned,
      title: 'Interactive Map',
      description:
        'Dive from state to polling booth to explore performance data. Visual insights with interactive comparisons.',
      color: 'bg-purple-50 text-purple-600',
      bgGradient: 'from-purple-400 to-indigo-500',
    },
    {
      icon: MessageCircle,
      title: 'AI Chatbot',
      description:
        'Get quick answers about MLAs, regional performance, or upcoming events—powered by intelligent search.',
      color: 'bg-orange-50 text-orange-600',
      bgGradient: 'from-orange-400 to-red-500',
    },
    {
      icon: Newspaper,
      title: 'Latest News',
      description:
        'Stay updated with region-specific or national announcements—curated and published by administrators.',
      color: 'bg-pink-50 text-pink-600',
      bgGradient: 'from-pink-400 to-rose-500',
    },
    {
      icon: CalendarClock,
      title: 'Session Scheduler',
      description:
        'MLAs can initiate public or internal sessions. Attendees get timely notifications via email/SMS.',
      color: 'bg-teal-50 text-teal-600',
      bgGradient: 'from-teal-400 to-green-500',
    },
  ];

  const stats = [
    { icon: Award, value: '2.5K+', label: 'Issues Resolved' },
    { icon: Users, value: '15K+', label: 'Active Citizens' },
    { icon: TrendingUp, value: '89%', label: 'Success Rate' },
    { icon: MapPinned, value: '28', label: 'States Connected' },
  ];

  const handleSignOut = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      dispatch(clearLanguage());
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 flex items-center justify-center">
                  <img src={logo} alt="" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-gray-900">
                    Jaagran
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    {' '}
                    Patra
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-0 xl:space-x-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center space-x-2 text-gray-700 hover:text-green-600 px-2 py-2 rounded-lg hover:bg-green-50 transition-all duration-200"
                >
                  <item.icon className="w-4 h-4" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="hidden lg:flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/dashboard"
                    className="bg-green-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-green-700 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => handleSignOut()}
                    className="p-2 text-gray-500 hover:text-gray-700 cursor-pointer hover:bg-primary/10 rounded-full transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="text-green-600 hover:text-green-700 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-green-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-green-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-green-100">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center space-x-3 text-gray-700 hover:text-green-600 px-3 py-2 rounded-lg hover:bg-green-50 transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
              <div className="border-t border-gray-200 pt-4 mt-4">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    className="block w-full bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-center"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      className="block w-full text-green-600 border border-green-600 px-4 py-2 rounded-lg font-medium text-center hover:bg-green-50"
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      className="block w-full bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-center"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 w-full h-full">
          <img
            src="https://imgs.search.brave.com/FP_K0kep9oKiXQG-JB5kA19MMTzqXNmGRemtdglBGBA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMTE0/MzQ5NDA2NS9waG90/by9jaGVlcmZ1bC1l/bGVtZW50YXJ5LWFn/ZS1jaGlsZC1wb3J0/cmFpdC13aXRoLWlu/ZGlhbi1uYXRpb25h/bC1mbGFnLmpwZz9z/PTYxMng2MTImdz0w/Jms9MjAmYz0zNThK/OHEwYjdzQjBYU1h3/Vi1VZG0tSGtnRkpD/eXBodHNYQ0YwdlBk/b284PQ"
            alt="Background"
            className="w-full h-full object-cover object-center opacity-20"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
          <div className="text-center">
            <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium mb-8 text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Empowering Democratic Participation
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              <span className="text-gray-900">Jaagran</span>{' '}
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Patra
              </span>
            </h1>

            <p className="text-lg sm:text-2xl text-green-700 font-semibold mb-4">
              Speed is True Progress
            </p>

            <p className="text-sm sm:text-lg text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
              A civic engagement platform empowering citizens and
              representatives to resolve local issues efficiently. Track,
              report, and act — transparently. Join thousands of citizens making
              a difference in their communities.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="group bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-2xl text-xs sm:text-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <span className="flex items-center justify-center">
                    Go to Dashboard
                    <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="group bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <span className="flex items-center justify-center">
                      Get Started
                      <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                  <Link
                    to="/login"
                    className="bg-white text-green-600 border-2 border-green-600 px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-green-50 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Login
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              {stats.map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-xl mb-3 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Democratic Engagement
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover how Jaagran Patra bridges the gap between citizens and
              their representatives
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-green-200"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                ></div>
                <div className="relative p-8">
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 ${feature.color} rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
