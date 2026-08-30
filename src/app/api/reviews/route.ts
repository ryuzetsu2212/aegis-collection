import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// GET /api/reviews?productId=... OR ?orderId=...
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get('productId')
    const orderId = searchParams.get('orderId')

    const db = await getDb()

    if (orderId) {
      const user = await requireAuth()
      const rawReviews = await db.prepare(`
        SELECT r.*, u.full_name as user_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.order_id = ? AND r.user_id = ?
        ORDER BY r.created_at DESC
      `).all(Number(orderId), user.id)
      const reviews = Array.isArray(rawReviews) ? rawReviews : []
      return NextResponse.json(reviews)
    }

    if (!productId) {
      return NextResponse.json({ error: 'productId atau orderId wajib diisi.' }, { status: 400 })
    }

    const rawReviews = await db.prepare(`
      SELECT r.*, u.full_name as user_name, u.email as user_email
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `).all(Number(productId))
    const reviews = (Array.isArray(rawReviews) ? rawReviews : []) as any[]

    const totalReviews = reviews.length
    const sumRating = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0)
    const averageRating = totalReviews > 0 ? Number((sumRating / totalReviews).toFixed(1)) : 5.0

    return NextResponse.json({
      reviews,
      total_reviews: totalReviews,
      average_rating: averageRating,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Gagal memuat review.' }, { status: 500 })
  }
}

// POST /api/reviews - create review
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { productId, orderId, rating, comment } = body

    if (!productId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'productId dan rating (1-5) wajib diisi.' }, { status: 400 })
    }

    const db = await getDb()

    // Check if order exists and belongs to user if orderId is provided
    if (orderId) {
      const order = await db.prepare('SELECT id, status, user_id FROM orders WHERE id = ?').get(orderId) as any
      if (!order || order.user_id !== user.id) {
        return NextResponse.json({ error: 'Pesanan tidak valid.' }, { status: 403 })
      }
      if (order.status !== 'completed') {
        return NextResponse.json({ error: 'Ulasan hanya dapat diberikan jika pesanan sudah Selesai.' }, { status: 400 })
      }
    }

    // Check if user already reviewed this product on this order
    let existing: { id: number } | undefined
    if (orderId) {
      existing = await db.prepare('SELECT id FROM reviews WHERE user_id = ? AND product_id = ? AND order_id = ?').get(user.id, productId, orderId) as { id: number } | undefined
    } else {
      existing = await db.prepare('SELECT id FROM reviews WHERE user_id = ? AND product_id = ? AND order_id IS NULL').get(user.id, productId) as { id: number } | undefined
    }

    if (existing) {
      await db.prepare(`
        UPDATE reviews
        SET rating = ?, comment = ?, created_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(rating, comment || null, existing.id)
      return NextResponse.json({ id: existing.id, message: 'Ulasan berhasil diperbarui.' }, { status: 200 })
    }

    const result = await db.prepare(`
      INSERT INTO reviews (product_id, user_id, order_id, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `).run(productId, user.id, orderId || null, rating, comment || null)

    return NextResponse.json({ id: result.lastInsertRowid, message: 'Ulasan berhasil ditambahkan.' }, { status: 201 })
  } catch (error) {
    console.error('Error adding review:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const msg = error instanceof Error ? error.message : 'Gagal menambah ulasan.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}