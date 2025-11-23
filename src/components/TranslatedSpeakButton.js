// Component that displays translated text and speaks it in the selected language
import React, { useState } from "react";
import { useTranslation, useTranslatedText } from "../hooks/useTranslation";
import SpeakButton from "./SpeakButton";

const TranslatedSpeakButton = ({
  text,
  className = "",
  showText = true,
  speakButtonClassName = "",
}) => {
  const { t } = useTranslation();
  const { translatedText, isLoading } = useTranslatedText(text);

  return (
    <div
      className={`translated-speak-container ${className}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        width: "100%",
      }}
    >
      {showText && (
        <span
          className="translated-text"
          style={{
            flex: 1,
            color: "#1e293b",
            fontSize: "0.95rem",
          }}
        >
          {isLoading ? "..." : translatedText || t(text)}
        </span>
      )}
      <SpeakButton
        text={translatedText || t(text)}
        className={speakButtonClassName}
      />
    </div>
  );
};

export default TranslatedSpeakButton;
