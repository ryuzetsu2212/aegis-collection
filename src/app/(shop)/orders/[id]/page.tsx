'use client'

import { use, useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice, getCustomerDisplayName, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Loader2, ArrowLeft, Printer, CheckCircle2, Clock, Truck, Store, Upload, ShieldCheck, QrCode, Download, Image as ImageIcon, RotateCcw } from 'lucide-react'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { compressImageIfNeeded } from '@/lib/imageCompressor'
import type { OrderStatus, PurchaseType, PaymentMethod } from '@/types/database.types'

interface OrderItem {
  id: number
  quantity: number
  price_at_purchase: number
  size: string | null
  color: string
  product_title: string
  product_slug: string
  image_url: string
}

interface Order {
  id: number
  user_email: string
  user_full_name: string | null
  total_amount: number
  status: OrderStatus
  purchase_type: PurchaseType
  payment_method: PaymentMethod
  payment_proof_url: string | null
  payment_status: string
  tracking_number: string | null
  courier_phone?: string | null
  voucher_code?: string | null
  discount_amount?: number
  shipping_cost?: number
  shipping_address: string
  created_at: string
  order_items: OrderItem[]
  return_id?: number | null
  return_status?: string | null
  return_reason?: string | null
  return_details?: string | null
  return_photo_url?: string | null
  return_created_at?: string | null
  return_admin_notes?: string | null
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Menunggu Pembayaran', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  pending_confirmation: { label: 'Menunggu Konfirmasi Staff', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  paid: { label: 'Dikonfirmasi Staff (Siap Dikirim)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  shipped: { label: 'Dalam Pengiriman Kurir', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  delivered: { label: 'Sampai di Tujuan (Menunggu Konfirmasi)', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  completed: { label: 'Pesanan Selesai', color: 'bg-zinc-100 text-zinc-800 border-zinc-200' },
  cancelled: { label: 'Dibatalkan', color: 'bg-rose-100 text-rose-800 border-rose-200' },
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [order, setOrder] = useState<Order | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.role) {
          setCurrentUserRole(data.user.role)
        }
      })
      .catch(() => {})
  }, [])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [proofUrl, setProofUrl] = useState<string | null>(null)
  const [downloadingJpg, setDownloadingJpg] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const handleConfirmCancel = async () => {
    if (!order) return
    setIsCancelling(true)
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal membatalkan pesanan.')
      }
      await fetchOrder()
    } catch (err: any) {
      setError(err?.message || 'Gagal membatalkan pesanan.')
    } finally {
      setIsCancelling(false)
      setShowCancelModal(false)
    }
  }

  const handleConfirmComplete = async () => {
    if (!order) return
    setIsCompleting(true)
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })
      if (!res.ok) throw new Error('Gagal memperbarui pesanan.')
      await fetchOrder()
    } catch (err: any) {
      setError(err?.message || 'Gagal mengonfirmasi pesanan diterima.')
    } finally {
      setIsCompleting(false)
      setShowConfirmModal(false)
    }
  }
  const receiptRef = useRef<HTMLDivElement>(null)

  const handleDownloadJpg = async () => {
    if (!receiptRef.current) return
    setDownloadingJpg(true)
    try {
      const { toJpeg } = await import('html-to-image')
      const dataUrl = await toJpeg(receiptRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        cacheBust: true,
      })
      const link = document.createElement('a')
      link.download = `Struk-INV-${order?.id ? order.id.toString().padStart(6, '0') : 'pembayaran'}.jpg`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Gagal mengunduh gambar struk:', err)
      setError('Gagal membuat gambar struk JPG. Silakan coba lagi.')
    } finally {
      setDownloadingJpg(false)
    }
  }

  useEffect(() => {
    fetchOrder()
  }, [id])

  async function fetchOrder() {
    try {
      setLoading(true)
      const res = await fetch(`/api/orders/${id}`)
      if (!res.ok) throw new Error('Gagal memuat detail pesanan.')
      const data = await res.json()
      setOrder(data)
      if (data.payment_proof_url) {
        setProofUrl(data.payment_proof_url)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat pesanan.')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Bukti pembayaran harus berupa gambar.')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const fileToUpload = await compressImageIfNeeded(file)

      if (fileToUpload.size > 5 * 1024 * 1024) {
        setError('Ukuran gambar terlalu besar dan gagal dikompres di bawah 5MB. Silakan pilih foto lain.')
        setUploading(false)
        return
      }

      const formData = new FormData()
      formData.append('file', fileToUpload)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) throw new Error('Gagal mengunggah foto.')
      const uploadData = await uploadRes.json()

      const updateRes = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_proof_url: uploadData.url }),
      })

      if (!updateRes.ok) throw new Error('Gagal memperbarui pesanan.')

      await fetchOrder()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah bukti bayar.')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 bg-zinc-50 flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex-1 bg-zinc-50 py-16 px-4 text-center">
        <p className="text-sm text-red-600 mb-4">{error || 'Pesanan tidak ditemukan.'}</p>
        <Link href="/orders">
          <Button variant="secondary">Kembali ke Pesanan Saya</Button>
        </Link>
      </div>
    )
  }

  const isConfirmed = ['paid', 'shipped', 'completed'].includes(order.status)
  const isTransfer = ['bank_transfer', 'dana', 'ovo', 'qris'].includes(order.payment_method || '')

  return (
    <div className="flex-1 bg-zinc-50 py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto space-y-6 print:space-y-0 print:max-w-none">
        
        {/* Navigation - hidden on print */}
        <div className="flex items-center justify-between print:hidden">
          {currentUserRole === 'staff' || currentUserRole === 'admin' ? (
            <Link
              href="/staff/orders"
              className="inline-flex items-center gap-2 text-sm text-zinc-700 hover:text-zinc-900 font-semibold"
            >
              <ArrowLeft className="h-4 w-4 text-zinc-600" />
              Kembali ke Kelola Pesanan Staff
            </Link>
          ) : currentUserRole === 'courier' ? (
            <Link
              href="/courier"
              className="inline-flex items-center gap-2 text-sm text-zinc-700 hover:text-zinc-900 font-semibold"
            >
              <ArrowLeft className="h-4 w-4 text-zinc-600" />
              Kembali ke Dashboard Kurir
            </Link>
          ) : (
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Pesanan Saya
            </Link>
          )}

          {isConfirmed && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDownloadJpg}
                disabled={downloadingJpg}
                variant="secondary"
                className="flex items-center gap-2 text-xs py-2 border border-zinc-300 hover:bg-zinc-100"
              >
                {downloadingJpg ? (
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />
                ) : (
                  <Download className="h-4 w-4 text-zinc-700" />
                )}
                Unduh Struk (JPG)
              </Button>
              <Button onClick={() => window.print()} className="flex items-center gap-2 text-xs py-2">
                <Printer className="h-4 w-4" />
                Cetak Struk
              </Button>
            </div>
          )}
        </div>

        {/* Info Card - hidden on print */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-6 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900">Detail Pesanan #{order.id}</h1>
              <p className="text-xs text-zinc-500 mt-1">Dibuat pada: {formatDateTime(order.created_at)}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_LABELS[order.status]?.color}`}>
              {STATUS_LABELS[order.status]?.label || order.status}
            </span>
          </div>

          {/* Alert Status Info */}
          {order.status === 'pending' && isTransfer && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold flex items-center gap-1.5 text-amber-950">
                  <Clock className="h-4 w-4 text-amber-600" /> Silakan Upload Bukti Pembayaran
                </p>
                <Button
                  onClick={() => setShowCancelModal(true)}
                  disabled={isCancelling}
                  variant="secondary"
                  className="font-bold text-xs py-1 px-2.5 text-red-600 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-700"
                >
                  Batalkan Pesanan
                </Button>
              </div>
              <p>Segera lakukan transfer sebesar <strong>{formatPrice(order.total_amount)}</strong> lalu unggah bukti transfer di bawah agar staff dapat mengkonfirmasi pesanan Anda.</p>
            </div>
          )}

          {order.status === 'pending_confirmation' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold flex items-center gap-1.5 text-blue-950">
                  <Clock className="h-4 w-4 text-blue-600" /> Menunggu Konfirmasi Staff
                </p>
                <Button
                  onClick={() => setShowCancelModal(true)}
                  disabled={isCancelling}
                  variant="secondary"
                  className="font-bold text-xs py-1 px-2.5 text-red-600 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-700"
                >
                  Batalkan Pesanan
                </Button>
              </div>
              <p>Bukti pembayaran/pesanan Anda telah diterima. Staff toko sedang memverifikasi pembayaran Anda.</p>
            </div>
          )}

          {order.status === 'paid' && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5 text-emerald-950">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Pembayaran Telah Dikonfirmasi!
              </p>
              <p>Struk Pembayaran digital telah diterbitkan. Barang Anda sedang disiapkan dan akan segera dikirimkan oleh kurir.</p>
            </div>
          )}

          {order.status === 'shipped' && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 space-y-3">
              <div>
                <p className="font-semibold flex items-center gap-1.5 text-purple-950">
                  <Truck className="h-4 w-4 text-purple-600" /> Barang Sedang Dalam Pengiriman Kurir
                </p>
                <p className="mt-1">Nomor Resi Kurir: <strong className="font-mono text-sm">{order.tracking_number || 'Sedang diproses kurir'}</strong></p>
                <p className="mt-1 text-[11px] text-purple-800">ℹ️ Kurir sedang mengantar paket Anda. Tombol konfirmasi selesai akan aktif setelah Kurir menandai paket sampai di lokasi.</p>
              </div>

              {/* Action Buttons */}
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <a
                  href={`https://wa.me/${(order.courier_phone || '081234567890').replace(/\D/g, '')}?text=${encodeURIComponent(`Halo Kurir, saya pembeli pesanan #INV-${order.id.toString().padStart(6, '0')}. Ingin menanyakan status pengiriman paket saya.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
                >
                  💬 Hubungi Kurir ({(order.courier_phone || '0812-3456-7890')})
                </a>
              </div>
            </div>
          )}

          {/* Return Alert Banner (If order has a return) */}
          {Boolean(order.return_id) && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-950 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-200/60 pb-2">
                <p className="font-bold text-sm text-orange-950 flex items-center gap-1.5">
                  <RotateCcw className="h-4 w-4 text-orange-600" />
                  Pengajuan Retur Barang #{order.return_id}
                </p>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    order.return_status === 'item_received'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : order.return_status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : order.return_status === 'rejected'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {order.return_status === 'item_received'
                    ? '📦 Barang Retur Diterima Kurir (Menunggu Verifikasi Staff)'
                    : order.return_status === 'approved'
                    ? '🟢 Retur Disetujui Staff Toko'
                    : order.return_status === 'rejected'
                    ? '🔴 Retur Ditolak Staff Toko'
                    : '🟡 Retur Dikirim (Menunggu Penjemputan Kurir)'}
                </span>
              </div>

              <div className="space-y-1 text-xs text-zinc-700">
                <p><span className="font-semibold text-zinc-900">Alasan Retur:</span> {order.return_reason}</p>
                {order.return_details && (
                  <p><span className="font-semibold text-zinc-900">Rincian Tambahan:</span> "{order.return_details}"</p>
                )}
                {order.return_admin_notes && (
                  <p className="text-red-700 italic"><span className="font-semibold not-italic">Catatan Verifikasi Staff:</span> "{order.return_admin_notes}"</p>
                )}
              </div>
            </div>
          )}

          {order.status === 'delivered' && (!order.return_id || order.return_status === 'rejected') && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-3">
              <div>
                <p className="font-semibold flex items-center gap-1.5 text-emerald-950">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Pesanan Telah Sampai / Diantar oleh Kurir!
                </p>
                <p className="mt-1">Nomor Resi: <strong className="font-mono text-sm">{order.tracking_number || '-'}</strong>. Silakan periksa barang Anda dan klik tombol di bawah untuk menyelesaikan pesanan.</p>
              </div>

              <div className="pt-1 flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => setShowConfirmModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 flex items-center gap-1.5 shadow-md"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Pesanan Diterima (Selesaikan Pesanan)
                </Button>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid sm:grid-cols-2 gap-4 text-xs bg-zinc-50 p-4 rounded-xl border border-zinc-200">
            <div>
              <p className="text-zinc-500 font-medium">Metode Pembelian:</p>
              <p className="font-semibold text-zinc-900 flex items-center gap-1 mt-0.5">
                {order.purchase_type === 'direct' ? <><Store className="h-3.5 w-3.5" /> Langsung di Toko</> : <><Truck className="h-3.5 w-3.5" /> Online (Pengiriman Kurir)</>}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium">Metode Pembayaran:</p>
              <p className="font-semibold text-zinc-900 uppercase mt-0.5">
                {(order.payment_method || 'cod').replace('_', ' ')}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-zinc-500 font-medium">Alamat / Informasi Pengiriman:</p>
              <p className="font-medium text-zinc-900 mt-0.5">{order.shipping_address}</p>
            </div>
          </div>

          {/* Proof Upload Section (If Transfer & Pending/Proof missing) */}
          {isTransfer && !isConfirmed && (
            <div className="border border-zinc-200 rounded-xl p-4 space-y-3 bg-white">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1">
                <p className="font-bold text-blue-900">
                  {order.payment_method === 'qris' ? '📲 Pembayaran QRIS National' : order.payment_method === 'bank_transfer' ? '🏦 Transfer Bank BCA' : '📱 Transfer DANA / E-Wallet'}
                </p>
                <p className="text-blue-800">
                  {order.payment_method === 'qris' ? (
                    <span>Scan QRIS Merchant: <strong className="font-mono font-bold text-blue-950 text-xs">AEGIS COLLECTION BENGKALIS (NMID: ID1024385920192)</strong></span>
                  ) : (
                    <span>Nomor Rekening / HP DANA: <strong className="font-mono font-bold text-blue-950 text-sm">{order.payment_method === 'bank_transfer' ? '1234-5678-90' : '0822-8501-1556'}</strong> (a.n. Aegis Collection Bengkalis)</span>
                  )}
                </p>
              </div>

              <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <Upload className="h-4 w-4 text-zinc-700" /> Unggah / Ganti Bukti Pembayaran
              </h3>
              {order.payment_proof_url ? (
                <div className="flex items-center gap-4 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                  <div className="w-16 h-16 relative rounded overflow-hidden shrink-0 border">
                    <Image src={order.payment_proof_url} alt="Bukti Transfer" fill className="object-cover" unoptimized />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Bukti sudah diunggah
                    </p>
                    <label className="inline-block mt-1 text-[11px] text-blue-600 hover:underline cursor-pointer font-medium">
                      <span>Ganti File Gambar</span>
                      <input type="file" accept="image/*" onChange={handleUploadProof} disabled={uploading} className="hidden" />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-zinc-300 hover:border-zinc-400 rounded-xl p-5 text-center relative bg-zinc-50/50">
                  <input type="file" accept="image/*" onChange={handleUploadProof} disabled={uploading} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2 text-xs text-zinc-600">
                      <Loader2 className="h-4 w-4 animate-spin" /> Mengunggah...
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="h-5 w-5 text-zinc-400 mx-auto" />
                      <p className="text-xs font-semibold text-zinc-700">Pilih / Unggah Bukti Transfer Gambar</p>
                      <p className="text-[11px] text-zinc-400">PNG, JPG, WEBP (Maksimal 5MB)</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Printable Struk Pembayaran (Digital Receipt) */}
        <div ref={receiptRef} className={`bg-white border border-zinc-200 rounded-xl p-8 shadow-sm ${!isConfirmed ? 'opacity-90' : ''} print:shadow-none print:border-none print:p-0`}>
          <div className="text-center border-b border-zinc-200 pb-6 mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">AEGIS COLLECTION</h2>
            <p className="text-xs text-zinc-500 mt-1">Jl. Ahmad Yani No. 88, Kota Bengkalis, Riau • Telp: 0812-3456-7890</p>
            <div className="mt-4 inline-block px-4 py-1.5 bg-zinc-100 rounded-full text-xs font-bold uppercase tracking-wider text-zinc-800">
              STRUK PEMBAYARAN DIGITAL
            </div>
          </div>

          <div className="grid grid-cols-2 text-xs space-y-1 mb-6 border-b border-zinc-100 pb-4">
            <div>
              <p className="text-zinc-500">No. Nota / Pesanan:</p>
              <p className="font-mono font-bold text-zinc-900 text-sm">#INV-{order.id.toString().padStart(6, '0')}</p>
            </div>
            <div className="text-right">
              <p className="text-zinc-500">Tanggal Transaksi:</p>
              <p className="font-medium text-zinc-900">{new Date(order.created_at).toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
            </div>
            <div>
              <p className="text-zinc-500 mt-2">Pelanggan:</p>
              <p className="font-semibold text-zinc-900">{getCustomerDisplayName(order)}</p>
            </div>
            <div className="text-right">
              <p className="text-zinc-500 mt-2">Metode Pembayaran:</p>
              <p className="font-bold uppercase text-zinc-900">{(order.payment_method || 'cod').replace('_', ' ')}</p>
            </div>
          </div>

          {/* Table Items */}
          <table className="w-full text-xs mb-6 border-collapse">
            <thead>
              <tr className="border-b border-zinc-900 text-left">
                <th className="py-2 font-bold text-zinc-900">Item Produk</th>
                <th className="py-2 text-center font-bold text-zinc-900">Qty</th>
                <th className="py-2 text-right font-bold text-zinc-900">Harga</th>
                <th className="py-2 text-right font-bold text-zinc-900">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {order.order_items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2.5">
                    <p className="font-medium text-zinc-900">{item.product_title}</p>
                    <p className="text-[11px] text-zinc-500">{item.size ? `Ukuran: ${item.size} | ` : ''}Warna: {item.color}</p>
                  </td>
                  <td className="py-2.5 text-center font-semibold text-zinc-900">{item.quantity}</td>
                  <td className="py-2.5 text-right tabular-nums text-zinc-700">
                    <span className="text-[10px] text-zinc-400 line-through block font-normal">{formatPrice(item.price_at_purchase * 2)}</span>
                    <span>{formatPrice(item.price_at_purchase)}</span>
                  </td>
                  <td className="py-2.5 text-right tabular-nums font-semibold text-zinc-900">
                    <span className="text-[10px] text-zinc-400 line-through block font-normal">{formatPrice(item.price_at_purchase * 2 * item.quantity)}</span>
                    <span>{formatPrice(item.price_at_purchase * item.quantity)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {(() => {
            const itemsSubtotal = order.order_items.reduce((sum, item) => sum + (item.price_at_purchase * item.quantity), 0)
            const originalItemsSubtotal = itemsSubtotal * 2
            const promoDiscount50 = itemsSubtotal
            const shippingCost = order.shipping_cost || 0
            const discountAmount = order.discount_amount || 0

            return (
              <div className="border-t-2 border-zinc-900 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-500 font-medium">
                  <span>Harga Asli Produk (Sebelum Diskon 50%):</span>
                  <span className="tabular-nums line-through">{formatPrice(originalItemsSubtotal)}</span>
                </div>
                <div className="flex justify-between text-red-600 font-medium">
                  <span>Diskon Promo Toko (50% OFF):</span>
                  <span className="tabular-nums">-{formatPrice(promoDiscount50)}</span>
                </div>
                <div className="flex justify-between text-zinc-700 font-semibold border-t border-zinc-100 pt-1">
                  <span>Subtotal Produk (Setelah Promo 50%):</span>
                  <span className="tabular-nums font-semibold text-zinc-900">{formatPrice(itemsSubtotal)}</span>
                </div>
                {order.purchase_type === 'online' && (
                  <div className="flex justify-between text-zinc-600 font-medium">
                    <span>Biaya Pengiriman (Ongkir):</span>
                    <span className="tabular-nums font-semibold text-zinc-900">
                      {shippingCost > 0 ? `+${formatPrice(shippingCost)}` : 'Rp 0 (Gratis Ongkir)'}
                    </span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Voucher Diskon {order.voucher_code ? `(${order.voucher_code})` : ''}:</span>
                    <span className="tabular-nums">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-zinc-900 pt-1.5 border-t border-zinc-200">
                  <span>TOTAL PEMBAYARAN</span>
                  <span className="tabular-nums text-base text-red-600">{formatPrice(order.total_amount)}</span>
                </div>
                <div className="flex justify-between text-zinc-600 pt-1">
                  <span>Status Pembayaran:</span>
                  <span className={`font-bold uppercase ${
                    order.status === 'cancelled' || order.payment_status === 'cancelled'
                      ? 'text-red-600 font-extrabold'
                      : order.return_id && order.return_status !== 'rejected'
                      ? order.return_status === 'approved'
                        ? 'text-red-700 font-extrabold'
                        : 'text-orange-700 font-extrabold'
                      : order.payment_status === 'paid'
                      ? 'text-emerald-700'
                      : order.payment_method === 'cod'
                      ? 'text-amber-800'
                      : 'text-blue-700'
                  }`}>
                    {order.status === 'cancelled' || order.payment_status === 'cancelled'
                      ? 'DIBATALKAN / TIDAK BERLAKU'
                      : order.return_id && order.return_status !== 'rejected'
                      ? order.return_status === 'approved'
                        ? 'DIRETUR / DIREFUND (RETUR DISETUJUI STAFF TOKO)'
                        : order.return_status === 'item_received'
                        ? 'PEMBAYARAN DITAHAN (BARANG DIRETUR & DITERIMA KURIR)'
                        : 'PEMBAYARAN DITAHAN (PENGAJUAN RETUR PEMBELI)'
                      : order.payment_status === 'paid'
                      ? 'LUNAS / DIKONFIRMASI'
                      : order.payment_method === 'cod'
                      ? 'BELUM LUNAS (COD - BAYAR KEPADA KURIR SAAT BARANG SAMPAI)'
                      : order.status === 'pending_confirmation'
                      ? 'MENUNGGU VERIFIKASI PEMBAYARAN'
                      : 'BELUM DIBAYAR'}
                  </span>
                </div>

                {Boolean(order.return_id) && (
                  <div className="mt-3 p-3 bg-red-50/90 border border-red-200 rounded-lg text-xs space-y-1">
                    <div className="font-bold text-red-900 flex items-center justify-between border-b border-red-200 pb-1">
                      <span>CATATAN RETUR BARANG STRUK:</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300">
                        {order.return_status === 'approved'
                          ? 'RETUR DISETUJUI STAFF'
                          : order.return_status === 'item_received'
                          ? 'BARANG DITERIMA KURIR'
                          : order.return_status === 'rejected'
                          ? 'RETUR DITOLAK STAFF'
                          : 'MENUNGGU PENJEMPUTAN KURIR'}
                      </span>
                    </div>
                    <p className="text-zinc-800 pt-0.5"><span className="font-semibold text-zinc-900">Alasan Retur:</span> {order.return_reason}</p>
                    {order.return_details && (
                      <p className="text-zinc-700"><span className="font-semibold text-zinc-900">Rincian Tambahan:</span> "{order.return_details}"</p>
                    )}
                    {order.return_admin_notes && (
                      <p className="text-red-800 italic"><span className="font-semibold not-italic">Catatan Staff:</span> "{order.return_admin_notes}"</p>
                    )}
                    {order.return_status === 'approved' && (
                      <p className="text-red-700 font-bold pt-1 border-t border-red-200/60 mt-1">
                        ⚠️ Keterangan Struk: Pembayaran pesanan ini telah dibatalkan / refund karena barang telah diretur.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })()}

          <div className="mt-8 border-t border-dashed border-zinc-300 pt-6 text-center text-[11px] text-zinc-500 space-y-1">
            <p className="font-medium text-zinc-700">Terima kasih telah berbelanja di Aegis Collection!</p>
            <p>Struk ini merupakan bukti pembayaran sah yang dikeluarkan secara elektronik.</p>
            <p>Simpan struk ini untuk klaim garansi atau penukaran barang.</p>
          </div>
        </div>

      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        title="Konfirmasi Pesanan Diterima"
        description="Apakah Anda yakin telah menerima barang pesanan ini? Status pesanan akan diubah menjadi Selesai."
        confirmText="Ya, Pesanan Diterima"
        cancelText="Batal"
        variant="success"
        isLoading={isCompleting}
        onConfirm={handleConfirmComplete}
        onCancel={() => setShowConfirmModal(false)}
      />

      <ConfirmModal
        isOpen={showCancelModal}
        title="Konfirmasi Batalkan Pesanan"
        description="Apakah Anda yakin ingin membatalkan pesanan ini? Stok produk akan dikembalikan dan pesanan akan dibatalkan."
        confirmText="Ya, Batalkan Pesanan"
        cancelText="Batal Kembali"
        variant="danger"
        isLoading={isCancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelModal(false)}
      />
    </div>
  )
}

