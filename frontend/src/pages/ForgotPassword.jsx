import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { forgotPassword, clearError } from '../redux/slices/userSlice';
import bgLogin from '../assets/bg-login.jpg';
import IndiaCulture from '../assets/india.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const dispatch = useDispatch();
  //   const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.user);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      return;
    }

    try {
      await dispatch(forgotPassword(email)).unwrap();
      setIsSubmitted(true);
    } catch (error) {
      console.error('Forgot password failed:', error);
    }
  };

  const clearErrorHandler = () => {
    dispatch(clearError());
  };

  if (isSubmitted) {
    return (
      <div className="relative min-h-screen bg-primary/5 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <img
          src={bgLogin}
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
        <img
                src={IndiaCulture}
                alt="Background"
                className="absolute inset-0 w-[500px] h-[500px] object-contain opacity-20 z-0 pointer-events-none"
              />
        <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
          <div className="flex flex-col items-center leading-10 font-semibold text-4xl mb-8">
            <span className="text-dark">Jaagran</span>
            <span className="text-primary">Patra.</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-primary">
            Check your email
          </h2>
          <p className="mt-2 text-center text-sm text-black/80">
            We've sent a password reset link to {email}
          </p>
        </div>

        <div className="mt-8 mx-auto sm:w-full sm:max-w-md z-10">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="font-medium text-primary hover:text-primary/80 cursor-pointer"
                >
                  try again
                </button>
              </p>
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-primary/5 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
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
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex flex-col items-center leading-10 font-semibold text-4xl mb-8">
          <span className="text-dark">Jaagran</span>
          <span className="text-primary">Patra.</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-primary">
          Forgot your password?
        </h2>
        <p className="mt-2 text-center text-sm text-black/80 max-w-[90vw] mx-auto">
          Enter your email address and we'll send you a link to reset your
          password
        </p>
      </div>

      <div className="mt-8 mx-auto min-w-[280px] sm:w-full sm:max-w-md z-10">
        <div className="relative w-full max-w-md z-10 bg-white/90 backdrop-blur-xl rounded-xl shadow-xl p-8 border border-white/30">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {error}
                    </h3>
                  </div>
                  <div className="ml-auto pl-3">
                    <div className="-mx-1.5 -my-1.5">
                      <button
                        type="button"
                        onClick={clearErrorHandler}
                        className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600 cursor-pointer"
                      >
                        <span className="sr-only">Dismiss</span>
                        <svg
                          className="h-3 w-3"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="font-medium text-primary hover:text-primary/80 cursor-pointer"
              >
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
