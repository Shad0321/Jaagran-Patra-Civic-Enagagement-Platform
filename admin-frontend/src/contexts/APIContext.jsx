import React, { createContext } from 'react';

// API Context
const APIContext = createContext();

// API Provider Component
const APIProvider = ({ children }) => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const value = {
    API_BASE_URL,
  };

  return (
    <APIContext.Provider value={value}>
      {children}
    </APIContext.Provider>
  );
};

export { APIContext, APIProvider };
