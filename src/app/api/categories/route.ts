import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = await getDb()
    const categories = await db.prepare('SELECT * FROM categories ORDER BY name ASC').all()
    const list = Array.isArray(categories) ? categories : []
    return NextResponse.json(list)
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

    const { name, slug } = await request.json()
    if (!name || !slug) {
      return NextResponse.json({ error: 'Nama dan Slug wajib diisi' }, { status: 400 })
    }

    const db = await getDb()
    const result = await db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)').run(name.trim(), slug.trim().toLowerCase())

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

    const { id, name, slug } = await request.json()
    if (!id || !name || !slug) {
      return NextResponse.json({ error: 'ID, Nama, dan Slug wajib diisi' }, { status: 400 })
    }

    const db = await getDb()
    await db.prepare('UPDATE categories SET name = ?, slug = ? WHERE id = ?').run(name.trim(), slug.trim().toLowerCase(), id)

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
    if (!id) {
      return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 })
    }

    const db = await getDb()
    await db.prepare('DELETE FROM categories WHERE id = ?').run(parseInt(id, 10))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}