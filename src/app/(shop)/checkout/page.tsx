'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

import { useCartStore } from '@/lib/store/useCartStore'
import { formatPrice } from '@/lib/utils'
import { calculateShippingFee } from '@/lib/shipping'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Loader2, ArrowLeft, Store, Truck, CreditCard, Upload, CheckCircle2, QrCode, Banknote, MapPin, AlertCircle, ExternalLink, Map, X, Share2, LocateFixed, Sparkles, BookmarkCheck, Ticket, ShoppingBag } from 'lucide-react'
import type { PurchaseType, PaymentMethod } from '@/types/database.types'
import type { DbVoucher } from '@/lib/db'
import { compressImageIfNeeded } from '@/lib/imageCompressor'

const BENGKALIS_DATA: Record<string, string[]> = {
  'Kecamatan Bengkalis': [
    'Kelurahan Bengkalis Kota',
    'Kelurahan Damon',
    'Kelurahan Rimba Sekampung',
    'Desa Air Putih',
    'Desa Kelapapati',
    'Desa Pedekik',
    'Desa Wonosari',
    'Desa Senggoro',
    'Desa Sebauk',
    'Desa Teluk Latak',
    'Desa Meskom',
    'Desa Prapat Tunggal',
    'Desa Penampi',
    'Desa Temuran',
    'Desa Pangkalan Batang',
    'Desa Pangkalan Batang Barat',
    'Desa Sungai Alam',
    'Desa Kelemantan',
    'Desa Kelemantan Barat',
    'Desa Palkun',
    'Desa Sekodi',
    'Desa Ketam Putih',
    'Desa Sungai Batang',
  ],
  'Kecamatan Bantan': [
    'Desa Selat Baru',
    'Desa Bantan Tua',
    'Desa Bantan Air',
    'Desa Bantan Tengah',
    'Desa Bantan Timur',
    'Desa Berancah',
    'Desa Resam Lapis',
    'Desa Teluk Lancar',
    'Desa Teluk Papal',
    'Desa Jangkang',
    'Desa Deluk',
    'Desa Kembung Luar',
    'Desa Kembung Tinggi',
    'Desa Muntai',
    'Desa Muntai Barat',
    'Desa Teluk Pambang',
    'Desa Pambang Baru',
    'Desa Pambang Pesisir',
    'Desa Sukamaju',
    'Desa Mentayan',
  ],
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotalPrice, clearCart } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [purchaseType, setPurchaseType] = useState<PurchaseType>('online')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod')
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null)
  const [showProofPreview, setShowProofPreview] = useState(false)
  const [showMapsTutorial, setShowMapsTutorial] = useState(false)

  const [kecamatan, setKecamatan] = useState<string>('Kecamatan Bengkalis')
  const [village, setVillage] = useState<string>('Kelurahan Bengkalis Kota')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [mapsLink, setMapsLink] = useState('')
  const [gettingGps, setGettingGps] = useState(false)
  const [gpsSuccess, setGpsSuccess] = useState<string | null>(null)
  const [saveAsDefault, setSaveAsDefault] = useState(true)
  const [hasSavedDefault, setHasSavedDefault] = useState(false)
  const [isOrderSuccess, setIsOrderSuccess] = useState(false)
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  const [directItem, setDirectItem] = useState<any | null>(null)
  const [isDirectBuy, setIsDirectBuy] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const isDirect = params.get('direct') === 'true'
      const saved = sessionStorage.getItem('toko_direct_buy_item')
      if (isDirect && saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed && parsed.variantId) {
            setDirectItem(parsed)
            setIsDirectBuy(true)
          }
        } catch {}
      }
    }
  }, [])

  const effectiveItems = isDirectBuy && directItem ? [directItem] : items

  const getEffectiveTotalPrice = () => {
    return effectiveItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  useEffect(() => {
    if (!mounted) return

    if (effectiveItems.length === 0 && !loading && !isOrderSuccess) {
      router.push('/cart')
      return
    }

    let locKec = ''
    let locVil = ''
    let locAddr = ''
    let locPhone = ''
    let locMaps = ''

    try {
      const saved = localStorage.getItem('toko_bengkalis_default_address')
      if (saved) {
        const data = JSON.parse(saved)
        if (data.kecamatan) locKec = data.kecamatan
        if (data.village) locVil = data.village
        if (data.address) locAddr = data.address
        if (data.phone) locPhone = data.phone
        if (data.mapsLink) locMaps = data.mapsLink
      }
    } catch {}

    if (locKec) setKecamatan(locKec)
    if (locVil) setVillage(locVil)
    if (locAddr) setAddress(locAddr)
    if (locPhone) setPhone(locPhone)
    if (locMaps) setMapsLink(locMaps)
    if (locAddr || locPhone) setHasSavedDefault(true)

    fetch('/api/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          const u = data.user
          setUserRole(u.role)
          if (u.phone && !locPhone) setPhone(u.phone)
          if (u.address && !locAddr) setAddress(u.address)
          if (u.kecamatan && !locKec) setKecamatan(u.kecamatan)
          if (u.village && !locVil) setVillage(u.village)
          if (u.maps_link && !locMaps) setMapsLink(u.maps_link)
          if (u.phone || u.address) setHasSavedDefault(true)
        }
      })
      .catch(() => {})
  }, [mounted, effectiveItems, loading, isOrderSuccess, router])

  const handleGetGpsLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Perangkat Anda tidak mendukung fitur lokasi GPS.')
      return
    }

    setGettingGps(true)
    setError(null)
    setGpsSuccess(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const generatedLink = `https://maps.google.com/?q=${lat},${lng}`
        setMapsLink(generatedLink)
        setGpsSuccess(`Lokasi Terdeteksi (${lat.toFixed(4)}, ${lng.toFixed(4)})`)

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          if (res.ok) {
            const data = await res.json()
            if (data.display_name && !address) {
              setAddress(data.display_name)
            }
          }
        } catch {}

        setGettingGps(false)
      },
      (err) => {
        setGettingGps(false)
        if (err.code === err.PERMISSION_DENIED) {
          setError('Izin akses lokasi/GPS ditolak. Silakan izinkan akses lokasi pada browser/HP Anda.')
        } else {
          setError('Gagal mengambil posisi GPS. Pastikan fitur lokasi/GPS aktif.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Update village options when kecamatan changes
  const handleKecamatanChange = (newKec: string) => {
    setKecamatan(newKec)
    const availableVillages = BENGKALIS_DATA[newKec] || []
    if (availableVillages.length > 0) {
      setVillage(availableVillages[0])
    }
  }

  const [voucherCodeInput, setVoucherCodeInput] = useState('')
  const [discountAmount, setDiscountAmount] = useState(0)
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null)
  const [voucherCategory, setVoucherCategory] = useState<'discount' | 'shipping'>('discount')
  const [voucherError, setVoucherError] = useState<string | null>(null)
  const [voucherSuccess, setVoucherSuccess] = useState<string | null>(null)
  const [applyingVoucher, setApplyingVoucher] = useState(false)

  const [showVoucherModal, setShowVoucherModal] = useState(false)
  const [availableVouchers, setAvailableVouchers] = useState<DbVoucher[]>([])
  const [loadingVouchers, setLoadingVouchers] = useState(false)
  const [fetchVouchersError, setFetchVouchersError] = useState<string | null>(null)

  const fetchPublicVouchers = async () => {
    setLoadingVouchers(true)
    setFetchVouchersError(null)
    try {
      const res = await fetch('/api/vouchers/public')
      if (!res.ok) throw new Error('Gagal memuat daftar voucher')
      const data = await res.json()
      setAvailableVouchers(Array.isArray(data.vouchers) ? data.vouchers : [])
    } catch (err: any) {
      setAvailableVouchers([])
      setFetchVouchersError(err.message || 'Gagal memuat voucher')
    } finally {
      setLoadingVouchers(false)
    }
  }

  const shippingFee = calculateShippingFee(purchaseType, kecamatan, village)

  const handleApplyVoucher = async (codeToApply?: string) => {
    setVoucherError(null)
    setVoucherSuccess(null)
    const targetCode = (codeToApply || voucherCodeInput).trim()
    if (!targetCode) return

    setApplyingVoucher(true)
    try {
      const res = await fetch('/api/vouchers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: targetCode,
          subtotal: getEffectiveTotalPrice(),
          shipping_cost: shippingFee,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Voucher tidak valid')

      setVoucherCodeInput(data.voucher_code)
      setDiscountAmount(data.discount_amount)
      setAppliedVoucher(data.voucher_code)
      setVoucherCategory(data.voucher_type || 'discount')
      setVoucherSuccess(
        `Voucher ${data.voucher_type === 'shipping' ? 'Ongkir' : 'Diskon'} ${data.voucher_code} dipasang! Hemat ${formatPrice(data.discount_amount)}`
      )
    } catch (err: any) {
      setVoucherError(err.message)
      setDiscountAmount(0)
      setAppliedVoucher(null)
    } finally {
      setApplyingVoucher(false)
    }
  }

  const handleRemoveVoucher = () => {
    setVoucherCodeInput('')
    setDiscountAmount(0)
    setAppliedVoucher(null)
    setVoucherCategory('discount')
    setVoucherSuccess(null)
    setVoucherError(null)
  }

  useEffect(() => {
    if (!mounted) return
    if (appliedVoucher && voucherCategory === 'shipping') {
      if (shippingFee <= 0) {
        setVoucherCodeInput('')
        setDiscountAmount(0)
        setAppliedVoucher(null)
        setVoucherCategory('discount')
        setVoucherSuccess(null)
        setVoucherError('Voucher Ongkir terlepas otomatis karena tidak ada biaya pengiriman (Ambil di Toko).')
      } else {
        handleApplyVoucher(appliedVoucher)
      }
    }
  }, [shippingFee, mounted])

  const grandTotal = Math.max(0, getEffectiveTotalPrice() + shippingFee - discountAmount)

  if (!mounted) {
    return (
      <div className="flex-1 bg-zinc-50 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (effectiveItems.length === 0 && !loading && !isOrderSuccess) {
    return null
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('File bukti pembayaran harus berupa gambar.')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const fileToUpload = await compressImageIfNeeded(file)
      const formData = new FormData()
      formData.append('file', fileToUpload)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal upload bukti bayar.')
      }

      const data = await res.json()
      setPaymentProofUrl(data.url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal upload bukti bayar.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (userRole === 'admin' || userRole === 'staff') {
      setError('Akun Administrator dan Staff Toko tidak diizinkan untuk checkout. Silakan gunakan akun Pelanggan biasa.')
      return
    }

    if (purchaseType === 'online') {
      if (!address.trim() || !kecamatan || !village || !phone.trim()) {
        setError('Harap isi alamat lengkap, kecamatan, desa/kelurahan, dan nomor telepon.')
        return
      }
    } else {
      if (!phone.trim()) {
        setError('Harap isi nomor telepon kontak.')
        return
      }
    }

    const isRequiresPaymentProof = purchaseType !== 'direct' && paymentMethod !== 'cod'
    if (isRequiresPaymentProof && !paymentProofUrl) {
      setError('Harap unggah foto bukti pembayaran terlebih dahulu sebelum menyelesaikan checkout.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const pinMapsPart = mapsLink.trim() ? ` | Link Maps: ${mapsLink.trim()}` : ''
      const shippingAddressStr = purchaseType === 'direct'
        ? `[Pembelian Langsung di Toko] No. Telp: ${phone}`
        : `${address}, Desa/Kel. ${village}, ${kecamatan}, Pulau Bengkalis (Telp: ${phone})${pinMapsPart}`

      const effectivePaymentMethod = purchaseType === 'direct' ? 'cash_store' : paymentMethod

      const activeItems = effectiveItems.filter(item => item.quantity > 0)
      if (activeItems.length === 0) {
        setError('Tidak ada produk aktif (jumlah minimal 1) di keranjang.')
        setLoading(false)
        return
      }

      const payload = {
        items: activeItems.map(item => ({
          variantId: item.variantId,
          productId: item.productId,
          price: item.price,
          quantity: item.quantity,
        })),
        shipping_address: shippingAddressStr,
        shipping_cost: shippingFee,
        purchase_type: purchaseType,
        payment_method: effectivePaymentMethod,
        payment_proof_url: isRequiresPaymentProof ? paymentProofUrl : null,
        voucher_code: appliedVoucher,
        discount_amount: discountAmount,
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal membuat pesanan.')
      }

      const data = await res.json()

      if (saveAsDefault || purchaseType === 'online') {
        try {
          localStorage.setItem('toko_bengkalis_default_address', JSON.stringify({
            kecamatan,
            village,
            address,
            phone,
            mapsLink,
          }))

          // Update profil DB di background agar Profil & Checkout selalu tersinkron
          fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone,
              address: purchaseType === 'online' ? address : undefined,
              kecamatan,
              village,
              maps_link: mapsLink,
            }),
          }).catch(() => {})
        } catch {}
      }

      setCreatedOrderId(data.id)
      setIsOrderSuccess(true)
      if (isDirectBuy) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('toko_direct_buy_item')
        }
      } else {
        clearCart()
      }
      setLoading(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses pesanan.')
      setLoading(false)
    }
  }

  const isTransferMethod = purchaseType === 'online' && ['bank_transfer', 'dana', 'ovo', 'qris'].includes(paymentMethod)

  return (
    <div className="w-full max-w-full bg-zinc-50 py-3 sm:py-8 px-2.5 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="max-w-4xl mx-auto w-full min-w-0">
        <Link
          href={isDirectBuy ? "/" : "/cart"}
          onClick={() => {
            if (isDirectBuy && typeof window !== 'undefined') {
              sessionStorage.removeItem('toko_direct_buy_item')
            }
          }}
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 mb-4 sm:mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          {isDirectBuy ? 'Kembali ke Katalog' : 'Kembali ke Keranjang'}
        </Link>

        <form onSubmit={handleSubmit} className="w-full min-w-0 max-w-3xl mx-auto space-y-4 sm:space-y-6">
          {/* Step 1: Metode Pembelian */}
              <div className="bg-white border border-zinc-200 rounded-xl p-3.5 sm:p-6 max-w-full overflow-hidden">
                <h2 className="text-base font-bold tracking-tight text-zinc-900 mb-3.5 flex items-center gap-2">
                  <Store className="h-5 w-5 text-zinc-700 shrink-0" />
                  <span>Pilih Metode Pembelian</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <label
                    onClick={() => {
                      setPurchaseType('direct')
                      setPaymentMethod('cash_store')
                    }}
                    className={`flex items-start p-3 sm:p-4 rounded-xl border cursor-pointer transition-all ${
                      purchaseType === 'direct'
                        ? 'border-zinc-900 bg-zinc-900/5 ring-1 ring-zinc-900'
                        : 'border-zinc-200 hover:border-zinc-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="purchaseType"
                      checked={purchaseType === 'direct'}
                      onChange={() => {}}
                      className="mt-1 h-4 w-4 text-zinc-900 focus:ring-zinc-900 shrink-0"
                    />
                    <div className="ml-2.5 sm:ml-3 flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
                        <Store className="h-4 w-4 shrink-0" />
                        <span>Langsung di Toko</span>
                      </span>
                      <span className="mt-1 block text-xs text-zinc-500 leading-normal">
                        Bayar di tempat & ambil barang di toko fisik (Pulau Bengkalis)
                      </span>
                    </div>
                  </label>

                  <label
                    onClick={() => {
                      setPurchaseType('online')
                      if (paymentMethod === 'cash_store') setPaymentMethod('cod')
                    }}
                    className={`flex items-start p-3 sm:p-4 rounded-xl border cursor-pointer transition-all ${
                      purchaseType === 'online'
                        ? 'border-zinc-900 bg-zinc-900/5 ring-1 ring-zinc-900'
                        : 'border-zinc-200 hover:border-zinc-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="purchaseType"
                      checked={purchaseType === 'online'}
                      onChange={() => {}}
                      className="mt-1 h-4 w-4 text-zinc-900 focus:ring-zinc-900 shrink-0"
                    />
                    <div className="ml-2.5 sm:ml-3 flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
                        <Truck className="h-4 w-4 shrink-0" />
                        <span>Online (Pengiriman Kurir)</span>
                      </span>
                      <span className="mt-1 block text-xs text-zinc-500 leading-normal">
                        Khusus Pengiriman Wilayah Pulau Bengkalis
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Step 2: Alamat Pengiriman Kurir / Kontak Ambil di Toko */}
              <div className="bg-white border border-zinc-200 rounded-xl p-3.5 sm:p-6 space-y-4 max-w-full overflow-hidden">
                <h2 className="text-base font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-zinc-700" />
                  {purchaseType === 'direct' ? 'Informasi Kontak & Peta Toko' : 'Alamat Pengiriman Kurir (Pulau Bengkalis)'}
                </h2>

                {purchaseType === 'direct' ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-2">
                      <p className="font-bold flex items-center gap-1.5 text-sm text-emerald-900">
                        <Store className="h-4 w-4 text-emerald-700 shrink-0" /> Datang Langsung ke Toko Fisik (Tanpa Reservasi Online)
                      </p>
                      <p className="leading-relaxed text-emerald-800">
                        Untuk Pembelian Langsung di Toko, Anda <strong>tidak perlu membuat pesanan / reservasi online</strong>. Silakan langsung berkunjung ke toko kami untuk melihat, mencoba, dan membayar barang secara langsung di meja kasir!
                      </p>
                      <div className="pt-2 text-[11px] space-y-1 text-emerald-900 border-t border-emerald-200/80">
                        <p>📍 <strong>Alamat Toko:</strong> Aegis Collection Bengkalis, Jl. Ahmad Yani No. 88, Kel. Bengkalis Kota, Kec. Bengkalis, Pulau Bengkalis (Buka 08.00 - 22.00 WIB)</p>
                      </div>
                    </div>

                    {/* Embedded Google Maps Frame for Store Location */}
                    <div className="rounded-xl overflow-hidden border border-zinc-300 shadow-sm">
                      <iframe
                        title="Google Maps Lokasi Toko Bengkalis"
                        src="https://maps.google.com/maps?q=Bengkalis+Kota,+Kabupaten+Bengkalis,+Riau&t=&z=15&ie=UTF8&iwloc=&output=embed"
                        width="100%"
                        height="200"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Saved Default Address Notice */}
                    {hasSavedDefault && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
                        <span className="font-semibold flex items-center gap-1.5 min-w-0">
                          <BookmarkCheck className="h-4 w-4 text-blue-600 shrink-0" />
                          <span className="truncate">Alamat Default Anda Berhasil Dimuat Otomatis!</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAddress('')
                            setPhone('')
                            setMapsLink('')
                            setHasSavedDefault(false)
                          }}
                          className="text-[11px] text-blue-700 underline font-semibold hover:text-blue-950 shrink-0 cursor-pointer text-left sm:text-right"
                        >
                          Atur Ulang Alamat
                        </button>
                      </div>
                    )}

                    {/* Notice Wilayah Layanan */}
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold block text-amber-950">Khusus Wilayah Pulau Bengkalis</strong>
                        <p className="mt-0.5 text-amber-800">
                          Pengiriman kurir hanya melayani wilayah di <strong>Pulau Bengkalis</strong> (Kecamatan Bengkalis & Kecamatan Bantan). Wilayah luar pulau (seperti Pulau Rupat, Mandau, Pinggir) tidak terjangkau kurir toko.
                        </p>
                      </div>
                    </div>

                    {/* Dropdown Kecamatan & Desa */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-900 mb-1.5">
                          Kecamatan (Pulau Bengkalis) <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={kecamatan}
                          onChange={(e) => handleKecamatanChange(e.target.value)}
                          className="w-full h-10 px-3 py-2 text-xs bg-white text-zinc-900 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 font-semibold cursor-pointer"
                        >
                          {Object.keys(BENGKALIS_DATA).map((kec) => (
                            <option key={kec} value={kec} className="bg-white text-zinc-900 font-semibold py-1">
                              {kec}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-900 mb-1.5">
                          Desa / Kelurahan <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={village}
                          onChange={(e) => setVillage(e.target.value)}
                          className="w-full h-10 px-3 py-2 text-xs bg-white text-zinc-900 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 font-semibold cursor-pointer"
                        >
                          {(BENGKALIS_DATA[kecamatan] || []).map((v) => (
                            <option key={v} value={v} className="bg-white text-zinc-900 font-semibold py-1">
                              {v}
                            </option>
                          ))}
                        </select>
                        <div className="text-[11px] font-semibold mt-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-zinc-700 bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-lg">
                          <span className="truncate">🚚 Biaya Ongkir ({village}):</span>
                          <span className={`shrink-0 ${shippingFee === 0 ? 'text-emerald-700 font-bold' : 'text-zinc-900 font-bold'}`}>
                            {shippingFee === 0 ? 'Rp 0 (Gratis Ongkir)' : formatPrice(shippingFee)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Input
                      label="Alamat Detail (Jalan, Nomor Rumah, RT/RW, Dusun)"
                      placeholder="Contoh: Jl. Antara Gang Mulia No. 12, RT 02/RW 03"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />

                    <Input
                      label="Nomor Telepon (WhatsApp)"
                      placeholder="0812-3456-7890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />

                    {/* Google Maps Preview for Selected Village/Kecamatan */}
                    <div className="space-y-2 pt-2 border-t border-zinc-100">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <label className="block text-xs font-bold text-zinc-900 flex items-center gap-1.5 min-w-0">
                          <Map className="h-4 w-4 text-blue-600 shrink-0" />
                          <span className="truncate">Peta Wilayah Pengiriman ({village})</span>
                        </label>
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(village + ', ' + kecamatan + ', Pulau Bengkalis, Riau')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-blue-600 hover:underline font-semibold flex items-center gap-1 shrink-0 self-start sm:self-auto"
                        >
                          Buka Google Maps <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>

                      <div className="rounded-xl overflow-hidden border border-zinc-300 shadow-sm bg-zinc-100">
                        <iframe
                          title={`Google Maps Peta ${village}`}
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(village + ', ' + kecamatan + ', Pulau Bengkalis, Riau')}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                          width="100%"
                          height="180"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                        />
                      </div>

                      {/* GPS Detection Button */}
                      <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                              <LocateFixed className="h-4 w-4 text-emerald-600 shrink-0" />
                              <span>Ambil Lokasi GPS Otomatis</span>
                            </span>
                            <p className="text-[11px] text-emerald-800 leading-normal mt-0.5">Klik untuk mengisi link lokasi & alamat presisi dari GPS HP Anda.</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleGetGpsLocation}
                            disabled={gettingGps}
                            className="w-full sm:w-auto px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50 cursor-pointer shrink-0"
                          >
                            {gettingGps ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
                            <span>{gettingGps ? 'Mendeteksi...' : '📍 Gunakan Lokasi GPS Saya'}</span>
                          </button>
                        </div>
                        {gpsSuccess && (
                          <div className="p-2 bg-emerald-100/80 border border-emerald-300 rounded-lg text-[11px] font-semibold text-emerald-900 flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                            <span>✓ {gpsSuccess} — Link Google Maps berhasil terisi secara otomatis!</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <label className="block text-xs font-semibold text-zinc-900">
                            Link Pin Point Google Maps Rumah (Opsional)
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowMapsTutorial(true)}
                            className="text-[11px] text-blue-600 hover:underline font-semibold flex items-center gap-1 shrink-0 self-start sm:self-auto"
                          >
                            ❓ Cara Ambil Manual?
                          </button>
                        </div>
                        <Input
                          placeholder="Contoh: https://maps.google.com/?q=..."
                          value={mapsLink}
                          onChange={(e) => setMapsLink(e.target.value)}
                        />
                        <p className="text-[11px] text-zinc-400 mt-1">Link ini terisi otomatis saat Anda menekan tombol "Gunakan Lokasi GPS Saya" di atas.</p>
                      </div>

                      {/* Save Default Address Checkbox */}
                      <label className="flex items-center gap-2 text-xs font-semibold text-zinc-800 cursor-pointer pt-3 border-t border-zinc-100">
                        <input
                          type="checkbox"
                          checked={saveAsDefault}
                          onChange={(e) => setSaveAsDefault(e.target.checked)}
                          className="h-4 w-4 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-900 cursor-pointer"
                        />
                        <span>Simpan alamat ini sebagai <strong>Alamat Default</strong> untuk pembelian berikutnya</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Metode Pembayaran (Jika Online) */}
              {purchaseType === 'online' && (
                <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-6 space-y-4 max-w-full overflow-hidden">
                  <h2 className="text-base font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-zinc-700" />
                    Pilih Metode Pembayaran
                  </h2>

                  <div className="space-y-3">
                    {/* COD */}
                    <label
                      onClick={() => setPaymentMethod('cod')}
                      className={`flex items-start p-3 sm:p-3.5 rounded-xl border cursor-pointer transition-all ${
                        paymentMethod === 'cod'
                          ? 'border-zinc-900 bg-zinc-900/5 ring-1 ring-zinc-900'
                          : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => {}}
                        className="mt-1 h-4 w-4 text-zinc-900 shrink-0"
                      />
                      <div className="ml-2.5 sm:ml-3 flex-1 min-w-0">
                        <span className="text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
                          <Banknote className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>COD (Bayar di Tempat Saat Kurir Datang)</span>
                        </span>
                        <span className="text-xs text-zinc-500 block leading-normal mt-0.5">Bayar tunai langsung ke kurir ketika barang sampai di Pulau Bengkalis</span>
                      </div>
                    </label>

                    {/* QRIS */}
                    <label
                      onClick={() => setPaymentMethod('qris')}
                      className={`flex items-start p-3 sm:p-3.5 rounded-xl border cursor-pointer transition-all ${
                        paymentMethod === 'qris'
                          ? 'border-zinc-900 bg-zinc-900/5 ring-1 ring-zinc-900'
                          : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'qris'}
                        onChange={() => {}}
                        className="mt-1 h-4 w-4 text-zinc-900 shrink-0"
                      />
                      <div className="ml-2.5 sm:ml-3 flex-1 min-w-0">
                        <span className="text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
                          <QrCode className="h-4 w-4 text-blue-600 shrink-0" />
                          <span>QRIS (BCA, Mandiri, BRI, BNI, GoPay, OVO, DANA, ShopeePay)</span>
                        </span>
                        <span className="text-xs text-zinc-500 block leading-normal mt-0.5">Scan kode QRIS instan menggunakan m-Banking atau aplikasi E-Wallet apa saja</span>
                      </div>
                    </label>

                    {/* Bank Transfer */}
                    <label
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`flex items-start p-3 sm:p-3.5 rounded-xl border cursor-pointer transition-all ${
                        paymentMethod === 'bank_transfer'
                          ? 'border-zinc-900 bg-zinc-900/5 ring-1 ring-zinc-900'
                          : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'bank_transfer'}
                        onChange={() => {}}
                        className="mt-1 h-4 w-4 text-zinc-900 shrink-0"
                      />
                      <div className="ml-2.5 sm:ml-3 flex-1 min-w-0">
                        <span className="text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
                          <span>🏦 Transfer Bank (BCA)</span>
                        </span>
                        <span className="text-xs text-zinc-500 block leading-normal mt-0.5">Transfer ke rekening resmi bank kami</span>
                      </div>
                    </label>

                    {/* DANA */}
                    <label
                      onClick={() => setPaymentMethod('dana')}
                      className={`flex items-start p-3 sm:p-3.5 rounded-xl border cursor-pointer transition-all ${
                        paymentMethod === 'dana'
                          ? 'border-zinc-900 bg-zinc-900/5 ring-1 ring-zinc-900'
                          : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'dana'}
                        onChange={() => {}}
                        className="mt-1 h-4 w-4 text-zinc-900 shrink-0"
                      />
                      <div className="ml-2.5 sm:ml-3 flex-1 min-w-0">
                        <span className="text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
                          <span>📱 E-Wallet DANA</span>
                        </span>
                        <span className="text-xs text-zinc-500 block leading-normal mt-0.5">Transfer via dompet digital DANA</span>
                      </div>
                    </label>

                    {/* OVO */}
                    <label
                      onClick={() => setPaymentMethod('ovo')}
                      className={`flex items-start p-3 sm:p-3.5 rounded-xl border cursor-pointer transition-all ${
                        paymentMethod === 'ovo'
                          ? 'border-zinc-900 bg-zinc-900/5 ring-1 ring-zinc-900'
                          : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'ovo'}
                        onChange={() => {}}
                        className="mt-1 h-4 w-4 text-zinc-900 shrink-0"
                      />
                      <div className="ml-2.5 sm:ml-3 flex-1 min-w-0">
                        <span className="text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
                          <span>📱 E-Wallet OVO</span>
                        </span>
                        <span className="text-xs text-zinc-500 block leading-normal mt-0.5">Transfer via dompet digital OVO</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 4: Diskon Kode Voucher (Diatas Informasi Pembayaran & Upload Bukti) */}
              <div className="bg-white border border-zinc-200 rounded-xl p-3.5 sm:p-6 space-y-3 max-w-full overflow-hidden shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    <span>Diskon Kode Voucher</span>
                  </h2>
                  {appliedVoucher && (
                    <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                    >
                      Hapus Voucher
                    </button>
                  )}
                </div>

                {(() => {
                  const isCurrentVoucherApplied = Boolean(
                    appliedVoucher && voucherCodeInput.trim().toUpperCase() === appliedVoucher.toUpperCase()
                  )
                  return (
                    <div className="flex gap-2 min-w-0">
                      <input
                        type="text"
                        value={voucherCodeInput}
                        onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                        placeholder="KODE VOUCHER"
                        className={`flex-1 min-w-0 border rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase focus:outline-none transition-colors ${
                          isCurrentVoucherApplied
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-extrabold'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!isCurrentVoucherApplied) {
                            handleApplyVoucher()
                          }
                        }}
                        disabled={applyingVoucher || !voucherCodeInput.trim() || isCurrentVoucherApplied}
                        className={`font-bold text-xs px-4 py-2 rounded-xl shrink-0 transition-all ${
                          isCurrentVoucherApplied
                            ? 'bg-emerald-600 text-white cursor-default shadow-sm'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-white cursor-pointer disabled:opacity-50'
                        }`}
                      >
                        {applyingVoucher ? 'Cek...' : isCurrentVoucherApplied ? '✓ Terpasang' : 'Pasang'}
                      </button>
                    </div>
                  )
                })()}

                <button
                  type="button"
                  onClick={() => {
                    setShowVoucherModal(true)
                    fetchPublicVouchers()
                  }}
                  className="w-full text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-all cursor-pointer"
                >
                  <Ticket className="h-4 w-4 text-blue-600 shrink-0" />
                  Lihat Voucher Tersedia
                </button>
                {voucherError && <p className="text-xs text-red-600 font-medium">{voucherError}</p>}
                {voucherSuccess && <p className="text-xs text-emerald-700 font-semibold">{voucherSuccess}</p>}
              </div>

              {/* Step 5: Detail Rekening & Upload Bukti Pembayaran (Jika Transfer) */}
              {isTransferMethod && (
                <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-6 space-y-4 max-w-full overflow-hidden">
                  <h2 className="text-base font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-blue-600" />
                    Informasi Pembayaran & Upload Bukti
                  </h2>

                  <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-sm space-y-2">
                    <p className="font-bold text-blue-950 flex items-center gap-2 text-base">
                      {paymentMethod === 'qris' && <><QrCode className="h-5 w-5 text-blue-600" /> QRIS National (All Bank & E-Wallet)</>}
                      {paymentMethod === 'bank_transfer' && '🏦 Bank BCA'}
                      {paymentMethod === 'dana' && '📱 E-Wallet DANA'}
                      {paymentMethod === 'ovo' && '📱 E-Wallet OVO'}
                    </p>

                    {paymentMethod === 'qris' ? (
                      <div className="space-y-3 pt-1">
                        <div className="bg-white p-4 border border-blue-200 rounded-2xl flex flex-col items-center justify-center text-center shadow-xs">
                          <div className="w-48 h-48 bg-zinc-900 text-white p-4 rounded-2xl flex flex-col items-center justify-center relative mb-2 shadow-inner border-2 border-amber-400">
                            <QrCode className="w-28 h-28 text-white" />
                            <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 mt-2 bg-zinc-800 px-2 py-0.5 rounded">
                              QRIS STATIK STANDAR
                            </span>
                          </div>
                          <span className="font-bold text-sm text-zinc-900">AEGIS COLLECTION BENGKALIS</span>
                          <span className="text-[11px] text-zinc-500 font-mono mt-0.5">NMID: ID1024385920192</span>
                        </div>

                        <div className="text-xs text-blue-900 space-y-1.5 bg-blue-100/50 p-3 rounded-xl border border-blue-200">
                          <p>1. Buka aplikasi <strong>m-Banking (BCA, Mandiri, BRI, BNI)</strong> atau <strong>E-Wallet (GoPay, OVO, DANA, ShopeePay)</strong>.</p>
                          <p>2. Scan kode QRIS di atas atau masukkan NMID <strong>ID1024385920192</strong>.</p>
                          <p>3. Masukkan nominal pembayaran pas sebesar: <strong className="text-red-600 text-sm font-bold">{formatPrice(grandTotal)}</strong></p>
                          <p>4. Simpan foto/screenshot bukti transaksi sukses, lalu unggah di bawah ini.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-blue-800 space-y-1">
                        <p>Nomor Rekening / HP DANA: <strong className="text-base font-mono font-bold text-blue-950">
                          {paymentMethod === 'bank_transfer' ? '1234-5678-90' : '0822-8501-1556'}
                        </strong></p>
                        <p>Atas Nama: <strong>Aegis Collection Bengkalis</strong></p>
                        <p>Jumlah Transfer: <strong className="text-red-600 text-sm font-bold">{formatPrice(grandTotal)}</strong></p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-2">
                      Upload Bukti Pembayaran (Foto/Screenshot)
                    </label>
                    {paymentProofUrl ? (
                      <div className="space-y-2">
                        {/* Preview thumbnail area - click to see full */}
                        <div
                          className="relative w-full rounded-xl overflow-hidden border-2 border-emerald-300 cursor-zoom-in group"
                          onClick={() => setShowProofPreview(true)}
                          style={{ maxHeight: '200px' }}
                        >
                          <img
                            src={paymentProofUrl}
                            alt="Bukti Transfer"
                            className="w-full object-contain max-h-[200px] bg-zinc-50"
                          />
                          {/* Overlay hint */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                              Klik untuk Perbesar
                            </span>
                          </div>
                        </div>
                        {/* Status + actions */}
                        <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4" /> Bukti Terunggah
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setShowProofPreview(true)}
                              className="text-[11px] bg-blue-600 text-white font-semibold px-2.5 py-1 rounded-md hover:bg-blue-700 transition-colors"
                            >
                              🔍 Lihat Foto
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaymentProofUrl(null)}
                              className="text-[11px] text-red-600 border border-red-300 font-semibold px-2.5 py-1 rounded-md hover:bg-red-50 transition-colors"
                            >
                              Ganti
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-zinc-300 hover:border-zinc-400 rounded-xl p-6 text-center cursor-pointer relative bg-zinc-50/50">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={uploading}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        {uploading ? (
                          <div className="flex items-center justify-center gap-2 text-xs text-zinc-600">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Mengunggah bukti...</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Upload className="h-6 w-6 text-zinc-400 mx-auto" />
                            <p className="text-xs font-semibold text-zinc-700">Klik di sini untuk upload bukti transfer</p>
                            <p className="text-[11px] text-zinc-400">PNG, JPG, JPEG hingga 5MB</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              {/* Step 6: Ringkasan Pesanan */}
              <div className="bg-white border border-zinc-200 rounded-xl p-3.5 sm:p-6 space-y-4 w-full max-w-full overflow-hidden shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-zinc-700" />
                  <span>Ringkasan Pesanan</span>
                </h2>
                <div className="space-y-3 max-h-64 overflow-y-auto divide-y divide-zinc-100">
                  {effectiveItems.filter(item => item.quantity > 0).map((item) => (
                    <div key={item.variantId} className="flex gap-3 text-sm pt-2 first:pt-0">
                    <div className="w-14 aspect-[16/9] relative bg-zinc-100 rounded-md overflow-hidden shrink-0">
                      <Image
                        src={item.imageUrl}
                        alt={item.productTitle}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-900 truncate">{item.productTitle}</p>
                      <p className="text-xs text-zinc-500">
                        {item.size && `${item.size} / `}{item.color}
                      </p>
                      <p className="text-xs text-zinc-700">{item.quantity} × {formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-200 pt-3 space-y-1.5 text-xs text-zinc-600">
                <div className="flex justify-between text-zinc-500">
                  <span>Harga Asli Produk (Sebelum Diskon 50%)</span>
                  <span className="line-through tabular-nums">{formatPrice(getEffectiveTotalPrice() * 2)}</span>
                </div>
                <div className="flex justify-between text-red-600 font-medium">
                  <span>Diskon Promo Toko (50% OFF)</span>
                  <span className="tabular-nums">-{formatPrice(getEffectiveTotalPrice())}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-100 pt-1 font-semibold text-zinc-900">
                  <span>Subtotal Produk (Setelah Promo)</span>
                  <span className="tabular-nums">{formatPrice(getEffectiveTotalPrice())}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>
                      Voucher {voucherCategory === 'shipping' ? 'Potongan Ongkir' : 'Diskon Produk'} ({appliedVoucher})
                    </span>
                    <span className="tabular-nums">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span>Biaya Ongkir Kurir</span>
                  <span className={`font-semibold ${shippingFee === 0 ? 'text-emerald-700 font-bold' : 'text-zinc-900'}`}>
                    {purchaseType === 'direct' ? 'Rp 0 (Ambil di Toko)' : shippingFee === 0 ? 'Rp 0 (Gratis Ongkir Kota)' : formatPrice(shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Wilayah Layanan</span>
                  <span className="font-semibold text-emerald-700">Pulau Bengkalis</span>
                </div>
                <div className="flex justify-between">
                  <span>Tipe Pembelian</span>
                  <span className="font-medium text-zinc-900">{purchaseType === 'direct' ? 'Langsung di Toko' : 'Online Kurir'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Metode Bayar</span>
                  <span className="font-medium text-zinc-900 uppercase">
                    {purchaseType === 'direct' ? 'Cash di Toko' : paymentMethod.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="border-t border-zinc-200 pt-3 flex justify-between font-bold text-zinc-900 text-base">
                <span>Total Pembayaran</span>
                <span className="tabular-nums text-red-600">{formatPrice(grandTotal)}</span>
              </div>

              {/* Tombol Aksi Pembelian */}
              <div className="pt-3">
                {purchaseType === 'direct' ? (
                  <div className="space-y-2">
                    <a
                      href="https://maps.google.com/?q=Bengkalis+Kota,+Kabupaten+Bengkalis,+Riau"
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all text-center block cursor-pointer"
                    >
                      <MapPin className="h-4 w-4" /> Buka Petunjuk Arah Google Maps Toko
                    </a>
                    <p className="text-[11px] text-zinc-500 text-center font-medium">
                      *Pembelian langsung dilakukan di toko fisik (tanpa checkout online).
                    </p>
                  </div>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading || uploading || userRole === 'admin' || userRole === 'staff'}
                    className={`w-full py-3.5 text-base font-semibold shadow-md ${
                      userRole === 'admin' || userRole === 'staff'
                        ? 'opacity-50 cursor-not-allowed bg-zinc-400 hover:bg-zinc-400'
                        : 'cursor-pointer'
                    }`}
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    ) : userRole === 'admin' || userRole === 'staff' ? (
                      'Checkout Khusus Pelanggan'
                    ) : (
                      'Buat Pesanan Sekarang'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>

      {/* Modal Preview Bukti Pembayaran */}
      {showProofPreview && paymentProofUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowProofPreview(false)}
        >
          <div
            className="relative max-w-lg w-full max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full mb-3">
              <p className="text-white text-sm font-semibold">Bukti Pembayaran</p>
              <button
                type="button"
                onClick={() => setShowProofPreview(false)}
                className="text-white bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="relative w-full rounded-xl overflow-hidden shadow-2xl bg-zinc-900">
              <img
                src={paymentProofUrl}
                alt="Bukti Transfer Penuh"
                className="w-full h-auto max-h-[75vh] object-contain"
              />
            </div>
            <p className="text-zinc-400 text-[11px] mt-3">Ketuk di luar foto untuk menutup</p>
          </div>
        </div>
      )}

      {/* Modal Tutorial Pin Point Google Maps */}
      {showMapsTutorial && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 relative shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-600" />
                Cara Mengambil Link Pin Point Google Maps
              </h3>
              <button
                onClick={() => setShowMapsTutorial(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-700 leading-relaxed">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-medium">
                📱 <strong>Lewat HP (Aplikasi Google Maps):</strong>
                <ol className="list-decimal list-inside mt-1.5 space-y-1 text-[11px] text-blue-950 font-normal">
                  <li>Buka aplikasi <strong>Google Maps</strong> di HP Anda.</li>
                  <li>Cari atau <strong>tekan lama (tahan)</strong> lokasi rumah Anda di peta hingga muncul <strong>Pin Merah 📍</strong>.</li>
                  <li>Usap menu bawah ke atas, lalu klik tombol <strong>Bagikan / Share <Share2 className="h-3 w-3 inline" /></strong>.</li>
                  <li>Pilih <strong>Salin ke Papan Klip / Copy link</strong>.</li>
                  <li>Tempelkan (Paste) link tersebut di kolom ini!</li>
                </ol>
              </div>

              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-800 font-medium">
                💻 <strong>Lewat Laptop / Komputer:</strong>
                <ol className="list-decimal list-inside mt-1.5 space-y-1 text-[11px] text-zinc-600 font-normal">
                  <li>Buka <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">maps.google.com</a>.</li>
                  <li>Klik titik lokasi rumah Anda di peta.</li>
                  <li>Klik tombol <strong>Bagikan / Share</strong> di panel sebelah kiri.</li>
                  <li>Klik <strong>Salin Link / Copy Link</strong>.</li>
                </ol>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button onClick={() => setShowMapsTutorial(false)} className="w-full text-xs font-semibold py-2.5">
                Saya Mengerti
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pilih Voucher Diskon / Ongkir */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 relative shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 shrink-0">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Ticket className="h-5 w-5 text-amber-500" />
                Voucher Diskon Tersedia
              </h3>
              <button
                onClick={() => setShowVoucherModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 pr-1">
              {loadingVouchers ? (
                <div className="py-8 flex flex-col items-center justify-center text-zinc-500 gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
                  <p className="text-xs font-medium">Memuat daftar voucher...</p>
                </div>
              ) : fetchVouchersError ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs text-center font-medium">
                  {fetchVouchersError}
                </div>
              ) : availableVouchers.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs space-y-1">
                  <Ticket className="h-8 w-8 text-zinc-300 mx-auto" />
                  <p className="font-semibold text-zinc-700">Belum ada voucher tersedia saat ini.</p>
                  <p className="text-zinc-400 text-[11px]">Pantau terus promosi terbaru dari toko kami!</p>
                </div>
              ) : (
                availableVouchers.map((v) => {
                  const isShipping = v.voucher_type === 'shipping'
                  const meetsMinPurchase = getEffectiveTotalPrice() >= (v.min_purchase || 0)
                  const meetsShippingRequirement = !isShipping || (
                    shippingFee > 0 && (v.discount_type !== 'fixed' || shippingFee >= v.discount_value)
                  )
                  const canUse = meetsMinPurchase && meetsShippingRequirement
                  const isApplied = appliedVoucher === v.code

                  return (
                    <div
                      key={v.id}
                      className={`p-4 rounded-xl border transition-all space-y-2 relative ${
                        isApplied
                          ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                          : canUse
                          ? 'border-zinc-200 hover:border-amber-400 bg-gradient-to-r from-amber-50/30 to-white'
                          : 'border-zinc-200 bg-zinc-50 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${
                            isShipping ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-900'
                          }`}>
                            {isShipping ? '🚚 Potongan Ongkir' : '🏷️ Diskon Produk'}
                          </span>
                          <h4 className="text-sm font-mono font-bold text-zinc-900">{v.code}</h4>
                        </div>
                        <button
                          type="button"
                          disabled={!canUse || applyingVoucher}
                          onClick={() => {
                            setShowVoucherModal(false)
                            handleApplyVoucher(v.code)
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isApplied
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
                              : canUse
                              ? 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm cursor-pointer'
                              : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                          }`}
                        >
                          {isApplied ? 'Terpasang' : 'Gunakan'}
                        </button>
                      </div>

                      <div className="text-xs text-zinc-700 font-medium space-y-0.5">
                        <p className="text-sm font-bold text-emerald-700">
                          {v.discount_type === 'percentage'
                            ? `Diskon ${v.discount_value}%${v.max_discount ? ` (Maks ${formatPrice(v.max_discount)})` : ''}`
                            : `Potongan ${formatPrice(v.discount_value)}`}
                        </p>
                        {v.min_purchase > 0 && (
                          <p className="text-[11px] text-zinc-500">
                            Min. Belanja: <strong className="text-zinc-800">{formatPrice(v.min_purchase)}</strong>
                          </p>
                        )}
                        {!meetsMinPurchase && (
                          <p className="text-[10px] text-red-600 font-semibold pt-1">
                            ⚠️ Belum memenuhi minimal pembelian (Kurang {formatPrice(v.min_purchase - getEffectiveTotalPrice())})
                          </p>
                        )}
                        {meetsMinPurchase && isShipping && shippingFee <= 0 && (
                          <p className="text-[10px] text-amber-700 font-semibold pt-1">
                            ⚠️ Voucher Ongkir tidak berlaku untuk Ambil di Toko / Gratis Ongkir
                          </p>
                        )}
                        {meetsMinPurchase && isShipping && v.discount_type === 'fixed' && shippingFee > 0 && shippingFee < v.discount_value && (
                          <p className="text-[10px] text-amber-700 font-semibold pt-1">
                            ⚠️ Biaya ongkir Anda ({formatPrice(shippingFee)}) kurang dari minimal ongkir ({formatPrice(v.discount_value)})
                          </p>
                        )}
                      </div>

                      {v.expires_at && (
                        <div className="pt-2 border-t border-zinc-100/80 text-[10px] text-zinc-400 flex items-center justify-between">
                          <span>Berlaku hingga: {new Date(v.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            <div className="pt-2 border-t border-zinc-100 flex justify-end shrink-0">
              <Button onClick={() => setShowVoucherModal(false)} variant="secondary" className="w-full text-xs font-semibold py-2">
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pop-up Sukses Pesanan */}
      {isOrderSuccess && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-zinc-900 tracking-tight">Pesanan Berhasil Dibuat! 🎉</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Terima kasih! Pesanan Anda {createdOrderId ? <strong>#{createdOrderId}</strong> : ''} sedang diproses oleh tim toko kami.
              </p>
            </div>
            {createdOrderId && (
              <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs space-y-1.5 text-left">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Nomor Pesanan:</span>
                  <span className="font-mono font-bold text-zinc-900">#{createdOrderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status Pembelian:</span>
                  <span className="font-semibold text-emerald-700">Menunggu Proses Toko</span>
                </div>
              </div>
            )}
            <div className="space-y-2 pt-2">
              <Button
                type="button"
                onClick={() => router.push(createdOrderId ? `/orders/${createdOrderId}` : '/orders')}
                className="w-full py-3 bg-zinc-900 text-white font-bold text-sm rounded-xl hover:bg-zinc-800 transition-all shadow-md cursor-pointer"
              >
                Lihat Detail Pesanan Saya
              </Button>
              <button
                type="button"
                onClick={() => router.push('/')}
                className="w-full py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}