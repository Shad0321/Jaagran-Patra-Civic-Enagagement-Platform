import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../utils/api';

// Async thunk for user login
export const loginUser = createAsyncThunk(
  'user/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await authAPI.login(credentials);
      
      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

// Async thunk for user signup
export const signupUser = createAsyncThunk(
  'user/signup',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await authAPI.signup(userData);
      
      // Store token in localStorage if login is automatic after signup
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Signup failed');
    }
  }
);

// Async thunk for user logout
export const logoutUser = createAsyncThunk(
  'user/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
      
      // Clear token
      localStorage.removeItem('token');
      
      return {};
    } catch (error) {
      // Still clear token on error
      localStorage.removeItem('token');
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

// Async thunk for getting user profile
export const getUserProfile = createAsyncThunk(
  'user/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No token found');
      }

      const data = await authAPI.getProfile();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch profile');
    }
  }
);

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearUser: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Signup cases
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = !!action.payload.token;
        state.error = null;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Logout cases
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      })
      // Get profile cases
      .addCase(getUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        if (action.payload === 'No token found') {
          state.isAuthenticated = false;
          state.token = null;
        }
      });
  },
});

export const { clearError, setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
