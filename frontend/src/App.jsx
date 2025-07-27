import React, { useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from './components/common/Navbar';
import { getUserProfile } from './redux/slices/userSlice';
import Faqs from './components/common/Faqs';
import Footer from './components/common/Footer';

const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.user);

  useEffect(() => {
    // If user is authenticated but user data is not loaded, fetch it
    if (isAuthenticated && !user) {
      dispatch(getUserProfile());
    }
  }, [dispatch, isAuthenticated, user]);

  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      <Navbar />
      <hr />
      <Outlet /> {/* Nested routes render here */}
      <ToastContainer position="top-right" />
      <Faqs />
      <Footer />
    </div>
  );
};

export default App;
