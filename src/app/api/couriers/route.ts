import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    await requireAuth()
    const db = await getDb()
    const rawCouriers = await db.prepare(`
      SELECT id, full_name, email, phone
      FROM users
      WHERE role = 'courier'
      ORDER BY full_name ASC
    `).all()
    const couriers = Array.isArray(rawCouriers) ? rawCouriers : []
    return NextResponse.json(couriers)
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

