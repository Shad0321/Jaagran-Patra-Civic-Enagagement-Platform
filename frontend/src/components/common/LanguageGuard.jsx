import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const LanguageGuard = ({ children }) => {
  const { isLanguageSelected } = useSelector((state) => state.language);

  // If language is not selected, redirect to language selection
  if (!isLanguageSelected) {
    return <Navigate to="/choose-language" replace />;
  }

  return children;
};

export default LanguageGuard;
