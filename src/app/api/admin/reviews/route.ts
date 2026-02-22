import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET /api/admin/reviews - Get all reviews with customer & product info
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = getDb();

    const reviews = await sql`
      SELECT r.id, r.product_id, r.user_id, r.rating, r.comment, r.created_at,
             u.name as user_name, u.email as user_email,
             p.name as product_name, p.image as product_image
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
    `;

    return NextResponse.json(
      reviews.map((r: Record<string, unknown>) => ({
        id: r.id,
        productId: r.product_id,
        userId: r.user_id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
        userName: r.user_name,
        userEmail: r.user_email,
        productName: r.product_name,
        productImage: r.product_image,
      }))
    );
  } catch (error) {
    console.error('GET admin reviews error:', error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST /api/admin/reviews - Admin create a review (bypass purchase check)
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = getDb();
    const body = await request.json();
    const { userId, productId, rating, comment } = body;

    if (!userId || !productId || !rating || !comment) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating harus 1-5' }, { status: 400 });
    }

    // Check if this user already reviewed this product
    const existing = await sql`
      SELECT id FROM reviews WHERE product_id = ${productId} AND user_id = ${parseInt(userId)}
    `;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Customer ini sudah punya review di produk ini' }, { status: 409 });
    }

    const result = await sql`
      INSERT INTO reviews (product_id, user_id, rating, comment)
      VALUES (${productId}, ${parseInt(userId)}, ${parseInt(rating)}, ${comment.trim()})
      RETURNING id, product_id, user_id, rating, comment, created_at
    `;

    // Update product average rating
    const avgResult = await sql`
      SELECT ROUND(AVG(rating)) as avg_rating FROM reviews WHERE product_id = ${productId}
    `;
    if (avgResult[0]?.avg_rating) {
      await sql`UPDATE products SET rating = ${avgResult[0].avg_rating} WHERE id = ${productId}`;
    }

    // Get user name for response
    const userRow = await sql`SELECT name, email FROM users WHERE id = ${parseInt(userId)}`;
    const productRow = await sql`SELECT name, image FROM products WHERE id = ${productId}`;

    return NextResponse.json({
      id: result[0].id,
      productId: result[0].product_id,
      userId: result[0].user_id,
      rating: result[0].rating,
      comment: result[0].comment,
      createdAt: result[0].created_at,
      userName: userRow[0]?.name,
      userEmail: userRow[0]?.email,
      productName: productRow[0]?.name,
      productImage: productRow[0]?.image,
    });
  } catch (error) {
    console.error('POST admin review error:', error);
    return NextResponse.json({ error: 'Gagal menambah review' }, { status: 500 });
  }
}
