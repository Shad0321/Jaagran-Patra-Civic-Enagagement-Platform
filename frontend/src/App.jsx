import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import Navbar from './components/common/Navbar';

const App = () => {
  return (
    <div className="flex flex-col min-h-screen bg-light text-dark">
      <Navbar />
      <hr />
      <Outlet /> {/* Nested routes render here */}
    </div>
  );
};

export default App;
