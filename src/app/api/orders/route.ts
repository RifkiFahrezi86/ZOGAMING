import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { 
  notifyAdminPayment, 
  notifyCustomerProcessing, 
  notifyCustomerDelivery, 
  notifyCustomerCancelled,
  notifyCustomerRefund 
} from '@/lib/whatsapp';

// GET - List all orders (admin) or customer's orders
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build filter
    const where: Record<string, unknown> = {};
    
    if (user && user.role === 'customer') {
      where.customerId = user.id;
    }
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }
    
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { id: true, name: true, email: true, phone: true } } },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH - Update order (admin actions)
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, action, accountEmail, accountPassword, deliveryMethod } = body;

    if (!orderId || !action) {
      return NextResponse.json({ error: 'orderId and action required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // ACTION: Verify payment → move to PROCESSING
    if (action === 'verify_payment') {
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'SUCCESS',
          status: 'PROCESSING',
          paidAt: new Date(),
        },
      });

      // Send WhatsApp notifications
      await notifyAdminPayment(order.orderNumber, order.customerName, order.total);
      await notifyCustomerProcessing(order.customerPhone, order.orderNumber);

      return NextResponse.json({ success: true, order: updated });
    }

    // ACTION: Input account details
    if (action === 'input_account') {
      if (!accountEmail || !accountPassword) {
        return NextResponse.json({ error: 'Account email and password required' }, { status: 400 });
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { accountEmail, accountPassword },
      });

      return NextResponse.json({ success: true, order: updated });
    }

    // ACTION: Deliver account → move to COMPLETED
    if (action === 'deliver') {
      if (!order.accountEmail || !order.accountPassword) {
        return NextResponse.json({ error: 'Account belum diinput' }, { status: 400 });
      }

      const method = deliveryMethod || 'whatsapp';
      
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'COMPLETED',
          deliveredAt: new Date(),
          deliveryMethod: method,
        },
      });

      // Send account to customer via WhatsApp
      if (method === 'whatsapp' || method === 'both') {
        await notifyCustomerDelivery(
          order.customerPhone, 
          order.orderNumber, 
          order.accountEmail!, 
          order.accountPassword!
        );
      }

      return NextResponse.json({ success: true, order: updated });
    }

    // ACTION: Cancel order
    if (action === 'cancel') {
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED', paymentStatus: 'FAILED' },
      });

      await notifyCustomerCancelled(order.customerPhone, order.orderNumber);

      return NextResponse.json({ success: true, order: updated });
    }

    // ACTION: Refund (30 min timeout)
    if (action === 'refund') {
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });

      await notifyCustomerRefund(order.customerPhone, order.orderNumber);

      return NextResponse.json({ success: true, order: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Orders PATCH error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
