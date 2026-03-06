import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { checkRateLimit, getClientIp, validatePassword, RATE_LIMITS } from '@/lib/security';

// Change password for logged-in user (customer or admin)
export async function PUT(request: Request) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`changepw:${ip}`, RATE_LIMITS.resetPassword);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Terlalu banyak percobaan. Coba lagi nanti.' }, { status: 429 });
    }

    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Password lama dan baru wajib diisi' }, { status: 400 });
    }

    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.valid) {
      return NextResponse.json({ error: pwCheck.error }, { status: 400 });
    }

    const sql = getDb();

    // Get current password hash
    const users = await sql`SELECT password_hash FROM users WHERE id = ${user.userId}`;
    if (users.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Verify current password
    const valid = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Password lama salah' }, { status: 400 });
    }

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 12);
    await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${user.userId}`;

    return NextResponse.json({ message: 'Password berhasil diubah' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
