import { NextResponse } from 'next/server';

// Private/internal IP ranges to block (SSRF protection)
function isPrivateUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    const hostname = parsed.hostname.toLowerCase();
    
    // Block localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '0.0.0.0') return true;
    
    // Block private IP ranges
    const ipMatch = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (ipMatch) {
      const [, a, b] = ipMatch.map(Number);
      if (a === 10) return true;                           // 10.0.0.0/8
      if (a === 172 && b >= 16 && b <= 31) return true;    // 172.16.0.0/12
      if (a === 192 && b === 168) return true;              // 192.168.0.0/16
      if (a === 169 && b === 254) return true;              // 169.254.0.0/16 (link-local/cloud metadata)
      if (a === 0) return true;                             // 0.0.0.0/8
    }
    
    // Block non-http(s) protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return true;
    
    // Block cloud metadata endpoints
    if (hostname === 'metadata.google.internal') return true;
    if (hostname.endsWith('.internal')) return true;
    
    return false;
  } catch {
    return true; // Invalid URL = block
  }
}

// Fetches the og:image (social media preview image) from any webpage URL
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
    }

    // SSRF Protection: Block private/internal URLs
    if (isPrivateUrl(url)) {
      return NextResponse.json({ error: 'URL not allowed' }, { status: 403 });
    }

    // If URL already looks like a direct image, return as-is
    if (/\.(jpg|jpeg|png|gif|webp|svg|avif|bmp)(\?.*)?$/i.test(url)) {
      return NextResponse.json({ imageUrl: url });
    }

    // Fetch the webpage
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 400 });
    }

    const html = await res.text();

    // Try to extract og:image
    let imageUrl = '';

    // og:image
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogMatch) {
      imageUrl = ogMatch[1];
    }

    // twitter:image fallback
    if (!imageUrl) {
      const twMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
      if (twMatch) {
        imageUrl = twMatch[1];
      }
    }

    // itemprop image fallback
    if (!imageUrl) {
      const itemMatch = html.match(/<meta[^>]*itemprop=["']image["'][^>]*content=["']([^"']+)["']/i);
      if (itemMatch) {
        imageUrl = itemMatch[1];
      }
    }

    // First large <img> as last resort
    if (!imageUrl) {
      const imgMatch = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*(width|height)=["'](\d+)/i);
      if (imgMatch && parseInt(imgMatch[3]) >= 200) {
        imageUrl = imgMatch[1];
      }
    }

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image found on this page' }, { status: 404 });
    }

    // Make relative URLs absolute
    if (imageUrl.startsWith('//')) {
      imageUrl = 'https:' + imageUrl;
    } else if (imageUrl.startsWith('/')) {
      const urlObj = new URL(url);
      imageUrl = urlObj.origin + imageUrl;
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('OG image fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}
