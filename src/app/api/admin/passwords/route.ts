import { NextResponse } from 'next/server';

// SECURITY: This endpoint has been disabled.
// Passwords must never be stored in a reversible format.
// Use the "Reset Password" feature instead.
export async function GET() {
  return NextResponse.json(
    { error: 'Fitur ini telah dihapus demi keamanan. Gunakan fitur Reset Password.' },
    { status: 410 }
  );
}
