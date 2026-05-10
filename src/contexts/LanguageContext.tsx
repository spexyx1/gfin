import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
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
  const userRef = useRef(user);
  userRef.current = user;

  const [currentLanguage, setCurrentLanguage] = useState<string>(() => resolveInitialLanguage());
  const [isRTL, setIsRTL] = useState<boolean>(() => isRTLLanguage(resolveInitialLanguage()));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Stable: does not depend on user — accesses it via ref for DB writes
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

    const currentUser = userRef.current;
    if (persistToDb && currentUser && supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({ preferred_language: normalized })
        .eq('id', currentUser.id);
      if (error) {
        logger.error('Failed to save preferred language', 'LanguageContext', error);
      }
    }
  }, []); // stable — no deps change identity

  const changeLanguage = useCallback(async (languageCode: string) => {
    try {
      await applyLanguage(languageCode, true);
    } catch (error) {
      logger.error('Failed to change language', 'LanguageContext', error);
      throw error;
    }
  }, [applyLanguage]);

  // Runs once on mount for initial load from localStorage/navigator
  useEffect(() => {
    let cancelled = false;
    const initLanguage = async () => {
      try {
        await applyLanguage(resolveInitialLanguage(), false);
      } catch (error) {
        logger.error('Failed to initialize language', 'LanguageContext', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    initLanguage();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Separate effect: when a user logs in, load their DB preference if it differs
  useEffect(() => {
    if (!user?.id || !supabase) return;
    let cancelled = false;

    supabase
      .from('profiles')
      .select('preferred_language')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data: profile, error }) => {
        if (cancelled || error || !profile?.preferred_language) return;
        const stored = localStorage.getItem(STORAGE_KEY);
        if (profile.preferred_language !== stored) {
          applyLanguage(profile.preferred_language, false).catch(err =>
            logger.error('Failed to apply DB language preference', 'LanguageContext', err)
          );
        }
      });

    return () => { cancelled = true; };
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
