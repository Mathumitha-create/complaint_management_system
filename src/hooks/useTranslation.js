// Custom hook for handling translations
import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translateText } from '../services/translationService';
import { staticTranslations } from '../utils/staticTranslations';

export const useTranslation = () => {
  const { currentLanguage, getCachedTranslation, cacheTranslation } = useLanguage();

  /**
   * Translate dynamic text using Google Cloud Translation API
   * @param {string} text - Text to translate
   * @param {boolean} useCache - Whether to use cached translation
   * @returns {Promise<string>} - Translated text
   */
  const translateDynamic = async (text, useCache = true) => {
    if (!text) return '';
    
    // Return original if English
    if (currentLanguage === 'en') {
      return text;
    }

    // Check cache first
    if (useCache) {
      const cached = getCachedTranslation(text, currentLanguage);
      if (cached) {
        return cached;
      }
    }

    try {
      const translated = await translateText(text, currentLanguage);
      
      // Cache the translation
      if (useCache) {
        cacheTranslation(text, currentLanguage, translated);
      }
      
      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original on error
    }
  };

  /**
   * Get static translation from predefined translations
   * @param {string} key - Translation key
   * @returns {string} - Translated text
   */
  const t = (key) => {
    if (!staticTranslations[currentLanguage]) {
      return staticTranslations.en[key] || key;
    }
    return staticTranslations[currentLanguage][key] || staticTranslations.en[key] || key;
  };

  return {
    t,
    translateDynamic,
    currentLanguage
  };
};

/**
 * Hook for translating text with loading state
 * @param {string} text - Text to translate
 * @returns {object} - { translatedText, isLoading, error }
 */
export const useTranslatedText = (text) => {
  const { currentLanguage, getCachedTranslation, cacheTranslation } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const translate = async () => {
      if (!text || currentLanguage === 'en') {
        setTranslatedText(text);
        return;
      }

      // Check cache
      const cached = getCachedTranslation(text, currentLanguage);
      if (cached) {
        setTranslatedText(cached);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const translated = await translateText(text, currentLanguage);
        setTranslatedText(translated);
        cacheTranslation(text, currentLanguage, translated);
      } catch (err) {
        console.error('Translation error:', err);
        setError(err.message);
        setTranslatedText(text); // Fallback to original
      } finally {
        setIsLoading(false);
      }
    };

    translate();
  }, [text, currentLanguage, getCachedTranslation, cacheTranslation]);

  return { translatedText, isLoading, error };
};
