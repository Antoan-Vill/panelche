export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { ok, serverError } from '@/lib/http/response';

export async function GET() {
  try {
    // Return mock data for testing
    const stats = {
      totalProducts: 150,
      totalCategories: 12,
      inStockProducts: 89,
      activeProducts: 75, // percentage
      averagePrice: 29.99,
      totalInventoryValue: 12500.50,
    };

    return ok(stats);
  } catch (error) {
    console.error('Error in stats API route:', error);
    return serverError('Internal server error');
  }
}
