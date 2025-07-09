import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './slices/counterSlice.js';
import userReducer from './slices/userSlice.js';
import languageReducer from './slices/languageSlice.js';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    user: userReducer,
    language: languageReducer,
  },
});
