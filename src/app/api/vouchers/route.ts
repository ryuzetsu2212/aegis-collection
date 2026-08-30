import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const user = await getSession()
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const db = await getDb()
    const vouchers = await db.prepare('SELECT * FROM vouchers ORDER BY created_at DESC').all()
    return NextResponse.json({ vouchers })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSession()
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { code, voucher_type = 'discount', discount_type, discount_value, min_purchase, usage_limit, expires_at } = body

    if (!code || !discount_value) {
      return NextResponse.json({ error: 'Kode voucher dan Nilai diskon wajib diisi' }, { status: 400 })
    }

    const db = await getDb()
    const result = await db.prepare(`
      INSERT INTO vouchers (code, voucher_type, discount_type, discount_value, min_purchase, usage_limit, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      code.trim().toUpperCase(),
      voucher_type || 'discount',
      discount_type || 'percentage',
      parseInt(discount_value, 10),
      parseInt(min_purchase || 0, 10),
      usage_limit ? parseInt(usage_limit, 10) : null,
      expires_at || null
    )

    return NextResponse.json({ success: true, id: result.lastInsertRowid })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getSession()
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, is_active, code, voucher_type, discount_type, discount_value, min_purchase, usage_limit, expires_at } = body
    if (id === undefined) {
      return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 })
    }

    const db = await getDb()

    if (is_active !== undefined && code === undefined) {
      await db.prepare('UPDATE vouchers SET is_active = ? WHERE id = ?').run(is_active ? 1 : 0, id)
    } else {
      if (!code || discount_value === undefined) {
        return NextResponse.json({ error: 'Kode voucher dan Nilai diskon wajib diisi' }, { status: 400 })
      }
      await db.prepare(`
        UPDATE vouchers
        SET code = ?, voucher_type = ?, discount_type = ?, discount_value = ?, min_purchase = ?, usage_limit = ?, expires_at = ?
        WHERE id = ?
      `).run(
        code.trim().toUpperCase(),
        voucher_type || 'discount',
        discount_type || 'percentage',
        parseInt(discount_value, 10),
        parseInt(min_purchase || 0, 10),
        usage_limit ? parseInt(usage_limit, 10) : null,
        expires_at || null,
        id
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSession()
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 })

    const db = await getDb()
    await db.prepare('DELETE FROM vouchers WHERE id = ?').run(parseInt(id, 10))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

