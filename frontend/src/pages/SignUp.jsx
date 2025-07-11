import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { signupUser, clearError } from '../redux/slices/userSlice';

const SignUp = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector(
    (state) => state.user
  );

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'CITIZEN',
  });

  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

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

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (formData.phone && !/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
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

    // Remove confirmPassword from the data sent to backend
    // eslint-disable-next-line no-unused-vars
    const { confirmPassword, ...submitData } = formData;

    try {
      await dispatch(signupUser(submitData)).unwrap();
      // Navigation will be handled by the useEffect hook
    } catch (err) {
      // Error is handled by the Redux slice
      console.error('Signup failed:', err);
    }
  };

  return (
    <div className="relative flex flex-col z-10 items-center justify-center bg-transparent min-h-screen px-4 py-8 overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute left-0 z-0 rotate-45 -translate-x-1/2 h-96 w-full m-auto grid grid-cols-2 -space-x-52 opacity-30"
      >
        <div className="blur-[106px] h-56 bg-gradient-to-br from-primary to-primary"></div>
        <div className="blur-[106px] h-32 bg-gradient-to-r from-primary to-[#16A34A]"></div>
      </div>
      <div className="w-full max-w-md z-10">
        <div
          className="flex flex-col items-start leading-10 font-semibold text-4xl focus:outline-none focus:opacity-80 transition-opacity duration-200"
          aria-label="Brand"
        >
          <span className="text-dark">Jaagran</span>
          <span className="text-primary">Patra.</span>
        </div>
        <div className="w-full max-w-[90vw] h-px bg-dark"></div>
        <p className="mt-4 text-dark font-semibold">Join the Movement</p>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="flex flex-col gap-4">
            <div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full Name"
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                  validationErrors.name ? 'border-red-400' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.name}
                </p>
              )}
            </div>

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
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number (Optional)"
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                  validationErrors.phone ? 'border-red-400' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {validationErrors.phone && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.phone}
                </p>
              )}
            </div>

            {/* <div>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors'
                disabled={loading}
              >
                <option value="CITIZEN">Citizen</option>
                <option value="MEMBER">Member</option>
                <option value="MLA">MLA</option>
              </select>
            </div> */}

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

            <div>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                  validationErrors.confirmPassword
                    ? 'border-red-400'
                    : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-primary text-white hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed transition-colors rounded-2xl font-medium"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary hover:text-primary/80 font-medium"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
