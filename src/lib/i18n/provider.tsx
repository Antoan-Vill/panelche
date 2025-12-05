'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { i18n as I18nInstance } from 'i18next';
import { getI18nClient } from './client';
import { i18nConfig, Locale, isValidLocale } from './settings';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isReady: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [i18n, setI18n] = useState<I18nInstance | null>(null);
  const [locale, setLocaleState] = useState<Locale>(i18nConfig.defaultLocale);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const instance = getI18nClient();
    setI18n(instance);

    // Get initial locale from storage or detection
    const storedLocale = localStorage.getItem(i18nConfig.localStorageKey);
    const cookieLocale = getCookieLocale();
    const initialLocale = (storedLocale && isValidLocale(storedLocale)) 
      ? storedLocale 
      : (cookieLocale && isValidLocale(cookieLocale))
        ? cookieLocale
        : i18nConfig.defaultLocale;

    if (instance.language !== initialLocale) {
      instance.changeLanguage(initialLocale);
    }
    
    setLocaleState(initialLocale);
    setIsReady(true);

    // Listen for language changes
    const handleLanguageChange = (lng: string) => {
      if (isValidLocale(lng)) {
        setLocaleState(lng);
      }
    };

    instance.on('languageChanged', handleLanguageChange);

    return () => {
      instance.off('languageChanged', handleLanguageChange);
    };
  }, []);

  const setLocale = (newLocale: Locale) => {
    if (!i18n) return;
    
    // Save to localStorage
    localStorage.setItem(i18nConfig.localStorageKey, newLocale);
    
    // Save to cookie
    document.cookie = `${i18nConfig.cookieName}=${newLocale};path=/;max-age=${365 * 24 * 60 * 60}`;
    
    // Change language
    i18n.changeLanguage(newLocale);
  };

  if (!i18n) {
    return null;
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, isReady }}>
      <I18nextProvider i18n={i18n}>
        {children}
      </I18nextProvider>
    </I18nContext.Provider>
  );
}

export function useI18nContext(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18nContext must be used within an I18nProvider');
  }
  return context;
}

function getCookieLocale(): string | null {
  if (typeof document === 'undefined') return null;
  
  const match = document.cookie.match(new RegExp(`${i18nConfig.cookieName}=([^;]+)`));
  return match?.[1] || null;
}
