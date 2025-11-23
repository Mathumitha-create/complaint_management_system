// Speech-to-Text Component (Using Browser's Web Speech API)
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './SpeakButton.css';


// Language to speech recognition mapping
const languageRecognitionMap = {
  'en': 'en-US',
  'hi': 'hi-IN',
  'ta': 'ta-IN',
  'te': 'te-IN',
  'bn': 'bn-IN',
  'mr': 'mr-IN',
  'gu': 'gu-IN',
  'kn': 'kn-IN',
  'ml': 'ml-IN',
  'pa': 'pa-IN',
  'or': 'or-IN',
  'as': 'as-IN',
  'ur': 'ur-IN',
  'sa': 'sa-IN',
  'ks': 'ks-IN',
  'sd': 'sd-IN',
  'ne': 'ne-NP',
  'si': 'si-LK',
};

const SpeechToText = ({
  onResult,
  placeholder = "Click microphone and speak...",
  className = '',
  disabled = false
}) => {
  const { currentLanguage } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);

  // Language to speech recognition mapping

  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // Set language based on current language selection
    const lang = languageRecognitionMap[currentLanguage] || 'en-US';
    recognition.lang = lang;

    console.log('🎤 Speech Recognition initialized for language:', lang);

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      console.log('🎤 Started listening...');
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptSegment = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptSegment;
        } else {
          interimTranscript += transcriptSegment;
        }
      }

      const fullTranscript = finalTranscript || interimTranscript;
      setTranscript(fullTranscript);

      // Call the onResult callback with the transcript
      if (onResult && finalTranscript) {
        onResult(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      console.error('🎤 Speech recognition error:', event.error);

      switch (event.error) {
        case 'no-speech':
          setError('No speech detected. Please speak clearly.');
          break;
        case 'audio-capture':
          setError('Microphone access denied. Please allow microphone access.');
          break;
        case 'not-allowed':
          setError('Microphone permission denied. Please allow microphone access.');
          break;
        case 'network':
          setError('Network error occurred. Please check your connection.');
          break;
        case 'language-not-supported':
          setError(`Speech recognition not supported for ${currentLanguage} language.`);
          break;
        default:
          setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log('🎤 Stopped listening');
    };

    recognitionRef.current = recognition;

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [currentLanguage, onResult]);

  const startListening = () => {
    if (!isSupported || disabled) return;

    if (recognitionRef.current && !isListening) {
      setError(null);
      setTranscript('');

      // Update language if it changed
      const lang = languageRecognitionMap[currentLanguage] || 'en-US';
      recognitionRef.current.lang = lang;

      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        setError('Failed to start speech recognition. Please try again.');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div className={`speech-to-text-container ${className}`}>
        <div className="speech-error">
          Speech recognition is not supported in your browser.
          Please use Chrome, Edge, or Safari for the best experience.
        </div>
      </div>
    );
  }

  return (
    <div className={`speech-to-text-container ${className}`}>
      <div className="speech-input-container">
        <input
          type="text"
          value={transcript}
          placeholder={placeholder}
          className="speech-input"
          readOnly
          disabled={disabled}
        />
        <button
          type="button"
          className={`speech-button ${isListening ? 'listening' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={toggleListening}
          disabled={disabled}
          title={isListening ? 'Stop listening' : 'Start voice input'}
          aria-label={isListening ? 'Stop listening' : 'Start voice input'}
        >
          {isListening ? (
            <svg
              className="speech-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg
              className="speech-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>
      </div>

      {isListening && (
        <div className="speech-status">
          🎤 Listening... Speak now in {currentLanguage.toUpperCase()}
        </div>
      )}

      {error && (
        <div className="speech-error">
          {error}
        </div>
      )}

      {/* Inline style tag without Next.js jsx attribute to avoid React warning */}
      <style>{`
        .speech-to-text-container {
          position: relative;
          width: 100%;
        }

        .speech-input-container {
          position: relative;
          display: flex;
          align-items: center;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          transition: border-color 0.3s ease;
        }

        .speech-input-container:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .speech-input {
          flex: 1;
          padding: 12px 16px;
          border: none;
          outline: none;
          font-size: 1rem;
          background: transparent;
          color: #1e293b;
        }

        .speech-input::placeholder {
          color: #94a3b8;
        }

        .speech-button {
          padding: 8px;
          margin: 4px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          min-width: 40px;
          height: 40px;
        }

        .speech-button:hover:not(:disabled) {
          background: #2563eb;
          transform: scale(1.05);
        }

        .speech-button:active:not(:disabled) {
          transform: scale(0.95);
        }

        .speech-button.listening {
          background: #ef4444;
          animation: pulse 1.5s infinite;
        }

        .speech-button.disabled {
          background: #9ca3af;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .speech-icon {
          width: 20px;
          height: 20px;
        }

        .speech-status {
          margin-top: 8px;
          padding: 8px 12px;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 6px;
          font-size: 0.875rem;
          text-align: center;
        }

        .speech-error {
          margin-top: 8px;
          padding: 8px 12px;
          background: #fee2e2;
          color: #dc2626;
          border-radius: 6px;
          font-size: 0.875rem;
          text-align: center;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        @media (max-width: 768px) {
          .speech-input {
            padding: 10px 12px;
            font-size: 0.95rem;
          }

          .speech-button {
            min-width: 36px;
            height: 36px;
          }

          .speech-icon {
            width: 18px;
            height: 18px;
          }
        }
      `}</style>
    </div>
  );
};

export default SpeechToText;
