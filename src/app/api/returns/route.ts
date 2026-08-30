import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export const MONTHLY_RETURN_LIMIT = 3

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const db = await getDb()

    if (user.role === 'user') {
      // Calculate user's returns count in current 30 days
      const quotaRow = db.prepare(`
        SELECT COUNT(*) as count 
        FROM returns 
        WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
      `).get(user.id) as { count: number }

      const usedThisMonth = quotaRow?.count || 0
      const remainingQuota = Math.max(0, MONTHLY_RETURN_LIMIT - usedThisMonth)

      // Fetch user's return requests
      const returns = db.prepare(`
        SELECT r.*, o.total_amount, o.status as order_status, o.created_at as order_date
        FROM returns r
        JOIN orders o ON r.order_id = o.id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
      `).all(user.id)

      return NextResponse.json({
        usedThisMonth,
        remainingQuota,
        maxLimit: MONTHLY_RETURN_LIMIT,
        returns,
      })
    } else {
      // Staff or Admin view: all returns with user & order info
      const returns = db.prepare(`
        SELECT r.*, 
               o.total_amount, 
               o.status as order_status, 
               o.created_at as order_date,
               u.full_name as customer_name,
               u.email as customer_email,
               u.phone as customer_phone
        FROM returns r
        JOIN orders o ON r.order_id = o.id
        LEFT JOIN users u ON r.user_id = u.id
        ORDER BY r.created_at DESC
      `).all()

      return NextResponse.json({
        returns,
      })
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching returns:', error)
    return NextResponse.json({ error: 'Gagal mengambil data retur.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const db = await getDb()
    const body = await request.json()

    const { order_id, reason, details, photo_url } = body

    if (!order_id || !reason) {
      return NextResponse.json(
        { error: 'ID pesanan dan alasan retur wajib diisi.' },
        { status: 400 }
      )
    }

    // 1. Verify order exists & belongs to user
    const order = db.prepare(`
      SELECT * FROM orders WHERE id = ? AND user_id = ?
    `).get(order_id, user.id) as any

    if (!order) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan atau tidak milik akun Anda.' },
        { status: 404 }
      )
    }

    // 2. Verify order status is strictly 'delivered' (NOT yet confirmed 'completed')
    if (order.status !== 'delivered') {
      return NextResponse.json(
        { error: 'Retur hanya dapat diajukan untuk pesanan yang sudah sampai di tujuan (delivered) sebelum mengonfirmasi pesanan diterima (selesai).' },
        { status: 400 }
      )
    }

    // 3. Verify order has NOT been rated / reviewed yet
    const reviewCountRow = db.prepare(`
      SELECT COUNT(*) as count FROM reviews WHERE order_id = ?
    `).get(order_id) as { count: number }

    if (reviewCountRow && reviewCountRow.count > 0) {
      return NextResponse.json(
        { error: 'Retur tidak dapat diajukan karena barang/pesanan ini sudah diberi rating atau ulasan.' },
        { status: 400 }
      )
    }

    // 4. Check if return request already exists for this order
    const existingReturn = db.prepare(`
      SELECT id FROM returns WHERE order_id = ?
    `).get(order_id)

    if (existingReturn) {
      return NextResponse.json(
        { error: 'Pengajuan retur untuk pesanan ini sudah pernah dibuat sebelumnya.' },
        { status: 400 }
      )
    }

    // 4. Check monthly limit (Max 3 returns per 30 days)
    const quotaRow = db.prepare(`
      SELECT COUNT(*) as count 
      FROM returns 
      WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
    `).get(user.id) as { count: number }

    const usedThisMonth = quotaRow?.count || 0
    if (usedThisMonth >= MONTHLY_RETURN_LIMIT) {
      return NextResponse.json(
        { error: `Batas maksimal pengajuan retur (${MONTHLY_RETURN_LIMIT}x per bulan) telah tercapai untuk akun Anda.` },
        { status: 400 }
      )
    }

    // 5. Insert return request
    const insertStmt = db.prepare(`
      INSERT INTO returns (order_id, user_id, reason, details, photo_url, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `)
    const result = await insertStmt.run(
      order_id,
      user.id,
      reason.trim(),
      details ? details.trim() : null,
      photo_url || null
    )

    const returnId = result.lastInsertRowid as number
    const newReturn = await db.prepare('SELECT * FROM returns WHERE id = ?').get(returnId)

    await logAudit({
      user,
      action: 'RETURN_REQUESTED',
      entityType: 'return',
      entityId: returnId,
      details: {
        order_id,
        alasan: reason.trim(),
        detail: details ? details.trim() : null,
      },
    })

    return NextResponse.json(
      {
        message: 'Pengajuan retur barang berhasil dikirim. Menunggu verifikasi dari Staff Toko.',
        return: newReturn,
        remainingQuota: Math.max(0, MONTHLY_RETURN_LIMIT - (usedThisMonth + 1)),
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error creating return:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan pada server saat membuat retur.' }, { status: 500 })
  }
}

