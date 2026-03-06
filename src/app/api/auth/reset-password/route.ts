import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { validatePassword, sanitizeId } from '@/lib/security';

// Admin reset password for any user
export async function PUT(request: Request) {
  try {
    const admin = await getAuthUser();
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, newPassword } = await request.json();

    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'User ID dan password baru wajib diisi' }, { status: 400 });
    }

    const safeUserId = sanitizeId(userId);
    if (!safeUserId) {
      return NextResponse.json({ error: 'User ID tidak valid' }, { status: 400 });
    }

    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.valid) {
      return NextResponse.json({ error: pwCheck.error }, { status: 400 });
    }

    const sql = getDb();

    // Check user exists
    const users = await sql`SELECT id, name, email FROM users WHERE id = ${safeUserId}`;
    if (users.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Hash and update
    const newHash = await bcrypt.hash(newPassword, 12);
    await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${safeUserId}`;

    return NextResponse.json({ 
      message: `Password untuk ${users[0].name} berhasil direset` 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
