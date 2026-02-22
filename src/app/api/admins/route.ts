import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { sanitizeInput, sanitizePhone } from '@/lib/security';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = getDb();

    // Ensure admins table exists
    await sql`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        whatsapp VARCHAR(50) NOT NULL,
        active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    const admins = await sql`SELECT * FROM admins ORDER BY sort_order, id`;

    return NextResponse.json(admins.map(a => ({
      id: a.id,
      name: a.name,
      whatsapp: a.whatsapp,
      active: a.active,
      sortOrder: a.sort_order,
      createdAt: a.created_at,
    })));
  } catch (error) {
    console.error('GET admins error:', error);
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
    const name = sanitizeInput(body.name || '').slice(0, 255);
    const whatsapp = sanitizePhone(body.whatsapp || '');

    if (!name || !whatsapp) {
      return NextResponse.json({ error: 'Nama dan nomor WhatsApp wajib diisi' }, { status: 400 });
    }

    const sql = getDb();

    // Ensure admins table exists
    await sql`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        whatsapp VARCHAR(50) NOT NULL,
        active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Get next sort_order
    const maxOrder = await sql`SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order FROM admins`;
    const nextOrder = maxOrder[0].next_order;

    const result = await sql`
      INSERT INTO admins (name, whatsapp, active, sort_order)
      VALUES (${name}, ${whatsapp}, true, ${nextOrder})
      RETURNING id
    `;

    return NextResponse.json({ id: result[0].id, message: 'Admin berhasil ditambahkan' });
  } catch (error) {
    console.error('POST admins error:', error);
    return NextResponse.json({ error: 'Gagal menambahkan admin' }, { status: 500 });
  }
}
