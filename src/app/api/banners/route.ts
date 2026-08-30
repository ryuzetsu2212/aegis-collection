import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = await getDb()
    const banners = db.prepare('SELECT * FROM banners ORDER BY position ASC, created_at DESC').all()
    return NextResponse.json({ banners })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSession()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { title, subtitle, image_url, link_url, position } = await request.json()
    if (!title) {
      return NextResponse.json({ error: 'Judul banner wajib diisi' }, { status: 400 })
    }

    const db = await getDb()
    const result = db.prepare(`
      INSERT INTO banners (title, subtitle, image_url, link_url, position)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      title.trim(),
      subtitle ? subtitle.trim() : null,
      image_url ? image_url.trim() : null,
      link_url ? link_url.trim() : null,
      parseInt(position || 0, 10)
    )

    return NextResponse.json({ success: true, id: result.lastInsertRowid })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getSession()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, is_active } = await request.json()
    if (id === undefined || is_active === undefined) {
      return NextResponse.json({ error: 'ID dan status wajib diisi' }, { status: 400 })
    }

    const db = await getDb()
    db.prepare('UPDATE banners SET is_active = ? WHERE id = ?').run(is_active ? 1 : 0, id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSession()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 })

    const db = await getDb()
    db.prepare('DELETE FROM banners WHERE id = ?').run(parseInt(id, 10))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

