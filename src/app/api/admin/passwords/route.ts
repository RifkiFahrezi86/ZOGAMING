import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { decryptPassword } from '@/lib/crypto';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/security';

// GET /api/admin/passwords?userId=X - Admin view a user's password
export async function GET(request: Request) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`viewpw:${ip}`, RATE_LIMITS.adminApi);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan' }, { status: 429 });
    }

    // Only admin can view passwords
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter required' }, { status: 400 });
    }

    const parsedId = parseInt(userId, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }

    const sql = getDb();
    const rows = await sql`SELECT id, name, email, role, password_enc FROM users WHERE id = ${parsedId}`;
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const targetUser = rows[0];
    const passwordEnc = targetUser.password_enc;

    let password = '(tidak tersedia - password lama)';
    if (passwordEnc && typeof passwordEnc === 'string' && passwordEnc.length > 0) {
      password = decryptPassword(passwordEnc);
    }

    return NextResponse.json({
      userId: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      password,
    });
  } catch (error) {
    console.error('GET admin password error:', error);
    return NextResponse.json({ error: 'Gagal mengambil password' }, { status: 500 });
  }
}
