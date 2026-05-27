import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import vi from './vi.json';
import en from './en.json';

const LANGUAGE_STORAGE_KEY = 'cutie_cuts_language';
const initialLanguage = typeof window === 'undefined'
  ? 'vi'
  : localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'vi';

i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: vi },
    en: { translation: en },
  },
  lng: initialLanguage,
  fallbackLng: 'vi',
  interpolation: {
    escapeValue: false,
  },
});

i18n.on('languageChanged', (language) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }
});

export default i18n;
