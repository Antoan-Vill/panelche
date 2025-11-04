'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Variant } from '@/schemas/variant';

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
    fetch(`/api/products/${productId}/variants`, { cache: 'no-store', signal: controller.signal })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          const rawError = (json as any)?.error;
          const message =
            typeof rawError === 'string'
              ? rawError
              : (rawError && typeof rawError === 'object' && 'message' in rawError)
                ? (rawError as any).message
                : `Failed to load variants (${res.status})`;
          const details = rawError && typeof rawError === 'object' ? (rawError as any).details : undefined;
          const err: any = new Error(message);
          err.status = res.status;
          if (details !== undefined) err.details = details;
          throw err;
        }
        const variants = Array.isArray((json as any)?.data) ? ((json as any).data as Variant[]) : [];
        setData(variants);
      })
      .catch((e: any) => {
        if (e?.name === 'AbortError') return;
        setError(e?.message || 'Failed to load variants');
        setErrorDetails(e?.status ? { status: e.status, details: e?.details ?? null } : (e?.details ?? null));
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



