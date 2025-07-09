// API configuration and utility functions
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Common API request function
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }
  
  return response.json();
};

// Auth API endpoints
export const authAPI = {
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  
  signup: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  
  logout: () => apiRequest('/auth/logout', {
    method: 'POST',
  }),
  
  getProfile: () => apiRequest('/auth/profile'),
  
  updateProfile: (userData) => apiRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),
};
