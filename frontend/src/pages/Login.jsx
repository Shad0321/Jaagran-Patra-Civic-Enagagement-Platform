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

  // Show backend error as toast
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    // Clear error when component mounts
    dispatch(clearError());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error when user starts typing
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
      // Navigation will be handled by the useEffect hook
    } catch (err) {
      // Error is handled by the Redux slice
      toast.error(err.message);
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-light px-4 py-8 overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute left-0 z-0 rotate-45 -translate-x-1/2 h-96 w-full m-auto grid grid-cols-2 -space-x-52 opacity-30"
      >
        <div className="blur-[106px] h-56 bg-gradient-to-br from-primary to-primary"></div>
        <div className="blur-[106px] h-32 bg-gradient-to-r from-primary to-[#16A34A]"></div>
      </div>
      <div className="w-full max-w-md z-10">
        <div
          className="flex flex-col item-start leading-10 font-semibold text-4xl focus:outline-none focus:opacity-80 transition-opacity duration-200"
          aria-label="Brand"
        >
          <span className="text-dark">Jaagran</span>
          <span className="text-primary">Patra.</span>
        </div>
        <div className="w-full max-w-[90vw] h-px bg-dark"></div>
        <p className="mt-4 text-dark font-semibold">Speed is True Progress</p>

        {/* Backend error is now shown as toast, not inline */}

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 mt-8">
            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
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
                placeholder="Password"
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
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

            <div className="flex justify-end mb-4">
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:text-primary/80 font-medium cursor-pointer"
              >
                Forgot your password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-fit px-6 mx-auto cursor-pointer bg-primary text-white py-2 hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed transition-colors rounded-2xl"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-primary hover:text-primary/80 font-medium"
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
