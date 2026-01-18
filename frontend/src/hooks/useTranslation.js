import { useLanguage } from '../contexts/LanguageContext';
import translations from '../locales';

/**
 * Hook for getting translated UI strings
 *
 * Usage:
 *   const { t } = useTranslation();
 *   <p>{t('start')}</p>
 *   <p>{t('greeting', { name: 'John' })}</p>
 */
export const useTranslation = () => {
  const { language } = useLanguage();

  /**
   * Get translated string
   * @param {string} key - Translation key (e.g., 'start', 'next')
   * @param {object} params - Optional parameters for interpolation
   * @returns {string} Translated string
   */
  const t = (key, params = {}) => {
    const langTranslations = translations[language] || translations.en;
    let text = langTranslations[key];

    // Fallback to English if key not found
    if (text === undefined) {
      text = translations.en[key] || key;
    }

    // Simple parameter interpolation: {{name}} -> value
    if (params && typeof text === 'string') {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(new RegExp(`{{${param}}}`, 'g'), value);
      });
    }

    return text;
  };

  return { t, language };
};

export default useTranslation;
