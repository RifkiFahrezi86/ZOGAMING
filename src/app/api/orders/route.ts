import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { sanitizeInput, sanitizePhone } from '@/lib/security';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let orders;
    if (user.role === 'admin') {
      // Admin sees all orders
      if (status && status !== 'all') {
        orders = await sql`SELECT * FROM orders WHERE status = ${status} ORDER BY created_at DESC`;
      } else {
        orders = await sql`SELECT * FROM orders ORDER BY created_at DESC`;
      }
    } else {
      // Customer sees only their orders
      if (status && status !== 'all') {
        orders = await sql`SELECT * FROM orders WHERE user_id = ${user.userId} AND status = ${status} ORDER BY created_at DESC`;
      } else {
        orders = await sql`SELECT * FROM orders WHERE user_id = ${user.userId} ORDER BY created_at DESC`;
      }
    }

    // Get items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order: Record<string, unknown>) => {
        const items = await sql`SELECT * FROM order_items WHERE order_id = ${order.id}`;

        // Try to get assigned admin info
        let assignedAdmin = null;
        try {
          if (order.assigned_admin_id) {
            const adminRows = await sql`SELECT id, name, whatsapp FROM admins WHERE id = ${order.assigned_admin_id}`;
            if (adminRows.length > 0) {
              assignedAdmin = { id: adminRows[0].id, name: adminRows[0].name, whatsapp: adminRows[0].whatsapp };
            }
          }
        } catch { /* admins table may not exist */ }

        return {
          id: order.id,
          userId: order.user_id,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          customerPhone: order.customer_phone,
          total: order.total,
          status: order.status,
          notes: order.notes,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
          assignedAdminId: order.assigned_admin_id || null,
          assignedAdmin,
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

    return NextResponse.json(ordersWithItems);
  } catch (error) {
    console.error('GET orders error:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Silakan login terlebih dahulu' }, { status: 401 });

    const body = await request.json();
    const { items } = body;
    const customerName = sanitizeInput(body.customerName || '').slice(0, 255);
    const customerEmail = sanitizeInput(body.customerEmail || user.email).slice(0, 255);
    const customerPhone = sanitizePhone(body.customerPhone || '');
    const notes = sanitizeInput(body.notes || '').slice(0, 1000);

    if (!customerName || !customerPhone || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Data pesanan tidak lengkap' }, { status: 400 });
    }

    // Validate items structure
    for (const item of items) {
      if (!item.productId || typeof item.price !== 'number' || item.price < 0) {
        return NextResponse.json({ error: 'Data item pesanan tidak valid' }, { status: 400 });
      }
    }

    const total = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0);

    const sql = getDb();

    // Round-robin: Find next admin to assign
    let assignedAdminId: number | null = null;
    let assignedAdminPhone: string | null = null;
    try {
      const activeAdmins = await sql`SELECT id, whatsapp FROM admins WHERE active = true ORDER BY sort_order, id`;
      
      if (activeAdmins.length > 0) {
        // Get the last assigned admin id
        const lastAssigned = await sql`SELECT assigned_admin_id FROM orders WHERE assigned_admin_id IS NOT NULL ORDER BY id DESC LIMIT 1`;
        
        let nextIdx = 0;
        if (lastAssigned.length > 0 && lastAssigned[0].assigned_admin_id) {
          const lastIdx = activeAdmins.findIndex((a: Record<string, unknown>) => a.id === lastAssigned[0].assigned_admin_id);
          nextIdx = (lastIdx + 1) % activeAdmins.length;
        }
        
        assignedAdminId = activeAdmins[nextIdx].id as number;
        assignedAdminPhone = activeAdmins[nextIdx].whatsapp as string;
      }
    } catch (e) {
      console.error('Round-robin admin lookup error:', e);
    }

    // Create order
    const orderResult = await sql`
      INSERT INTO orders (user_id, customer_name, customer_email, customer_phone, total, status, notes, assigned_admin_id)
      VALUES (${user.userId}, ${customerName}, ${customerEmail}, ${customerPhone}, ${total}, 'pending', ${notes}, ${assignedAdminId})
      RETURNING id
    `;

    const orderId = orderResult[0].id;

    // Create order items
    for (const item of items) {
      const productName = sanitizeInput(item.productName || '').slice(0, 255);
      const productImage = sanitizeInput(item.productImage || '').slice(0, 500);
      const quantity = Math.max(1, Math.min(parseInt(item.quantity) || 1, 999));
      await sql`
        INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, price)
        VALUES (${orderId}, ${item.productId}, ${productName}, ${productImage}, ${quantity}, ${item.price})
      `;
    }

    // Send WhatsApp notification to assigned admin (or fallback to env)
    try {
      const adminPhone = assignedAdminPhone || process.env.ADMIN_WHATSAPP;
      const fonnteToken = process.env.FONNTE_TOKEN;
      
      if (adminPhone && fonnteToken) {
        const itemsList = items.map((item: { productName: string; quantity: number; price: number }) => 
          `• ${item.productName} x${item.quantity} = Rp ${item.price.toLocaleString('id-ID')}`
        ).join('\n');

        const message = `*PESANAN BARU #${orderId}*\n\nCustomer: ${customerName}\nEmail: ${customerEmail || user.email}\nWhatsApp: ${customerPhone}\n\nProduk yang dipesan:\n${itemsList}\n\n*Total: Rp ${total.toLocaleString('id-ID')}*\n\nCatatan: ${notes || '-'}\n\nStatus: PENDING`;

        await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            'Authorization': fonnteToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            target: adminPhone,
            message: message,
          }),
        });
      }
    } catch (waError) {
      console.error('WhatsApp notification error:', waError);
      // Don't fail the order if WhatsApp fails
    }

    return NextResponse.json({ 
      orderId, 
      message: 'Pesanan berhasil dibuat!',
      total,
      assignedAdminId,
    });
  } catch (error) {
    console.error('POST orders error:', error);
    return NextResponse.json({ error: 'Gagal membuat pesanan' }, { status: 500 });
  }
}
