import React, { createContext, useContext, useState, useEffect } from 'react';

// Supported languages in display order (based on Hiroshima visitor statistics)
export const SUPPORTED_LANGUAGES = ['en', 'fr', 'de', 'es', 'pt', 'it', 'th', 'vi', 'id', 'ko', 'ja'];

// Language configuration
export const LANGUAGE_CONFIG = {
  en: { name: 'English', nativeName: 'English', flag: '\u{1F1FA}\u{1F1F8}' },
  fr: { name: 'French', nativeName: 'Fran\u00e7ais', flag: '\u{1F1EB}\u{1F1F7}' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '\u{1F1E9}\u{1F1EA}' },
  es: { name: 'Spanish', nativeName: 'Espa\u00f1ol', flag: '\u{1F1EA}\u{1F1F8}' },
  pt: { name: 'Portuguese', nativeName: 'Português', flag: '\u{1F1E7}\u{1F1F7}' },
  it: { name: 'Italian', nativeName: 'Italiano', flag: '\u{1F1EE}\u{1F1F9}' },
  th: { name: 'Thai', nativeName: '\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22', flag: '\u{1F1F9}\u{1F1ED}' },
  vi: { name: 'Vietnamese', nativeName: 'Ti\u1EBFng Vi\u1EC7t', flag: '\u{1F1FB}\u{1F1F3}' },
  id: { name: 'Indonesian', nativeName: 'Indonesia', flag: '\u{1F1EE}\u{1F1E9}' },
  ko: { name: 'Korean', nativeName: '\uD55C\uAD6D\uC5B4', flag: '\u{1F1F0}\u{1F1F7}' },
  ja: { name: 'Japanese', nativeName: '\u65E5\u672C\u8A9E', flag: '\u{1F1EF}\u{1F1F5}' }
};

const LanguageContext = createContext(null);

/**
 * Detect language from various sources
 * Priority: URL param > localStorage > browser setting > default (en)
 */
const detectLanguage = () => {
  // 1. URL parameter (?lang=ko)
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  if (urlLang && SUPPORTED_LANGUAGES.includes(urlLang)) {
    return urlLang;
  }

  // 2. localStorage (past selection)
  const savedLang = localStorage.getItem('preferred_language');
  if (savedLang && SUPPORTED_LANGUAGES.includes(savedLang)) {
    return savedLang;
  }

  // 3. Browser/OS setting (navigator.language)
  const browserLang = navigator.language.split('-')[0];
  if (SUPPORTED_LANGUAGES.includes(browserLang)) {
    return browserLang;
  }

  // 4. Default: English
  return 'en';
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => detectLanguage());

  // Save to localStorage when language changes
  const setLanguage = (lang) => {
    if (SUPPORTED_LANGUAGES.includes(lang)) {
      setLanguageState(lang);
      localStorage.setItem('preferred_language', lang);
    }
  };

  // Update URL when language changes (without page reload)
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', language);
    window.history.replaceState({}, '', url.toString());
  }, [language]);

  const value = {
    language,
    setLanguage,
    languageConfig: LANGUAGE_CONFIG[language],
    supportedLanguages: SUPPORTED_LANGUAGES,
    allLanguageConfigs: LANGUAGE_CONFIG
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
