import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, clearError } from '../redux/slices/userSlice';
import logo from '../assets/new_logo/logo.png';
import bgLogin from '../assets/bg-login.jpg';
import IndiaCulture from '../assets/india.png';

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
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-primary/5 px-4 py-8 overflow-hidden">
      <img
        src={bgLogin}
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover opacity-90 z-0 pointer-events-none"
      />
      <img
        src={IndiaCulture}
        alt="Background"
        className="absolute inset-0 w-[500px] h-[500px] object-contain opacity-20 z-0 pointer-events-none"
      />
      <div className="relative w-full max-w-md bg-white/70 backdrop-blur-xl rounded-xl shadow-xl p-8 border border-white/30 z-10">
        <div className="text-4xl font-bold mb-1">
          <img src={logo} alt="Jaagran Patra Logo" className="w-16 h-16 mb-2" />
          <span className="text-dark">Jaagran</span>{' '}
          <span className="text-primary">Patra.</span>
        </div>
        <div className="w-16 h-1 bg-primary rounded-full mb-6" />
        <p className="text-dark font-medium text-sm">Speed is True Progress</p>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-5 mt-8 z-10">
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
