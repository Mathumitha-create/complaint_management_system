import { useEffect } from "react";
import { translateBatch } from "../services/translationService";
import { useLanguage } from "../contexts/LanguageContext";

/**
 * Hook: batch translate an array of texts and cache results in LanguageContext
 * @param {string[]} texts - array of strings to translate
 * @param {boolean} enabled - whether to run
 */
const useBatchTranslate = (texts = [], enabled = true) => {
  const { currentLanguage, cacheTranslation, getCachedTranslation } =
    useLanguage();

  useEffect(() => {
    if (!enabled) return;
    if (!texts || texts.length === 0) return;
    if (currentLanguage === "en") return; // nothing to do

    const unique = Array.from(new Set(texts.filter(Boolean)));
    const toTranslate = unique.filter(
      (t) => !getCachedTranslation(t, currentLanguage)
    );
    if (toTranslate.length === 0) return;

    let cancelled = false;

    const doTranslate = async () => {
      try {
        console.log(
          "useBatchTranslate: translating",
          toTranslate.length,
          "items",
          toTranslate.slice(0, 10)
        );
        const translations = await translateBatch(toTranslate, currentLanguage);
        console.log(
          "useBatchTranslate: received",
          translations.length,
          "translations"
        );
        if (cancelled) return;
        translations.forEach((translated, idx) => {
          try {
            cacheTranslation(toTranslate[idx], currentLanguage, translated);
          } catch (e) {
            // swallow caching errors
            console.error("Cache error", e);
          }
        });
      } catch (err) {
        console.error("useBatchTranslate error:", err);
      }
    };

    doTranslate();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLanguage, enabled, texts.length && texts.join("||")]);
};

export default useBatchTranslate;
