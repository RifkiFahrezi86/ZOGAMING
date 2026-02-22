import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiter for middleware
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

// Clean up every 2 minutes
if (typeof globalThis !== 'undefined') {
  const cleanupInterval = 2 * 60 * 1000;
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of ipRequestCounts) {
      if (now > entry.resetTime) {
        ipRequestCounts.delete(key);
      }
    }
  }, cleanupInterval);
}

function getIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || request.headers.get('x-real-ip') 
    || 'unknown';
}

function isRateLimited(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const key = ip;
  const entry = ipRequestCounts.get(key);
  
  if (!entry || now > entry.resetTime) {
    ipRequestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }
  
  entry.count++;
  return entry.count > maxRequests;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getIp(request);

  // =============================================
  // 1. Block suspicious paths (common attack vectors)
  // =============================================
  const blockedPaths = [
    '/wp-admin', '/wp-login', '/xmlrpc.php', '/.env',
    '/phpmyadmin', '/admin.php', '/.git', '/wp-content',
    '/wp-includes', '/cgi-bin', '/.htaccess', '/server-status',
  ];
  
  if (blockedPaths.some(p => pathname.toLowerCase().startsWith(p))) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // =============================================
  // 2. Block requests with suspicious query strings
  // =============================================
  const url = request.nextUrl.toString().toLowerCase();
  const suspiciousPatterns = [
    'union+select', 'union%20select', 'select+from', 'select%20from',
    'drop+table', 'drop%20table', 'insert+into', 'insert%20into',
    '<script', '%3cscript', 'javascript:', 'onerror=', 'onload=',
    '../../../', '..%2f..%2f', '/etc/passwd', 'cmd.exe',
  ];
  
  if (suspiciousPatterns.some(p => url.includes(p))) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // =============================================
  // 3. Rate limit API routes
  // =============================================
  if (pathname.startsWith('/api/')) {
    // Stricter rate limit for auth endpoints
    if (pathname.startsWith('/api/auth/')) {
      if (isRateLimited(`auth:${ip}`, 20, 60 * 1000)) {
        return NextResponse.json(
          { error: 'Terlalu banyak permintaan. Coba lagi nanti.' },
          { status: 429 }
        );
      }
    }
    
    // General API rate limit
    if (isRateLimited(`api:${ip}`, 120, 60 * 1000)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Seed endpoint - very strict
    if (pathname === '/api/seed') {
      if (isRateLimited(`seed:${ip}`, 3, 60 * 60 * 1000)) {
        return NextResponse.json(
          { error: 'Seed dibatasi. Coba lagi dalam 1 jam.' },
          { status: 429 }
        );
      }
    }
  }

  // =============================================
  // 4. Protect admin routes (client-side check, real auth is in API)
  // =============================================
  if (pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    // This is just a basic check - real auth is enforced in API routes
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // =============================================
  // 5. Add security headers to response
  // =============================================
  const response = NextResponse.next();
  
  // Prevent content sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  // XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public images
     */
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ],
};
