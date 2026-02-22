import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { sanitizeInput, sanitizeString } from '@/lib/security';

export async function GET() {
  try {
    const sql = getDb();
    const products = await sql`
      SELECT id, name, slug, category, price, sale_price, image, description, 
             tags, featured, trending, most_played, badge, rating, platform, downloads
      FROM products ORDER BY name
    `;
    // Map snake_case to camelCase
    const mapped = products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category,
      price: p.price,
      salePrice: p.sale_price,
      image: p.image,
      description: p.description,
      tags: p.tags || [],
      featured: p.featured,
      trending: p.trending,
      mostPlayed: p.most_played,
      badge: p.badge,
      rating: p.rating,
      platform: p.platform || [],
      downloads: p.downloads,
    }));
    return NextResponse.json(mapped);
  } catch (error) {
    console.error('GET products error:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const sql = getDb();
    const id = sanitizeString(body.id || Date.now().toString(), 100);
    const name = sanitizeString(body.name, 255);
    const slug = sanitizeString(body.slug, 255);
    const category = sanitizeString(body.category, 100);
    const image = sanitizeString(body.image, 500);
    const description = sanitizeInput(body.description || '').slice(0, 5000);

    if (!name || !slug || !category) {
      return NextResponse.json({ error: 'Nama, slug, dan kategori wajib diisi' }, { status: 400 });
    }

    await sql`
      INSERT INTO products (id, name, slug, category, price, sale_price, image, description, tags, featured, trending, most_played, badge, rating, platform, downloads)
      VALUES (${id}, ${name}, ${slug}, ${category}, ${body.price}, ${body.salePrice || null}, ${image}, ${description}, ${body.tags || []}, ${body.featured || false}, ${body.trending || false}, ${body.mostPlayed || false}, ${body.badge || null}, ${body.rating || 5}, ${body.platform || []}, ${body.downloads || 0})
    ;`;

    return NextResponse.json({ id, message: 'Product created' });
  } catch (error) {
    console.error('POST products error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
