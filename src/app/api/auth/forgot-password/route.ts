import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { checkRateLimit, getClientIp, sanitizeEmail, RATE_LIMITS } from '@/lib/security';
import { randomBytes } from 'crypto';

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(10);
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(bytes[i] % chars.length);
  }
  return result;
}

// Forgot password - sends new temporary password via WhatsApp
export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`forgot:${ip}`, RATE_LIMITS.forgotPassword);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Terlalu banyak percobaan. Coba lagi dalam 5 menit.' }, { status: 429 });
    }

    const body = await request.json();
    const email = sanitizeEmail(body.email || '');

    if (!email) {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 });
    }

    const sql = getDb();

    // Find user by email
    const users = await sql`SELECT id, name, email, phone FROM users WHERE email = ${email}`;
    if (users.length === 0) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({ 
        message: 'Jika email terdaftar dan memiliki nomor WhatsApp, password baru akan dikirim via WhatsApp.' 
      });
    }

    const user = users[0];

    if (!user.phone) {
      // Don't reveal whether the account exists or has a phone number
      return NextResponse.json({ 
        message: 'Jika email terdaftar dan memiliki nomor WhatsApp, password baru akan dikirim via WhatsApp.' 
      });
    }

    // Generate temp password
    const tempPassword = generateTempPassword();
    const hash = await bcrypt.hash(tempPassword, 12);

    // Send via WhatsApp using Fonnte BEFORE updating the password
    const fonnteToken = process.env.FONNTE_TOKEN;
    if (fonnteToken) {
      const message = `*ZOGAMING - Reset Password*\n\nHalo ${user.name},\n\nPassword akun kamu telah direset.\n\nEmail: ${user.email}\nPassword Baru: *${tempPassword}*\n\nSegera login dan ubah password kamu di menu Dashboard.\n\nJika kamu tidak meminta reset password, segera hubungi admin.`;

      const sendResult = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': fonnteToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: user.phone,
          message: message,
        }),
      });

      // Only update password if WhatsApp message was sent successfully
      if (!sendResult.ok) {
        return NextResponse.json({ error: 'Gagal mengirim pesan WhatsApp. Password tidak diubah.' }, { status: 500 });
      }
    }

    // Update password in database (only after successful delivery)
    await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${user.id}`;

    return NextResponse.json({ 
      message: 'Password baru telah dikirim ke WhatsApp yang terdaftar.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
