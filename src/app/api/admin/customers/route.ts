import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// POST /api/admin/customers - Quick create a customer from admin
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = getDb();
    const body = await request.json();
    const { name, email, phone } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
    }

    // Auto-generate email if not provided
    const finalEmail = email?.trim() || `${name.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}${Date.now()}@zogaming.fake`;

    // Check if email already exists
    const existing = await sql`SELECT id FROM users WHERE email = ${finalEmail}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 });
    }

    const hash = await bcrypt.hash('customer123', 10);

    const result = await sql`
      INSERT INTO users (name, email, password_hash, phone, role)
      VALUES (${name.trim()}, ${finalEmail}, ${hash}, ${(phone || '').trim()}, 'customer')
      RETURNING id, name, email, phone
    `;

    return NextResponse.json({
      id: result[0].id,
      name: result[0].name,
      email: result[0].email,
      phone: result[0].phone,
    });
  } catch (error) {
    console.error('POST admin customer error:', error);
    return NextResponse.json({ error: 'Gagal membuat customer' }, { status: 500 });
  }
}
