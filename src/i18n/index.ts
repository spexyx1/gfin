import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import { logger } from '../utils/logger';
import { SUPPORTED_LANGUAGES } from './languages';

const loadedLocales = new Set<string>(['en']);

export const loadLocaleData = async (locale: string) => {
  try {
    const data = await import(`./locales/${locale}.json`);
    return data.default;
  } catch (error) {
    logger.warn(`Failed to load locale ${locale}, falling back to English`, 'i18n', error);
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

const supportedCodes = SUPPORTED_LANGUAGES.map(l => l.code);

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
    },
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: supportedCodes,
    load: 'languageOnly',
    nonExplicitSupportedLngs: false,
    defaultNS: 'translation',
    ns: ['translation'],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
    },
    initImmediate: false,
  });

export default i18n;
