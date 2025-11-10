'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Category } from '@/schemas/category';
import type { ProductsResponse } from '@/schemas/product';
import useSWR from 'swr';
import type { Category as CategoryType } from '@/lib/types/categories';

type AsyncState<T> = {
  data: T | undefined;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
};

/**
 * SWR-based hook for categories (preferred for most use cases)
 */
export function useCategoriesSWR() {
  const { data, error, isLoading, mutate } = useSWR<CategoryType[]>(
    '/api/categories',
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Cache for 5 seconds
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  return {
    categories: data || [],
    isLoading,
    error: error?.message || null,
    refetch: mutate,
    retry: () => mutate(),
  };
}

/**
 * Fetch-based hook for categories (for cases where SWR isn't suitable)
 */
export function useCategories(): AsyncState<CategoryType[]> {
  const [data, setData] = useState<CategoryType[] | undefined>(undefined);
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
        const rawCategories = Array.isArray(json?.data) ? json.data : [];
        // Transform null values to undefined to match CategoryType
        const categories = rawCategories.map((cat: any) => ({
          ...cat,
          attributes: {
            ...cat.attributes,
            description: cat.attributes?.description === null ? undefined : cat.attributes?.description,
            url_handle: cat.attributes?.url_handle === null ? undefined : cat.attributes?.url_handle,
            image_url: cat.attributes?.image_url === null ? undefined : cat.attributes?.image_url,
          },
        })) as CategoryType[];
        if (!cancelled) setData(categories);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError((e as { message?: string })?.message || 'Failed to load categories');
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
      .catch((e: unknown) => {
        if (!cancelled) setError((e as { message?: string })?.message || 'Failed to load products');
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



