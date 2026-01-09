import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en/translation.json';
import frTranslations from './locales/fr/translation.json';

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: frTranslations },
    en: { translation: enTranslations },
  },
  lng: 'fr',
  fallbackLng: 'fr',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;