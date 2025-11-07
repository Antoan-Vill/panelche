import useSWR from 'swr';
import type { DashboardStats } from '@/lib/types/stats';

export function useDashboardStats() {
  const { data, error, isLoading, mutate } = useSWR<DashboardStats>(
    '/api/stats',
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // Cache for 30 seconds (stats change less frequently)
      errorRetryCount: 2,
      errorRetryInterval: 10000,
      refreshInterval: 60000, // Refresh every minute for real-time stats
    }
  );

  return {
    stats: data || null,
    isLoading,
    error: error?.message || null,
    refetch: mutate,
    retry: () => mutate(),
  };
}
