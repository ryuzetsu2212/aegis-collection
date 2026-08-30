'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Truck,
  Phone,
  MessageSquare,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Package,
  Clock,
  Search,
  RefreshCw,
  AlertCircle,
  Check,
  User,
  RotateCcw,
  Save,
  Upload,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { compressImageIfNeeded } from '@/lib/imageCompressor'
import { formatDateTime } from '@/lib/utils'

interface OrderItem {
  id: number
  quantity: number
  price_at_purchase: number
  size: string | null
  color: string
  title: string
  image_url: string
}

interface Order {
  id: number
  user_id: number
  customer_name: string
  customer_email: string
  phone: string | null
  total_amount: number
  status: string
  payment_method: string
  payment_proof_url?: string | null
  payment_status: string
  purchase_type: string
  tracking_number: string | null
  shipping_address: string
  kecamatan?: string | null
  village?: string | null
  maps_link?: string | null
  created_at: string
  items: OrderItem[]
  return_id?: number | null
  return_status?: string | null
  return_reason?: string | null
  return_details?: string | null
  return_photo_url?: string | null
  return_created_at?: string | null
  return_admin_notes?: string | null
}

export default function CourierDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'need_ship' | 'shipped' | 'delivered' | 'returns'>('need_ship')
  const [searchQuery, setSearchQuery] = useState('')
  const [trackingInputs, setTrackingInputs] = useState<Record<number, string>>({})
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [uploadingProofId, setUploadingProofId] = useState<number | null>(null)
  const [updatingReturnId, setUpdatingReturnId] = useState<number | null>(null)

  const handleMarkReturnReceived = async (returnId: number, orderId: number) => {
    setUpdatingReturnId(returnId)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await fetch(`/api/returns/${returnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'item_received',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal mengonfirmasi penerimaan barang retur.')
      }

      setSuccessMsg(`Barang retur untuk Pesanan #${orderId} telah berhasil ditandai 'Sudah Diterima Kurir'!`)
      await fetchOrders()
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memperbarui status retur.')
    } finally {
      setUpdatingReturnId(null)
    }
  }

  const handleUploadCodProof = async (orderId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('File bukti pembayaran COD harus berupa gambar.')
      return
    }

    setUploadingProofId(orderId)
    setError(null)
    setSuccessMsg(null)

    try {
      const fileToUpload = await compressImageIfNeeded(file)

      if (fileToUpload.size > 5 * 1024 * 1024) {
        setError('Ukuran foto bukti COD terlalu besar dan gagal dikompres di bawah 5MB. Silakan pilih foto lain.')
        setUploadingProofId(null)
        return
      }

      const formData = new FormData()
      formData.append('file', fileToUpload)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) throw new Error('Gagal mengunggah foto bukti COD.')
      const uploadData = await uploadRes.json()

      const updateRes = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_proof_url: uploadData.url }),
      })

      if (!updateRes.ok) throw new Error('Gagal menyimpan bukti pembayaran COD.')

      setSuccessMsg(`Bukti pembayaran COD untuk Pesanan #${orderId} berhasil diunggah!`)
      await fetchOrders()
    } catch (err: any) {
      setError(err.message || 'Gagal mengunggah foto bukti COD.')
    } finally {
      setUploadingProofId(null)
    }
  }

  const fetchOrders = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/orders')
      if (!res.ok) {
        throw new Error('Gagal mengambil data pesanan')
      }
      const data = await res.json()
      const rawList = Array.isArray(data) ? data : data.orders || []

      const mapped: Order[] = rawList.map((o: any) => ({
        ...o,
        customer_name: o.user_full_name || o.customer_name || o.user_email || 'Pelanggan',
        customer_email: o.user_email || o.customer_email || '',
        items: (o.order_items || o.items || []).map((it: any) => ({
          ...it,
          title: it.product_title || it.title || 'Produk',
          image_url: it.image_url || '',
        })),
      }))

      setOrders(mapped)

      // Auto switch active tab to 'shipped' if 'need_ship' is empty but shipped exists
      const needShipCount = mapped.filter((o) => ['paid', 'processing', 'pending_confirmation', 'pending'].includes(o.status) && o.status !== 'cancelled').length
      const shippedCount = mapped.filter((o) => o.status === 'shipped').length

      if (needShipCount === 0 && shippedCount > 0) {
        setActiveTab('shipped')
      }

      // Initial tracking numbers state
      const initialTracking: Record<number, string> = {}
      mapped.forEach((o: Order) => {
        if (o.tracking_number) {
          initialTracking[o.id] = o.tracking_number
        }
      })
      setTrackingInputs(initialTracking)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || !data.user || data.user.role !== 'courier') {
          const target = data?.user?.role === 'staff' || data?.user?.role === 'admin' ? '/staff/orders' : '/'
          window.location.href = target
          return
        }
        fetchOrders()
      })
      .catch(() => {
        fetchOrders()
      })
  }, [])

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    setUpdatingId(orderId)
    setError(null)
    setSuccessMsg(null)

    const trackingNum = trackingInputs[orderId] || ''

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          tracking_number: trackingNum,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal memperbarui status pengiriman.')
      }

      setSuccessMsg(`Status Pesanan #${orderId} berhasil diperbarui menjadi '${newStatus}'!`)
      fetchOrders()
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.')
    } finally {
      setUpdatingId(null)
    }
  }

  const formatPhoneNumber = (phone: string | null) => {
    if (!phone) return null
    let clean = phone.replace(/[^0-9]/g, '')
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1)
    }
    return clean
  }

  const filteredOrders = orders.filter((order) => {
    // Filter Tab
    if (activeTab === 'need_ship') {
      if (!['paid', 'processing', 'pending_confirmation', 'pending'].includes(order.status) || order.status === 'cancelled') return false
    } else if (activeTab === 'shipped') {
      if (order.status !== 'shipped') return false
    } else if (activeTab === 'delivered') {
      if (!['delivered', 'completed'].includes(order.status)) return false
    } else if (activeTab === 'returns') {
      if (!order.return_id) return false
    }

    // Filter Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchName = order.customer_name?.toLowerCase().includes(query)
      const matchId = order.id.toString().includes(query)
      const matchAddr = order.shipping_address?.toLowerCase().includes(query)
      const matchResi = order.tracking_number?.toLowerCase().includes(query)
      const matchReturn =
        order.return_reason?.toLowerCase().includes(query) ||
        order.return_status?.toLowerCase().includes(query)
      return matchName || matchId || matchAddr || matchResi || matchReturn
    }

    return true
  })

  const countNeedShip = orders.filter((o) => ['paid', 'processing', 'pending_confirmation', 'pending'].includes(o.status) && o.status !== 'cancelled').length
  const countShipped = orders.filter((o) => o.status === 'shipped').length
  const countDelivered = orders.filter((o) => ['delivered', 'completed'].includes(o.status)).length
  const countReturns = orders.filter((o) => Boolean(o.return_id)).length

  return (
    <div className="min-h-screen bg-zinc-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
                Dashboard Pengiriman Kurir
              </h1>
              <p className="text-sm text-zinc-500">
                Kelola jadwal antar barang, lacak lokasi pelanggan, dan update status resi pengiriman.
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={fetchOrders}
            isLoading={isLoading}
            className="flex items-center gap-2 text-xs font-semibold self-start md:self-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>

        {/* Banners Notification */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap items-center bg-white border border-zinc-200 p-1.5 rounded-xl shadow-xs gap-1">
            <button
              onClick={() => setActiveTab('need_ship')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'need_ship' ? 'bg-amber-500 text-white shadow-xs' : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Perlu Antar ({countNeedShip})</span>
            </button>
            <button
              onClick={() => setActiveTab('shipped')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'shipped' ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              <Truck className="h-3.5 w-3.5" />
              <span>Dalam Pengiriman ({countShipped})</span>
            </button>
            <button
              onClick={() => setActiveTab('delivered')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'delivered' ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Terkirim ({countDelivered})</span>
            </button>
            <button
              onClick={() => setActiveTab('returns')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'returns' ? 'bg-orange-600 text-white shadow-xs' : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retur Barang ({countReturns})</span>
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'all' ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              <span>Semua ({orders.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Cari nama / ID / alamat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>

        {/* List Pesanan Pengiriman */}
        {isLoading ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center text-zinc-500">
            <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm font-medium">Memuat daftar tugas pengiriman...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center space-y-3">
            <Package className="h-10 w-10 text-zinc-300 mx-auto" />
            <h3 className="text-base font-bold text-zinc-800">Tidak ada pengiriman ditemukan</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Belum ada pesanan yang ditugaskan oleh Staff Toko kepada Anda, atau tidak ada pesanan yang sesuai dengan filter pencarian.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              let rawPhone = order.phone || (order as any).user_phone || null
              if (!rawPhone && order.shipping_address) {
                const match = order.shipping_address.match(/(?:Telp:\s*|telp:\s*|hp:\s*|Hp:\s*|Phone:\s*|no\.?\s*hp:\s*)([0-9]+)/i) || order.shipping_address.match(/(?:08\d{8,11}|62\d{9,12})/)
                if (match && match[1]) {
                  rawPhone = match[1]
                } else if (match && match[0]) {
                  rawPhone = match[0]
                }
              }

              const waNumber = formatPhoneNumber(rawPhone)
              const mapsUrl =
                order.maps_link ||
                (order.shipping_address
                  ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.shipping_address)}`
                  : null)

              return (
                <div
                  key={order.id}
                  className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs hover:border-zinc-300 transition-all space-y-4"
                >
                  {/* Top Bar Card */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-zinc-900 bg-zinc-100 px-3 py-1 rounded-lg">
                        #{order.id}
                      </span>
                      <span suppressHydrationWarning className="text-xs text-zinc-400">
                        {formatDateTime(order.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          order.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : order.status === 'shipped'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : order.status === 'delivered'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : order.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                        }`}
                      >
                        {order.status === 'cancelled'
                          ? 'Dibatalkan'
                          : order.status === 'shipped'
                          ? 'Dalam Pengiriman'
                          : order.status === 'delivered'
                          ? 'Sudah Diantar (Menunggu Konfirmasi Pembeli)'
                          : order.status === 'completed'
                          ? 'Pesanan Selesai'
                          : 'Perlu Dikirim'}
                      </span>

                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          order.payment_method === 'cod'
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                        }`}
                      >
                        {order.payment_method === 'cod' ? 'COD (Bayar di Tempat)' : 'Transfer (Lunas)'}
                      </span>
                    </div>
                  </div>

                  {/* Customer Info & Address */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Left: Customer Info */}
                    <div className="md:col-span-6 space-y-2 bg-zinc-50/80 p-4 rounded-xl border border-zinc-100">
                      <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                        <User className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>{order.customer_name || 'Pelanggan'}</span>
                      </div>

                      <div className="flex items-start gap-2 text-xs text-zinc-600">
                        <MapPin className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-zinc-800">{order.shipping_address || 'Tidak ada alamat'}</p>
                          {(order.kecamatan || order.village) && (
                            <p className="text-zinc-500 mt-0.5">
                              Kec. {order.kecamatan || '-'}, Kel. {order.village || '-'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Links: Call / WA / Maps */}
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        {waNumber ? (
                          <>
                            <a
                              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                                `Halo Kak ${order.customer_name || 'Pelanggan'}, saya Kurir dari Toko Pakaian Aegis Collection mengenai pengantaran pesanan #${order.id}.`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>WhatsApp ({rawPhone})</span>
                            </a>

                            <a
                              href={`tel:${rawPhone}`}
                              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              <span>Telepon ({rawPhone})</span>
                            </a>
                          </>
                        ) : (
                          <span className="text-xs text-zinc-400 italic">No. HP tidak tersedia</span>
                        )}

                        {mapsUrl && (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>Buka Maps</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Right: Items Summary & Payment */}
                    <div className="md:col-span-6 space-y-3 flex flex-col justify-between bg-zinc-50/80 p-4 rounded-xl border border-zinc-100">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                          Rincian Barang ({order.items?.length || 0})
                        </h4>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                          {order.items?.map((item) => (
                            <div key={item.id} className="text-xs flex items-center justify-between gap-2">
                              <span className="font-medium text-zinc-800 truncate">
                                {item.quantity}x {item.title} ({item.color} {item.size ? `/ ${item.size}` : ''})
                              </span>
                              <span className="font-semibold text-zinc-700 shrink-0">
                                Rp {(item.price_at_purchase * item.quantity).toLocaleString('id-ID')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-200/60 flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-500">Total Pembayaran:</span>
                        <span className="text-sm font-black text-amber-600">
                          Rp {order.total_amount?.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Return Info Section for Courier */}
                  {Boolean(order.return_id) && (
                    <div className="bg-orange-50/80 border border-orange-200 rounded-xl p-4 space-y-3 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-200/60 pb-2">
                        <div className="flex items-center gap-2">
                          <RotateCcw className="h-4 w-4 text-orange-600 shrink-0" />
                          <span className="text-xs font-bold text-orange-950">
                            Pengajuan Retur Barang Pembeli #{order.return_id}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${
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
                            ? '🔴 Retur Ditolak Staff'
                            : '🟡 Pengajuan Retur Pembeli (Perlu Diambil Kurir)'}
                        </span>
                      </div>

                      <div className="text-xs text-zinc-700 space-y-1">
                        <p><span className="font-semibold text-zinc-900">Alasan Retur:</span> {order.return_reason}</p>
                        {order.return_details && (
                          <p><span className="font-semibold text-zinc-900">Rincian Tambahan:</span> "{order.return_details}"</p>
                        )}
                        {order.return_admin_notes && (
                          <p className="text-orange-900 italic"><span className="font-semibold not-italic">Catatan Staff:</span> "{order.return_admin_notes}"</p>
                        )}
                      </div>

                      {/* Action Button: Mark Return Received */}
                      {order.return_status === 'pending' && (
                        <div className="pt-2 flex justify-end">
                          <Button
                            onClick={() => handleMarkReturnReceived(order.return_id!, order.id)}
                            isLoading={updatingReturnId === order.return_id}
                            className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <Package className="h-4 w-4" />
                            Konfirmasi Barang Retur Diterima
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* COD Proof Upload Section for Courier */}
                  {order.payment_method === 'cod' && order.status !== 'cancelled' && (
                    <div className="bg-purple-50/60 border border-purple-200/80 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                          <Upload className="h-4 w-4 text-purple-700" />
                          Bukti Pembayaran COD (Foto Uang / Serah Terima Barang)
                        </span>
                        {order.payment_proof_url && (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Foto Terunggah
                          </span>
                        )}
                      </div>

                      {order.payment_proof_url ? (
                        <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-purple-200 shadow-xs">
                          <div className="w-14 h-14 relative rounded-lg overflow-hidden border border-zinc-200 shrink-0">
                            <Image src={order.payment_proof_url} alt="Bukti COD" fill className="object-cover" unoptimized />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-zinc-900 truncate">Bukti Pembayaran COD Tersimpan</p>
                            <label className="inline-block mt-1 text-[11px] text-purple-700 hover:underline cursor-pointer font-bold">
                              <span>📷 Ganti Foto Bukti COD</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleUploadCodProof(order.id, e)}
                                disabled={uploadingProofId === order.id}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-purple-300 hover:border-purple-400 bg-white p-3 rounded-xl cursor-pointer text-xs font-bold text-purple-800 transition-colors">
                          {uploadingProofId === order.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                              <span>Mengunggah Foto Bukti COD...</span>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-center py-1">
                              <div className="flex items-center gap-1.5">
                                <Upload className="h-4 w-4 text-purple-600" />
                                <span>Unggah Foto Bukti Pembayaran COD (Uang/Serah Terima)</span>
                              </div>
                              <span className="text-[10px] font-normal text-zinc-500">PNG, JPG, WEBP (Maksimal 5MB)</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleUploadCodProof(order.id, e)}
                                disabled={uploadingProofId === order.id}
                                className="hidden"
                              />
                            </div>
                          )}
                        </label>
                      )}
                    </div>
                  )}

                  {/* Resi & Status Update Bar */}
                  <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                    <div className="flex-1 max-w-md">
                      <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                        Nomor Resi Pengiriman Kurir:
                      </label>
                      <Input
                        placeholder="Contoh: RESI-KURIR-001 / JNE-123"
                        value={trackingInputs[order.id] || ''}
                        onChange={(e) =>
                          setTrackingInputs((prev) => ({
                            ...prev,
                            [order.id]: e.target.value,
                          }))
                        }
                        className="bg-white text-xs font-semibold text-zinc-900 placeholder:text-zinc-400"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center">
                      {order.status === 'cancelled' ? (
                        <span className="text-xs font-bold text-rose-800 bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4 text-rose-600" />
                          Pesanan Ini Telah Dibatalkan
                        </span>
                      ) : (
                        <>
                          {order.status !== 'shipped' && order.status !== 'delivered' && order.status !== 'completed' && (
                            <Button
                              onClick={() => handleUpdateStatus(order.id, 'shipped')}
                              isLoading={updatingId === order.id}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                            >
                              <Truck className="h-4 w-4 mr-1.5" />
                              Set 'Dalam Pengiriman'
                            </Button>
                          )}

                          {order.status !== 'delivered' && order.status !== 'completed' && (
                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                              {order.payment_method?.toLowerCase() === 'cod' && !order.payment_proof_url && (
                                <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300 flex items-center gap-1">
                                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                  Unggah bukti COD terlebih dahulu
                                </span>
                              )}
                              <Button
                                onClick={() => handleUpdateStatus(order.id, 'delivered')}
                                isLoading={updatingId === order.id}
                                disabled={updatingId === order.id || (order.payment_method?.toLowerCase() === 'cod' && !order.payment_proof_url)}
                                title={order.payment_method?.toLowerCase() === 'cod' && !order.payment_proof_url ? 'Wajib unggah foto bukti COD terlebih dahulu di atas' : ''}
                                className={`text-xs font-bold shadow-xs ${
                                  order.payment_method?.toLowerCase() === 'cod' && !order.payment_proof_url
                                    ? 'bg-zinc-200 text-zinc-400 border border-zinc-300 cursor-not-allowed opacity-60'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                                }`}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                Tandai Sudah Diantar
                              </Button>
                            </div>
                          )}

                          {order.status === 'delivered' && (
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                onClick={() => handleUpdateStatus(order.id, 'shipped')}
                                isLoading={updatingId === order.id}
                                variant="secondary"
                                className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Kembalikan ke 'Dalam Pengiriman'
                              </Button>
                              <Button
                                onClick={() => handleUpdateStatus(order.id, 'delivered')}
                                isLoading={updatingId === order.id}
                                className="bg-zinc-800 hover:bg-zinc-900 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                              >
                                <Save className="h-3.5 w-3.5" />
                                Update Nomor Resi
                              </Button>
                            </div>
                          )}

                          {order.status === 'completed' && (
                            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              Pesanan Selesai (Dikonfirmasi Pembeli)
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

