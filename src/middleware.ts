import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

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
  // Prefer x-real-ip (set by trusted reverse proxy)
  const realIp = request.headers.get('x-real-ip');
  if (realIp && /^[\d.:a-fA-F]+$/.test(realIp)) return realIp.trim();
  
  // x-forwarded-for: take rightmost (closest to proxy)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map(s => s.trim()).filter(s => /^[\d.:a-fA-F]+$/.test(s));
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return 'unknown';
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getIp(request);

  // Normalize pathname for bypass prevention
  const normalizedPath = decodeURIComponent(pathname).toLowerCase().replace(/\/+/g, '/');

  // =============================================
  // 1. Block suspicious paths (common attack vectors)
  // =============================================
  const blockedPaths = [
    '/wp-admin', '/wp-login', '/xmlrpc.php', '/.env',
    '/phpmyadmin', '/admin.php', '/.git', '/wp-content',
    '/wp-includes', '/cgi-bin', '/.htaccess', '/server-status',
    '/.aws', '/.docker', '/config.php', '/debug', '/trace',
    '/actuator', '/.svn', '/_debug', '/elmah.axd',
  ];
  
  if (blockedPaths.some(p => normalizedPath.startsWith(p))) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // =============================================
  // 2. Block requests with suspicious query strings
  // =============================================
  const url = decodeURIComponent(request.nextUrl.toString()).toLowerCase();
  const suspiciousPatterns = [
    'union select', 'union+select', 'union%20select', 'select from', 'select+from', 'select%20from',
    'drop table', 'drop+table', 'drop%20table', 'insert into', 'insert+into', 'insert%20into',
    '<script', '%3cscript', 'javascript:', 'onerror=', 'onload=',
    '../../../', '..%2f..%2f', '/etc/passwd', 'cmd.exe',
    'eval(', 'exec(', 'system(', 'passthru(', 'base64_decode(',
    '0x', 'char(', 'concat(', 'benchmark(', 'sleep(',
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
  // 4. Protect admin routes - verify JWT and admin role
  // =============================================
  if (pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Verify JWT and check admin role
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        // In dev without JWT_SECRET, allow (real auth in API routes)
        // In production this should never happen since auth.ts throws on startup
      } else {
        const key = new TextEncoder().encode(secret);
        const { payload } = await jwtVerify(token, key);
        if (payload.role !== 'admin') {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
    } catch {
      // Invalid/expired token - redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  }

  // =============================================
  // 5. CSRF protection for state-changing API requests
  // =============================================
  if (pathname.startsWith('/api/') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const contentType = request.headers.get('content-type') || '';
    const xRequested = request.headers.get('x-requested-with');
    // Allow requests with JSON content type or x-requested-with header (not sent by HTML forms)
    // This blocks cross-origin form submissions
    if (!contentType.includes('application/json') && !xRequested) {
      // Allow multipart/form-data for file uploads from same origin
      const origin = request.headers.get('origin');
      const host = request.headers.get('host');
      if (origin && host && !origin.includes(host)) {
        return NextResponse.json({ error: 'CSRF check failed' }, { status: 403 });
      }
    }
  }

  // =============================================
  // 6. Add security headers to response
  // =============================================
  const response = NextResponse.next();
  
  // Prevent content sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  // XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  // Cross-Origin isolation headers
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  
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
