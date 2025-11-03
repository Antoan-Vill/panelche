import { useState, useEffect, useCallback } from 'react';
import { DashboardStats, getDashboardStats } from '@/lib/stats';

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchStats = useCallback(async (isRetry = false) => {
    try {
      setIsLoading(true);
      if (isRetry) {
        setError(null);
        setRetryCount(prev => prev + 1);
      }
      const data = await getDashboardStats();
      setStats(data);
      setError(null);
      setRetryCount(0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard stats';
      setError(errorMessage);
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const retry = useCallback(() => {
    fetchStats(true);
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    retry,
    refetch: fetchStats,
    canRetry: error !== null && retryCount < 3
  };
}
