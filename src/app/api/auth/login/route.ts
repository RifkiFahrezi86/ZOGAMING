import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { checkRateLimit, getClientIp, sanitizeEmail, RATE_LIMITS } from '@/lib/security';

export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`login:${ip}`, RATE_LIMITS.login);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Terlalu banyak percobaan login. Coba lagi dalam 1 menit.' }, { status: 429 });
    }

    const body = await request.json();
    const email = sanitizeEmail(body.email || '');
    const password = body.password || '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 });
    }

    const sql = getDb();

    // Find user
    const users = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (users.length === 0) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
    }

    const user = users[0];

    // Check password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
    }

    // Create JWT token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone },
      message: 'Login berhasil!',
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
