'use client';

import { createContext, useContext, useCallback, useState, useEffect, ReactNode } from 'react';

export type DataSource = 'cloudcart' | 'firestore';

const STORAGE_KEY = 'data-source-preference';
const COOKIE_NAME = 'data-source';
const DEFAULT_SOURCE: DataSource = 'firestore';

interface DataSourceContextValue {
  source: DataSource;
  setSource: (source: DataSource) => void;
  isFirestore: boolean;
  isCloudCart: boolean;
}

const DataSourceContext = createContext<DataSourceContextValue | undefined>(undefined);

interface DataSourceProviderProps {
  children: ReactNode;
}

// Helper to set cookie (accessible by server components)
function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value};path=/;max-age=31536000`; // 1 year
}

// Helper to get cookie value
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

export function DataSourceProvider({ children }: DataSourceProviderProps) {
  const [source, setSourceState] = useState<DataSource>(DEFAULT_SOURCE);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage/cookie on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) || getCookie(COOKIE_NAME);
    if (stored === 'cloudcart' || stored === 'firestore') {
      setSourceState(stored);
      // Sync to both storage mechanisms
      localStorage.setItem(STORAGE_KEY, stored);
      setCookie(COOKIE_NAME, stored);
    }
    setIsHydrated(true);
  }, []);

  const setSource = useCallback((newSource: DataSource) => {
    setSourceState(newSource);
    // Store in both localStorage and cookie (cookie for server components)
    localStorage.setItem(STORAGE_KEY, newSource);
    setCookie(COOKIE_NAME, newSource);
    // Clear products cache so fresh data is fetched from new source
    localStorage.removeItem('av:productsCache:v1');
  }, []);

  const value: DataSourceContextValue = {
    source,
    setSource,
    isFirestore: source === 'firestore',
    isCloudCart: source === 'cloudcart',
  };

  // Prevent hydration mismatch by not rendering children until hydrated
  // But we still render with default value to avoid layout shift
  if (!isHydrated) {
    return (
      <DataSourceContext.Provider value={value}>
        {children}
      </DataSourceContext.Provider>
    );
  }

  return (
    <DataSourceContext.Provider value={value}>
      {children}
    </DataSourceContext.Provider>
  );
}

export function useDataSource() {
  const context = useContext(DataSourceContext);
  if (!context) {
    throw new Error('useDataSource must be used within DataSourceProvider');
  }
  return context;
}
