export interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  inStockProducts: number;
  activeProducts: number; // percentage
  averagePrice: number;
  totalInventoryValue: number;
}

import { env } from '@/lib/env';
import { REVALIDATE } from '@/lib/cache';

export async function getDashboardStats(): Promise<DashboardStats | null> {
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/stats`, {
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
