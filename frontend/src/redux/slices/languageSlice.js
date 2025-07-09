import { createSlice } from '@reduxjs/toolkit';

// Check if language is already stored in localStorage
const getInitialLanguage = () => {
  try {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    return savedLanguage || null;
  } catch (error) {
    console.error('Error reading language from localStorage:', error);
    return null;
  }
};

const initialState = {
  selectedLanguage: getInitialLanguage(),
  isLanguageSelected: !!getInitialLanguage(),
};

const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      state.selectedLanguage = action.payload;
      state.isLanguageSelected = true;
      // Store in localStorage for persistence
      try {
        localStorage.setItem('selectedLanguage', action.payload);
      } catch (error) {
        console.error('Error saving language to localStorage:', error);
      }
    },
    clearLanguage: (state) => {
      state.selectedLanguage = null;
      state.isLanguageSelected = false;
      try {
        localStorage.removeItem('selectedLanguage');
      } catch (error) {
        console.error('Error removing language from localStorage:', error);
      }
    },
  },
});

export const { setLanguage, clearLanguage } = languageSlice.actions;
export default languageSlice.reducer;
