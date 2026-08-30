import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// GET /api/wishlist - get user's wishlist
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const db = await getDb()
    const rows = db.prepare(`
      SELECT w.product_id, p.id, p.slug, p.title, p.price, p.image_url
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `).all(user.id)
    return NextResponse.json(rows)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Gagal memuat wishlist.' }, { status: 500 })
  }
}

// POST /api/wishlist - add to wishlist
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { productId } = body
    if (!productId) {
      return NextResponse.json({ error: 'productId wajib diisi.' }, { status: 400 })
    }
    const db = await getDb()
    // Check if already exists
    const existing = db.prepare('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?').get(user.id, productId)
    if (existing) {
      return NextResponse.json({ error: 'Sudah ada di wishlist.' }, { status: 409 })
    }
    db.prepare('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)').run(user.id, productId)
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Gagal menambah wishlist.' }, { status: 500 })
  }
}

// DELETE /api/wishlist - remove from wishlist
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth()
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get('productId')
    if (!productId) {
      return NextResponse.json({ error: 'productId wajib diisi.' }, { status: 400 })
    }
    const db = await getDb()
    const result = db.prepare('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?').run(user.id, productId)
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Tidak ditemukan.' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Gagal menghapus wishlist.' }, { status: 500 })
  }
}