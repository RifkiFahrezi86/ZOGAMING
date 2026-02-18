import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyCustomerRefund } from '@/lib/whatsapp';

// This API is called by a cron job (Vercel Cron) to check expired orders
// Add to vercel.json: { "crons": [{ "path": "/api/cron/check-expired", "schedule": "*/5 * * * *" }] }

export async function GET() {
  try {
    // Find orders that are PENDING with expired payment
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        paymentStatus: { in: ['WAITING', 'PENDING'] },
        paymentExpiry: { lt: new Date() },
      },
    });

    const results = [];
    for (const order of expiredOrders) {
      // Update status
      await prisma.order.update({
        where: { id: order.id },
        data: { 
          status: 'CANCELLED', 
          paymentStatus: 'EXPIRED' 
        },
      });

      // Notify customer
      await notifyCustomerRefund(order.customerPhone, order.orderNumber);
      results.push(order.orderNumber);
    }

    // Also check PROCESSING orders older than 30 minutes without account
    const processingTimeout = new Date(Date.now() - 30 * 60 * 1000);
    const timeoutOrders = await prisma.order.findMany({
      where: {
        status: 'PROCESSING',
        accountEmail: null,
        paidAt: { lt: processingTimeout },
      },
    });

    for (const order of timeoutOrders) {
      await notifyCustomerRefund(order.customerPhone, order.orderNumber);
      results.push(`${order.orderNumber} (processing timeout)`);
    }

    return NextResponse.json({ 
      checked: expiredOrders.length + timeoutOrders.length,
      expired: results,
    });
  } catch (error) {
    console.error('Cron check-expired error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
