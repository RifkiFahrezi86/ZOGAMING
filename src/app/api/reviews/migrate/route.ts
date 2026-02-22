import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/reviews/migrate - Create reviews table (one-time migration)
export async function GET() {
  try {
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
    return NextResponse.json({ error: 'Migration failed', details: String(error) }, { status: 500 });
  }
}
