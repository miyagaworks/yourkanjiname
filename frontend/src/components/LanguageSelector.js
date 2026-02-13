import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, SUPPORTED_LANGUAGES, LANGUAGE_CONFIG } from '../contexts/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';
import './LanguageSelector.css';

const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown when pressing Escape
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (lang) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  const currentConfig = LANGUAGE_CONFIG[language];

  return (
    <div className="language-selector" ref={dropdownRef}>
      <button
        className="language-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="language-label">{t('languageLabel')}</span>
        <span className="language-flag">{currentConfig.flag}</span>
        <span className="language-name">{currentConfig.nativeName}</span>
        <span className={`language-arrow ${isOpen ? 'open' : ''}`}>&#9660;</span>
      </button>

      {isOpen && (
        <ul className="language-dropdown" role="listbox">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const config = LANGUAGE_CONFIG[lang];
            const isSelected = lang === language;

            return (
              <li
                key={lang}
                className={`language-option ${isSelected ? 'selected' : ''}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(lang)}
              >
                <span className="language-flag">{config.flag}</span>
                <span className="language-name">{config.nativeName}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default LanguageSelector;
