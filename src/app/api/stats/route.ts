import { NextResponse } from 'next/server';
import { z } from 'zod';
import { serverError } from '@/lib/http/response';

export async function GET() {
  try {
    const siteUrl = process.env.SITE_URL;
    const apiKey = process.env.CLOUDCART_API_KEY;

    if (!siteUrl) {
      return serverError('SITE_URL environment variable not set');
    }

    if (!apiKey) {
      return serverError('CloudCart API key not set');
    }

    // Fetch categories count
    const categoriesResponse = await fetch(`${siteUrl}/api/v2/categories`, {
      headers: {
        'X-CloudCart-ApiKey': apiKey,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!categoriesResponse.ok) {
      console.error('Failed to fetch categories for stats:', categoriesResponse.status);
      return serverError('Failed to fetch categories');
    }

    const categoriesData = await categoriesResponse.json();
    const totalCategories = categoriesData.data?.length || 0;

    // Fetch products count and calculate stats
    const productsResponse = await fetch(`${siteUrl}/api/v2/products?page[size]=100&page[number]=1`, {
      headers: {
        'X-CloudCart-ApiKey': apiKey,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!productsResponse.ok) {
      console.error('Failed to fetch products for stats:', productsResponse.status);
      return serverError('Failed to fetch products');
    }

    const productsData = await productsResponse.json();
    const products = productsData.data || [];

    const totalProducts = productsData.meta?.pagination?.total || productsData.meta?.page?.total || 0;
    const inStockProducts = products.filter((p: any) => p.attributes?.is_in_stock !== false).length;
    const activeProductsPercent = products.length > 0
      ? Math.round((products.filter((p: any) => p.attributes?.active === 'yes').length / products.length) * 100)
      : 0;

    // Calculate average price
    const productsWithPrice = products.filter((p: any) => (p.attributes?.price || 0) > 0);
    const averagePrice = productsWithPrice.length > 0
      ? productsWithPrice.reduce((sum: number, p: any) => sum + (p.attributes?.price || 0), 0) / productsWithPrice.length
      : 0;

    // Calculate total value of inventory (simplified for first page only)
    const totalInventoryValue = products
      .filter((p: any) => (p.attributes?.price || 0) > 0 && (p.attributes?.stock_quantity || 0) > 0)
      .reduce((sum: number, p: any) => sum + ((p.attributes?.price || 0) * (p.attributes?.stock_quantity || 0)), 0);

    const stats = {
      totalProducts,
      totalCategories,
      inStockProducts,
      activeProducts: activeProductsPercent,
      averagePrice: Math.round(averagePrice * 100) / 100,
      totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
    };

    const StatsSchema = z.object({
      totalProducts: z.number(),
      totalCategories: z.number(),
      inStockProducts: z.number(),
      activeProducts: z.number(),
      averagePrice: z.number(),
      totalInventoryValue: z.number(),
    });
    const parsed = StatsSchema.safeParse(stats);
    if (!parsed.success) {
      return serverError('Invalid stats payload', parsed.error.flatten());
    }

    return NextResponse.json({ data: parsed.data });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return serverError('Internal server error');
  }
}

// Respond to HEAD to avoid 405 when probing
export async function HEAD() {
  return new Response(null, { status: 200 });
}


