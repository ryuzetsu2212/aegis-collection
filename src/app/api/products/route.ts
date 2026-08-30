import { NextRequest, NextResponse } from 'next/server'
import { getDb, DbProduct, DbProductVariant } from '@/lib/db'
import { getSession, requireRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const db = await getDb()
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    const slug = searchParams.get('slug')
    const q = searchParams.get('q')
    const category = searchParams.get('category')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '12') || 12)
    const offset = (page - 1) * limit

    let query = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = p.id), 0) as average_rating,
        COALESCE((SELECT COUNT(*) FROM reviews WHERE product_id = p.id), 0) as total_reviews
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `
    const params: any[] = []
    const whereClauses: string[] = []

    // If id or slug is provided, fetch single product
    if (id || slug) {
      if (id) {
        whereClauses.push('p.id = ?')
        params.push(id)
      } else {
        whereClauses.push('p.slug = ?')
        params.push(slug)
      }
    } else {
      // Filter by active
      const active = searchParams.get('active') !== 'false'
      if (active) {
        whereClauses.push('p.is_active = 1')
      }

      // Search
      if (q) {
        whereClauses.push('(p.title LIKE ? OR p.description LIKE ?)')
        const like = `%${q}%`
        params.push(like, like)
      }

      // Category filter by slug
      if (category) {
        whereClauses.push('c.slug = ?')
        params.push(category)
      }
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ')
    }

    // For single product, no pagination
    if (id || slug) {
      query += ' LIMIT 1'
      const stmt = db.prepare(query)
      const row = stmt.get(...params) as any
      if (!row) {
        return NextResponse.json({ error: 'Produk tidak ditemukan.' }, { status: 404 })
      }
      const variants = db.prepare(
        'SELECT id, product_id, size, color, stock FROM product_variants WHERE product_id = ?'
      ).all(row.id) as DbProductVariant[]
      return NextResponse.json({
        ...row,
        product_variants: variants,
      })
    }

    // For listing, get total count
    let countQuery = 'SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id'
    if (whereClauses.length > 0) {
      countQuery += ' WHERE ' + whereClauses.join(' AND ')
    }
    const countStmt = db.prepare(countQuery)
    const totalRow = countStmt.get(...params) as { total: number } | undefined
    const total = totalRow?.total ?? 0

    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const stmt = db.prepare(query)
    const rows = stmt.all(...params) as any[]

    // Attach variants
    const products = rows.map(row => {
      const variants = db.prepare(
        'SELECT id, product_id, size, color, stock FROM product_variants WHERE product_id = ?'
      ).all(row.id) as DbProductVariant[]
      return {
        ...row,
        product_variants: variants,
      }
    })

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal memuat produk.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'staff'])
    const body = await request.json()

    const { title, slug, description, price, category_id, image_url, is_active, variants } = body

    if (!title || !slug || !price || !image_url) {
      return NextResponse.json(
        { error: 'Title, slug, price, dan image_url wajib diisi.' },
        { status: 400 }
      )
    }

    if (!variants || variants.length === 0) {
      return NextResponse.json(
        { error: 'Minimal harus ada 1 varian.' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const existing = db.prepare('SELECT id FROM products WHERE slug = ?').get(slug)
    if (existing) {
      return NextResponse.json(
        { error: 'Slug sudah digunakan.' },
        { status: 409 }
      )
    }

    const result = db.prepare(`
      INSERT INTO products (category_id, title, slug, description, price, image_url, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      category_id || null,
      title,
      slug,
      description || null,
      Number(price),
      image_url,
      is_active !== undefined ? (is_active ? 1 : 0) : 1
    )

    const productId = result.lastInsertRowid as number

    const insertVariant = db.prepare(`
      INSERT INTO product_variants (product_id, size, color, stock)
      VALUES (?, ?, ?, ?)
    `)

    for (const v of variants) {
      insertVariant.run(productId, v.size || null, v.color, Number(v.stock) || 0)
    }

    return NextResponse.json({
      id: productId,
      message: 'Produk berhasil dibuat.',
    }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json(
      { error: 'Gagal membuat produk.' },
      { status: 500 }
    )
  }
}