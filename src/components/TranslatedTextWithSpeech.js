// Component that displays translated text with a speak button
import React from 'react';
import { useTranslatedText } from '../hooks/useTranslation';
import SpeakButton from './SpeakButton';

const TranslatedTextWithSpeech = ({ 
  text, 
  as: Component = 'span', 
  className = '',
  showSpeakButton = true,
  ...props 
}) => {
  const { translatedText, isLoading } = useTranslatedText(text);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Component className={`translated-text ${className}`} {...props}>
        {translatedText}
      </Component>
      {showSpeakButton && !isLoading && (
        <SpeakButton text={translatedText} />
      )}
    </div>
  );
};

export default TranslatedTextWithSpeech;
