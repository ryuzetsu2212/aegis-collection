'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Plus, Trash2, ShoppingBag, Store, Tag, Check, Loader2, User, CreditCard, Search, CheckCircle2, QrCode, ShieldCheck } from 'lucide-react'

interface ProductVariant {
  id: number
  size: string
  color: string
  stock: number
}

interface Product {
  id: number
  title?: string
  name?: string
  price: number
  images?: string | string[]
  image_url?: string
  product_variants?: ProductVariant[]
  variants?: ProductVariant[]
}

interface Voucher {
  id: number
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_purchase?: number
  max_discount?: number
  voucher_type?: string
}

interface UserItem {
  id: number
  full_name?: string
  email: string
  role?: string
}

interface PosItem {
  productId: number
  variantId: number
  productName: string
  variantName: string
  price: number
  quantity: number
  maxStock: number
  image?: string
}

interface ModalTambahPesananKasirProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ModalTambahPesananKasir({
  isOpen,
  onClose,
  onSuccess,
}: ModalTambahPesananKasirProps) {
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Data lists
  const [usersList, setUsersList] = useState<UserItem[]>([])
  const [productsList, setProductsList] = useState<Product[]>([])
  const [vouchersList, setVouchersList] = useState<Voucher[]>([])

  // Form State
  const [customerType, setCustomerType] = useState<'walkin' | 'registered'>('walkin')
  const [selectedUserId, setSelectedUserId] = useState<number>(0)
  const [customerNameNote, setCustomerNameNote] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('cash_store')
  const [selectedVoucherCode, setSelectedVoucherCode] = useState<string>('')

  // QRIS Modal State
  const [showQrisModal, setShowQrisModal] = useState<boolean>(false)
  const [qrisSimulating, setQrisSimulating] = useState<boolean>(false)
  const [qrisSuccess, setQrisSuccess] = useState<boolean>(false)

  // Search & Cart State
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [posItems, setPosItems] = useState<PosItem[]>([])

  // Variant Modal Picker for multi-variant products
  const [activePickerProduct, setActivePickerProduct] = useState<Product | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadInitialData()
    }
  }, [isOpen])

  const loadInitialData = async () => {
    setFetchingData(true)
    setError(null)
    try {
      // 1. Fetch Users
      const resUsers = await fetch('/api/users')
      if (resUsers.ok) {
        const uData = await resUsers.json()
        setUsersList(Array.isArray(uData) ? uData : [])
      }

      // 2. Fetch Products (limit 100 for POS)
      const resProds = await fetch('/api/products?limit=100')
      if (resProds.ok) {
        const pData = await resProds.json()
        setProductsList(pData.products || [])
      }

      // 3. Fetch Vouchers (Filter out shipping/ongkir vouchers for direct store cashier purchase)
      const resVouchers = await fetch('/api/vouchers/public')
      if (resVouchers.ok) {
        const vData = await resVouchers.json()
        const rawVouchers: Voucher[] = vData.vouchers || []
        const itemDiscountVouchers = rawVouchers.filter((v) => {
          const type = (v.voucher_type || '').toLowerCase()
          const code = (v.code || '').toLowerCase()
          return !(type === 'shipping' || type === 'ongkir' || code.includes('ongkir') || code.includes('shipping'))
        })
        setVouchersList(itemDiscountVouchers)
      }
    } finally {
      setFetchingData(false)
    }
  }

  if (!isOpen) return null

  // Filter products by search query
  const filteredProducts = productsList.filter((p) => {
    const title = (p.title || p.name || '').toLowerCase()
    return title.includes(searchQuery.toLowerCase())
  })

  // Helper to parse image URL
  const getProductImage = (p: Product) => {
    if (p.image_url) return p.image_url
    if (typeof p.images === 'string') {
      try {
        const arr = JSON.parse(p.images)
        if (Array.isArray(arr) && arr.length > 0) return arr[0]
      } catch {
        return p.images
      }
    } else if (Array.isArray(p.images) && p.images.length > 0) {
      return p.images[0]
    }
    return '/images/placeholder.jpg'
  }

  // Quick Add Product to POS Cart
  const handleSelectProduct = (p: Product) => {
    const variants = p.product_variants || p.variants || []
    if (variants.length > 1) {
      // Open variant picker
      setActivePickerProduct(p)
    } else {
      // Add default or single variant directly
      const singleVar = variants[0]
      const vId = singleVar ? singleVar.id : p.id
      const vName = singleVar ? `${singleVar.size} - ${singleVar.color}` : 'Standard'
      const vStock = singleVar ? singleVar.stock : 999
      const title = p.title || p.name || `Produk #${p.id}`
      const discountedPrice = Math.round(p.price * 0.5)

      addItemToCart({
        productId: p.id,
        variantId: vId,
        productName: title,
        variantName: vName,
        price: discountedPrice,
        quantity: 1,
        maxStock: vStock,
        image: getProductImage(p),
      })
    }
  }

  const handleAddVariant = (p: Product, v: ProductVariant) => {
    const title = p.title || p.name || `Produk #${p.id}`
    const discountedPrice = Math.round(p.price * 0.5)
    addItemToCart({
      productId: p.id,
      variantId: v.id,
      productName: title,
      variantName: `${v.size} - ${v.color}`,
      price: discountedPrice,
      quantity: 1,
      maxStock: v.stock,
      image: getProductImage(p),
    })
    setActivePickerProduct(null)
  }

  const addItemToCart = (newItem: PosItem) => {
    setPosItems((prev) => {
      const idx = prev.findIndex((i) => i.variantId === newItem.variantId)
      if (idx > -1) {
        const updated = [...prev]
        const nextQty = updated[idx].quantity + 1
        if (nextQty > updated[idx].maxStock) {
          setError(`Stok maksimal varian "${newItem.productName}" hanya ${newItem.maxStock}.`)
          return prev
        }
        updated[idx].quantity = nextQty
        return updated
      }
      return [...prev, newItem]
    })
    setError(null)
  }

  const handleRemoveItem = (index: number) => {
    setPosItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleQtyChange = (index: number, newQty: number) => {
    if (newQty < 1) return
    setPosItems((prev) => {
      const updated = [...prev]
      if (newQty > updated[index].maxStock) {
        setError(`Stok tersisa hanya ${updated[index].maxStock}.`)
        return prev
      }
      updated[index].quantity = newQty
      return updated
    })
  }

  // Subtotal & Voucher Discount Calculations
  const subtotal = posItems.reduce((acc, item) => acc + item.price * item.quantity, 0)

  const activeVoucher = vouchersList.find(
    (v) => v.code.toUpperCase() === selectedVoucherCode.trim().toUpperCase()
  )

  let discountAmount = 0
  if (activeVoucher && subtotal >= (activeVoucher.min_purchase || 0)) {
    if (activeVoucher.discount_type === 'percentage') {
      discountAmount = Math.round((subtotal * activeVoucher.discount_value) / 100)
      if (activeVoucher.max_discount && discountAmount > activeVoucher.max_discount) {
        discountAmount = activeVoucher.max_discount
      }
    } else {
      discountAmount = activeVoucher.discount_value
    }
    if (discountAmount > subtotal) discountAmount = subtotal
  }

  const grandTotal = Math.max(0, subtotal - discountAmount)

  const handleSubmitTransaction = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (posItems.length === 0) {
      setError('Harap pilih minimal 1 produk terlebih dahulu.')
      return
    }

    // Jika pembayaran QRIS, munculkan modal QRIS terlebih dahulu untuk di-scan dan dikonfirmasi
    if (paymentMethod === 'qris' && !showQrisModal) {
      setShowQrisModal(true)
      return
    }

    await executeSaveOrder()
  }

  const executeSaveOrder = async () => {
    setLoading(true)
    setError(null)

    try {
      const notePart = customerNameNote.trim() ? ` (a.n. ${customerNameNote.trim()})` : ''
      const shippingAddrStr = `[Pembelian Langsung di Toko Kasir]${notePart}`
      const proofStr = paymentMethod === 'qris'
        ? 'QRIS Kasir (Terverifikasi)'
        : paymentMethod === 'bank_transfer'
        ? 'EDC / Transfer Kasir'
        : 'Tunai Kasir (Struk)'

      const payload = {
        purchase_type: 'direct',
        payment_method: paymentMethod,
        payment_proof_url: proofStr,
        shipping_address: shippingAddrStr,
        target_user_id: customerType === 'registered' && selectedUserId > 0 ? selectedUserId : undefined,
        items: posItems.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        voucher_code: selectedVoucherCode ? selectedVoucherCode.toUpperCase() : null,
        discount_amount: discountAmount,
        shipping_cost: 0,
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan transaksi kasir.')
      }

      if (showQrisModal) {
        setQrisSuccess(true)
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      // Reset State
      setPosItems([])
      setSelectedVoucherCode('')
      setSelectedUserId(0)
      setCustomerNameNote('')
      setShowQrisModal(false)
      setQrisSimulating(false)
      setQrisSuccess(false)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memproses transaksi kasir.')
      setQrisSimulating(false)
    } finally {
      setLoading(false)
    }
  }

  const formatRp = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-6 space-y-4 relative shadow-2xl my-4 border border-zinc-200">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">Kasir Toko Fisik (Pembelian Langsung)</h2>
              <p className="text-xs text-zinc-500">Pilih produk cepat, masukkan voucher, dan cetak struk kasir</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:underline">Tutup</button>
          </div>
        )}

        {/* Layout 2 Kolom: Kiri Katalog Produk, Kanan Ringkasan Kasir */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* KOLOM KIRI: KATALOG & PENCARIAN PRODUK (7 Cols) */}
          <div className="lg:col-span-7 space-y-3">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="🔍 Cari nama pakaian / produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs bg-zinc-50 text-zinc-900 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold"
              />
            </div>

            {/* Grid Katalog Produk Visual */}
            <div className="max-h-[360px] overflow-y-auto pr-1">
              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 rounded-xl">
                  Produk tidak ditemukan.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {filteredProducts.map((p) => {
                    const title = p.title || p.name || `Produk #${p.id}`
                    const discountedPrice = Math.round(p.price * 0.5)
                    const variants = p.product_variants || p.variants || []
                    const totalStock = variants.reduce((acc, v) => acc + (v.stock || 0), 0)

                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        className="bg-white border border-zinc-200 hover:border-emerald-500 hover:shadow-md rounded-xl p-2 transition-all cursor-pointer flex flex-col justify-between group"
                      >
                        <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-zinc-100 mb-1.5">
                          <Image
                            src={getProductImage(p)}
                            alt={title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-zinc-900 line-clamp-1 leading-snug">{title}</p>
                          <p className="text-[10px] font-bold text-emerald-700 tabular-nums">
                            {formatRp(discountedPrice)}
                          </p>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[9px] text-zinc-400 pt-1 border-t border-zinc-100">
                          <span>{variants.length > 1 ? `${variants.length} Varian` : '1 Varian'}</span>
                          <span className="bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                            + Klik Pilih
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* KOLOM KANAN: RINGKASAN KASIR & KERANJANG (5 Cols) */}
          <div className="lg:col-span-5 bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              {/* Opsi Pelanggan */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-zinc-900 flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-zinc-600" /> Tipe Pembeli
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-zinc-200/70 p-1 rounded-xl text-[11px]">
                  <button
                    type="button"
                    onClick={() => setCustomerType('walkin')}
                    className={`py-1 rounded-lg font-bold transition-all ${
                      customerType === 'walkin' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600'
                    }`}
                  >
                    👤 Umum (Walk-in)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerType('registered')}
                    className={`py-1 rounded-lg font-bold transition-all ${
                      customerType === 'registered' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600'
                    }`}
                  >
                    🔍 Akun Member
                  </button>
                </div>

                {customerType === 'walkin' ? (
                  <input
                    type="text"
                    placeholder="Catatan Nama Pembeli (Opsional)"
                    value={customerNameNote}
                    onChange={(e) => setCustomerNameNote(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-900"
                  />
                ) : (
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(Number(e.target.value))}
                    className="w-full h-8 px-2 text-xs bg-white text-zinc-900 border border-zinc-300 rounded-lg font-semibold"
                  >
                    <option value={0}>-- Pilih Akun Pelanggan --</option>
                    {usersList
                      .filter((u) => u.role === 'customer' || u.role === 'user')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name || u.email}
                        </option>
                      ))}
                  </select>
                )}
              </div>

              {/* Daftar Item dalam Kasir */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-900">
                  <span>Keranjang Kasir</span>
                  <span className="text-[11px] text-zinc-900 font-bold">{posItems.length} item</span>
                </div>

                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                  {posItems.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-zinc-400 bg-white border border-dashed border-zinc-300 rounded-xl">
                      Klik produk di sebelah kiri untuk menambah ke kasir.
                    </div>
                  ) : (
                    posItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-white border border-zinc-200 rounded-lg text-xs"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-bold text-zinc-900 truncate text-[11px]">{item.productName}</p>
                          <p className="text-[10px] text-zinc-700 font-semibold">
                            {item.variantName} • {formatRp(item.price)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="flex items-center border border-zinc-300 rounded overflow-hidden text-[11px] bg-white">
                            <button
                              type="button"
                              onClick={() => handleQtyChange(idx, item.quantity - 1)}
                              className="px-1.5 py-0.5 bg-zinc-100 hover:bg-zinc-200 font-bold text-zinc-900 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-2 font-bold tabular-nums text-zinc-900 bg-white">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleQtyChange(idx, item.quantity + 1)}
                              className="px-1.5 py-0.5 bg-zinc-100 hover:bg-zinc-200 font-bold text-zinc-900 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-bold tabular-nums text-[11px] w-16 text-right text-zinc-900">
                            {formatRp(item.price * item.quantity)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Tombol Voucher Cepat */}
              <div className="space-y-1 pt-1 border-t border-zinc-200">
                <label className="block text-[11px] font-bold text-purple-900 flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5 text-purple-700" /> Voucher Diskon
                </label>

                {vouchersList.length > 0 ? (
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => setSelectedVoucherCode('')}
                      className={`px-2 py-1 text-[10px] rounded-lg font-bold transition-all border ${
                        !selectedVoucherCode
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-white text-zinc-600 border-zinc-300'
                      }`}
                    >
                      Tanpa Voucher
                    </button>
                    {vouchersList.map((v) => {
                      const isSelected = selectedVoucherCode.toUpperCase() === v.code.toUpperCase()
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVoucherCode(isSelected ? '' : v.code)}
                          className={`px-2 py-1 text-[10px] rounded-lg font-bold transition-all border ${
                            isSelected
                              ? 'bg-purple-700 text-white border-purple-800 shadow-sm'
                              : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
                          }`}
                        >
                          🎟️ {v.code} ({v.discount_type === 'percentage' ? `${v.discount_value}%` : formatRp(v.discount_value)})
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-400">Tidak ada voucher aktif.</p>
                )}
              </div>

              {/* Metode Bayar Toggle */}
              <div className="space-y-1 pt-1 border-t border-zinc-200">
                <label className="block text-[11px] font-bold text-zinc-900 flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5 text-zinc-600" /> Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-1 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash_store')}
                    className={`py-1.5 rounded-lg border transition-all cursor-pointer ${
                      paymentMethod === 'cash_store'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                        : 'bg-white text-zinc-700 border-zinc-300'
                    }`}
                  >
                    💵 Tunai
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qris')}
                    className={`py-1.5 rounded-lg border transition-all cursor-pointer ${
                      paymentMethod === 'qris'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                        : 'bg-white text-zinc-700 border-zinc-300'
                    }`}
                  >
                    📱 QRIS
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`py-1.5 rounded-lg border transition-all cursor-pointer ${
                      paymentMethod === 'bank_transfer'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                        : 'bg-white text-zinc-700 border-zinc-300'
                    }`}
                  >
                    🏦 EDC/BCA
                  </button>
                </div>

                {paymentMethod === 'qris' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-[10px] text-emerald-900 font-semibold flex items-center gap-2 mt-1.5 animate-in fade-in duration-150">
                    <QrCode className="h-4 w-4 text-emerald-700 shrink-0" />
                    <span>Kode QRIS Resmi akan langsung muncul saat Anda menekan tombol hijau di bawah ini.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Subtotal & Submit Transaksi */}
            <div className="pt-2 border-t border-zinc-200 space-y-2">
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal:</span>
                  <span className="font-bold text-zinc-900 tabular-nums">{formatRp(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-purple-700 font-bold">
                    <span>Diskon Voucher ({selectedVoucherCode}):</span>
                    <span className="tabular-nums">- {formatRp(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-zinc-900 pt-1">
                  <span>Total Bayar:</span>
                  <span className="tabular-nums text-emerald-700 text-base">{formatRp(grandTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                onClick={handleSubmitTransaction}
                disabled={loading || posItems.length === 0}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : paymentMethod === 'qris' ? (
                  <>
                    <QrCode className="h-4 w-4 text-white" />
                    <span>Tampilkan Kode QRIS & Bayar</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 text-white" />
                    <span>Simpan Transaksi Kasir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Pop-up Pilih Varian Ukuran/Warna jika produk punya banyak varian */}
        {activePickerProduct && (
          <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
            <div className="bg-white rounded-2xl p-4 max-w-sm w-full space-y-3 border border-zinc-200 shadow-xl">
              <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                <h4 className="text-xs font-bold text-zinc-900">
                  Pilih Varian ({activePickerProduct.title || activePickerProduct.name})
                </h4>
                <button
                  onClick={() => setActivePickerProduct(null)}
                  className="text-zinc-400 hover:text-zinc-700 text-xs"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {(activePickerProduct.product_variants || activePickerProduct.variants || []).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleAddVariant(activePickerProduct, v)}
                    disabled={v.stock <= 0}
                    className="w-full p-2 bg-zinc-50 hover:bg-emerald-50 border border-zinc-200 hover:border-emerald-400 rounded-xl text-xs flex justify-between items-center font-semibold disabled:opacity-40"
                  >
                    <span className="text-zinc-900 font-bold">
                      Ukuran {v.size} ({v.color})
                    </span>
                    <span className="text-[11px] text-emerald-700 font-bold">
                      {v.stock > 0 ? `Stok: ${v.stock}` : 'Habis'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL POP-UP SCAN QRIS */}
        {showQrisModal && (
          <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl p-4 max-w-[310px] w-full space-y-2.5 border border-zinc-200 shadow-2xl relative overflow-hidden my-auto">
              
              {/* Header QRIS Resmi */}
              <div className="bg-red-600 -mx-4 -mt-4 p-2.5 px-3 text-white flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-1.5">
                  <div className="bg-white px-1.5 py-0.5 rounded font-black text-red-600 text-[10px] tracking-wider border border-red-200">
                    QRIS
                  </div>
                  <span className="text-[9px] font-bold text-red-100 tracking-wide uppercase">
                    Standar Pembayaran Nasional
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowQrisModal(false)
                    setQrisSimulating(false)
                  }}
                  disabled={qrisSimulating || loading}
                  className="text-white/80 hover:text-white text-xs p-0.5 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Detail Tagihan */}
              <div className="text-center pt-0.5 space-y-0.5">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">AEGIS COLLECTION (TOKO KASIR)</p>
                <div className="text-xl font-black text-zinc-900 tracking-tight leading-tight">
                  {formatRp(grandTotal)}
                </div>
                <p className="text-[9px] text-zinc-500 font-semibold">
                  NMID: ID102488392019 • Kasir #LIVE
                </p>
              </div>

              {/* Tampilan Visual Kode QRIS */}
              <div className="bg-zinc-50 border border-dashed border-zinc-300 rounded-xl p-2.5 flex flex-col items-center justify-center relative shadow-inner">
                {qrisSuccess ? (
                  <div className="py-4 flex flex-col items-center justify-center space-y-1.5">
                    <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                    <p className="text-xs font-bold text-emerald-700">Pembayaran QRIS Berhasil!</p>
                    <p className="text-[10px] text-zinc-500">Menyelesaikan pesanan kasir...</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-zinc-200 relative">
                      <svg
                        className="w-32 h-32"
                        viewBox="0 0 100 100"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect width="100" height="100" fill="white" />
                        <rect x="5" y="5" width="22" height="22" fill="#09090b" rx="2" />
                        <rect x="8" y="8" width="16" height="16" fill="white" rx="1" />
                        <rect x="11" y="11" width="10" height="10" fill="#09090b" rx="1" />

                        <rect x="73" y="5" width="22" height="22" fill="#09090b" rx="2" />
                        <rect x="76" y="8" width="16" height="16" fill="white" rx="1" />
                        <rect x="79" y="11" width="10" height="10" fill="#09090b" rx="1" />

                        <rect x="5" y="73" width="22" height="22" fill="#09090b" rx="2" />
                        <rect x="8" y="76" width="16" height="16" fill="white" rx="1" />
                        <rect x="11" y="79" width="10" height="10" fill="#09090b" rx="1" />

                        <path
                          d="M32 6h4v4h-4zM40 6h4v4h-4zM48 6h4v4h-4zM60 6h4v4h-4zM32 14h4v4h-4zM44 14h4v4h-4zM56 14h4v4h-4zM64 14h4v4h-4zM36 22h4v4h-4zM48 22h4v4h-4zM60 22h4v4h-4zM6 32h4v4h-4zM14 32h4v4h-4zM22 32h4v4h-4zM32 32h4v4h-4zM40 32h4v4h-4zM52 32h4v4h-4zM64 32h4v4h-4zM72 32h4v4h-4zM84 32h4v4h-4zM6 40h4v4h-4zM18 40h4v4h-4zM36 40h4v4h-4zM48 40h4v4h-4zM60 40h4v4h-4zM76 40h4v4h-4zM88 40h4v4h-4zM10 48h4v4h-4zM26 48h4v4h-4zM32 48h4v4h-4zM56 48h4v4h-4zM68 48h4v4h-4zM80 48h4v4h-4zM6 56h4v4h-4zM14 56h4v4h-4zM40 56h4v4h-4zM48 56h4v4h-4zM64 56h4v4h-4zM72 56h4v4h-4zM88 56h4v4h-4zM32 64h4v4h-4zM44 64h4v4h-4zM52 64h4v4h-4zM60 64h4v4h-4zM80 64h4v4h-4zM32 72h4v4h-4zM40 72h4v4h-4zM48 72h4v4h-4zM68 72h4v4h-4zM76 72h4v4h-4zM84 72h4v4h-4zM36 80h4v4h-4zM44 80h4v4h-4zM60 80h4v4h-4zM72 80h4v4h-4zM88 80h4v4h-4zM32 88h4v4h-4zM48 88h4v4h-4zM56 88h4v4h-4zM64 88h4v4h-4zM80 88h4v4h-4z"
                          fill="#09090b"
                        />
                        <rect x="40" y="40" width="20" height="20" fill="white" rx="2" stroke="#dc2626" strokeWidth="1" />
                        <text x="50" y="53" fontSize="7" fontWeight="bold" fill="#dc2626" textAnchor="middle">
                          QRIS
                        </text>
                      </svg>
                    </div>

                    <div className="mt-2 flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span>Menunggu Scan & Pembayaran...</span>
                    </div>
                  </>
                )}
              </div>

              {/* Panduan Singkat E-Wallet */}
              <div className="text-[9px] text-zinc-500 text-center space-y-0.5">
                <p className="font-semibold text-zinc-600">Scan via E-Wallet & m-Banking:</p>
                <div className="flex flex-wrap items-center justify-center gap-1 font-bold text-zinc-600 text-[8px]">
                  <span className="bg-zinc-100 px-1 py-0.5 rounded">BCA</span>
                  <span className="bg-zinc-100 px-1 py-0.5 rounded">Mandiri</span>
                  <span className="bg-zinc-100 px-1 py-0.5 rounded">BRI</span>
                  <span className="bg-zinc-100 px-1 py-0.5 rounded">GoPay</span>
                  <span className="bg-zinc-100 px-1 py-0.5 rounded">OVO</span>
                  <span className="bg-zinc-100 px-1 py-0.5 rounded">DANA</span>
                  <span className="bg-zinc-100 px-1 py-0.5 rounded">ShopeePay</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-1.5 pt-1 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={async () => {
                    setQrisSimulating(true)
                    await executeSaveOrder()
                  }}
                  disabled={qrisSimulating || loading || qrisSuccess}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-[11px] font-extrabold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {qrisSimulating || loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Memverifikasi QRIS...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      <span>Konfirmasi QRIS Berhasil</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowQrisModal(false)
                    setQrisSimulating(false)
                  }}
                  disabled={qrisSimulating || loading}
                  className="w-full py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-bold rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  Batalkan / Ubah Metode
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  )
}
