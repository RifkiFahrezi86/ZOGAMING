import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, customerEmail, customerPhone, productId, productName, productPrice, quantity } = body;

    // Validation
    if (!customerName || !customerEmail || !customerPhone || !productId || !productName || !productPrice) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi (nama, email, WhatsApp, produk)' },
        { status: 400 }
      );
    }

    // Format phone number (ensure starts with 62)
    let phone = customerPhone.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.slice(1);
    } else if (!phone.startsWith('62')) {
      phone = '62' + phone;
    }

    // Generate order number
    const orderCount = await prisma.order.count();
    const orderNumber = `ORD-${String(orderCount + 1).padStart(3, '0')}`;

    // Find or create customer
    let customer = await prisma.customer.findUnique({ where: { email: customerEmail } });
    if (!customer) {
      const { hashPassword } = await import('@/lib/auth');
      customer = await prisma.customer.create({
        data: {
          name: customerName,
          email: customerEmail,
          phone: phone,
          password: await hashPassword('default123'), // Default password
        },
      });
    }

    const qty = quantity || 1;
    const total = productPrice * qty;

    // Create order with 30 min payment expiry
    const paymentExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        customerName,
        customerEmail,
        customerPhone: phone,
        productId,
        productName,
        productPrice,
        quantity: qty,
        total,
        status: 'PENDING',
        paymentStatus: 'WAITING',
        paymentExpiry,
      },
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        paymentExpiry: order.paymentExpiry,
      },
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
