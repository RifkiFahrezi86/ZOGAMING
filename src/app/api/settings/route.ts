import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

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

    // Save settings as key-value pairs
    const keys = ['siteName', 'logo', 'address', 'phone', 'email', 'heroTitle', 'heroSubtitle', 'heroDescription', 'socialLinks', 'adminWhatsApp', 'promoProductId', 'promoTitle', 'promoActive'];
    for (const key of keys) {
      if (body[key] !== undefined) {
        await sql`
          INSERT INTO settings (key, value) VALUES (${key}, ${JSON.stringify(body[key])})
          ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(body[key])}
        `;
      }
    }

    // Save banner images
    if (body.bannerImages) {
      await sql`DELETE FROM banner_images`;
      for (let i = 0; i < body.bannerImages.length; i++) {
        const b = body.bannerImages[i];
        await sql`
          INSERT INTO banner_images (id, title, image_url, badge, badge_color, badge_text_color, active, sort_order)
          VALUES (${b.id}, ${b.title || ''}, ${b.imageUrl || ''}, ${b.badge || ''}, ${b.badgeColor || '#ef4444'}, ${b.badgeTextColor || '#fff'}, ${b.active !== false}, ${i})
        `;
      }
    }

    return NextResponse.json({ message: 'Settings updated' });
  } catch (error) {
    console.error('PUT settings error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
