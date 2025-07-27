import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import bgLogin from '../assets/bg-login.jpg';
import IndiaCulture from '../assets/india.png';

const VerifyEmail = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const urlEmail = searchParams.get('email');
    const urlToken = searchParams.get('token');
    if (urlEmail) setEmail(urlEmail);
    if (urlToken) setToken(urlToken);
    if (urlEmail && urlToken) {
      handleSubmit(urlEmail, urlToken);
    }
    // eslint-disable-next-line
  }, []);

  const handleSubmit = async (eOrEmail, maybeToken) => {
    let submitEmail = email;
    let submitToken = token;
    if (typeof eOrEmail === 'string' && typeof maybeToken === 'string') {
      submitEmail = eOrEmail;
      submitToken = maybeToken;
    } else if (eOrEmail && eOrEmail.preventDefault) {
      eOrEmail.preventDefault();
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/auth/verify-email', {
        email: submitEmail,
        token: submitToken,
      });
      setSuccess('Email verified successfully! You can now log in.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err?.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-primary/5 p-4">
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
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full z-10">
        <h2 className="text-2xl font-bold mb-4">Verify Your Email</h2>
        <form onSubmit={handleSubmit} className="space-y-4 z-10">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-md"
            required
          />
          <input
            type="text"
            placeholder="Verification Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full p-3 border rounded-md"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-primary text-white rounded-md font-medium"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>
        {error && <div className="mt-4 text-red-600">{error}</div>}
        {success && <div className="mt-4 text-green-600">{success}</div>}
      </div>
    </div>
  );
};

export default VerifyEmail;
