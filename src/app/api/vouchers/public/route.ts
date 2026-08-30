import { NextResponse } from 'next/server'
import { getDb, DbVoucher } from '@/lib/db'

export async function GET() {
  try {
    const db = await getDb()
    
    // Fetch active vouchers
    const rawVouchers = await db.prepare(`
      SELECT id, code, voucher_type, discount_type, discount_value, min_purchase, max_discount, usage_limit, used_count, expires_at 
      FROM vouchers 
      WHERE is_active = 1
      ORDER BY created_at DESC
    `).all()

    const list = (Array.isArray(rawVouchers) ? rawVouchers : []) as DbVoucher[]
    const now = new Date()

    const vouchers = list.filter(v => {
      const notExpired = !v.expires_at || new Date(v.expires_at) > now
      const withinLimit = !v.usage_limit || (v.used_count || 0) < v.usage_limit
      return notExpired && withinLimit
    })

    return NextResponse.json({ vouchers })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

