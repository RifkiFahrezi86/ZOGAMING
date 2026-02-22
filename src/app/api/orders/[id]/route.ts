import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { sanitizeId, sanitizeInput } from '@/lib/security';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const sql = getDb();
    const orderId = sanitizeId(id);
    if (!orderId) return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });

    // Validate status to prevent arbitrary values
    const validStatuses = ['pending', 'processing', 'complete', 'cancelled'];
    const status = sanitizeInput(body.status || '');
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Status pesanan tidak valid' }, { status: 400 });
    }
    const safeNotes = body.notes ? sanitizeInput(body.notes).slice(0, 1000) : null;

    await sql`
      UPDATE orders SET status = ${status}, notes = COALESCE(${safeNotes}, notes), updated_at = NOW()
      WHERE id = ${orderId}
    `;

    // If status changed to complete, send WhatsApp to customer
    if (body.status === 'complete') {
      try {
        const orderData = await sql`SELECT * FROM orders WHERE id = ${orderId}`;
        const fonnteToken = process.env.FONNTE_TOKEN;
        
        if (orderData.length > 0 && fonnteToken && orderData[0].customer_phone) {
          const message = `*PESANAN #${id} SELESAI!*\n\nHai ${orderData[0].customer_name}!\n\nPesanan kamu sudah *COMPLETE*.\nAkun dan password sudah dikirim via WhatsApp.\n\nTerima kasih sudah belanja di ZOGAMING!`;

          await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: { 
              'Authorization': fonnteToken,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              target: orderData[0].customer_phone,
              message: message,
            }),
          });
        }
      } catch (waError) {
        console.error('WhatsApp notification error:', waError);
      }
    }

    return NextResponse.json({ message: 'Order updated' });
  } catch (error) {
    console.error('PUT order error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const sql = getDb();
    const orderId = sanitizeId(id);
    if (!orderId) return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });

    if (user.role === 'admin') {
      // Admin can delete any order
      await sql`DELETE FROM order_items WHERE order_id = ${orderId}`;
      await sql`DELETE FROM orders WHERE id = ${orderId}`;
      return NextResponse.json({ message: 'Order deleted' });
    }

    // Customer can only manage their own orders
    const orderRows = await sql`SELECT * FROM orders WHERE id = ${orderId} AND user_id = ${user.userId}`;
    if (orderRows.length === 0) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    const order = orderRows[0];

    // Check if customer wants to permanently delete (completed/cancelled orders)
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'delete') {
      // Customer can delete completed or cancelled orders to clean up
      if (order.status !== 'complete' && order.status !== 'cancelled') {
        return NextResponse.json({ error: 'Hanya pesanan selesai atau dibatalkan yang bisa dihapus' }, { status: 400 });
      }
      await sql`DELETE FROM order_items WHERE order_id = ${orderId}`;
      await sql`DELETE FROM orders WHERE id = ${orderId}`;
      return NextResponse.json({ message: 'Pesanan berhasil dihapus' });
    }

    // Default: cancel pending order
    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'Hanya pesanan dengan status "Menunggu" yang bisa dibatalkan' }, { status: 400 });
    }

    // Cancel the order (set status to cancelled instead of deleting)
    await sql`UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = ${orderId}`;

    return NextResponse.json({ message: 'Pesanan berhasil dibatalkan' });
  } catch (error) {
    console.error('DELETE order error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
