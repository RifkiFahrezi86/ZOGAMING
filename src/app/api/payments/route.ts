import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get payment settings & order details for payment page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if payment expired
    if (order.paymentExpiry && new Date() > order.paymentExpiry && order.paymentStatus === 'WAITING') {
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'EXPIRED', status: 'CANCELLED' },
      });
      return NextResponse.json({ error: 'Pembayaran sudah expired', expired: true }, { status: 410 });
    }

    // Get enabled payment methods
    const paymentSettings = await prisma.paymentSetting.findMany({
      where: { enabled: true },
    });

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        productName: order.productName,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentExpiry: order.paymentExpiry,
        paymentMethod: order.paymentMethod,
      },
      paymentMethods: paymentSettings,
    });
  } catch (error) {
    console.error('Payment GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Select payment method & confirm payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paymentMethod, action } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check expiry
    if (order.paymentExpiry && new Date() > order.paymentExpiry && order.paymentStatus !== 'SUCCESS') {
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'EXPIRED', status: 'CANCELLED' },
      });
      return NextResponse.json({ error: 'Pembayaran sudah expired' }, { status: 410 });
    }

    // Action: select payment method
    if (action === 'select_method') {
      if (!paymentMethod || !['QRIS', 'VA', 'GOPAY'].includes(paymentMethod)) {
        return NextResponse.json({ error: 'Metode pembayaran tidak valid' }, { status: 400 });
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { 
          paymentMethod: paymentMethod as 'QRIS' | 'VA' | 'GOPAY',
          paymentStatus: 'PENDING',
        },
      });

      return NextResponse.json({ success: true, order: updated });
    }

    // Action: confirm payment (customer says they've paid)
    if (action === 'confirm_payment') {
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'PENDING' }, // Admin will verify
      });

      return NextResponse.json({
        success: true,
        message: 'Konfirmasi pembayaran diterima. Menunggu verifikasi admin.',
        order: updated,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Payment POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
