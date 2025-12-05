export const i18nConfig = {
  defaultLocale: 'bg',
  locales: ['bg', 'en'],
  fallbackLocale: 'en',
  defaultNamespace: 'common',
  namespaces: ['common'],
  cookieName: 'NEXT_LOCALE',
  localStorageKey: 'preferredLanguage',
} as const;

export type Locale = (typeof i18nConfig.locales)[number];

export function isValidLocale(locale: string): locale is Locale {
  return i18nConfig.locales.includes(locale as Locale);
}

export function getLocaleFromCookie(cookies: string | undefined): Locale {
  if (!cookies) return i18nConfig.defaultLocale;
  
  const match = cookies.match(new RegExp(`${i18nConfig.cookieName}=([^;]+)`));
  const locale = match?.[1];
  
  if (locale && isValidLocale(locale)) {
    return locale;
  }
  
  return i18nConfig.defaultLocale;
}
