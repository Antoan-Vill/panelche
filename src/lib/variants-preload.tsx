'use client';

import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import type { Variant } from '@/lib/types/products';

type VariantsMap = Map<string, Variant[]>;

type VariantsPreloadContextType = {
  getCachedVariants: (productId: string) => Variant[] | undefined;
  setBatch: (entries: Record<string, Variant[]>) => void;
  preload: (productIds: string[], options?: { concurrency?: number }) => Promise<void>;
  isLoading: boolean;
};

const VariantsPreloadContext = createContext<VariantsPreloadContextType | undefined>(undefined);

export function VariantsPreloadProvider({ children }: { children: ReactNode }) {
  const [variantsMap, setVariantsMap] = useState<VariantsMap>(() => new Map());
  const [isLoading, setIsLoading] = useState(false);

  const getCachedVariants = useCallback((productId: string) => {
    return variantsMap.get(productId);
  }, [variantsMap]);

  const setBatch = useCallback((entries: Record<string, Variant[]>) => {
    setVariantsMap((prev) => {
      const next = new Map(prev);
      for (const [pid, list] of Object.entries(entries)) {
        next.set(pid, Array.isArray(list) ? list : []);
      }
      return next;
    });
  }, []);

  const preload = useCallback(async (productIds: string[], options?: { concurrency?: number }) => {
    const ids = Array.from(new Set(productIds)).filter(Boolean);
    if (ids.length === 0) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/variants/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: ids, concurrency: options?.concurrency }),
      });
      if (!res.ok) return;
      const json = await res.json().catch(() => ({} as any));
      const data: Record<string, Variant[]> = (json && json.data) || {};
      setBatch(data);
    } finally {
      setIsLoading(false);
    }
  }, [setBatch]);

  const value: VariantsPreloadContextType = useMemo(() => ({
    getCachedVariants,
    setBatch,
    preload,
    isLoading,
  }), [getCachedVariants, setBatch, preload, isLoading]);

  return (
    <VariantsPreloadContext.Provider value={value}>
      {children}
    </VariantsPreloadContext.Provider>
  );
}

export function useVariantsPreload() {
  const ctx = useContext(VariantsPreloadContext);
  if (!ctx) throw new Error('useVariantsPreload must be used within VariantsPreloadProvider');
  return ctx;
}


