// Text-to-Speech Button Component (Using Browser's Web Speech API)
import React, { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useTranslatedText } from "../hooks/useTranslation";
import "./SpeakButton.css";

const SpeakButton = ({ text, className = "" }) => {
  const { currentLanguage } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  // Get translated text (if user selected a non-English language)
  const { translatedText, isLoading: isTranslating } = useTranslatedText(text);
  const [error, setError] = useState(null);
  const [speakingRequested, setSpeakingRequested] = useState(false);

  // Language to voice mapping for better TTS
  const languageVoiceMap = {
    en: "en-US",
    hi: "hi-IN",
    ta: "ta-IN",
    te: "te-IN",
    bn: "bn-IN",
    mr: "mr-IN",
    gu: "gu-IN",
    kn: "kn-IN",
    ml: "ml-IN",
    pa: "pa-IN",
    or: "or-IN",
    as: "as-IN",
    ur: "ur-IN",
    sa: "sa-IN",
    ks: "ks-IN",
    sd: "sd-IN",
    ne: "ne-NP",
    si: "si-LK",
  };

  const handleSpeak = () => {
    // Check if browser supports Speech Synthesis
    if (!("speechSynthesis" in window)) {
      setError("Text-to-Speech is not supported in your browser");
      alert(
        "Text-to-Speech is not supported in your browser. Please use Chrome, Edge, or Safari."
      );
      return;
    }

    // If already playing, stop it
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    if (!text || text.trim() === "") {
      console.warn("No text to speak");
    }

    // If translation is still in progress, mark request and wait for it to finish
    if (isTranslating) {
      setSpeakingRequested(true);
      // voices may still be loading; ensure voicesReady will trigger speak when ready
      ensureVoicesLoaded()
        .catch(() => { });
      return;
    }

    // Ensure voices are loaded before speaking
    ensureVoicesLoaded()
      .then(() => {
        speakText();
      })
      .catch((err) => {
        console.warn("Could not load voices:", err);
        // still attempt to speak
        speakText();
      });
  };

  // Helper: returns a promise that resolves when voices are available
  const ensureVoicesLoaded = () => {
    return new Promise((resolve) => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        resolve(voices);
        return;
      }

      const handler = () => {
        const loaded = window.speechSynthesis.getVoices();
        if (loaded && loaded.length > 0) {
          try {
            window.speechSynthesis.removeEventListener(
              "voiceschanged",
              handler
            );
          } catch (e) {
            window.speechSynthesis.onvoiceschanged = null;
          }
          resolve(loaded);
        }
      };

      // Attach event listener
      try {
        window.speechSynthesis.addEventListener("voiceschanged", handler);
      } catch (e) {
        // some browsers only support onvoiceschanged assignment
        window.speechSynthesis.onvoiceschanged = handler;
      }

      // Fallback: try again shortly
      setTimeout(() => {
        const again = window.speechSynthesis.getVoices();
        if (again && again.length > 0) {
          try {
            window.speechSynthesis.removeEventListener(
              "voiceschanged",
              handler
            );
          } catch (e) { }
          resolve(again);
        }
      }, 250);
    });
  };

  // Function to speak with loaded voices
  const speakText = () => {
    try {
      // Choose the text to speak: prefer translated text if available
      const finalText =
        translatedText && translatedText.trim() !== "" ? translatedText : text;
      // If user requested speaking while translation was pending, clear the flag
      if (speakingRequested) setSpeakingRequested(false);
      // Set language
      const lang = languageVoiceMap[currentLanguage] || "en-US";

      // Get voices and find matching voice
      const voices = window.speechSynthesis.getVoices();
      console.log("🔊 Available voices:", voices.length);
      console.log("🔊 Current language code:", currentLanguage);
      console.log("🔊 Looking for voice with locale:", lang);

      // List all available voices for debugging
      voices.forEach((v) => console.log(`  - ${v.name} (${v.lang})`));

      // Try multiple matching strategies
      let matchingVoice = null;

      // 1. Try exact match (e.g., 'hi-IN')
      matchingVoice = voices.find((voice) => voice.lang === lang);

      // 2. Try language code with dash (e.g., 'hi-' matches 'hi-IN')
      if (!matchingVoice) {
        matchingVoice = voices.find((voice) =>
          voice.lang.startsWith(currentLanguage + "-")
        );
      }

      // 3. Try language code with underscore (e.g., 'hi_' matches 'hi_IN')
      if (!matchingVoice) {
        matchingVoice = voices.find((voice) =>
          voice.lang.startsWith(currentLanguage + "_")
        );
      }

      // 4. Try just the language code (e.g., 'hi')
      if (!matchingVoice) {
        matchingVoice = voices.find((voice) =>
          voice.lang.toLowerCase().startsWith(currentLanguage.toLowerCase())
        );
      }

      // 5. Try case-insensitive search in lang string
      if (!matchingVoice) {
        matchingVoice = voices.find((voice) =>
          voice.lang.toLowerCase().includes(currentLanguage.toLowerCase())
        );
      }

      // 6. For Indian languages, try to find any Indian voice
      if (!matchingVoice && lang.includes("-IN")) {
        matchingVoice = voices.find((voice) => voice.lang.includes("-IN"));
      }

      // 7. If still no match, try to find any voice that contains the language code
      if (!matchingVoice) {
        matchingVoice = voices.find((voice) =>
          voice.lang
            .toLowerCase()
            .includes(currentLanguage.toLowerCase().substring(0, 2))
        );
      }

      const utterance = new SpeechSynthesisUtterance(finalText);

      // Set language
      utterance.lang = lang;

      // Set voice properties
      utterance.rate = 0.9; // Slightly slower for clarity

      if (matchingVoice) {
        utterance.voice = matchingVoice;
        console.log(
          "✅ Using voice:",
          matchingVoice.name,
          "(" + matchingVoice.lang + ")"
        );
      } else {
        console.warn(
          "⚠️ No matching voice found for",
          lang,
          "- browser will use default voice"
        );
        console.warn(
          "💡 Language code set to:",
          lang,
          "- browser should still attempt pronunciation"
        );
      }

      // Event handlers
      utterance.onstart = () => {
        setIsPlaying(true);
        console.log("🔊 Started speaking:", text.substring(0, 50) + "...");
      };

      utterance.onend = () => {
        setIsPlaying(false);
        console.log("🔊 Finished speaking");
      };

      utterance.onerror = (event) => {
        setIsPlaying(false);
        console.error("🔊 Speech error:", event.error);
        if (event.error !== "interrupted") {
          setError("Speech error: " + event.error);
          alert("TTS Error: " + event.error + ". Please try again.");
        }
      };

      // Speak the text
      console.log("🔊 Speaking text:", finalText);
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Speech error:", err);
      setError("Failed to speak text");
      setIsPlaying(false);
      alert("Failed to speak: " + err.message);
    }
  };

  // If a speak request was made while translation was loading, speak when ready
  useEffect(() => {
    if (!isTranslating && speakingRequested) {
      ensureVoicesLoaded()
        .then(() => speakText())
        .catch(() => speakText());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTranslating, speakingRequested]);

  return (
    <div className={`speak-button-container ${className}`}>
      <button
        className={`speak-button ${isPlaying ? "playing" : ""}`}
        onClick={handleSpeak}
        title={isPlaying ? "Stop speaking" : "Read aloud"}
        aria-label={isPlaying ? "Stop speaking" : "Read aloud"}
      >
        {isPlaying ? (
          <svg
            className="speak-icon"
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
            className="speak-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </button>
      {error && <span className="speak-error">{error}</span>}
    </div>
  );
};

export default SpeakButton;
