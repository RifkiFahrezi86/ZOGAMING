import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { sanitizeString } from '@/lib/security';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const label = sanitizeString(body.label || '', 100);
    const color = /^#[0-9a-fA-F]{3,8}$/.test(body.color || '') ? body.color : '#000';
    const textColor = /^#[0-9a-fA-F]{3,8}$/.test(body.textColor || '') ? body.textColor : '#fff';
    const icon = sanitizeString(body.icon || 'none', 50);
    const sanitizedId = sanitizeString(id, 100);
    if (!label) return NextResponse.json({ error: 'Label wajib diisi' }, { status: 400 });
    const sql = getDb();
    await sql`
      UPDATE badges SET label=${label}, color=${color}, text_color=${textColor}, icon=${icon}, active=${body.active !== false}
      WHERE id = ${sanitizedId}
    `;
    return NextResponse.json({ message: 'Updated' });
  } catch (error) {
    console.error('PUT badge error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const sanitizedId = sanitizeString(id, 100);
    const sql = getDb();
    await sql`UPDATE products SET badge = NULL WHERE badge = ${sanitizedId}`;
    await sql`DELETE FROM badges WHERE id = ${sanitizedId}`;
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('DELETE badge error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
