import { NextRequest, NextResponse } from 'next/server'
import { getDb, DbOrder, DbOrderItem } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const db = await getDb()
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    let query = `
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
        u.phone as user_phone,
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
    `
    const params: any[] = []

    if (user.role === 'user') {
      query += ' WHERE o.user_id = ?'
      params.push(user.id)
      if (status) {
        query += ' AND o.status = ?'
        params.push(status)
      }
    } else if (user.role === 'courier') {
      const name1 = (user.full_name || '').trim().toLowerCase()
      const name2 = (user.email || '').trim().toLowerCase()
      const phone = (user.phone || '').trim()

      query += ` WHERE (
        (o.courier_name IS NOT NULL AND (LOWER(o.courier_name) = ? OR LOWER(o.courier_name) = ?))
        OR
        (o.courier_phone IS NOT NULL AND ? != '' AND o.courier_phone = ?)
      )`
      params.push(name1, name2, phone, phone)

      if (status) {
        query += ' AND o.status = ?'
        params.push(status)
      }
    } else {
      if (status) {
        query += ' WHERE o.status = ?'
        params.push(status)
      }
    }

    query += ' ORDER BY o.created_at DESC'

    const rows = (await db.prepare(query).all(...params)) as any[]

    const orders = await Promise.all(rows.map(async row => {
      let extractedPhone = row.user_phone || null
      if (!extractedPhone && row.shipping_address) {
        const match = row.shipping_address.match(/(?:Telp:\s*|telp:\s*|hp:\s*|Hp:\s*|Phone:\s*|no\.?\s*hp:\s*)([0-9]+)/i) || row.shipping_address.match(/(?:08\d{8,11}|62\d{9,12})/)
        if (match && match[1]) {
          extractedPhone = match[1]
        } else if (match && match[0]) {
          extractedPhone = match[0]
        }
      }

      const items = (await db.prepare(`
        SELECT oi.*, pv.product_id, pv.size, pv.color, pr.title as product_title, pr.slug as product_slug, pr.image_url,
          r.rating as review_rating, r.comment as review_comment
        FROM order_items oi
        JOIN product_variants pv ON oi.variant_id = pv.id
        JOIN products pr ON pv.product_id = pr.id
        LEFT JOIN reviews r ON r.order_id = oi.order_id AND r.product_id = pv.product_id AND r.user_id = ?
        WHERE oi.order_id = ?
      `).all(row.user_id, row.id)) as any[]

      return {
        ...row,
        customer_name: row.user_full_name || 'Pelanggan',
        phone: extractedPhone,
        order_items: items,
      }
    }))

    return NextResponse.json(orders)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Gagal mengambil data pesanan.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const {
      items,
      shipping_address,
      shipping_cost = 0,
      purchase_type = 'online',
      payment_method = 'cod',
      payment_proof_url = null,
      voucher_code = null,
      discount_amount = 0,
    } = body

    const userRoleStr = String(user.role || '')
    if (purchase_type !== 'direct' && (userRoleStr === 'admin' || userRoleStr === 'staff')) {
      return NextResponse.json(
        { error: 'Akun Administrator dan Staff Toko tidak diizinkan untuk melakukan checkout online. Silakan gunakan POS Kasir.' },
        { status: 403 }
      )
    }

    if (!items || items.length === 0 || !shipping_address) {
      return NextResponse.json(
        { error: 'Items dan alamat pengiriman wajib diisi.' },
        { status: 400 }
      )
    }

    const db = await getDb()

    // === SERVER-SIDE PRICE VALIDATION ===
    // NEVER trust prices from client. Always fetch from database.
    let itemsTotal = 0
    const validatedItems: { variantId: number; quantity: number; price: number }[] = []

    for (const item of items) {
      const rawId = String(item.variantId || item.variant_id || '')
      let variantId = parseInt(rawId.replace(/\D/g, ''), 10)
      const isProductPrefix = rawId.startsWith('p-') || rawId.startsWith('prod-')
      const qty = Math.max(1, Number(item.quantity) || 1)

      let variant: { id: number; stock: number; price: number } | undefined

      if (!isNaN(variantId) && variantId > 0 && !isProductPrefix) {
        // Attempt 1: match product_variants.id directly
        variant = (await db.prepare(`
          SELECT pv.id, pv.stock, p.price
          FROM product_variants pv
          JOIN products p ON pv.product_id = p.id
          WHERE pv.id = ? AND p.is_active = 1
        `).get(variantId)) as { id: number; stock: number; price: number } | undefined
      }

      // Attempt 2: fallback to product_id match if variantId is invalid, not found, or has p- prefix
      if (!variant) {
        const rawProdId = String(item.productId || item.product_id || rawId)
        const prodId = parseInt(rawProdId.replace(/\D/g, ''), 10)
        if (!isNaN(prodId) && prodId > 0) {
          variant = (await db.prepare(`
            SELECT pv.id, pv.stock, p.price
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.id
            WHERE p.id = ? AND p.is_active = 1
            ORDER BY pv.stock DESC
            LIMIT 1
          `).get(prodId)) as { id: number; stock: number; price: number } | undefined
        }
      }

      if (!variant) {
        return NextResponse.json(
          { error: 'Varian produk atau stok barang tidak ditemukan.' },
          { status: 400 }
        )
      }

      // Check stock availability
      if (variant.stock < qty) {
        return NextResponse.json(
          { error: `Stok tidak mencukupi. Tersedia: ${variant.stock}.` },
          { status: 400 }
        )
      }

      const discountedPrice = Math.round(variant.price * 0.5)

      validatedItems.push({
        variantId: variant.id,
        quantity: qty,
        price: discountedPrice, // Price with global 50% discount applied
      })

      itemsTotal += discountedPrice * qty
    }

    // === SERVER-SIDE VOUCHER VALIDATION ===
    let validDiscount = 0
    if (voucher_code) {
      const voucher = (await db.prepare(
        'SELECT * FROM vouchers WHERE code = ? AND is_active = 1'
      ).get(String(voucher_code).trim().toUpperCase())) as any

      if (voucher) {
        const notExpired = !voucher.expires_at || new Date(voucher.expires_at) >= new Date()
        const withinLimit = !voucher.usage_limit || voucher.used_count < voucher.usage_limit
        const meetsMin = itemsTotal >= (voucher.min_purchase || 0)

        if (notExpired && withinLimit && meetsMin) {
          if (voucher.voucher_type === 'shipping') {
            const sc = Math.max(0, Number(shipping_cost) || 0)
            if (sc <= 0 || (voucher.discount_type === 'fixed' && sc < voucher.discount_value)) {
              validDiscount = 0
            } else {
              if (voucher.discount_type === 'percentage') {
                validDiscount = Math.round((sc * voucher.discount_value) / 100)
              } else {
                validDiscount = voucher.discount_value
              }
              if (voucher.max_discount && validDiscount > voucher.max_discount) {
                validDiscount = voucher.max_discount
              }
              if (validDiscount > sc) validDiscount = sc
            }
          } else {
            if (voucher.discount_type === 'percentage') {
              validDiscount = Math.round((itemsTotal * voucher.discount_value) / 100)
              if (voucher.max_discount && validDiscount > voucher.max_discount) {
                validDiscount = voucher.max_discount
              }
            } else {
              validDiscount = voucher.discount_value
            }
            if (validDiscount > itemsTotal) validDiscount = itemsTotal
          }
        }
      }
    }

    const shippingFee = purchase_type === 'direct' ? 0 : Math.max(0, Number(shipping_cost) || 0)
    const total_amount = Math.max(0, itemsTotal - validDiscount) + shippingFee

    // Enforce payment proof upload except for COD and direct store purchases
    const isRequiresPaymentProof = purchase_type !== 'direct' && payment_method !== 'cod'
    if (isRequiresPaymentProof && !payment_proof_url) {
      return NextResponse.json(
        { error: 'Harap unggah foto bukti pembayaran terlebih dahulu sebelum membuat pesanan (kecuali COD atau Beli Langsung di Toko).' },
        { status: 400 }
      )
    }

    let initialStatus = 'pending'
    let initialPaymentStatus = 'unpaid'

    let finalUserId = user.id
    if (body.target_user_id && ((user.role as string) === 'admin' || (user.role as string) === 'staff')) {
      finalUserId = Number(body.target_user_id) || user.id
    }

    if (purchase_type === 'direct') {
      initialStatus = 'completed'
      initialPaymentStatus = 'paid'
    } else if (payment_method === 'cod') {
      initialStatus = 'pending'
      initialPaymentStatus = 'unpaid'
    } else if (payment_proof_url) {
      initialStatus = 'pending_confirmation'
      initialPaymentStatus = 'pending_confirmation'
    }

    const result = await db.prepare(`
      INSERT INTO orders (user_id, total_amount, shipping_address, purchase_type, payment_method, payment_proof_url, payment_status, status, voucher_code, discount_amount, shipping_cost)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      finalUserId,
      total_amount,
      shipping_address,
      purchase_type,
      payment_method,
      payment_proof_url,
      initialPaymentStatus,
      initialStatus,
      voucher_code,
      validDiscount,
      shippingFee
    )

    if (voucher_code && validDiscount > 0) {
      await db.prepare('UPDATE vouchers SET used_count = used_count + 1 WHERE code = ?').run(
        String(voucher_code).trim().toUpperCase()
      )
    }

    const orderId = Number(result.lastInsertRowid)

    for (const item of validatedItems) {
      await db.prepare(`
        INSERT INTO order_items (order_id, variant_id, quantity, price_at_purchase)
        VALUES (?, ?, ?, ?)
      `).run(orderId, item.variantId, item.quantity, item.price)

      await db.prepare(`
        UPDATE product_variants SET stock = MAX(0, stock - ?) WHERE id = ?
      `).run(item.quantity, item.variantId)
    }

    await logAudit({
      user,
      action: 'ORDER_CREATED',
      entityType: 'order',
      entityId: orderId,
      details: {
        nominal_total: total_amount,
        tipe_pembelian: purchase_type,
        metode_pembayaran: payment_method,
        status: initialStatus,
      },
    })

    return NextResponse.json({
      id: orderId,
      message: 'Pesanan berhasil dibuat.',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Gagal membuat pesanan.' },
      { status: 500 }
    )
  }
}