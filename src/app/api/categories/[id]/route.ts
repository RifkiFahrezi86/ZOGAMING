import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { sanitizeString, sanitizeInput, sanitizeId } from '@/lib/security';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const safeId = sanitizeId(id);
    if (!safeId) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }
    const body = await request.json();
    const sql = getDb();
    const name = sanitizeString(body.name, 255);
    const slug = sanitizeString(body.slug, 255);
    const image = sanitizeString(body.image || '', 500);
    const description = sanitizeInput(body.description || '').slice(0, 2000);

    await sql`
      UPDATE categories SET name = ${name}, slug = ${slug}, image = ${image}, description = ${description}
      WHERE id = ${safeId}
    `;
    return NextResponse.json({ message: 'Updated' });
  } catch (error) {
    console.error('PUT category error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const safeId = sanitizeId(id);
    if (!safeId) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }
    const sql = getDb();
    await sql`DELETE FROM categories WHERE id = ${safeId}`;
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('DELETE category error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
