import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LOCALE_COOKIE = 'NEXT_LOCALE';
const DEFAULT_LOCALE = 'bg';
const SUPPORTED_LOCALES = ['bg', 'en'];

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  
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
  
  return response;
}

export const config = {
  // Match all paths except static files, api routes, etc.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)' 
  ],
};
