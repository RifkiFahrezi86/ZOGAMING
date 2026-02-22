import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { sanitizeString, sanitizeInput } from '@/lib/security';

export async function GET() {
  try {
    const sql = getDb();
    const categories = await sql`SELECT * FROM categories ORDER BY name`;
    return NextResponse.json(categories);
  } catch (error) {
    console.error('GET categories error:', error);
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
    const image = sanitizeString(body.image || '', 500);
    const description = sanitizeInput(body.description || '').slice(0, 2000);

    if (!name || !slug) {
      return NextResponse.json({ error: 'Nama dan slug wajib diisi' }, { status: 400 });
    }

    await sql`
      INSERT INTO categories (id, name, slug, image, description)
      VALUES (${id}, ${name}, ${slug}, ${image}, ${description})
    `;

    return NextResponse.json({ id, message: 'Category created' });
  } catch (error) {
    console.error('POST categories error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
