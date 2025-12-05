import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect home page to admin catalog
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/admin/catalog', request.url), 307);
  }
  if (pathname === '/admin') {
    return NextResponse.redirect(new URL('/admin/orders', request.url), 307);
  }

  // Skip middleware for static files, API routes, and Next.js internals
  // Authentication is handled client-side by AuthGate component
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Add security headers
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Content Security Policy (adjust as needed)
  // Allow localhost in development for local API calls
  const isDevelopment = process.env.NODE_ENV === 'development';
  const connectSrc = isDevelopment
    ? "'self' http://localhost:* https:"
    : "'self' https:";

  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.googleapis.com https://*.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      `connect-src ${connectSrc} https://identitytoolkit.googleapis.com https://securetoken.googleapis.com`,
      "frame-src 'self' https://ellenmore-bd0db.firebaseapp.com https://accounts.google.com",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  return response;
}

// Configure which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
