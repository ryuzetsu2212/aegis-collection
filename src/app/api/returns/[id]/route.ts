import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(['staff', 'admin', 'courier'])
    const { id } = await params
    const returnId = Number(id)

    if (isNaN(returnId)) {
      return NextResponse.json({ error: 'ID retur tidak valid.' }, { status: 400 })
    }

    const db = await getDb()
    const returnItem = await db.prepare('SELECT * FROM returns WHERE id = ?').get(returnId) as any

    if (!returnItem) {
      return NextResponse.json({ error: 'Pengajuan retur tidak ditemukan.' }, { status: 404 })
    }

    const body = await request.json()
    const { status, admin_notes } = body

    if (!['approved', 'rejected', 'pending', 'item_received'].includes(status)) {
      return NextResponse.json({ error: 'Status retur tidak valid.' }, { status: 400 })
    }

    db.prepare(`
      UPDATE returns 
      SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, admin_notes ? admin_notes.trim() : null, returnId)

    const updated = await db.prepare('SELECT * FROM returns WHERE id = ?').get(returnId)

    const action = status === 'approved' ? 'RETURN_APPROVED' : 'RETURN_STATUS_UPDATED'
    await logAudit({
      user,
      action,
      entityType: 'return',
      entityId: returnId,
      details: {
        order_id: returnItem.order_id,
        status_sebelumnya: returnItem.status,
        status_baru: status,
        catatan_admin: admin_notes || null,
      },
    })

    return NextResponse.json({
      message: `Status retur berhasil diperbarui menjadi '${status}'.`,
      return: updated,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 })
    }
    console.error('Error updating return:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan pada server saat memperbarui retur.' }, { status: 500 })
  }
}

