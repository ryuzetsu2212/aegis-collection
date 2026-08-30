import { NextRequest, NextResponse } from 'next/server'
import { getDb, DbProductVariant } from '@/lib/db'
import { requireRole } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'ID produk tidak valid.' }, { status: 400 })
    }

    const db = await getDb()
    const product = db.prepare(`
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(productId) as any

    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan.' }, { status: 404 })
    }

    const variants = db.prepare(
      'SELECT id, product_id, size, color, stock FROM product_variants WHERE product_id = ?'
    ).all(productId) as DbProductVariant[]

    return NextResponse.json({
      ...product,
      product_variants: variants,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memuat produk.' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['admin', 'staff'])
    const { id } = await params
    const productId = parseInt(id)
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'ID produk tidak valid.' }, { status: 400 })
    }

    const body = await request.json()
    const { title, slug, description, price, category_id, image_url, is_active, variants } = body

    if (!title || !slug || price === undefined || !image_url) {
      return NextResponse.json(
        { error: 'Nama, slug, harga, dan gambar produk wajib diisi.' },
        { status: 400 }
      )
    }

    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json(
        { error: 'Minimal harus ada 1 varian produk.' },
        { status: 400 }
      )
    }

    const db = await getDb()

    // Check if product exists
    const existing = await db.prepare('SELECT id FROM products WHERE id = ?').get(productId)
    if (!existing) {
      return NextResponse.json({ error: 'Produk tidak ditemukan.' }, { status: 404 })
    }

    // Check slug uniqueness for other products
    const slugCheck = await db.prepare('SELECT id FROM products WHERE slug = ? AND id != ?').get(slug, productId)
    if (slugCheck) {
      return NextResponse.json({ error: 'Slug sudah digunakan oleh produk lain.' }, { status: 409 })
    }

    // Update products table
    db.prepare(`
      UPDATE products 
      SET category_id = ?, title = ?, slug = ?, description = ?, price = ?, image_url = ?, is_active = ?
      WHERE id = ?
    `).run(
      category_id || null,
      title,
      slug,
      description || null,
      Number(price),
      image_url,
      is_active ? 1 : 0,
      productId
    )

    // Delete existing variants and re-insert
    await db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(productId)

    const insertVariant = db.prepare(`
      INSERT INTO product_variants (product_id, size, color, stock)
      VALUES (?, ?, ?, ?)
    `)

    for (const v of variants) {
      await insertVariant.run(productId, v.size || null, v.color || 'Standard', Number(v.stock) || 0)
    }

    return NextResponse.json({ message: 'Produk berhasil diperbarui.' })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Gagal memperbarui produk.' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['admin', 'staff'])
    const { id } = await params
    const productId = parseInt(id)
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'ID produk tidak valid.' }, { status: 400 })
    }

    const db = await getDb()

    const existing = await db.prepare('SELECT id FROM products WHERE id = ?').get(productId)
    if (!existing) {
      return NextResponse.json({ error: 'Produk tidak ditemukan.' }, { status: 404 })
    }

    // Get variant IDs to clean up order_items if any
    const variantRows = await db.prepare('SELECT id FROM product_variants WHERE product_id = ?').all(productId) as { id: number }[]
    const variantIds = variantRows.map(v => v.id)

    if (variantIds.length > 0) {
      const placeholders = variantIds.map(() => '?').join(',')
      await db.prepare(`DELETE FROM order_items WHERE variant_id IN (${placeholders})`).run(...variantIds)
    }

    await db.prepare('DELETE FROM wishlist WHERE product_id = ?').run(productId)
    await db.prepare('DELETE FROM reviews WHERE product_id = ?').run(productId)
    await db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(productId)
    await db.prepare('DELETE FROM products WHERE id = ?').run(productId)

    return NextResponse.json({ message: 'Produk berhasil dihapus.' })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Gagal menghapus produk.' }, { status: 500 })
  }
}

