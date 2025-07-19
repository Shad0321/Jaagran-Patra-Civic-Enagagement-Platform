import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, clearError } from '../redux/slices/userSlice';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector(
    (state) => state.user
  );

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      await dispatch(loginUser(formData)).unwrap();
      toast.success('Logged in successfully');
    } catch (err) {
      toast.error(err.message);
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-primary px-4 py-8 overflow-hidden">
      {/* --- Decorative Background Elements: Project Icons --- */}
      {/* Loudspeaker (Announcements) Icon */}
      <svg className="absolute top-8 left-8 w-20 h-20 opacity-20 z-0 animate-pulse" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 28h8l16-12v32L16 36h-8V28z" fill="#000"/>
        <path d="M48 32c0-4.418-2.239-8-5-8v16c2.761 0 5-3.582 5-8z" fill="#000" fillOpacity="0.5"/>
        <path d="M54 32c0-7.732-4.03-14-9-14v4c3.866 0 7 4.925 7 10s-3.134 10-7 10v4c4.97 0 9-6.268 9-14z" fill="#000" fillOpacity="0.2"/>
      </svg>
      {/* Chat (Chatbot) Icon */}
      <svg className="absolute bottom-8 left-12 w-16 h-16 opacity-20 z-0 animate-pulse" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="16" width="48" height="28" rx="8" fill="#000"/>
        <rect x="16" y="36" width="16" height="8" rx="4" fill="#fff" fillOpacity="0.2"/>
        <circle cx="24" cy="28" r="2" fill="#fff" fillOpacity="0.5"/>
        <circle cx="32" cy="28" r="2" fill="#fff" fillOpacity="0.5"/>
        <circle cx="40" cy="28" r="2" fill="#fff" fillOpacity="0.5"/>
      </svg>
      {/* Map Pin (Map/Location) Icon */}
      <svg className="absolute top-1/2 right-12 -translate-y-1/2 w-20 h-20 opacity-20 z-0 animate-pulse" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 8c-8.837 0-16 6.268-16 14.001C16 38.5 32 56 32 56s16-17.5 16-33.999C48 14.268 40.837 8 32 8z" fill="#000"/>
        <circle cx="32" cy="24" r="6" fill="#fff" fillOpacity="0.3"/>
      </svg>
      {/* News (Newspaper) Icon */}
      <svg className="absolute bottom-8 right-8 w-16 h-16 opacity-20 z-0 animate-pulse" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="12" y="16" width="40" height="32" rx="6" fill="#000"/>
        <rect x="20" y="24" width="24" height="4" rx="2" fill="#fff" fillOpacity="0.3"/>
        <rect x="20" y="32" width="16" height="4" rx="2" fill="#fff" fillOpacity="0.2"/>
      </svg>
      {/* Calendar (Session Scheduler) Icon */}
      <svg className="absolute top-1 right-1/3 w-16 h-16 opacity-20 z-0 animate-pulse" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="12" y="20" width="40" height="28" rx="6" fill="#000"/>
        <rect x="20" y="28" width="8" height="8" rx="2" fill="#fff" fillOpacity="0.2"/>
        <rect x="36" y="28" width="8" height="8" rx="2" fill="#fff" fillOpacity="0.2"/>
      </svg>
      {/* --- End Decorative Elements --- */}
      <div className="relative w-full max-w-md z-10 bg-white/70 backdrop-blur-xl rounded-xl shadow-xl p-8 border border-white/30">
        <div className="text-4xl font-bold mb-1">
          <span className="text-dark">Jaagran</span>{' '}
          <span className="text-primary">Patra.</span>
        </div>
        <div className="w-16 h-1 bg-primary rounded-full mb-6" />
        <p className="text-dark font-medium text-sm">Speed is True Progress</p>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-5 mt-8">
            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all bg-white/80 placeholder-gray-500 ${
                  validationErrors.email ? 'border-red-400' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.email}
                </p>
              )}
            </div>

            <div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all bg-white/80 placeholder-gray-500 ${
                  validationErrors.password
                    ? 'border-red-400'
                    : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.password}
                </p>
              )}
            </div>

            <div className="flex justify-end text-sm font-medium text-primary hover:text-primary/80 transition">
              <Link to="/forgot-password">Forgot your password?</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 disabled:bg-primary/60 transition-all cursor-pointer"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don’t have an account?{' '}
            <Link
              to="/signup"
              className="text-primary hover:text-primary/80 font-semibold"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
