export const revalidate = 300;

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CategorySchema } from '@/schemas/category';
import { serverError } from '@/lib/http/response';
import { REVALIDATE } from '@/lib/cache';

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

    const response = await fetch(`${siteUrl}/api/v2/categories`, {
      headers: {
        'X-CloudCart-ApiKey': apiKey,
        'Content-Type': 'application/json',
      },
      // cache: 'no-store',
      next: { revalidate: REVALIDATE.categories },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch categories:', response.status, errorText);
      return serverError('Failed to fetch categories from CloudCart API');
    }

    const data = await response.json();
    const categories = Array.isArray(data?.data) ? data.data : [];
    const validated = categories.filter((c: unknown) => CategorySchema.safeParse(c).success);
    return NextResponse.json({ ...data, data: validated });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return serverError('Internal server error');
  }
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}



