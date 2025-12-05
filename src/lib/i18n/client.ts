'use client';

import i18next, { i18n as I18nInstance } from 'i18next';
import { initReactI18next, useTranslation as useTranslationBase } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { i18nConfig, Locale } from './settings';

// Import translations
import bgCommon from '../../../public/locales/bg/common.json';
import enCommon from '../../../public/locales/en/common.json';

const resources = {
  bg: {
    common: bgCommon,
  },
  en: {
    common: enCommon,
  },
};

let i18nInstance: I18nInstance | null = null;

export function getI18nClient(): I18nInstance {
  if (i18nInstance) {
    return i18nInstance;
  }

  i18nInstance = i18next.createInstance();
  
  i18nInstance
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      lng: i18nConfig.defaultLocale,
      fallbackLng: i18nConfig.fallbackLocale,
      defaultNS: i18nConfig.defaultNamespace,
      ns: i18nConfig.namespaces,
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['cookie', 'localStorage', 'navigator'],
        lookupCookie: i18nConfig.cookieName,
        lookupLocalStorage: i18nConfig.localStorageKey,
        caches: ['cookie', 'localStorage'],
        cookieOptions: {
          path: '/',
          maxAge: 365 * 24 * 60 * 60, // 1 year
        },
      },
      react: {
        useSuspense: false,
      },
    });

  return i18nInstance;
}

export function useTranslation(namespace: string = 'common') {
  return useTranslationBase(namespace);
}

export function changeLanguage(locale: Locale): void {
  const i18n = getI18nClient();
  
  // Save to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(i18nConfig.localStorageKey, locale);
    
    // Save to cookie
    document.cookie = `${i18nConfig.cookieName}=${locale};path=/;max-age=${365 * 24 * 60 * 60}`;
  }
  
  i18n.changeLanguage(locale);
}

export function getCurrentLocale(): Locale {
  const i18n = getI18nClient();
  return (i18n.language as Locale) || i18nConfig.defaultLocale;
}
