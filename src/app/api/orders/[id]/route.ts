import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const orderId = Number(id)

    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'ID pesanan tidak valid.' }, { status: 400 })
    }

    const db = await getDb()
    const order = (await db.prepare(`
      SELECT 
        o.id,
        o.user_id,
        o.total_amount,
        o.status,
        COALESCE(o.purchase_type, 'online') as purchase_type,
        COALESCE(o.payment_method, 'cod') as payment_method,
        o.payment_proof_url,
        COALESCE(o.payment_status, 'unpaid') as payment_status,
        o.tracking_number,
        o.courier_name,
        o.courier_phone,
        o.discount_amount,
        o.voucher_code,
        o.shipping_cost,
        o.shipping_address,
        o.created_at,
        u.email as user_email,
        u.full_name as user_full_name,
        r.id as return_id,
        r.status as return_status,
        r.reason as return_reason,
        r.details as return_details,
        r.photo_url as return_photo_url,
        r.created_at as return_created_at,
        r.admin_notes as return_admin_notes
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN returns r ON r.order_id = o.id
      WHERE o.id = ?
    `).get(orderId)) as any

    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 })
    }

    if (user.role === 'user' && order.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const items = (await db.prepare(`
      SELECT oi.*, pv.product_id, pv.size, pv.color, pr.title as product_title, pr.slug as product_slug, pr.image_url,
        r.rating as review_rating, r.comment as review_comment
      FROM order_items oi
      JOIN product_variants pv ON oi.variant_id = pv.id
      JOIN products pr ON pv.product_id = pr.id
      LEFT JOIN reviews r ON r.order_id = oi.order_id AND r.product_id = pv.product_id AND r.user_id = ?
      WHERE oi.order_id = ?
    `).all(order.user_id, orderId)) as any[]

    return NextResponse.json({
      ...order,
      order_items: items,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Gagal memuat pesanan.' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const orderId = Number(id)

    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'ID pesanan tidak valid.' }, { status: 400 })
    }

    const db = await getDb()
    const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any
    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 })
    }

    if (user.role === 'user' && order.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (user.role === 'courier') {
      const courierName = (order.courier_name || '').trim().toLowerCase()
      const courierPhone = (order.courier_phone || '').trim()
      const userFullName = (user.full_name || '').trim().toLowerCase()
      const userEmail = (user.email || '').trim().toLowerCase()
      const userPhone = (user.phone || '').trim()

      const nameMatch = courierName !== '' && (courierName === userFullName || courierName === userEmail)
      const phoneMatch = courierPhone !== '' && userPhone !== '' && courierPhone === userPhone

      if (!nameMatch && !phoneMatch) {
        return NextResponse.json(
          { error: 'Pesanan ini hanya dapat diupdate oleh kurir yang telah ditugaskan oleh Staff Toko.' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const updates: string[] = []
    const paramsArr: any[] = []

    // Customer can cancel order when status is pending or pending_confirmation
    if (body.status === 'cancelled' && order.user_id === user.id && user.role === 'user') {
      if (!['pending', 'pending_confirmation'].includes(order.status)) {
        return NextResponse.json(
          { error: 'Pesanan yang sudah dikonfirmasi atau dikirim tidak dapat dibatalkan.' },
          { status: 400 }
        )
      }
      updates.push('status = ?')
      paramsArr.push('cancelled')
    }

    // Customer, staff, admin, or assigned courier can upload payment_proof_url
    if (body.payment_proof_url && (order.user_id === user.id || user.role === 'admin' || user.role === 'staff' || user.role === 'courier')) {
      updates.push('payment_proof_url = ?')
      paramsArr.push(body.payment_proof_url)
      if (user.role === 'courier') {
        updates.push('payment_status = ?')
        paramsArr.push('paid')
      } else {
        updates.push('status = ?', 'payment_status = ?')
        paramsArr.push('pending_confirmation', 'pending_confirmation')
      }
    }

    // Customer can complete order when shipped, paid, or delivered
    if (body.status === 'completed' && order.user_id === user.id) {
      if (!['shipped', 'paid', 'delivered'].includes(order.status)) {
        return NextResponse.json(
          { error: 'Pesanan hanya dapat diselesaikan setelah dikirim.' },
          { status: 400 }
        )
      }
      updates.push('status = ?')
      paramsArr.push('completed')
    }

    // Staff, admin, or courier can confirm payment / status
    if (body.confirm_payment && (user.role === 'admin' || user.role === 'staff')) {
      updates.push('status = ?', 'payment_status = ?')
      paramsArr.push('paid', 'paid')
    } else if (body.status && (user.role === 'admin' || user.role === 'staff' || user.role === 'courier') && body.status !== 'completed') {
      updates.push('status = ?')
      paramsArr.push(body.status)
      if (body.status === 'paid') {
        updates.push('payment_status = ?')
        paramsArr.push('paid')
      } else if (body.status === 'cancelled') {
        updates.push('payment_status = ?')
        paramsArr.push('cancelled')
      }
    } else if (body.status === 'completed' && (user.role === 'admin' || user.role === 'staff' || user.role === 'courier')) {
      if (order.purchase_type === 'online' && (user.role === 'admin' || user.role === 'staff')) {
        return NextResponse.json(
          { error: 'Pesanan online hanya dapat diselesaikan oleh pembeli saat barang diterima (atau kurir pengantar).' },
          { status: 400 }
        )
      }
      updates.push('status = ?')
      paramsArr.push('completed')
      if (order.payment_method === 'cod') {
        updates.push('payment_status = ?')
        paramsArr.push('paid')
      }
    }

    if (body.tracking_number !== undefined && (user.role === 'admin' || user.role === 'staff' || user.role === 'courier')) {
      updates.push('tracking_number = ?')
      paramsArr.push(body.tracking_number)
    }

    if (body.courier_name !== undefined && (user.role === 'admin' || user.role === 'staff')) {
      updates.push('courier_name = ?')
      paramsArr.push(body.courier_name)
    }

    if (body.courier_phone !== undefined && (user.role === 'admin' || user.role === 'staff')) {
      updates.push('courier_phone = ?')
      paramsArr.push(body.courier_phone)
    }

    // Khusus pembayaran di luar COD (QRIS, Transfer, dll), ketika menugaskan kurir / status dikirim, status pembayaran otomatis LUNAS ('paid')
    const isAssigningCourier = body.courier_name !== undefined || body.tracking_number !== undefined || body.courier_phone !== undefined
    if ((isAssigningCourier || body.status === 'shipped') && order.payment_method !== 'cod') {
      if (!updates.includes('payment_status = ?')) {
        updates.push('payment_status = ?')
        paramsArr.push('paid')
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada field yang diupdate.' },
        { status: 400 }
      )
    }

    paramsArr.push(orderId)
    const query = `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`
    await db.prepare(query).run(...paramsArr)

    // Audit Log recording for order updates (admin, staff, courier, or user/buyer)
    const isCourierAssignment = body.courier_name !== undefined || body.tracking_number !== undefined || body.courier_phone !== undefined
    const isCompleted = body.status === 'completed'
    const isCancelled = body.status === 'cancelled'
    const action = isCourierAssignment 
      ? 'COURIER_ASSIGNED' 
      : (isCompleted ? 'ORDER_RECEIVED' : (isCancelled ? 'ORDER_CANCELLED' : 'ORDER_UPDATED'))

    await logAudit({
      user,
      action,
      entityType: 'order',
      entityId: orderId,
      details: {
        status_sebelumnya: order.status,
        status_baru: body.status || order.status,
        kurir: body.courier_name !== undefined ? body.courier_name : order.courier_name,
        telepon_kurir: body.courier_phone !== undefined ? body.courier_phone : order.courier_phone,
        resi: body.tracking_number !== undefined ? body.tracking_number : order.tracking_number,
      },
    })

    // Restore stock & voucher if order status changed to cancelled from non-cancelled
    if (paramsArr.includes('cancelled') && order.status !== 'cancelled') {
      const items = await db.prepare('SELECT variant_id, quantity FROM order_items WHERE order_id = ?').all(orderId) as any[]
      for (const item of items) {
        await db.prepare('UPDATE product_variants SET stock = stock + ? WHERE id = ?').run(item.quantity, item.variant_id)
      }
      if (order.voucher_code) {
        await db.prepare('UPDATE vouchers SET used_count = MAX(0, used_count - 1) WHERE code = ?').run(order.voucher_code)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Gagal update pesanan.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['admin', 'staff'])
    const { id } = await params
    const orderId = Number(id)

    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'ID pesanan tidak valid.' }, { status: 400 })
    }

    const db = await getDb()
    const order = await db.prepare('SELECT id, status FROM orders WHERE id = ?').get(orderId) as { id: number; status: string } | undefined
    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 })
    }

    if (order.status !== 'cancelled') {
      return NextResponse.json(
        { error: 'Hanya pesanan dengan status Dibatalkan yang dapat dihapus.' },
        { status: 400 }
      )
    }

    await db.prepare('DELETE FROM order_items WHERE order_id = ?').run(orderId)
    await db.prepare('DELETE FROM orders WHERE id = ?').run(orderId)

    return NextResponse.json({ success: true, message: 'Pesanan berhasil dihapus.' })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json(
      { error: 'Gagal menghapus pesanan.' },
      { status: 500 }
    )
  }
}