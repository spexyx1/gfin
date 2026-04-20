import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import i18n, { ensureLocaleLoaded } from '../i18n';
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

function resolveInitialLanguage(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const base = stored.split('-')[0];
      if (SUPPORTED_LANGUAGES.find(l => l.code === stored)) return stored;
      if (SUPPORTED_LANGUAGES.find(l => l.code === base)) return base;
    }
    const nav = (typeof navigator !== 'undefined' ? navigator.language : 'en').split('-')[0];
    if (SUPPORTED_LANGUAGES.find(l => l.code === nav)) return nav;
  } catch {
    // ignore
  }
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => resolveInitialLanguage());
  const [isRTL, setIsRTL] = useState<boolean>(() => isRTLLanguage(resolveInitialLanguage()));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const applyLanguage = useCallback(async (languageCode: string, persistToDb: boolean) => {
    const normalized = SUPPORTED_LANGUAGES.find(l => l.code === languageCode)
      ? languageCode
      : 'en';

    await ensureLocaleLoaded(normalized);
    await i18n.changeLanguage(normalized);

    const rtl = isRTLLanguage(normalized);
    setCurrentLanguage(normalized);
    setIsRTL(rtl);

    if (typeof document !== 'undefined') {
      document.documentElement.dir = rtl ? 'rtl' : 'ltr';
      document.documentElement.lang = normalized;
    }

    try {
      localStorage.setItem(STORAGE_KEY, normalized);
    } catch {
      // ignore storage errors
    }

    if (persistToDb && user) {
      const { error } = await supabase
        .from('profiles')
        .update({ preferred_language: normalized })
        .eq('id', user.id);
      if (error) {
        logger.error('Failed to save preferred language', 'LanguageContext', error);
      }
    }
  }, [user]);

  const changeLanguage = useCallback(async (languageCode: string) => {
    try {
      await applyLanguage(languageCode, true);
    } catch (error) {
      logger.error('Failed to change language', 'LanguageContext', error);
      throw error;
    }
  }, [applyLanguage]);

  useEffect(() => {
    let cancelled = false;
    const initializeLanguage = async () => {
      try {
        let languageToUse = resolveInitialLanguage();

        if (user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('preferred_language')
            .eq('id', user.id)
            .maybeSingle();

          if (!error && profile?.preferred_language) {
            languageToUse = profile.preferred_language;
          }
        }

        if (cancelled) return;
        await applyLanguage(languageToUse, false);
      } catch (error) {
        logger.error('Failed to initialize language', 'LanguageContext', error);
        if (!cancelled) await applyLanguage('en', false);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    initializeLanguage();
    return () => {
      cancelled = true;
    };
  }, [user?.id, applyLanguage]);

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
