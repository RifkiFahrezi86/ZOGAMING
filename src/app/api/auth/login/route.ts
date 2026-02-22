import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { checkRateLimit, getClientIp, sanitizeEmail, RATE_LIMITS } from '@/lib/security';

// Per-account login attempt tracking (brute-force protection)
const accountAttempts = new Map<string, { count: number; lockedUntil: number }>();

export async function POST(request: Request) {
  try {
    // Rate limiting per IP
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

    // Check per-account lockout
    const acctKey = email.toLowerCase();
    const acctEntry = accountAttempts.get(acctKey);
    if (acctEntry && acctEntry.lockedUntil > Date.now()) {
      const waitSec = Math.ceil((acctEntry.lockedUntil - Date.now()) / 1000);
      return NextResponse.json({ error: `Akun dikunci sementara. Coba lagi dalam ${waitSec} detik.` }, { status: 429 });
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
      // Track failed attempt for this account
      const entry = accountAttempts.get(acctKey) || { count: 0, lockedUntil: 0 };
      entry.count++;
      // Exponential lockout: 5 fails = 30s, 10 = 2min, 15 = 5min, 20+ = 15min
      if (entry.count >= 20) entry.lockedUntil = Date.now() + 15 * 60 * 1000;
      else if (entry.count >= 15) entry.lockedUntil = Date.now() + 5 * 60 * 1000;
      else if (entry.count >= 10) entry.lockedUntil = Date.now() + 2 * 60 * 1000;
      else if (entry.count >= 5) entry.lockedUntil = Date.now() + 30 * 1000;
      accountAttempts.set(acctKey, entry);
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
    }

    // Successful login - clear failed attempts
    accountAttempts.delete(acctKey);

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
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
