import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const loadLocaleData = async (locale: string) => {
  try {
    const data = await import(`./locales/${locale}.json`);
    return data.default;
  } catch (error) {
    console.warn(`Failed to load locale ${locale}, falling back to English`);
    const enData = await import('./locales/en.json');
    return enData.default;
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {},
    fallbackLng: 'en',
    defaultNS: 'translation',
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
    },
  });

(async () => {
  const enData = await import('./locales/en.json');
  i18n.addResourceBundle('en', 'translation', enData.default, true, true);
})();

export { loadLocaleData };
export default i18n;
