'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useI18nContext, i18nConfig, isValidLocale } from '@/lib/i18n';

/**
 * Custom hook for client-side translation with automatic locale synchronization.
 * This hook ensures the language preference is restored from localStorage on mount
 * and provides a consistent translation interface across the application.
 * 
 * @param namespace - The translation namespace to use (defaults to 'common')
 * @returns The translation function and i18n instance from react-i18next
 */
export function useClientTranslation(namespace: string = 'common') {
  const { t, i18n, ready } = useTranslation(namespace);
  const { locale, setLocale, isReady } = useI18nContext();

  useEffect(() => {
    // Check localStorage on mount and sync if different
    if (typeof window !== 'undefined' && isReady) {
      const savedLocale = localStorage.getItem(i18nConfig.localStorageKey);
      
      if (savedLocale && isValidLocale(savedLocale) && savedLocale !== i18n.language) {
        // Sync the language from localStorage
        setLocale(savedLocale);
      }
    }
  }, [isReady, i18n.language, setLocale]);

  return {
    t,
    i18n,
    locale,
    ready: ready && isReady,
    changeLanguage: setLocale,
  };
}

export default useClientTranslation;
