import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// Protected endpoint: returns active admins list (requires auth)
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = getDb();

    // Ensure admins table exists
    await sql`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        whatsapp VARCHAR(50) NOT NULL,
        active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    const admins = await sql`SELECT id, name, whatsapp FROM admins WHERE active = true ORDER BY sort_order, id`;

    return NextResponse.json(admins.map(a => ({
      id: a.id,
      name: a.name,
      whatsapp: a.whatsapp,
    })));
  } catch (error) {
    console.error('GET active admins error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
