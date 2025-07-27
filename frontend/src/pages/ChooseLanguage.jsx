import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setLanguage } from '../redux/slices/languageSlice';
import {
  changeGoogleTranslateLanguage,
  getCurrentGoogleTranslateLanguage,
} from '../utils/googletranslatehelper';
import { languages } from '../utils/constants';

const ChooseLanguage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedLanguage: currentLanguage } = useSelector(
    (state) => state.language
  );

  const [selectedLanguage, setSelectedLanguage] = useState(
    currentLanguage || 'English'
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleLanguageSelect = async (language) => {
    if (isLoading) return;

    setIsLoading(true);
    setSelectedLanguage(language);

    try {
      // Update Redux state
      dispatch(setLanguage(language));

      // Get language code for Google Translate
      const selectedLangObj = languages.find((lang) => lang.value === language);
      if (selectedLangObj) {
        // Check if we're actually changing to a different language
        const currentGoogleLang = getCurrentGoogleTranslateLanguage();
        if (currentGoogleLang !== selectedLangObj.code) {
          // Change Google Translate language
          const success = await changeGoogleTranslateLanguage(
            selectedLangObj.code
          );
          if (!success) {
            console.warn('Failed to change Google Translate language');
          }
        }
      }
    } catch (error) {
      console.error('Error setting language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      navigate('/login');
    } catch (error) {
      console.error('Error on continue:', error);
      navigate('/login'); // Navigate anyway
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-emerald-500 flex flex-col items-center justify-center px-6"
      style={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      }}
    >
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800">Jaagran</h1>
          <h2 className="text-4xl font-bold text-white">Patra.</h2>
        </div>

        {/* Choose Language Text */}
        <div className="text-center mb-8">
          <p className="text-white text-lg font-medium">Choose a Language</p>
        </div>

        {/* Language Options */}
        <div className="space-y-4 mb-8">
          {languages.map((language) => (
            <button
              key={language.id}
              onClick={() => handleLanguageSelect(language.value)}
              disabled={isLoading}
              className={`w-full px-6 py-4 rounded-full border-2 transition-all duration-200 flex items-center justify-between ${
                selectedLanguage === language.value
                  ? 'bg-white text-gray-800 border-white shadow-lg'
                  : 'bg-transparent text-white border-white/30 hover:border-white/60'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="text-lg font-medium">{language.name}</span>
              {selectedLanguage === language.value && (
                <Check className="w-5 h-5 text-gray-800" />
              )}
            </button>
          ))}
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={isLoading}
          className={`w-full py-4 rounded-full font-semibold text-lg transition-colors duration-200 shadow-lg ${
            isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-white text-gray-800 hover:bg-gray-100 cursor-pointer'
          }`}
        >
          {isLoading ? 'Setting Language...' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default ChooseLanguage;
