import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { sanitizeString } from '@/lib/security';

export async function GET() {
  try {
    const sql = getDb();
    const badges = await sql`SELECT id, label, color, text_color, icon, active FROM badges ORDER BY label`;
    const mapped = badges.map(b => ({
      id: b.id,
      label: b.label,
      color: b.color,
      textColor: b.text_color,
      icon: b.icon,
      active: b.active,
    }));
    return NextResponse.json(mapped);
  } catch (error) {
    console.error('GET badges error:', error);
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
    const label = sanitizeString(body.label || '', 100);
    const color = /^#[0-9a-fA-F]{3,8}$/.test(body.color || '') ? body.color : '#000';
    const textColor = /^#[0-9a-fA-F]{3,8}$/.test(body.textColor || '') ? body.textColor : '#fff';
    const icon = sanitizeString(body.icon || 'none', 50);
    if (!label) return NextResponse.json({ error: 'Label wajib diisi' }, { status: 400 });
    const id = body.id || label.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

    await sql`
      INSERT INTO badges (id, label, color, text_color, icon, active)
      VALUES (${id}, ${label}, ${color}, ${textColor}, ${icon}, ${body.active !== false})
    `;
    return NextResponse.json({ id, message: 'Badge created' });
  } catch (error) {
    console.error('POST badges error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
