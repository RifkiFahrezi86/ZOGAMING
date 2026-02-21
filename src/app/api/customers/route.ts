import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = getDb();

    // Get all customers (non-admin users) with order summary
    const customers = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.created_at,
        COUNT(o.id)::int AS total_orders,
        COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total ELSE 0 END), 0)::int AS total_spent
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      WHERE u.role = 'customer'
      GROUP BY u.id, u.name, u.email, u.phone, u.created_at
      ORDER BY u.created_at DESC
    `;

    return NextResponse.json(
      customers.map((c: Record<string, unknown>) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        createdAt: c.created_at,
        totalOrders: c.total_orders,
        totalSpent: c.total_spent,
      }))
    );
  } catch (error) {
    console.error('GET customers error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
