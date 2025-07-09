import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setLanguage } from '../redux/slices/languageSlice';
import { Check } from 'lucide-react';

const Settings = () => {
  const dispatch = useDispatch();
  const { selectedLanguage } = useSelector((state) => state.language);
  const [currentLanguage, setCurrentLanguage] = useState(selectedLanguage);

  const languages = [
    { id: 'hindi', name: 'हिंदी', value: 'हिंदी' },
    { id: 'english', name: 'English', value: 'English' },
  ];

  const handleLanguageChange = (language) => {
    setCurrentLanguage(language);
    dispatch(setLanguage(language));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your app preferences</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Language Preference</h2>
          
          <div className="space-y-3">
            {languages.map((language) => (
              <button
                key={language.id}
                onClick={() => handleLanguageChange(language.value)}
                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 flex items-center justify-between ${
                  currentLanguage === language.value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                } cursor-pointer`}
              >
                <span className="font-medium">{language.name}</span>
                {currentLanguage === language.value && (
                  <Check className="w-5 h-5" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Current Language:</strong> {currentLanguage}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Language changes are saved automatically
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
