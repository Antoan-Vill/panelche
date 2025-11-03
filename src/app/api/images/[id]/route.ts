import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const siteUrl = process.env.SITE_URL;
    const apiKey = process.env.CLOUDCART_API_KEY;

    if (!siteUrl || !apiKey) {
      return NextResponse.json(
        { error: 'Server not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${siteUrl}/api/v2/images/${id}`, {
      headers: {
        'X-CloudCart-ApiKey': apiKey,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return NextResponse.json(
        { error: text || 'Failed to fetch image' },
        { status: response.status }
      );
    }

    const json = await response.json();
    return NextResponse.json(json.data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


