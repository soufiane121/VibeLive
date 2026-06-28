import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';

import en from './locales/en.json';
import es from './locales/es.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
};

const getDeviceLanguage = (): string => {
  try {
    const locales = RNLocalize.getLocales();
    if (locales && locales.length > 0) {
      // languageCode is already the ISO 639-1 code (e.g. "en", "fr", "ar")
      // languageTag may include a region (e.g. "fr-FR") — strip it as fallback
      const code = locales[0].languageCode || locales[0].languageTag?.split('-')[0];
      if (code) return code.toLowerCase();
    }
  } catch {
    // Native module unavailable — fall through to default
  }
  return 'en';
};

const deviceLanguage = getDeviceLanguage();
const supportedLanguages = ['en', 'es'];
const defaultLanguage = supportedLanguages.includes(deviceLanguage) ? deviceLanguage : 'en';

export const i18nInit = i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })
  .then(() => {
    console.log('i18n initialized, resources loaded:', !!i18n.store.data);
    console.log('Has event.readyToGoLive:', i18n.exists('event.readyToGoLive'));
  })
  .catch((err) => {
    console.warn('i18n init failed, falling back to English:', err);
  });

export default i18n;
