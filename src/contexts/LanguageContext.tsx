import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import i18n, { loadLocaleData } from '../i18n';
import { SUPPORTED_LANGUAGES, Language, isRTLLanguage } from '../i18n/languages';
import { logger } from '../utils/logger';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (languageCode: string) => Promise<void>;
  languages: Language[];
  isRTL: boolean;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'i18nextLng';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [isRTL, setIsRTL] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        let languageToUse = 'en';

        if (user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('preferred_language')
            .eq('id', user.id)
            .maybeSingle();

          if (!error && profile?.preferred_language) {
            languageToUse = profile.preferred_language;
            logger.debug(`Loaded user preferred language: ${languageToUse}`, 'LanguageContext');
          }
        }

        if (languageToUse === 'en') {
          const storedLanguage = localStorage.getItem(STORAGE_KEY);
          if (storedLanguage && SUPPORTED_LANGUAGES.find(l => l.code === storedLanguage)) {
            languageToUse = storedLanguage;
            logger.debug(`Using stored language: ${languageToUse}`, 'LanguageContext');
          } else {
            const browserLanguage = navigator.language.split('-')[0];
            if (SUPPORTED_LANGUAGES.find(l => l.code === browserLanguage)) {
              languageToUse = browserLanguage;
              logger.debug(`Using browser language: ${languageToUse}`, 'LanguageContext');
            }
          }
        }

        await changeLanguage(languageToUse);
      } catch (error) {
        logger.error('Failed to initialize language', 'LanguageContext', error);
        await changeLanguage('en');
      } finally {
        setIsLoading(false);
      }
    };

    initializeLanguage();
  }, [user?.id]);

  const changeLanguage = async (languageCode: string) => {
    try {
      logger.debug(`Changing language to: ${languageCode}`, 'LanguageContext');

      const localeData = await loadLocaleData(languageCode);
      i18n.addResourceBundle(languageCode, 'translation', localeData, true, true);

      await i18n.changeLanguage(languageCode);

      setCurrentLanguage(languageCode);

      const rtl = isRTLLanguage(languageCode);
      setIsRTL(rtl);
      document.documentElement.dir = rtl ? 'rtl' : 'ltr';
      document.documentElement.lang = languageCode;

      localStorage.setItem(STORAGE_KEY, languageCode);

      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ preferred_language: languageCode })
          .eq('id', user.id);

        if (error) {
          logger.error('Failed to update preferred language in database', 'LanguageContext', error);
        } else {
          logger.debug(`Updated preferred language in database: ${languageCode}`, 'LanguageContext');
        }
      }

      logger.debug(`Language changed successfully to ${languageCode}`, 'LanguageContext');
    } catch (error) {
      logger.error('Failed to change language', 'LanguageContext', error);
      throw error;
    }
  };

  const value: LanguageContextType = {
    currentLanguage,
    changeLanguage,
    languages: SUPPORTED_LANGUAGES,
    isRTL,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
