import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/reviews/migrate - Create reviews table (one-time migration, admin only)
export async function GET() {
  try {
    // SECURITY: Require admin authentication for migration
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = getDb();

    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(product_id, user_id)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id)`;

    return NextResponse.json({ message: 'Reviews table created successfully!' });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
