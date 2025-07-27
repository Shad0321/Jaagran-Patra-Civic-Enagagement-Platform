import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../assets/new_logo/logo.png';

const Footer = () => {
  const location = useLocation();

  if (location.pathname === '/chat') {
    return null;
  }
  return (
    <footer className="bg-light text-dark py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 flex items-center justify-center">
                  <img src={logo} alt="" />
                </div>
              </Link>
              <div>
                <span className="text-2xl font-bold">Jaagran</span>
                <span className="text-2xl font-bold text-green-400">
                  {' '}
                  Patra
                </span>
              </div>
            </div>
            <p className="text-gray-400 mb-4">
              Empowering democratic participation through technology. Connecting
              citizens with their representatives for a better tomorrow.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link
                  to="/about"
                  className="hover:text-green-400 transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-green-400 transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-green-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="hover:text-green-400 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link
                  to="/help"
                  className="hover:text-green-400 transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="hover:text-green-400 transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/feedback"
                  className="hover:text-green-400 transition-colors"
                >
                  Feedback
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 Jaagran Patra. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
