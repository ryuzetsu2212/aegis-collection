import { NextResponse } from 'next/server'
import { getDb, DbVoucher } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { code, subtotal, shipping_cost = 0 } = await request.json()
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Kode voucher wajib diisi' }, { status: 400 })
    }

    const db = await getDb()
    const voucher = await db.prepare('SELECT * FROM vouchers WHERE code = ? AND is_active = 1').get(
      code.trim().toUpperCase()
    ) as DbVoucher | undefined

    if (!voucher) {
      return NextResponse.json({ error: 'Kode voucher tidak ditemukan atau tidak aktif' }, { status: 404 })
    }

    // Check expiration
    if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Voucher telah kedaluwarsa' }, { status: 400 })
    }

    // Check usage limit
    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
      return NextResponse.json({ error: 'Batas penggunaan voucher telah habis' }, { status: 400 })
    }

    // Check min purchase
    if (subtotal < voucher.min_purchase) {
      return NextResponse.json(
        { error: `Minimal Pembelian untuk voucher ini adalah Rp ${voucher.min_purchase.toLocaleString('id-ID')}` },
        { status: 400 }
      )
    }

    const isShippingVoucher = voucher.voucher_type === 'shipping'
    let discountAmount = 0

    if (isShippingVoucher) {
      if (shipping_cost <= 0) {
        return NextResponse.json(
          { error: 'Voucher Ongkir hanya berlaku untuk pengiriman kurir berbayar (tidak berlaku untuk Ambil di Toko).' },
          { status: 400 }
        )
      }
      if (voucher.discount_type === 'fixed' && shipping_cost < voucher.discount_value) {
        return NextResponse.json(
          { error: `Voucher Ongkir Rp ${voucher.discount_value.toLocaleString('id-ID')} hanya dapat digunakan jika biaya pengiriman minimal Rp ${voucher.discount_value.toLocaleString('id-ID')}.` },
          { status: 400 }
        )
      }
      if (voucher.discount_type === 'percentage') {
        discountAmount = Math.round((shipping_cost * voucher.discount_value) / 100)
      } else {
        discountAmount = voucher.discount_value
      }
      if (voucher.max_discount && discountAmount > voucher.max_discount) {
        discountAmount = voucher.max_discount
      }
      if (discountAmount > shipping_cost) {
        discountAmount = shipping_cost
      }
    } else {
      // Subtotal Discount
      if (voucher.discount_type === 'percentage') {
        discountAmount = Math.round((subtotal * voucher.discount_value) / 100)
        if (voucher.max_discount && discountAmount > voucher.max_discount) {
          discountAmount = voucher.max_discount
        }
      } else {
        discountAmount = voucher.discount_value
      }
      if (discountAmount > subtotal) {
        discountAmount = subtotal
      }
    }

    return NextResponse.json({
      success: true,
      voucher_code: voucher.code,
      voucher_type: voucher.voucher_type || 'discount',
      discount_amount: discountAmount,
      discount_type: voucher.discount_type,
      discount_value: voucher.discount_value,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

