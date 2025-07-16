import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice.js';
import languageReducer from './slices/languageSlice.js';

export const store = configureStore({
  reducer: {
    user: userReducer,
    language: languageReducer,
  },
});
