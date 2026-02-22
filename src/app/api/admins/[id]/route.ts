import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { sanitizeInput, sanitizePhone, sanitizeId } from '@/lib/security';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const sql = getDb();
    const parsedId = sanitizeId(id);
    if (!parsedId) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    if (body.name !== undefined && body.whatsapp !== undefined) {
      const name = sanitizeInput(body.name).slice(0, 255);
      const whatsapp = sanitizePhone(body.whatsapp);
      await sql`
        UPDATE admins SET name = ${name}, whatsapp = ${whatsapp}
        WHERE id = ${parsedId}
      `;
    }

    if (body.active !== undefined) {
      await sql`
        UPDATE admins SET active = ${body.active}
        WHERE id = ${parsedId}
      `;
    }

    return NextResponse.json({ message: 'Admin berhasil diupdate' });
  } catch (error) {
    console.error('PUT admin error:', error);
    return NextResponse.json({ error: 'Gagal update admin' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const sql = getDb();
    const parsedId = sanitizeId(id);
    if (!parsedId) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    // Set assigned_admin_id to null for orders assigned to this admin
    try {
      await sql`UPDATE orders SET assigned_admin_id = NULL WHERE assigned_admin_id = ${parsedId}`;
    } catch {
      // Column may not exist yet
    }

    await sql`DELETE FROM admins WHERE id = ${parsedId}`;

    return NextResponse.json({ message: 'Admin berhasil dihapus' });
  } catch (error) {
    console.error('DELETE admin error:', error);
    return NextResponse.json({ error: 'Gagal hapus admin' }, { status: 500 });
  }
}
