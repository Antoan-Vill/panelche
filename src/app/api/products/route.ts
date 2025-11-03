import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '20';

    const siteUrl = process.env.SITE_URL;
    const apiKey = process.env.CLOUDCART_API_KEY;

    if (!siteUrl) {
      return NextResponse.json(
        { error: 'SITE_URL environment variable not set' },
        { status: 500 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'CloudCart API key not set' },
        { status: 500 }
      );
    }

    // Build CloudCart API URL with search parameters
    let productsUrl = `${siteUrl}/api/v2/products?page[size]=${perPage}&page[number]=${page}&include=images`;

    if (query) {
      productsUrl += `&filter[name][icontains]=${encodeURIComponent(query)}`;
    }

    const response = await fetch(productsUrl, {
      headers: {
        'X-CloudCart-ApiKey': apiKey,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Failed to fetch products:', response.status);
      return NextResponse.json(
        { error: 'Failed to fetch products from CloudCart API' },
        { status: response.status }
      );
    }

    const productsData = await response.json();
    return NextResponse.json(productsData);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
