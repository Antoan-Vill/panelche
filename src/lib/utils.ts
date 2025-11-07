import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { env } from '@/lib/env';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the base URL for internal API calls.
 * Handles server-side (Vercel) and client-side environments.
 * Priority: VERCEL_URL > NEXT_PUBLIC_APP_URL > localhost fallback
 */
export function getApiBaseUrl(): string {
  const isServer = typeof window === 'undefined';
  
  if (isServer) {
    // Server-side: use VERCEL_URL if available, otherwise NEXT_PUBLIC_APP_URL
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }
  
  // Client-side: use NEXT_PUBLIC_APP_URL
  return env.NEXT_PUBLIC_APP_URL;
}
