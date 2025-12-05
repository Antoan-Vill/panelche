import useSWR from 'swr';
import type { Category } from '@/lib/types/categories';

export function useCategories(source: 'cloudcart' | 'firestore' = 'cloudcart') {
  const { data, error, isLoading, mutate } = useSWR<Category[]>(
    `/api/categories?source=${source}`,
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
    // SWR handles retry automatically, but we can trigger manual refresh
    retry: () => mutate(),
  };
}
