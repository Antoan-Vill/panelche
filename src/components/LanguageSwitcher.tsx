'use client';

import { useI18nContext, i18nConfig, Locale } from '@/lib/i18n';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'buttons' | 'dropdown';
}

export function LanguageSwitcher({ 
  className = '', 
  variant = 'buttons' 
}: LanguageSwitcherProps) {
  const { locale, setLocale, isReady } = useI18nContext();

  if (!isReady) {
    return (
      <div className={`language-switcher ${className}`}>
        <span className="text-muted-foreground">...</span>
      </div>
    );
  }

  const handleChange = (newLocale: Locale) => {
    setLocale(newLocale);
  };

  if (variant === 'dropdown') {
    return (
      <div className={`language-switcher ${className}`}>
        <select
          value={locale}
          onChange={(e) => handleChange(e.target.value as Locale)}
          className="px-3 py-2 bg-background border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
          aria-label="Select language"
        >
          {i18nConfig.locales.map((loc) => (
            <option key={loc} value={loc}>
              {loc === 'bg' ? 'Български' : 'English'}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={`language-switcher flex gap-1 ${className}`}>
      {i18nConfig.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => handleChange(loc)}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-md transition-colors
            ${locale === loc
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }
          `}
          aria-pressed={locale === loc}
          aria-label={`Switch to ${loc === 'bg' ? 'Bulgarian' : 'English'}`}
        >
          {loc === 'bg' ? 'БГ' : 'EN'}
        </button>
      ))}
    </div>
  );
}

export default LanguageSwitcher;
