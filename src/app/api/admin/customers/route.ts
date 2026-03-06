import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { sanitizeInput, sanitizePhone, sanitizeEmail } from '@/lib/security';

// POST /api/admin/customers - Quick create a customer from admin
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = getDb();
    const body = await request.json();
    const name = sanitizeInput(body.name || '').slice(0, 255);
    const phone = sanitizePhone(body.phone || '');
    const password = body.password?.trim() || 'customer123';

    if (!name) {
      return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
    }

    // Sanitize email or auto-generate
    let email: string;
    if (body.email?.trim()) {
      const cleanEmail = sanitizeEmail(body.email.trim());
      if (!cleanEmail) {
        return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 });
      }
      email = cleanEmail;
    } else {
      email = `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}${Date.now()}@zogaming.fake`;
    }

    // Check if email already exists
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 12);

    const result = await sql`
      INSERT INTO users (name, email, password_hash, phone, role)
      VALUES (${name}, ${email}, ${hash}, ${phone}, 'customer')
      RETURNING id, name, email, phone, created_at
    `;

    return NextResponse.json({
      id: result[0].id,
      name: result[0].name,
      email: result[0].email,
      phone: result[0].phone,
      createdAt: result[0].created_at,
      message: 'Customer berhasil dibuat',
    });
  } catch (error) {
    console.error('POST admin customer error:', error);
    return NextResponse.json({ error: 'Gagal membuat customer. Pastikan database sudah di-seed.' }, { status: 500 });
  }
}
