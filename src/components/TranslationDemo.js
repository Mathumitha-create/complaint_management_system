// Demo component to test translation functionality
import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translateText } from '../services/translationService';
import TranslatedText from './TranslatedText';
import SpeakButton from './SpeakButton';
import './TranslationDemo.css';

const TranslationDemo = () => {
  const { currentLanguage } = useLanguage();
  const [inputText, setInputText] = useState('Welcome to our Grievance Management System');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const handleManualTranslate = async () => {
    if (!inputText.trim()) return;
    
    setIsTranslating(true);
    try {
      const result = await translateText(inputText, currentLanguage);
      setTranslatedText(result);
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedText('Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  // Sample complaint data
  const sampleComplaint = {
    title: 'Library Computer Not Working',
    description: 'The computer in the library reading room has been out of order for three days. Students are unable to access online resources.',
    status: 'pending',
    priority: 'high'
  };

  return (
    <div className="translation-demo">
      <div className="demo-header">
        <h2>🌐 Translation System Demo</h2>
        <p className="current-lang">Current Language: <strong>{currentLanguage.toUpperCase()}</strong></p>
      </div>

      {/* Manual Translation Test */}
      <div className="demo-section">
        <h3>Manual Translation Test</h3>
        <div className="input-group">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter text to translate..."
            rows="3"
          />
          <button 
            onClick={handleManualTranslate}
            disabled={isTranslating}
            className="translate-btn"
          >
            {isTranslating ? 'Translating...' : `Translate to ${currentLanguage.toUpperCase()}`}
          </button>
        </div>
        
        {translatedText && (
          <div className="translation-result">
            <h4>Translation Result:</h4>
            <p>{translatedText}</p>
            <SpeakButton text={translatedText} />
          </div>
        )}
      </div>

      {/* Auto Translation Demo */}
      <div className="demo-section">
        <h3>Auto Translation Demo (TranslatedText Component)</h3>
        <div className="sample-card">
          <div className="card-header">
            <h4>
              <TranslatedText text={sampleComplaint.title} />
              <SpeakButton text={sampleComplaint.title} />
            </h4>
          </div>
          <div className="card-body">
            <p>
              <TranslatedText text={sampleComplaint.description} />
              <SpeakButton text={sampleComplaint.description} />
            </p>
          </div>
          <div className="card-footer">
            <span className="badge status-badge">
              Status: <TranslatedText text={sampleComplaint.status} />
            </span>
            <span className="badge priority-badge">
              Priority: <TranslatedText text={sampleComplaint.priority} />
            </span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="demo-section instructions">
        <h3>📝 How to Use</h3>
        <ol>
          <li>Click the <strong>🌐 language selector</strong> in the top-right corner</li>
          <li>Type to search for a language (e.g., "Tamil", "Hindi", "Malayalam")</li>
          <li>Select a language from the dropdown</li>
          <li>Watch the text above automatically translate!</li>
          <li>Click the <strong>🔊 speaker icon</strong> to hear the translation</li>
        </ol>
      </div>
    </div>
  );
};

export default TranslationDemo;
