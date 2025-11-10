'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Variant } from '@/schemas/variant';
import type { Product } from '@/lib/types/products';

type AsyncState<T> = {
  data: T | undefined;
  isLoading: boolean;
  error: string | null;
  errorDetails: unknown | null;
  reload: () => void;
};

type UseProductVariantsOptions = {
  autoRetry?: boolean;
  untilHasData?: boolean;
  maxAttempts?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  maxDelayMs?: number;
};

export function useProductVariants(
  productId: string | null | undefined,
  opts: UseProductVariantsOptions = {}
): AsyncState<Variant[]> {
  const {
    autoRetry = false,
    untilHasData = true,
    maxAttempts = 8,
    initialDelayMs = 800,
    backoffFactor = 1.7,
    maxDelayMs = 5000,
  } = opts;

  const [data, setData] = useState<Variant[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<unknown | null>(null);
  const [nonce, setNonce] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!productId) return;
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    setErrorDetails(null);
    fetch(`/api/catalog/${productId}/variants`, { cache: 'no-store', signal: controller.signal })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          const rawError = (json as { error?: unknown })?.error;
          const message =
            typeof rawError === 'string'
              ? rawError
              : (rawError && typeof rawError === 'object' && 'message' in rawError)
                ? (rawError as { message: string }).message
                : `Failed to load variants (${res.status})`;
          const details = rawError && typeof rawError === 'object' ? (rawError as { details?: unknown }).details : undefined;
          const err = new Error(message) as Error & { status?: number; details?: unknown };
          err.status = res.status;
          if (details !== undefined) err.details = details;
          throw err;
        }
        const variants = Array.isArray((json as { data?: Variant[] })?.data) ? ((json as { data: Variant[] }).data as Variant[]) : [];
        setData(variants);
      })
      .catch((e: unknown) => {
        const err = e as { name?: string; message?: string; status?: number; details?: unknown };
        if (err?.name === 'AbortError') return;
        setError(err?.message || 'Failed to load variants');
        setErrorDetails(err?.status ? { status: err.status, details: err?.details ?? null } : (err?.details ?? null));
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [productId, nonce]);

  useEffect(() => {
    if (!autoRetry || !productId) return;
    if (isLoading) return;

    const hasData = Array.isArray(data) && data.length > 0;
    const noDataYet = untilHasData ? !hasData : false;
    const shouldRetry = !!error || noDataYet;

    if (!shouldRetry) {
      if (attempt !== 0) setAttempt(0);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (attempt >= maxAttempts) return;

    const delay = Math.min(
      Math.round(initialDelayMs * Math.pow(backoffFactor, Math.max(0, attempt))),
      maxDelayMs
    );
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setAttempt((a) => a + 1);
      reload();
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    autoRetry,
    untilHasData,
    productId,
    isLoading,
    error,
    data,
    attempt,
    initialDelayMs,
    backoffFactor,
    maxDelayMs,
    maxAttempts,
    reload,
  ]);

  return useMemo(() => ({ data, isLoading, error, errorDetails, reload }), [data, isLoading, error, errorDetails, reload]);
}

/**
 * Hook for searching/filtering products client-side
 */
export function useProductSearch(products: Product[]) {
  const [search, setSearch] = useState('');

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term.length <= 2) return products;
    return products.filter((product) =>
      product.attributes.name.toLowerCase().includes(term)
    );
  }, [products, search]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearch('');
  }, []);

  return {
    search,
    setSearch,
    filteredProducts,
    handleSearch,
    handleClearSearch,
  };
}



