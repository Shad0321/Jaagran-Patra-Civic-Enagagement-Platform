import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { changeGoogleTranslateLanguage } from '../../utils/googletranslatehelper';

const LanguageGuard = ({ children }) => {
  const { isLanguageSelected, languageCode } = useSelector(
    (state) => state.language
  );

  useEffect(() => {
    // Auto-apply Google Translate when language is already selected
    if (isLanguageSelected && languageCode) {
      const applyTranslation = async () => {
        try {
          await changeGoogleTranslateLanguage(languageCode);
        } catch (error) {
          console.error('Error applying auto-translation:', error);
        }
      };

      // Wait a bit for Google Translate to initialize
      setTimeout(applyTranslation, 1000);
    }
  }, [isLanguageSelected, languageCode]);

  return children;
};

export default LanguageGuard;
