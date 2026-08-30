'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/store/useCartStore'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Trash2, Minus, Plus, ArrowRight, AlertTriangle } from 'lucide-react'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

export default function CartPage() {
  const router = useRouter()
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [showAdminWarning, setShowAdminWarning] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.role) {
          setUserRole(data.user.role)
        }
      })
      .catch(() => {})
  }, [])

  const isRestricted = userRole === 'admin' || userRole === 'staff'

  const handleProceedCheckout = () => {
    if (isRestricted) {
      setShowAdminWarning(true)
      return
    }
    router.push('/checkout')
  }

  if (!mounted) {
    return (
      <div className="flex-1 bg-zinc-50 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 bg-zinc-50 flex items-center justify-center py-16 px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-2">
            Keranjang Belanja Kosong
          </h1>
          <p className="text-sm text-zinc-500 mb-6">
            Anda belum menambahkan produk apapun ke dalam keranjang.
          </p>
          <Link href="/">
            <Button>Mulai Belanja</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 md:py-12 w-full max-w-full overflow-x-hidden">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-zinc-900">
            Keranjang Belanja
          </h1>
          <button
            onClick={clearCart}
            className="text-xs text-zinc-500 hover:text-red-600 font-medium transition-colors cursor-pointer"
          >
            Kosongkan Keranjang
          </button>
        </div>

        {isRestricted && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block text-amber-950 text-sm">
                Informasi Akun {userRole === 'admin' ? 'Administrator' : 'Staff Toko'}
              </strong>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                Anda sedang masuk sebagai <strong>{userRole === 'admin' ? 'Administrator' : 'Staff Toko'}</strong>. Anda dapat melihat produk dan menambahkan ke keranjang, namun <strong>fitur Checkout pesanan dibatasi khusus untuk akun Pelanggan</strong>.
              </p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-8 space-y-3 sm:space-y-4">
            {items.map((item) => (
              <div
                key={item.variantId}
                className="bg-white border border-zinc-200 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-6 items-start sm:items-center relative max-w-full overflow-hidden"
              >
                <div className="flex gap-3 sm:gap-4 flex-1 min-w-0 w-full items-start">
                  {/* Image */}
                  <div className="aspect-[16/9] w-20 sm:w-24 relative overflow-hidden bg-zinc-100 rounded-lg shrink-0 border border-zinc-200">
                    <Image
                      src={item.imageUrl}
                      alt={item.productTitle}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 pr-6 sm:pr-0">
                    <Link
                      href={`/products/${item.productSlug}`}
                      className="text-xs sm:text-sm font-semibold text-zinc-900 hover:underline line-clamp-2 leading-snug"
                    >
                      {item.productTitle}
                    </Link>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-zinc-500">
                      {item.size && <span>Ukuran: <strong className="text-zinc-700">{item.size}</strong></span>}
                      <span>Warna: <strong className="text-zinc-700">{item.color}</strong></span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold tabular-nums text-red-600">
                        {formatPrice(item.price)}
                      </span>
                      <span className="text-[10px] sm:text-xs text-zinc-400 line-through tabular-nums">
                        {formatPrice(item.price * 2)}
                      </span>
                      <span className="text-[9px] sm:text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">
                        50% OFF
                      </span>
                    </div>
                  </div>

                  {/* Trash button */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.variantId)}
                    className="absolute top-3.5 right-3.5 sm:static p-1 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Hapus"
                  >
                    <Trash2 className="h-4 w-4 text-zinc-400 hover:text-red-600" />
                  </button>
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 border-zinc-100 shrink-0">
                  <span className="text-xs text-zinc-500 font-medium sm:hidden">Jumlah:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      disabled={item.quantity <= 0}
                      className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border border-zinc-300 rounded-lg bg-white text-zinc-900 transition-colors shadow-sm ${
                        item.quantity <= 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-zinc-100 cursor-pointer'
                      }`}
                      title={item.quantity <= 0 ? 'Jumlah minimal 0' : 'Kurangi Jumlah'}
                    >
                      <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-zinc-900 stroke-[2.5]" />
                    </button>
                    <span className={`w-7 sm:w-8 text-center text-xs sm:text-sm font-bold tabular-nums ${item.quantity === 0 ? 'text-zinc-400' : 'text-zinc-900'}`}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border border-zinc-300 rounded-lg bg-white text-zinc-900 hover:bg-zinc-100 transition-colors shadow-sm cursor-pointer"
                      title="Tambah Jumlah"
                    >
                      <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-zinc-900 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-full overflow-hidden">
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 border-b border-zinc-100 pb-3 sm:pb-4">
              Ringkasan Belanja
            </h2>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between text-zinc-500 text-xs">
                <span>Harga Asli Produk (Sebelum Diskon 50%)</span>
                <span className="line-through tabular-nums">{formatPrice(getTotalPrice() * 2)}</span>
              </div>
              <div className="flex justify-between text-red-600 font-medium text-xs">
                <span>Diskon Promo Toko (50% OFF)</span>
                <span className="tabular-nums">-{formatPrice(getTotalPrice())}</span>
              </div>
              <div className="flex justify-between text-zinc-700 font-semibold pt-1 border-t border-zinc-100">
                <span>Subtotal Produk (Setelah Diskon 50%)</span>
                <span className="font-semibold text-zinc-900 tabular-nums">
                  {formatPrice(getTotalPrice())}
                </span>
              </div>
              <div className="flex justify-between text-zinc-600 text-xs">
                <span>Est. Ongkir Kurir (P. Bengkalis)</span>
                <span className="font-semibold text-emerald-700">
                  Rp 0 – Rp 20.000
                </span>
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-3 sm:pt-4 flex justify-between text-sm sm:text-base font-bold text-zinc-900">
              <span>Total Estimasi</span>
              <span className="tabular-nums">{formatPrice(getTotalPrice())}</span>
            </div>

            <Button
              onClick={handleProceedCheckout}
              disabled={isRestricted}
              className={`w-full py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 ${
                isRestricted
                  ? 'opacity-50 cursor-not-allowed bg-zinc-400 hover:bg-zinc-400'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white cursor-pointer'
              }`}
            >
              <span>{isRestricted ? 'Checkout Khusus Pelanggan' : 'Lanjut ke Checkout'}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showAdminWarning}
        title="Akses Checkout Terbatas"
        description={`Akun ${userRole === 'admin' ? 'Administrator' : 'Staff Toko'} tidak diizinkan melakukan checkout pesanan. Silakan masuk menggunakan akun Pelanggan biasa.`}
        confirmText="Mengerti"
        cancelText="Tutup"
        variant="warning"
        onConfirm={() => setShowAdminWarning(false)}
        onCancel={() => setShowAdminWarning(false)}
      />
    </div>
  )
}
