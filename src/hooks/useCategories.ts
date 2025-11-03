import { useState, useEffect, useCallback } from 'react';
import { Category, getCategories } from '@/lib/categories';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchCategories = useCallback(async (isRetry = false) => {
    try {
      setIsLoading(true);
      if (isRetry) {
        setError(null);
        setRetryCount(prev => prev + 1);
      }
      const data = await getCategories();
      setCategories(data);
      setError(null);
      setRetryCount(0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories';
      setError(errorMessage);
      console.error('Error fetching categories:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const retry = useCallback(() => {
    fetchCategories(true);
  }, [fetchCategories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    error,
    retry,
    refetch: fetchCategories,
    canRetry: error !== null && retryCount < 3
  };
}
