// Language Context for managing multi-language support
import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [translationCache, setTranslationCache] = useState({});

  // Load saved language preference from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  // Save language preference to localStorage
  const changeLanguage = (languageCode) => {
    setCurrentLanguage(languageCode);
    localStorage.setItem('preferredLanguage', languageCode);
  };

  // Cache translation to avoid repeated API calls
  const cacheTranslation = (text, targetLang, translatedText) => {
    const key = `${text}_${targetLang}`;
    setTranslationCache(prev => ({
      ...prev,
      [key]: translatedText
    }));
  };

  // Get cached translation
  const getCachedTranslation = (text, targetLang) => {
    const key = `${text}_${targetLang}`;
    return translationCache[key];
  };

  const value = {
    currentLanguage,
    changeLanguage,
    cacheTranslation,
    getCachedTranslation
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
