import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const user = await getSession()
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { review_id, reply } = await request.json()
    if (!review_id || !reply || typeof reply !== 'string') {
      return NextResponse.json({ error: 'ID ulasan dan pesan balasan wajib diisi' }, { status: 400 })
    }

    const db = await getDb()
    await db.prepare(`
      UPDATE reviews
      SET admin_reply = ?, replied_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(reply.trim(), parseInt(review_id, 10))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

