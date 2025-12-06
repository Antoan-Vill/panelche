import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LOCALE_COOKIE = 'NEXT_LOCALE';
const DEFAULT_LOCALE = 'bg';
const SUPPORTED_LOCALES = ['bg', 'en'];

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  
  const { pathname } = request.nextUrl;

  console.log('PATHNAME:', pathname);

  // Redirect home page to admin catalog
  if (pathname === '/' || pathname === '/admin') {
    return NextResponse.redirect(new URL('/admin/orders', request.url), 307);
  }

  // Check if locale cookie exists
  const localeCookie = request.cookies.get(LOCALE_COOKIE)?.value;
  
  // If no locale cookie, set default (Bulgarian)
  if (!localeCookie || !SUPPORTED_LOCALES.includes(localeCookie)) {
    response.cookies.set(LOCALE_COOKIE, DEFAULT_LOCALE, {
      path: '/',
      maxAge: 365 * 24 * 60 * 60, // 1 year
      sameSite: 'lax',
    });
  }
  

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

export const config = {
  // Match all paths except static files, api routes, etc.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)' 
  ],
};
