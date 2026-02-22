import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/security';
import { lookup } from 'dns/promises';

// Private/internal IP ranges to block (SSRF protection)
function isPrivateIp(ip: string): boolean {
  // IPv6 loopback
  if (ip === '::1' || ip === '::') return true;
  
  const ipMatch = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!ipMatch) return false;
  
  const [, a, b] = ipMatch.map(Number);
  if (a === 127) return true;                             // 127.0.0.0/8
  if (a === 10) return true;                              // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true;       // 172.16.0.0/12
  if (a === 192 && b === 168) return true;                 // 192.168.0.0/16
  if (a === 169 && b === 254) return true;                 // 169.254.0.0/16
  if (a === 0) return true;                                // 0.0.0.0/8
  return false;
}

function isPrivateUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    const hostname = parsed.hostname.toLowerCase();
    
    // Block localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '0.0.0.0') return true;
    
    // Block direct private IPs
    if (isPrivateIp(hostname)) return true;
    
    // Block non-http(s) protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return true;
    
    // Block cloud metadata endpoints
    if (hostname === 'metadata.google.internal') return true;
    if (hostname.endsWith('.internal')) return true;
    
    return false;
  } catch {
    return true;
  }
}

// Resolve hostname and validate the resolved IP is not private (DNS rebinding protection)
async function resolveAndValidate(urlString: string): Promise<boolean> {
  try {
    const parsed = new URL(urlString);
    const hostname = parsed.hostname;
    
    // Skip IP check for direct IPs (already checked by isPrivateUrl)
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return true;
    
    const result = await lookup(hostname);
    if (isPrivateIp(result.address)) return false;
    return true;
  } catch {
    return false;
  }
}

// Fetches the og:image (social media preview image) from any webpage URL
// Requires authentication to prevent abuse as open proxy
export async function GET(request: Request) {
  try {
    // Require authentication
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting - strict for this endpoint
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`ogimage:${ip}`, { maxRequests: 10, windowMs: 60 * 1000 });
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
    }

    // SSRF Protection: Block private/internal URLs
    if (isPrivateUrl(url)) {
      return NextResponse.json({ error: 'URL not allowed' }, { status: 403 });
    }

    // DNS rebinding protection: resolve and validate IP
    const dnsValid = await resolveAndValidate(url);
    if (!dnsValid) {
      return NextResponse.json({ error: 'URL not allowed' }, { status: 403 });
    }

    // If URL already looks like a direct image, return as-is
    if (/\.(jpg|jpeg|png|gif|webp|svg|avif|bmp)(\?.*)?$/i.test(url)) {
      return NextResponse.json({ imageUrl: url });
    }

    // Fetch the webpage (disable redirects to validate each hop)
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(5000),
      redirect: 'manual',
    });

    // Handle redirects manually with SSRF check
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location || isPrivateUrl(location)) {
        return NextResponse.json({ error: 'Redirect to disallowed URL' }, { status: 403 });
      }
      // Resolve redirect target too
      const redirectValid = await resolveAndValidate(location);
      if (!redirectValid) {
        return NextResponse.json({ error: 'Redirect to disallowed URL' }, { status: 403 });
      }
      // Follow one redirect
      const res2 = await fetch(location, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)', 'Accept': 'text/html' },
        signal: AbortSignal.timeout(5000),
        redirect: 'error',
      });
      if (!res2.ok) return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 400 });
      const html = await res2.text();
      return extractOgImage(html, location);
    }

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 400 });
    }

    const html = await res.text();
    return extractOgImage(html, url);
  } catch (error) {
    console.error('OG image fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}

function extractOgImage(html: string, baseUrl: string) {
    let imageUrl = '';

    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogMatch) imageUrl = ogMatch[1];

    if (!imageUrl) {
      const twMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
      if (twMatch) imageUrl = twMatch[1];
    }

    if (!imageUrl) {
      const itemMatch = html.match(/<meta[^>]*itemprop=["']image["'][^>]*content=["']([^"']+)["']/i);
      if (itemMatch) imageUrl = itemMatch[1];
    }

    if (!imageUrl) {
      const imgMatch = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*(width|height)=["'](\d+)/i);
      if (imgMatch && parseInt(imgMatch[3]) >= 200) imageUrl = imgMatch[1];
    }

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image found on this page' }, { status: 404 });
    }

    if (imageUrl.startsWith('//')) {
      imageUrl = 'https:' + imageUrl;
    } else if (imageUrl.startsWith('/')) {
      const urlObj = new URL(baseUrl);
      imageUrl = urlObj.origin + imageUrl;
    }

    return NextResponse.json({ imageUrl });
}
