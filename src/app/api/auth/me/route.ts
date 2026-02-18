import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role === 'admin') {
      return NextResponse.json({
        user: { id: 'admin', name: 'Admin', email: user.email, role: 'admin' },
      });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, phone: true },
    });

    if (!customer) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: { ...customer, role: 'customer' },
    });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
