import { env } from '@/lib/env';
import type { DashboardStats } from '@/lib/types/stats';
import { REVALIDATE } from '@/lib/cache';

export async function getDashboardStats(): Promise<DashboardStats | null> {
  try {
    // Construct the base URL for API calls
    // Priority: VERCEL_URL > NEXT_PUBLIC_APP_URL > localhost fallback
    const isServer = typeof window === 'undefined';
    let baseUrl: string;
    
    if (isServer) {
      // Server-side: use VERCEL_URL if available, otherwise NEXT_PUBLIC_APP_URL
      if (process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
      } else {
        baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      }
    } else {
      // Client-side: use NEXT_PUBLIC_APP_URL
      baseUrl = env.NEXT_PUBLIC_APP_URL;
    }
    
    const response = await fetch(`${baseUrl}/api/stats`, {
      next: { revalidate: REVALIDATE.stats },
    });

    if (!response.ok) {
      console.error('Failed to fetch dashboard stats:', response.status);
      return null;
    }

    const responseData = await response.json();
    return responseData.data || null;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return null;
  }
}
