import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET customer detail with their orders
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const sql = getDb();

    // Get customer info
    const customerRows = await sql`SELECT id, name, email, phone, created_at FROM users WHERE id = ${parseInt(id)} AND role = 'customer'`;
    if (customerRows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const customer = customerRows[0];

    // Get all orders for this customer
    const orders = await sql`SELECT * FROM orders WHERE user_id = ${parseInt(id)} ORDER BY created_at DESC`;

    const ordersWithItems = await Promise.all(
      orders.map(async (order: Record<string, unknown>) => {
        const items = await sql`SELECT * FROM order_items WHERE order_id = ${order.id}`;
        return {
          id: order.id,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          customerPhone: order.customer_phone,
          total: order.total,
          status: order.status,
          notes: order.notes,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
          items: items.map((item: Record<string, unknown>) => ({
            id: item.id,
            productId: item.product_id,
            productName: item.product_name,
            productImage: item.product_image,
            quantity: item.quantity,
            price: item.price,
          })),
        };
      })
    );

    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.created_at,
      orders: ordersWithItems,
    });
  } catch (error) {
    console.error('GET customer detail error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// DELETE customer
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const sql = getDb();

    // Verify it's a customer account, not admin
    const customerRows = await sql`SELECT id, role FROM users WHERE id = ${parseInt(id)}`;
    if (customerRows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    if (customerRows[0].role === 'admin') {
      return NextResponse.json({ error: 'Cannot delete admin account' }, { status: 403 });
    }

    // Delete all order items for this customer's orders
    await sql`DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ${parseInt(id)})`;
    // Delete all orders
    await sql`DELETE FROM orders WHERE user_id = ${parseInt(id)}`;
    // Delete the user
    await sql`DELETE FROM users WHERE id = ${parseInt(id)}`;

    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('DELETE customer error:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
