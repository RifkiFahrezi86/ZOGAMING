import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET single order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id },
          { orderNumber: id },
        ],
      },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if payment expired
    if (order.paymentExpiry && new Date() > order.paymentExpiry && order.paymentStatus === 'WAITING') {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'EXPIRED', status: 'CANCELLED' },
      });
      order.paymentStatus = 'EXPIRED';
      order.status = 'CANCELLED';
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Order GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
