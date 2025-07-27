// API configuration and utility functions
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
    if (error.error) {
      throw new Error(error.error);
    }
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
};

// Axios-like API instance
const api = {
  get: async (endpoint, config = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...config.headers,
    };

    // Handle params like axios
    let url = `${API_BASE_URL}${endpoint}`;
    if (config.params) {
      const searchParams = new URLSearchParams();
      Object.keys(config.params).forEach((key) => {
        const value = config.params[key];
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
      url += `?${searchParams.toString()}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      // Remove params from config since we've handled it
      ...(() => {
        // eslint-disable-next-line no-unused-vars
        const { params, ...restConfig } = config;
        return restConfig;
      })(),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Request failed' }));
      throw { response: { data: error, status: response.status } };
    }

    return { data: await response.json() };
  },

  post: async (endpoint, data, config = {}) => {
    const token = localStorage.getItem('token');
    const isFormData = data instanceof FormData;

    // Don't set Content-Type for FormData - let browser set it with boundary
    const headers = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...config.headers,
    };

    // If FormData, don't set Content-Type at all
    if (isFormData && headers['Content-Type']) {
      delete headers['Content-Type'];
    }
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: isFormData ? data : JSON.stringify(data),
      ...config,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Request failed' }));
      throw { response: { data: error, status: response.status } };
    }

    return { data: await response.json() };
  },

  put: async (endpoint, data, config = {}) => {
    const token = localStorage.getItem('token');
    const isFormData = data instanceof FormData;

    const headers = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...config.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: isFormData ? data : JSON.stringify(data),
      ...config,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Request failed' }));
      throw { response: { data: error, status: response.status } };
    }

    return { data: await response.json() };
  },

  patch: async (endpoint, data, config = {}) => {
    const token = localStorage.getItem('token');
    const isFormData = data instanceof FormData;

    const headers = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...config.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
      ...config,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Request failed' }));
      throw { response: { data: error, status: response.status } };
    }

    return { data: await response.json() };
  },

  delete: async (endpoint, config = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...config.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
      ...config,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Request failed' }));
      throw { response: { data: error, status: response.status } };
    }

    return { data: await response.json() };
  },
};

export default api;

// Auth API endpoints
export const authAPI = {
  login: (credentials) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  signup: (userData) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  logout: () =>
    apiRequest('/auth/logout', {
      method: 'POST',
    }),

  getProfile: () => apiRequest('/auth/profile'),

  updateProfile: (userData) => api.put('/auth/profile', userData),

  changePassword: (passwordData) =>
    apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    }),

  forgotPassword: (email) =>
    apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (resetData) =>
    apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(resetData),
    }),

  updateLocation: (locationData) =>
    apiRequest('/auth/update-location', {
      method: 'POST',
      body: JSON.stringify(locationData),
    }),
};
