import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET - Get all payment settings
export async function GET() {
  try {
    const settings = await prisma.paymentSetting.findMany({
      orderBy: { method: 'asc' },
    });

    // If no settings exist, create defaults
    if (settings.length === 0) {
      const defaults = [
        { method: 'qris', label: 'QRIS', enabled: true, instructions: 'Scan QR code untuk pembayaran' },
        { method: 'va', label: 'Virtual Account (VA)', enabled: true, instructions: 'Transfer ke nomor Virtual Account' },
        { method: 'gopay', label: 'GoPay', enabled: true, instructions: 'Transfer ke nomor GoPay' },
      ];

      for (const def of defaults) {
        await prisma.paymentSetting.create({ data: def });
      }

      const created = await prisma.paymentSetting.findMany({ orderBy: { method: 'asc' } });
      return NextResponse.json({ settings: created });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Payment settings GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT - Update payment settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const updated = [];
    for (const setting of settings) {
      const result = await prisma.paymentSetting.upsert({
        where: { method: setting.method },
        update: {
          label: setting.label,
          enabled: setting.enabled,
          qrisImage: setting.qrisImage || null,
          bankName: setting.bankName || null,
          vaNumber: setting.vaNumber || null,
          accountName: setting.accountName || null,
          gopayNumber: setting.gopayNumber || null,
          gopayName: setting.gopayName || null,
          instructions: setting.instructions || null,
        },
        create: {
          method: setting.method,
          label: setting.label,
          enabled: setting.enabled ?? true,
          qrisImage: setting.qrisImage || null,
          bankName: setting.bankName || null,
          vaNumber: setting.vaNumber || null,
          accountName: setting.accountName || null,
          gopayNumber: setting.gopayNumber || null,
          gopayName: setting.gopayName || null,
          instructions: setting.instructions || null,
        },
      });
      updated.push(result);
    }

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error('Payment settings PUT error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
