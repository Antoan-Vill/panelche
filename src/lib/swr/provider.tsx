'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';
import { logger } from '@/lib/monitoring/logger';

interface SwrProviderProps {
  children: ReactNode;
}

export function SwrProvider({ children }: SwrProviderProps) {
  return (
    <SWRConfig
      value={{
        // Global fetcher
        fetcher: async (url: string) => {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const result = await response.json();

          // Extract data from API response format { success: true, data: ... }
          if (result && typeof result === 'object' && 'success' in result && 'data' in result) {
            if (result.success) {
              return result.data;
            } else {
              throw new Error(result.error?.message || 'API request failed');
            }
          }

          // Return raw result for non-API responses
          return result;
        },

        // Revalidation options
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        refreshInterval: 0, // Disable automatic refresh, use manual refresh when needed

        // Error retry configuration
        errorRetryCount: 3,
        errorRetryInterval: 5000,

        // Loading states
        loadingTimeout: 3000,

        // Deduping interval (prevents duplicate requests within this timeframe)
        dedupingInterval: 2000,

        // Cache provider - using default (Map) but can be customized for persistence
        provider: () => new Map(),

        // Global error handler
        onError: (error, key) => {
          logger.error(`SWR Error for key "${key}"`, error, { key, timestamp: Date.now() });
        },

        // Global success handler (optional)
        onSuccess: (data, key) => {
          logger.debug(`SWR Success for key "${key}"`, { key, dataSize: JSON.stringify(data).length });
        },

        // Global loading handler
        onLoadingSlow: (key, config) => {
          logger.warn(`SWR Slow loading for key "${key}"`, {
            key,
            timeout: config.loadingTimeout,
          });
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}



