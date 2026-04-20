import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslations from './locales/en.json';

const loadedLocales = new Set<string>(['en']);

export const loadLocaleData = async (locale: string) => {
  try {
    const data = await import(`./locales/${locale}.json`);
    return data.default;
  } catch (error) {
    console.warn(`Failed to load locale ${locale}, falling back to English`, error);
    return enTranslations;
  }
};

export const ensureLocaleLoaded = async (locale: string) => {
  if (loadedLocales.has(locale) && i18n.hasResourceBundle(locale, 'translation')) {
    return;
  }
  const data = await loadLocaleData(locale);
  i18n.addResourceBundle(locale, 'translation', data, true, true);
  loadedLocales.add(locale);
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
    },
    lng: undefined,
    fallbackLng: 'en',
    supportedLngs: false,
    load: 'languageOnly',
    nonExplicitSupportedLngs: true,
    defaultNS: 'translation',
    ns: ['translation'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
    },
    initImmediate: false,
  });

export default i18n;
