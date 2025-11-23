// Component for dynamically translated text with loading state
import React from 'react';
import { useTranslatedText } from '../hooks/useTranslation';
import './TranslatedText.css';

const TranslatedText = ({ 
  text, 
  as: Component = 'span', 
  className = '',
  showLoading = false,
  ...props 
}) => {
  const { translatedText, isLoading } = useTranslatedText(text);

  if (isLoading && showLoading) {
    return (
      <Component className={`translated-text loading ${className}`} {...props}>
        <span className="translation-skeleton">{text}</span>
      </Component>
    );
  }

  return (
    <Component className={`translated-text ${className}`} {...props}>
      {translatedText}
    </Component>
  );
};

export default TranslatedText;
