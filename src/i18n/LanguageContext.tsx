import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppLanguage, LanguageOption } from '../types';
import { translations, AVAILABLE_LANGUAGES, TranslationKey } from './translations';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: TranslationKey, fallback?: string) => string;
  availableLanguages: LanguageOption[];
}

const STORAGE_KEY_LANGUAGE = 'iptv_app_language_v2';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LANGUAGE) as AppLanguage;
      if (saved && ['tr', 'en', 'de', 'es', 'fr'].includes(saved)) {
        return saved;
      }
      // Check browser language
      const navLang = navigator.language?.toLowerCase() || '';
      if (navLang.startsWith('tr')) return 'tr';
      if (navLang.startsWith('de')) return 'de';
      if (navLang.startsWith('es')) return 'es';
      if (navLang.startsWith('fr')) return 'fr';
      return 'tr'; // Default to Turkish as requested
    } catch {
      return 'tr';
    }
  });

  const setLanguage = useCallback((newLang: AppLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY_LANGUAGE, newLang);
      document.documentElement.lang = newLang;
    } catch (e) {
      console.warn('Failed to save language preference:', e);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback((key: TranslationKey, fallback?: string): string => {
    const langDict = translations[language] || translations.en;
    if (key in langDict) {
      return langDict[key as keyof typeof langDict];
    }
    const fallbackDict = translations.en;
    if (key in fallbackDict) {
      return fallbackDict[key as keyof typeof fallbackDict];
    }
    return fallback || key;
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        availableLanguages: AVAILABLE_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
