'use client';

import { useCallback, useState } from 'react';

type UpdateResult<T = unknown> = {
  isLoading: boolean;
  error: string | null;
  update: (quantity: number) => Promise<T>;
};

export function useUpdateVariantStock(variantId: string | null | undefined): UpdateResult<any> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (quantity: number) => {
    if (!variantId) throw new Error('Missing variantId');
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/variants/${variantId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to update stock');
      }
      return json?.data ?? json;
    } catch (e: any) {
      setError(e?.message || 'Failed to update stock');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [variantId]);

  return { isLoading, error, update };
}


