import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setLanguage } from '../redux/slices/languageSlice';

const ChooseLanguage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('हिंदी');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const languages = [
    { id: 'hindi', name: 'हिंदी', value: 'हिंदी' },
    { id: 'english', name: 'English', value: 'English' },
    { id: 'other', name: '', value: '' } // Empty option for third choice
  ];

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
  };

  const handleContinue = () => {
    // Store the selected language in Redux and localStorage
    dispatch(setLanguage(selectedLanguage));
    
    // Navigate to login page
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-emerald-500 flex flex-col items-center justify-center px-6" style={{
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    }}>
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Jaagran
          </h1>
          <h2 className="text-4xl font-bold text-white">
            Patra.
          </h2>
        </div>

        {/* Choose Language Text */}
        <div className="text-center mb-8">
          <p className="text-white text-lg font-medium">
            Choose a Language
          </p>
        </div>

        {/* Language Options */}
        <div className="space-y-4 mb-8">
          {languages.map((language) => (
            <button
              key={language.id}
              onClick={() => language.name && handleLanguageSelect(language.value)}
              className={`w-full px-6 py-4 rounded-full border-2 transition-all duration-200 flex items-center justify-between ${
                selectedLanguage === language.value
                  ? 'bg-white text-gray-800 border-white shadow-lg'
                  : 'bg-transparent text-white border-white/30 hover:border-white/60'
              } ${!language.name ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              disabled={!language.name}
            >
              <span className="text-lg font-medium">
                {language.name || ''}
              </span>
              {selectedLanguage === language.value && language.name && (
                <Check className="w-5 h-5 text-gray-800" />
              )}
            </button>
          ))}
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          className="w-full bg-white text-gray-800 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors duration-200 shadow-lg cursor-pointer"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default ChooseLanguage;
