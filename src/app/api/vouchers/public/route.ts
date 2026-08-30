import { NextResponse } from 'next/server'
import { getDb, DbVoucher } from '@/lib/db'

export async function GET() {
  try {
    const db = await getDb()
    
    // Fetch active vouchers that are not expired and still have usage limit
    const rawVouchers = await db.prepare(`
      SELECT id, code, voucher_type, discount_type, discount_value, min_purchase, max_discount, usage_limit, used_count, expires_at 
      FROM vouchers 
      WHERE is_active = 1 
        AND (expires_at IS NULL OR CAST(expires_at AS TIMESTAMP) > CURRENT_TIMESTAMP)
        AND (usage_limit IS NULL OR used_count < usage_limit)
      ORDER BY created_at DESC
    `).all()

    const vouchers = (Array.isArray(rawVouchers) ? rawVouchers : []) as DbVoucher[]

    return NextResponse.json({ vouchers })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

