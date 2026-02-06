import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ICU from 'i18next-icu';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslations from './locales/en/translation.json';
import frTranslations from './locales/fr/translation.json';


i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .use(ICU)
  .init({
    resources: {
      fr: { translation: frTranslations },
      en: { translation: enTranslations },
    },
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;