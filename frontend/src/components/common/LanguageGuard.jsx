import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const LanguageGuard = ({ children }) => {
  const { isLanguageSelected } = useSelector((state) => state.language);

  return children;
};

export default LanguageGuard;
