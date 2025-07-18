import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { signupUser, clearError } from '../redux/slices/userSlice';

const SignUp = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state) => state.user);

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
    if (error) toast.error(error);
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

    if (!formData.name.trim()) errors.name = 'Name is required';

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
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

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // eslint-disable-next-line no-unused-vars
    const { confirmPassword, ...submitData } = formData;

    try {
      const result = await dispatch(signupUser(submitData)).unwrap();
      toast.success(result?.message || 'Registration successful! Please verify your email.');
    } catch (err) {
      console.error('Signup failed:', err);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-primary px-4 py-8 overflow-hidden">
      {/* --- Decorative Background Elements: Project Icons --- */}
      {/* Loudspeaker (Announcements) Icon */}
      <svg className="absolute top-8 left-8 w-20 h-20 opacity-20 z-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 28h8l16-12v32L16 36h-8V28z" fill="#16A34A"/>
        <path d="M48 32c0-4.418-2.239-8-5-8v16c2.761 0 5-3.582 5-8z" fill="#16A34A" fillOpacity="0.5"/>
        <path d="M54 32c0-7.732-4.03-14-9-14v4c3.866 0 7 4.925 7 10s-3.134 10-7 10v4c4.97 0 9-6.268 9-14z" fill="#16A34A" fillOpacity="0.2"/>
      </svg>
      {/* Chat (Chatbot) Icon */}
      <svg className="absolute bottom-8 left-12 w-16 h-16 opacity-20 z-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="16" width="48" height="28" rx="8" fill="#16A34A"/>
        <rect x="16" y="36" width="16" height="8" rx="4" fill="#fff" fillOpacity="0.2"/>
        <circle cx="24" cy="28" r="2" fill="#fff" fillOpacity="0.5"/>
        <circle cx="32" cy="28" r="2" fill="#fff" fillOpacity="0.5"/>
        <circle cx="40" cy="28" r="2" fill="#fff" fillOpacity="0.5"/>
      </svg>
      {/* Map Pin (Map/Location) Icon */}
      <svg className="absolute top-1/2 right-12 -translate-y-1/2 w-20 h-20 opacity-20 z-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 8c-8.837 0-16 6.268-16 14.001C16 38.5 32 56 32 56s16-17.5 16-33.999C48 14.268 40.837 8 32 8z" fill="#16A34A"/>
        <circle cx="32" cy="24" r="6" fill="#fff" fillOpacity="0.3"/>
      </svg>
      {/* News (Newspaper) Icon */}
      <svg className="absolute bottom-8 right-8 w-16 h-16 opacity-20 z-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="12" y="16" width="40" height="32" rx="6" fill="#16A34A"/>
        <rect x="20" y="24" width="24" height="4" rx="2" fill="#fff" fillOpacity="0.3"/>
        <rect x="20" y="32" width="16" height="4" rx="2" fill="#fff" fillOpacity="0.2"/>
      </svg>
      {/* Calendar (Session Scheduler) Icon */}
      <svg className="absolute top-1/4 right-24 w-16 h-16 opacity-20 z-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="12" y="20" width="40" height="28" rx="6" fill="#16A34A"/>
        <rect x="20" y="28" width="8" height="8" rx="2" fill="#fff" fillOpacity="0.2"/>
        <rect x="36" y="28" width="8" height="8" rx="2" fill="#fff" fillOpacity="0.2"/>
      </svg>
      {/* --- End Decorative Elements --- */}
      {/* Card */}
      <div className="relative w-full max-w-md z-10 bg-white/70 backdrop-blur-xl rounded-xl shadow-xl p-8 border border-white/30">
        <div className="text-4xl font-bold mb-1">
          <span className="text-dark">Jaagran</span>{' '}
          <span className="text-primary">Patra.</span>
        </div>
        <div className="w-16 h-1 bg-primary rounded-full mb-6" />
        <p className="text-dark font-medium text-sm">Join the Movement</p>

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="flex flex-col gap-5">
            <InputField
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              error={validationErrors.name}
              loading={loading}
            />
            <InputField
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              error={validationErrors.email}
              loading={loading}
            />
            <InputField
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              error={validationErrors.phone}
              loading={loading}
            />
            <InputField
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              error={validationErrors.password}
              loading={loading}
            />
            <InputField
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              error={validationErrors.confirmPassword}
              loading={loading}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 disabled:bg-primary/60 transition-all"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary hover:text-primary/80 font-semibold"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// 🧩 Reusable InputField component
const InputField = ({ name, type, value, onChange, placeholder, error, loading }) => (
  <div>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all bg-white/80 placeholder-gray-500 ${
        error ? 'border-red-400' : 'border-gray-300'
      }`}
      disabled={loading}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

export default SignUp;
