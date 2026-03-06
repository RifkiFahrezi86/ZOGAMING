import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { sanitizeString, sanitizeInput } from '@/lib/security';

export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`SELECT key, value FROM settings`;
    const result: Record<string, unknown> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }

    // Get banner images
    const banners = await sql`SELECT * FROM banner_images ORDER BY sort_order`;
    const bannerImages = banners.map(b => ({
      id: b.id,
      title: b.title,
      imageUrl: b.image_url,
      badge: b.badge,
      badgeColor: b.badge_color,
      badgeTextColor: b.badge_text_color,
      active: b.active,
    }));

    return NextResponse.json({
      siteName: result.siteName || 'ZOGAMING',
      logo: result.logo || '/images/logo.svg',
      address: result.address || '',
      phone: result.phone || '',
      email: result.email || '',
      heroTitle: result.heroTitle || 'BEST GAMING SITE EVER!',
      heroSubtitle: result.heroSubtitle || 'Welcome to ZOGAMING',
      heroDescription: result.heroDescription || '',
      adminWhatsApp: result.adminWhatsApp || '',
      promoProductId: result.promoProductId || '',
      promoTitle: result.promoTitle || 'DEAL OF THE DAY',
      promoActive: result.promoActive !== undefined ? result.promoActive : true,
      bannerImages,
      socialLinks: result.socialLinks || { facebook: '#', twitter: '#', instagram: '#' },
    });
  } catch (error) {
    console.error('GET settings error:', error);
    return NextResponse.json({
      siteName: 'ZOGAMING',
      logo: '/images/logo.svg',
      address: '',
      phone: '',
      email: '',
      heroTitle: 'BEST GAMING SITE EVER!',
      heroSubtitle: 'Welcome to ZOGAMING',
      heroDescription: '',
      adminWhatsApp: '',
      promoProductId: '',
      promoTitle: 'DEAL OF THE DAY',
      promoActive: true,
      bannerImages: [],
      socialLinks: {},
    });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const sql = getDb();

    // Save settings as key-value pairs (with sanitization)
    const keys = ['siteName', 'logo', 'address', 'phone', 'email', 'heroTitle', 'heroSubtitle', 'heroDescription', 'socialLinks', 'adminWhatsApp', 'promoProductId', 'promoTitle', 'promoActive'];
    const stringKeys = ['siteName', 'address', 'phone', 'email', 'heroTitle', 'heroSubtitle', 'heroDescription', 'adminWhatsApp', 'promoProductId', 'promoTitle'];
    const urlKeys = ['logo'];
    for (const key of keys) {
      if (body[key] !== undefined) {
        let sanitized = body[key];
        if (stringKeys.includes(key) && typeof sanitized === 'string') {
          sanitized = sanitizeInput(sanitized).slice(0, 500);
        } else if (urlKeys.includes(key) && typeof sanitized === 'string') {
          sanitized = sanitizeString(sanitized, 500);
          // Only allow relative paths or https URLs
          if (!sanitized.startsWith('/') && !sanitized.startsWith('https://')) {
            sanitized = '/images/logo.svg';
          }
        } else if (key === 'socialLinks' && typeof sanitized === 'object') {
          // Sanitize each social link URL
          for (const sk of Object.keys(sanitized)) {
            if (typeof sanitized[sk] === 'string') {
              sanitized[sk] = sanitizeString(sanitized[sk], 500);
            }
          }
        }
        await sql`
          INSERT INTO settings (key, value) VALUES (${key}, ${JSON.stringify(sanitized)})
          ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(sanitized)}
        `;
      }
    }

    // Save banner images (with sanitization)
    if (body.bannerImages) {
      await sql`DELETE FROM banner_images`;
      for (let i = 0; i < body.bannerImages.length; i++) {
        const b = body.bannerImages[i];
        const bannerId = sanitizeString(String(b.id || ''), 100);
        const bannerTitle = sanitizeString(String(b.title || ''), 255);
        const bannerImageUrl = sanitizeString(String(b.imageUrl || ''), 500);
        const bannerBadge = sanitizeString(String(b.badge || ''), 100);
        const bannerBadgeColor = sanitizeString(String(b.badgeColor || '#ef4444'), 50);
        const bannerBadgeTextColor = sanitizeString(String(b.badgeTextColor || '#fff'), 50);
        await sql`
          INSERT INTO banner_images (id, title, image_url, badge, badge_color, badge_text_color, active, sort_order)
          VALUES (${bannerId}, ${bannerTitle}, ${bannerImageUrl}, ${bannerBadge}, ${bannerBadgeColor}, ${bannerBadgeTextColor}, ${b.active !== false}, ${i})
        `;
      }
    }

    return NextResponse.json({ message: 'Settings updated' });
  } catch (error) {
    console.error('PUT settings error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
