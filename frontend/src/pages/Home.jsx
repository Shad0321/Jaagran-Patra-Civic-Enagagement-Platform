import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Home = () => {
  const { isAuthenticated } = useSelector((state) => state.user);
  const { isLanguageSelected } = useSelector((state) => state.language);
  const navigate = useNavigate();

  useEffect(() => {
    // If language is not selected, redirect to language selection
    if (!isLanguageSelected) {
      navigate('/choose-language');
    }
  }, [isLanguageSelected, navigate]);

  return (
    <div className="min-h-screen bg-light">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <div className="flex flex-col items-center leading-10 font-semibold text-6xl mb-8">
            <span className="text-dark">Jaagran</span>
            <span className="text-primary">Patra.</span>
          </div>
          <p className="text-xl text-gray-600 mb-8">Speed is True Progress</p>
          <p className="text-lg text-gray-700 mb-12 max-w-2xl mx-auto">
            Connect with your representatives, report issues, and be part of the
            democratic process. Join the movement towards transparent and
            efficient governance.
          </p>

          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="bg-primary text-white px-8 py-3 rounded-2xl text-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="bg-primary text-white px-8 py-3 rounded-2xl text-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="border-2 border-primary text-primary px-8 py-3 rounded-2xl text-lg font-medium hover:bg-primary hover:text-white transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
