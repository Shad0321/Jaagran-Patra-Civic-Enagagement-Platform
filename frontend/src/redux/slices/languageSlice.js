import { createSlice } from '@reduxjs/toolkit';

// Language mapping for Google Translate
const LANGUAGE_CODES = {
  हिंदी: 'hi',
  English: 'en',
};

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

// Check current Google Translate state from URL or cookies
const getCurrentGoogleTranslateState = () => {
  try {
    // Check URL hash first
    if (window.location.hash.includes('googtrans')) {
      const match = window.location.hash.match(/googtrans\(en\|([^)]+)\)/);
      if (match) {
        const langCode = match[1];
        // Find language name from code
        // eslint-disable-next-line no-unused-vars
        const langEntry = Object.entries(LANGUAGE_CODES).find(
          ([_, code]) => code === langCode
        );
        return langEntry ? langEntry[0] : null;
      }
    }

    // Check cookies as fallback
    const googtransCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('googtrans='));

    if (googtransCookie) {
      const value = googtransCookie.split('=')[1];
      const match = value.match(/\/en\/([^/]+)/);
      if (match) {
        const langCode = match[1];
        // eslint-disable-next-line no-unused-vars
        const langEntry = Object.entries(LANGUAGE_CODES).find(
          ([_, code]) => code === langCode
        );
        return langEntry ? langEntry[0] : null;
      }
    }

    return null;
  } catch (error) {
    console.error('Error reading Google Translate state:', error);
    return null;
  }
};

// Get the most accurate initial language state
const getInitialState = () => {
  const savedLanguage = getInitialLanguage();
  const googleTranslateLanguage = getCurrentGoogleTranslateState();

  // Priority: saved language > google translate state > default English
  const finalLanguage = savedLanguage || googleTranslateLanguage || 'English';

  return {
    selectedLanguage: finalLanguage,
    isLanguageSelected: !!finalLanguage,
    languageCode: LANGUAGE_CODES[finalLanguage] || 'en',
    lastChanged: Date.now(),
  };
};

const initialState = getInitialState();

const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      const newLanguage = action.payload;
      const newCode = LANGUAGE_CODES[newLanguage] || 'en';

      // Only update if actually changing
      if (state.selectedLanguage !== newLanguage) {
        state.selectedLanguage = newLanguage;
        state.isLanguageSelected = true;
        state.languageCode = newCode;
        state.lastChanged = Date.now();

        // Store in localStorage for persistence
        try {
          localStorage.setItem('selectedLanguage', newLanguage);
          localStorage.setItem('languageCode', newCode);
          localStorage.setItem(
            'languageLastChanged',
            state.lastChanged.toString()
          );
        } catch (error) {
          console.error('Error saving language to localStorage:', error);
        }
      }
    },

    // Sync with Google Translate state (useful for page reloads)
    syncWithGoogleTranslate: (state) => {
      const googleTranslateLanguage = getCurrentGoogleTranslateState();
      if (
        googleTranslateLanguage &&
        googleTranslateLanguage !== state.selectedLanguage
      ) {
        state.selectedLanguage = googleTranslateLanguage;
        state.languageCode = LANGUAGE_CODES[googleTranslateLanguage] || 'en';
        state.isLanguageSelected = true;
        state.lastChanged = Date.now();

        // Update localStorage too
        try {
          localStorage.setItem('selectedLanguage', googleTranslateLanguage);
          localStorage.setItem('languageCode', state.languageCode);
          localStorage.setItem(
            'languageLastChanged',
            state.lastChanged.toString()
          );
        } catch (error) {
          console.error('Error syncing language to localStorage:', error);
        }
      }
    },

    clearLanguage: (state) => {
      state.selectedLanguage = 'English';
      state.isLanguageSelected = false;
      state.languageCode = 'en';
      state.lastChanged = Date.now();

      try {
        localStorage.removeItem('selectedLanguage');
        localStorage.removeItem('languageCode');
        localStorage.removeItem('languageLastChanged');

        // Also clear Google Translate cookies
        document.cookie =
          'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie =
          'googtrans_=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

        // Clear URL hash if present
        if (window.location.hash.includes('googtrans')) {
          window.location.hash = '';
        }
      } catch (error) {
        console.error('Error clearing language from localStorage:', error);
      }
    },

    // Force refresh language state
    refreshLanguageState: (state) => {
      const currentState = getInitialState();
      Object.assign(state, currentState);
    },
  },
});

export const {
  setLanguage,
  clearLanguage,
  syncWithGoogleTranslate,
  refreshLanguageState,
} = languageSlice.actions;

export default languageSlice.reducer;
