// Google Cloud Translation API Service
const GOOGLE_CLOUD_API_KEY = 'AIzaSyDMHRci1orRMvNhwwHz2jaCXrxs34AJqzE';
const TRANSLATION_API_URL = 'https://translation.googleapis.com/language/translate/v2';

/**
 * Translate text using Google Cloud Translation API
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code (en, ta, hi, ml)
 * @param {string} sourceLanguage - Source language code (optional, auto-detect if not provided)
 * @returns {Promise<string>} - Translated text
 */
export const translateText = async (text, targetLanguage, sourceLanguage = null) => {
  // Don't translate if target is English and no source specified
  if (targetLanguage === 'en' && !sourceLanguage) {
    return text;
  }

  try {
    const params = new URLSearchParams({
      key: GOOGLE_CLOUD_API_KEY,
      q: text,
      target: targetLanguage,
      format: 'text'
    });

    if (sourceLanguage) {
      params.append('source', sourceLanguage);
    }

    const response = await fetch(`${TRANSLATION_API_URL}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Translation API error:', errorData);
      throw new Error(`Translation failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (data.data && data.data.translations && data.data.translations.length > 0) {
      return data.data.translations[0].translatedText;
    }
    
    throw new Error('No translation returned');
  } catch (error) {
    console.error('Translation error:', error);
    // Return original text if translation fails
    return text;
  }
};

/**
 * Translate multiple texts in batch
 * @param {string[]} texts - Array of texts to translate
 * @param {string} targetLanguage - Target language code
 * @param {string} sourceLanguage - Source language code (optional)
 * @returns {Promise<string[]>} - Array of translated texts
 */
export const translateBatch = async (texts, targetLanguage, sourceLanguage = null) => {
  if (targetLanguage === 'en' && !sourceLanguage) {
    return texts;
  }

  try {
    const params = new URLSearchParams({
      key: GOOGLE_CLOUD_API_KEY,
      target: targetLanguage,
      format: 'text'
    });

    if (sourceLanguage) {
      params.append('source', sourceLanguage);
    }

    // Add all texts as separate 'q' parameters
    texts.forEach(text => {
      params.append('q', text);
    });

    const response = await fetch(`${TRANSLATION_API_URL}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Batch translation API error:', errorData);
      throw new Error(`Batch translation failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (data.data && data.data.translations) {
      return data.data.translations.map(t => t.translatedText);
    }
    
    throw new Error('No translations returned');
  } catch (error) {
    console.error('Batch translation error:', error);
    // Return original texts if translation fails
    return texts;
  }
};

/**
 * Detect language of text
 * @param {string} text - Text to detect language
 * @returns {Promise<string>} - Detected language code
 */
export const detectLanguage = async (text) => {
  try {
    const params = new URLSearchParams({
      key: GOOGLE_CLOUD_API_KEY,
      q: text
    });

    const response = await fetch(`https://translation.googleapis.com/language/translate/v2/detect?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Language detection failed');
    }

    const data = await response.json();
    
    if (data.data && data.data.detections && data.data.detections.length > 0) {
      return data.data.detections[0][0].language;
    }
    
    return 'en'; // Default to English
  } catch (error) {
    console.error('Language detection error:', error);
    return 'en';
  }
};

/**
 * Get all supported languages from Google Cloud Translation API
 * @param {string} targetLanguage - Language code to display language names in (default: 'en')
 * @returns {Promise<Array>} - Array of language objects with code and name
 */
export const getSupportedLanguages = async (targetLanguage = 'en') => {
  try {
    const params = new URLSearchParams({
      key: GOOGLE_CLOUD_API_KEY,
      target: targetLanguage
    });

    const url = `https://translation.googleapis.com/language/translate/v2/languages?${params.toString()}`;
    console.log('📡 Fetching languages from:', url.replace(GOOGLE_CLOUD_API_KEY, 'API_KEY_HIDDEN'));

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('📡 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ API Error Response:', errorData);
      throw new Error(`Failed to fetch languages: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📦 API Response data:', data);
    
    if (data.data && data.data.languages) {
      const languages = data.data.languages.map(lang => ({
        code: lang.language,
        name: lang.name
      }));
      console.log('✅ Successfully parsed', languages.length, 'languages');
      return languages;
    }
    
    console.warn('⚠️ No languages in response data');
    return [];
  } catch (error) {
    console.error('❌ Error fetching supported languages:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    return [];
  }
};
