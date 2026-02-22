import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// PUT /api/admin/reviews/[id] - Update a review
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const sql = getDb();
    const body = await request.json();
    const { rating, comment, userId, productId } = body;

    // Verify review exists
    const reviewRows = await sql`SELECT * FROM reviews WHERE id = ${parseInt(id)}`;
    if (reviewRows.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const oldProductId = reviewRows[0].product_id;

    // Build update - support changing customer, product, rating, comment
    if (userId && productId) {
      // Check unique constraint if changing user or product
      const existing = await sql`
        SELECT id FROM reviews WHERE product_id = ${productId} AND user_id = ${parseInt(userId)} AND id != ${parseInt(id)}
      `;
      if (existing.length > 0) {
        return NextResponse.json({ error: 'Customer ini sudah punya review di produk tersebut' }, { status: 409 });
      }
      await sql`
        UPDATE reviews SET 
          rating = ${parseInt(rating)}, 
          comment = ${comment.trim()},
          user_id = ${parseInt(userId)},
          product_id = ${productId}
        WHERE id = ${parseInt(id)}
      `;
    } else {
      await sql`
        UPDATE reviews SET rating = ${parseInt(rating)}, comment = ${comment.trim()}
        WHERE id = ${parseInt(id)}
      `;
    }

    // Update product average rating for old and new product
    const finalProductId = productId || oldProductId;
    const avgResult = await sql`
      SELECT ROUND(AVG(rating)) as avg_rating FROM reviews WHERE product_id = ${finalProductId}
    `;
    if (avgResult[0]?.avg_rating) {
      await sql`UPDATE products SET rating = ${avgResult[0].avg_rating} WHERE id = ${finalProductId}`;
    }

    // Also update old product if product changed
    if (productId && productId !== oldProductId) {
      const oldAvg = await sql`
        SELECT ROUND(AVG(rating)) as avg_rating FROM reviews WHERE product_id = ${oldProductId}
      `;
      if (oldAvg[0]?.avg_rating) {
        await sql`UPDATE products SET rating = ${oldAvg[0].avg_rating} WHERE id = ${oldProductId}`;
      }
    }

    return NextResponse.json({ message: 'Review updated' });
  } catch (error) {
    console.error('PUT admin review error:', error);
    return NextResponse.json({ error: 'Gagal update review' }, { status: 500 });
  }
}

// DELETE /api/admin/reviews/[id] - Delete a review
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const sql = getDb();

    // Get review info before deleting
    const reviewRows = await sql`SELECT product_id FROM reviews WHERE id = ${parseInt(id)}`;
    if (reviewRows.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const productId = reviewRows[0].product_id;

    await sql`DELETE FROM reviews WHERE id = ${parseInt(id)}`;

    // Update product average rating
    const avgResult = await sql`
      SELECT ROUND(AVG(rating)) as avg_rating FROM reviews WHERE product_id = ${productId}
    `;
    const newAvg = avgResult[0]?.avg_rating || 5;
    await sql`UPDATE products SET rating = ${newAvg} WHERE id = ${productId}`;

    return NextResponse.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('DELETE admin review error:', error);
    return NextResponse.json({ error: 'Gagal hapus review' }, { status: 500 });
  }
}
