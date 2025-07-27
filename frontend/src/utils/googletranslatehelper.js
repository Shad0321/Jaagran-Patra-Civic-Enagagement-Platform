// googleTranslateHelper.js - Fixed version

export const initializeGoogleTranslate = () => {
  return new Promise((resolve) => {
    if (window.google && window.google.translate) {
      resolve(window.google.translate);
      return;
    }

    // Wait for Google Translate to load
    const checkGoogleTranslate = setInterval(() => {
      if (window.google && window.google.translate) {
        clearInterval(checkGoogleTranslate);
        resolve(window.google.translate);
      }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkGoogleTranslate);
      resolve(null);
    }, 10000);
  });
};

// Clear Google Translate cookies and reset state
const clearGoogleTranslateCookies = () => {
  // Clear Google Translate related cookies
  const cookies = ['googtrans', 'googtrans_'];
  cookies.forEach((cookieName) => {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });

  // Clear any hash-based translation state
  if (window.location.hash.includes('googtrans')) {
    window.location.hash = '';
  }
};

// Force Google Translate to reset and apply new language
const forceGoogleTranslateReset = async (languageCode) => {
  return new Promise((resolve) => {
    // Clear existing translation state
    clearGoogleTranslateCookies();

    // Reset any existing Google Translate elements
    const existingFrames = document.querySelectorAll(
      'iframe[src*="translate.googleapis.com"]'
    );
    existingFrames.forEach((frame) => frame.remove());

    // Wait a moment for cleanup
    setTimeout(() => {
      // Set new translation
      if (languageCode === 'en') {
        // For English, we want to clear translation
        window.location.hash = '#googtrans(en|en)';
      } else {
        // For other languages, set the translation
        window.location.hash = `#googtrans(en|${languageCode})`;
      }

      // Trigger page refresh to apply changes
      setTimeout(() => {
        window.location.reload();
        resolve(true);
      }, 100);
    }, 200);
  });
};

// Improved method to change Google Translate language
export const changeGoogleTranslateLanguage = async (languageCode) => {
  try {
    // First, try the direct method without reload
    const success = await tryDirectLanguageChange(languageCode);
    if (success) {
      return true;
    }
    return await forceGoogleTranslateReset(languageCode);
  } catch (error) {
    console.error('Error changing Google Translate language:', error);
    // Fallback to force reset
    return await forceGoogleTranslateReset(languageCode);
  }
};

// Try to change language without page reload first
const tryDirectLanguageChange = async (languageCode) => {
  try {
    const googleTranslate = await initializeGoogleTranslate();
    if (!googleTranslate) {
      return false;
    }

    // Method 1: Try to find and trigger the select dropdown
    const translateElement = document.querySelector(
      '#google_translate_element'
    );
    if (translateElement) {
      const selectElement = translateElement.querySelector('select');
      if (selectElement) {
        // Clear any existing selection first
        selectElement.value = '';

        // Wait a moment then set new value
        setTimeout(() => {
          selectElement.value = languageCode;
          selectElement.dispatchEvent(new Event('change', { bubbles: true }));
          selectElement.dispatchEvent(new Event('click', { bubbles: true }));
        }, 100);

        return true;
      }
    }

    // Method 2: Try to find translate buttons
    const translateButtons = document.querySelectorAll('[data-gtranslate]');
    const targetButton = Array.from(translateButtons).find(
      (btn) => btn.getAttribute('data-gtranslate') === languageCode
    );

    if (targetButton) {
      targetButton.click();
      return true;
    }

    return false;
  } catch (error) {
    console.error('Direct language change failed:', error);
    return false;
  }
};

// Utility to check current Google Translate language
export const getCurrentGoogleTranslateLanguage = () => {
  // Check hash
  if (window.location.hash.includes('googtrans')) {
    const match = window.location.hash.match(/googtrans\(en\|([^)]+)\)/);
    return match ? match[1] : 'en';
  }

  // Check cookies
  const googtransCookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith('googtrans='));

  if (googtransCookie) {
    const value = googtransCookie.split('=')[1];
    const match = value.match(/\/en\/([^/]+)/);
    return match ? match[1] : 'en';
  }

  return 'en';
};

// Initialize Google Translate with better error handling
export const setupGoogleTranslate = () => {
  // Ensure Google Translate script is loaded
  if (!document.querySelector('script[src*="translate.google.com"]')) {
    const script = document.createElement('script');
    script.src =
      'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.head.appendChild(script);
  }

  // Define the callback function globally
  window.googleTranslateElementInit = function () {
    if (window.google && window.google.translate) {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: 'en,hi',
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false, // Prevent auto-display to have more control
        },
        'google_translate_element'
      );
    }
  };
};
