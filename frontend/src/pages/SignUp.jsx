import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { signupUser, clearError } from '../redux/slices/userSlice';
import logo from '../assets/new_logo/logo.png';
import bgLogin from '../assets/bg-login.jpg';
import IndiaCulture from '../assets/india.png';

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
      toast.success(
        result?.message || 'Registration successful! Please verify your email.'
      );
    } catch (err) {
      console.error('Signup failed:', err);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-primary/5 px-4 py-8 overflow-hidden">
      <img
        src={bgLogin}
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover opacity-90 z-0"
      />
      <img
              src={IndiaCulture}
              alt="Background"
              className="absolute inset-0 w-[500px] h-[500px] object-contain opacity-20 z-0 pointer-events-none"
            />
      {/* Card */}
      <div className="relative w-full max-w-md bg-white/70 backdrop-blur-xl rounded-xl shadow-xl p-8 border border-white/30 z-10">
        <div className="text-4xl font-bold mb-1">
          <img src={logo} alt="Jaagran Patra Logo" className="w-16 h-16 mb-2" />
          <span className="text-dark">Jaagran</span>{' '}
          <span className="text-primary">Patra.</span>
        </div>
        <div className="w-16 h-1 bg-primary rounded-full mb-6" />
        <p className="text-dark font-medium text-sm">Join the Movement</p>

        <form onSubmit={handleSubmit} className="mt-8 z-10">
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
const InputField = ({
  name,
  type,
  value,
  onChange,
  placeholder,
  error,
  loading,
}) => (
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
