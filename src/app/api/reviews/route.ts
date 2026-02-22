import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { sanitizeInput } from '@/lib/security';

// GET /api/reviews?productId=xxx - Get reviews for a product
export async function GET(request: Request) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'productId required' }, { status: 400 });
    }

    const reviews = await sql`
      SELECT r.id, r.product_id, r.user_id, r.rating, r.comment, r.created_at,
             u.name as user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ${productId}
      ORDER BY r.created_at DESC
    `;

    // Check if current user can review this product
    let canReview = false;
    let hasReviewed = false;
    const user = await getAuthUser();

    if (user && user.role === 'customer') {
      // Check if user already reviewed this product
      const existing = await sql`
        SELECT id FROM reviews WHERE product_id = ${productId} AND user_id = ${user.userId}
      `;
      hasReviewed = existing.length > 0;

      if (!hasReviewed) {
        // Check if user has a completed order containing this product
        const purchaseCheck = await sql`
          SELECT o.id FROM orders o
          JOIN order_items oi ON oi.order_id = o.id
          WHERE o.user_id = ${user.userId}
            AND o.status = 'complete'
            AND oi.product_id = ${productId}
          LIMIT 1
        `;
        canReview = purchaseCheck.length > 0;
      }
    }

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? Math.round(reviews.reduce((sum: number, r: Record<string, unknown>) => sum + (r.rating as number), 0) / reviews.length)
      : 0;

    return NextResponse.json({
      reviews: reviews.map((r: Record<string, unknown>) => ({
        id: r.id,
        productId: r.product_id,
        userId: r.user_id,
        userName: r.user_name,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
      })),
      avgRating,
      totalReviews: reviews.length,
      canReview,
      hasReviewed,
    });
  } catch (error) {
    console.error('GET /api/reviews error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST /api/reviews - Create a review (customer only, must have purchased)
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Anda harus login terlebih dahulu' }, { status: 401 });
    }
    if (user.role !== 'customer') {
      return NextResponse.json({ error: 'Hanya customer yang bisa memberikan ulasan' }, { status: 403 });
    }

    const sql = getDb();
    const body = await request.json();
    const { productId, rating } = body;
    const comment = sanitizeInput(body.comment || '').slice(0, 2000);

    if (!productId || !rating || !comment) {
      return NextResponse.json({ error: 'productId, rating, dan comment wajib diisi' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating harus antara 1-5' }, { status: 400 });
    }

    if (comment.length < 5) {
      return NextResponse.json({ error: 'Ulasan minimal 5 karakter' }, { status: 400 });
    }

    // Check if user already reviewed this product
    const existing = await sql`
      SELECT id FROM reviews WHERE product_id = ${productId} AND user_id = ${user.userId}
    `;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Anda sudah memberikan ulasan untuk produk ini' }, { status: 409 });
    }

    // Check if user has a completed order containing this product
    const purchaseCheck = await sql`
      SELECT o.id FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = ${user.userId}
        AND o.status = 'complete'
        AND oi.product_id = ${productId}
      LIMIT 1
    `;
    if (purchaseCheck.length === 0) {
      return NextResponse.json({ error: 'Anda hanya bisa mengulas produk yang sudah dibeli dan selesai' }, { status: 403 });
    }

    // Create review
    const result = await sql`
      INSERT INTO reviews (product_id, user_id, rating, comment)
      VALUES (${productId}, ${user.userId}, ${rating}, ${comment})
      RETURNING id, product_id, user_id, rating, comment, created_at
    `;

    // Update product average rating
    const avgResult = await sql`
      SELECT ROUND(AVG(rating)) as avg_rating FROM reviews WHERE product_id = ${productId}
    `;
    const newAvgRating = avgResult[0]?.avg_rating || 5;
    await sql`UPDATE products SET rating = ${newAvgRating} WHERE id = ${productId}`;

    return NextResponse.json({
      success: true,
      review: {
        id: result[0].id,
        productId: result[0].product_id,
        userId: result[0].user_id,
        userName: user.name,
        rating: result[0].rating,
        comment: result[0].comment,
        createdAt: result[0].created_at,
      },
    });
  } catch (error) {
    console.error('POST /api/reviews error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan ulasan' }, { status: 500 });
  }
}
