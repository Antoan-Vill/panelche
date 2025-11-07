import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/',
  '/admin',
  '/store',
];

// Routes that are public (no auth required)
const publicRoutes = [
  '/api/auth',
];

// Routes that should redirect to dashboard if authenticated
const authRoutes = [
  '/login',
  '/signin',
];

// Firebase Auth check - simplified server-side check
async function verifyAuth(request: NextRequest): Promise<boolean> {
  try {
    // Get the session cookie or token from the request
    const sessionCookie = request.cookies.get('session')?.value;
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '');

    // If no session cookie or token, user is not authenticated
    if (!sessionCookie && !authToken) {
      return false;
    }

    // TODO: Verify the session cookie or token with Firebase Admin SDK
    // For now, we'll do a basic check - in production you'd verify the token
    // const decodedToken = await admin.auth().verifySessionCookie(sessionCookie);

    // Simplified check - if there's a session cookie, consider authenticated
    // In production, implement proper token verification
    return !!sessionCookie;
  } catch (error) {
    console.error('Auth verification failed:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  const isAuthenticated = await verifyAuth(request);

  // Handle protected routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      // Redirect to login page with return URL
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Handle auth routes (login, signin, etc.)
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (isAuthenticated) {
      // If already authenticated, redirect to dashboard
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Handle API routes that need authentication
  if (pathname.startsWith('/api/')) {
    // Skip auth check for public API routes
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    // For other API routes, check authentication
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }
  }

  // Add security headers
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Content Security Policy (adjust as needed)
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https:",
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
