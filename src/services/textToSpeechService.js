// Google Cloud Text-to-Speech API Service
const GOOGLE_CLOUD_API_KEY = 'AIzaSyDMHRci1orRMvNhwwHz2jaCXrxs34AJqzE';
const TTS_API_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

// Voice configurations for different languages
const VOICE_CONFIGS = {
  en: { languageCode: 'en-US', name: 'en-US-Standard-A', ssmlGender: 'FEMALE' },
  ta: { languageCode: 'ta-IN', name: 'ta-IN-Standard-A', ssmlGender: 'FEMALE' },
  hi: { languageCode: 'hi-IN', name: 'hi-IN-Standard-A', ssmlGender: 'FEMALE' },
  ml: { languageCode: 'ml-IN', name: 'ml-IN-Standard-A', ssmlGender: 'FEMALE' }
};

/**
 * Convert text to speech using Google Cloud Text-to-Speech API
 * @param {string} text - Text to convert to speech
 * @param {string} languageCode - Language code (en, ta, hi, ml)
 * @returns {Promise<void>} - Plays the audio
 */
export const textToSpeech = async (text, languageCode = 'en') => {
  try {
    const voiceConfig = VOICE_CONFIGS[languageCode] || VOICE_CONFIGS.en;

    const requestBody = {
      input: { text },
      voice: voiceConfig,
      audioConfig: {
        audioEncoding: 'MP3',
        pitch: 0,
        speakingRate: 1.0
      }
    };

    const response = await fetch(`${TTS_API_URL}?key=${GOOGLE_CLOUD_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('TTS API error:', errorData);
      throw new Error(`Text-to-Speech failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (data.audioContent) {
      // Convert base64 audio to blob and play
      const audioBlob = base64ToBlob(data.audioContent, 'audio/mp3');
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Play the audio
      await audio.play();
      
      // Clean up the URL after playing
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
      
      return audio;
    }
    
    throw new Error('No audio content returned');
  } catch (error) {
    console.error('Text-to-Speech error:', error);
    throw error;
  }
};

/**
 * Convert base64 string to Blob
 * @param {string} base64 - Base64 encoded string
 * @param {string} contentType - MIME type
 * @returns {Blob} - Blob object
 */
const base64ToBlob = (base64, contentType) => {
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
};

/**
 * Stop currently playing audio
 * @param {HTMLAudioElement} audio - Audio element to stop
 */
export const stopSpeech = (audio) => {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
};
