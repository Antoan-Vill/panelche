'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Category } from '@/schemas/category';
import type { ProductsResponse } from '@/schemas/product';

type AsyncState<T> = {
  data: T | undefined;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
};

export function useCategories(): AsyncState<Category[]> {
  const [data, setData] = useState<Category[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetch('/api/categories', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load categories (${res.status})`);
        const json = await res.json();
        const categories = Array.isArray(json?.data) ? (json.data as Category[]) : [];
        if (!cancelled) setData(categories);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e?.message || 'Failed to load categories');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  return useMemo(() => ({ data, isLoading, error, reload }), [data, isLoading, error, reload]);
}

export function useCategoryProducts(slug: string | null | undefined, page: number = 1): AsyncState<ProductsResponse> {
  const [data, setData] = useState<ProductsResponse | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetch(`/api/categories/${slug}/products?page=${page}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load products (${res.status})`);
        const json = (await res.json()) as ProductsResponse;
        if (!cancelled) setData(json);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e?.message || 'Failed to load products');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, page, nonce]);

  return useMemo(() => ({ data, isLoading, error, reload }), [data, isLoading, error, reload]);
}


