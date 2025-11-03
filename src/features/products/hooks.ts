'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Variant } from '@/schemas/variant';

type AsyncState<T> = {
  data: T | undefined;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
};

export function useProductVariants(productId: string | null | undefined): AsyncState<Variant[]> {
  const [data, setData] = useState<Variant[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetch(`/api/products/${productId}/variants`, { cache: 'no-store' })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          const message = json?.error || `Failed to load variants (${res.status})`;
          throw new Error(message);
        }
        const variants = Array.isArray(json?.data) ? (json.data as Variant[]) : [];
        if (!cancelled) setData(variants);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e?.message || 'Failed to load variants');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId, nonce]);

  return useMemo(() => ({ data, isLoading, error, reload }), [data, isLoading, error, reload]);
}


