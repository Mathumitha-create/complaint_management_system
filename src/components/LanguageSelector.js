// Language Selector Component - Searchable dropdown for switching languages
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../contexts/LanguageContext";
import "./LanguageSelector.css";

// Regional Indian Languages - All supported by Google Cloud Translation API
const REGIONAL_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া" },
  { code: "ur", name: "Urdu", nativeName: "اردو" },
  { code: "sa", name: "Sanskrit", nativeName: "संस्कृतम्" },
  { code: "ks", name: "Kashmiri", nativeName: "कॉशुर" },
  { code: "sd", name: "Sindhi", nativeName: "سنڌي" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली" },
  { code: "si", name: "Sinhala", nativeName: "සිංහල" },
];

const LanguageSelector = () => {
  const { currentLanguage, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [allLanguages] = useState(REGIONAL_LANGUAGES); // Use regional languages only
  const [filteredLanguages, setFilteredLanguages] =
    useState(REGIONAL_LANGUAGES);
  const searchInputRef = useRef(null);
  const buttonRef = useRef(null);
  const portalDivRef = useRef(null);

  // No API fetch needed - using predefined regional languages

  // Filter languages based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredLanguages(allLanguages);
    } else {
      const filtered = allLanguages.filter(
        (lang) =>
          lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lang.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLanguages(filtered);
    }
  }, [searchTerm, allLanguages]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Create a portal container once and attach to document.body
  useEffect(() => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    portalDivRef.current = div;
    return () => {
      try {
        document.body.removeChild(div);
      } catch (e) {
        // ignore
      }
    };
  }, []);

  const handleLanguageChange = (languageCode, languageName) => {
    console.log("🌐 Language changed to:", languageCode, languageName);
    changeLanguage(languageCode);
    setIsOpen(false);
    setSearchTerm("");
    // Force a small delay to ensure state updates
    setTimeout(() => {
      console.log("✅ Language change complete");
    }, 100);
  };

  const handleToggleDropdown = () => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);
    if (willOpen) {
      setSearchTerm("");
      // compute dropdown position relative to button, use fixed positioning to escape stacking contexts
      const btn = buttonRef.current;
      if (btn) {
        const rect = btn.getBoundingClientRect();
        const dropdownWidth = Math.min(320, Math.max(200, rect.width * 1.5));
        const right = Math.max(8, window.innerWidth - rect.right);
        const top = rect.bottom + 8 + window.scrollY;
        // prefer right-aligned dropdown matching original design
        setDropdownStyle({
          position: "fixed",
          top: `${top}px`,
          right: `${right}px`,
          width: `${dropdownWidth}px`,
        });
      }
    }
  };

  const currentLang = allLanguages.find(
    (lang) => lang.code === currentLanguage
  );
  const displayName = currentLang?.nativeName || currentLang?.name || "English";

  return (
    <div className="language-selector">
      <button
        ref={buttonRef}
        className="language-selector-button"
        onClick={handleToggleDropdown}
        aria-label="Select Language"
      >
        <span className="language-icon">🌐</span>
        <span className="language-text">{displayName}</span>
        <span className={`dropdown-arrow ${isOpen ? "open" : ""}`}>▼</span>
      </button>

      {isOpen &&
        portalDivRef.current &&
        createPortal(
          <>
            <div className="language-dropdown" style={dropdownStyle}>
              {/* Search Input */}
              <div className="language-search-container">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="language-search-input"
                  placeholder="Type to search languages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                {searchTerm && (
                  <button
                    className="clear-search"
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Language List */}
              <div className="language-list">
                <div className="api-status-success">
                  🇮🇳 {allLanguages.length} Regional Indian Languages
                </div>
                {filteredLanguages.length === 0 ? (
                  <div className="language-no-results">
                    No languages found. Try a different search.
                  </div>
                ) : (
                  filteredLanguages.map((language) => (
                    <button
                      key={language.code}
                      className={`language-option ${
                        currentLanguage === language.code ? "active" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleLanguageChange(language.code, language.name);
                      }}
                      type="button"
                    >
                      <span className="language-name">
                        <span className="native-name">
                          {language.nativeName}
                        </span>
                        <span className="english-name">({language.name})</span>
                      </span>
                      <span className="language-code">{language.code}</span>
                      {currentLanguage === language.code && (
                        <span className="checkmark">✓</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Backdrop to close dropdown when clicking outside */}
            <div
              className="language-backdrop"
              onClick={() => {
                setIsOpen(false);
                setSearchTerm("");
              }}
            />
          </>,
          portalDivRef.current
        )}
    </div>
  );
};

export default LanguageSelector;
