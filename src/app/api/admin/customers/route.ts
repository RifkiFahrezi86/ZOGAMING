import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { encryptPassword } from '@/lib/crypto';
import { sanitizeInput, sanitizePhone } from '@/lib/security';

// POST /api/admin/customers - Quick create a customer from admin
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = getDb();
    const body = await request.json();
    const name = sanitizeInput(body.name || '');
    const phone = sanitizePhone(body.phone || '');

    if (!name) {
      return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
    }

    // Auto-generate email if not provided
    const email = body.email?.trim() || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}${Date.now()}@zogaming.fake`;

    // Check if email already exists
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 });
    }

    const defaultPassword = 'customer123';
    const hash = await bcrypt.hash(defaultPassword, 12);
    const enc = encryptPassword(defaultPassword);

    const result = await sql`
      INSERT INTO users (name, email, password_hash, password_enc, phone, role)
      VALUES (${name}, ${email}, ${hash}, ${enc}, ${phone}, 'customer')
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
