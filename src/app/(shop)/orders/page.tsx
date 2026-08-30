'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Loader2, Package, ArrowRight, Store, Truck, FileText, CheckCircle2, Star, X, RotateCcw, Upload, AlertCircle } from 'lucide-react'
import type { OrderStatus, PurchaseType, PaymentMethod } from '@/types/database.types'
import { ReviewForm } from '@/components/ReviewForm'

import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { compressImageIfNeeded } from '@/lib/imageCompressor'

interface ReturnItem {
  id: number
  order_id: number
  reason: string
  details: string | null
  photo_url: string | null
  status: 'pending' | 'approved' | 'rejected' | 'item_received'
  admin_notes: string | null
  created_at: string
}

interface OrderItem {
  id: number
  quantity: number
  price_at_purchase: number
  size: string | null
  color: string
  product_title: string
  product_slug: string
  image_url: string
  variant_id: number
  product_id?: number
  review_rating?: number | null
  review_comment?: string | null
}

interface Order {
  id: number
  total_amount: number
  status: OrderStatus
  purchase_type: PurchaseType
  payment_method: PaymentMethod
  payment_proof_url: string | null
  payment_status: string
  tracking_number: string | null
  shipping_address: string
  created_at: string
  order_items: OrderItem[]
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Menunggu Pembayaran', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  pending_confirmation: { label: 'Menunggu Konfirmasi Staff', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  paid: { label: 'Dikonfirmasi (Siap Dikirim)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  shipped: { label: 'Dalam Pengiriman Kurir', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  delivered: { label: 'Pesanan Sampai di Tujuan', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  completed: { label: 'Selesai', color: 'bg-zinc-100 text-zinc-800 border-zinc-200' },
  cancelled: { label: 'Dibatalkan', color: 'bg-rose-100 text-rose-800 border-rose-200' },
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  // Review Modal State
  const [selectedReviewOrder, setSelectedReviewOrder] = useState<Order | null>(null)
  const [activeReviewItem, setActiveReviewItem] = useState<OrderItem | null>(null)
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<number>>(new Set())

  // Return State
  const [returnsMap, setReturnsMap] = useState<Record<number, ReturnItem>>({})
  const [quotaInfo, setQuotaInfo] = useState<{ usedThisMonth: number; remainingQuota: number; maxLimit: number }>({
    usedThisMonth: 0,
    remainingQuota: 3,
    maxLimit: 3,
  })

  // Return Modal State
  const [selectedReturnOrder, setSelectedReturnOrder] = useState<Order | null>(null)
  const [returnReason, setReturnReason] = useState('Ukuran / Warna Tidak Sesuai')
  const [returnDetails, setReturnDetails] = useState('')
  const [returnPhotoUrl, setReturnPhotoUrl] = useState<string | null>(null)
  const [uploadingReturnPhoto, setUploadingReturnPhoto] = useState(false)
  const [submittingReturn, setSubmittingReturn] = useState(false)
  const [returnError, setReturnError] = useState<string | null>(null)
  const [returnSuccess, setReturnSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
    fetchUser()
    fetchReturns()
  }, [])

  useEffect(() => {
    if (selectedReviewOrder) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedReviewOrder])

  async function fetchUser() {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUserRole(data.user?.role || null)
      }
    } catch {}
  }

  async function fetchOrders() {
    try {
      const res = await fetch('/api/orders')
      if (!res.ok) throw new Error('Gagal memuat daftar pesanan.')
      const data = await res.json()
      setOrders(data || [])
      return data || []
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat pesanan.')
      return []
    } finally {
      setLoading(false)
    }
  }

  async function fetchReturns() {
    try {
      const res = await fetch('/api/returns')
      if (res.ok) {
        const data = await res.json()
        setQuotaInfo({
          usedThisMonth: data.usedThisMonth || 0,
          remainingQuota: data.remainingQuota ?? 3,
          maxLimit: data.maxLimit || 3,
        })
        const map: Record<number, ReturnItem> = {}
        if (data.returns && Array.isArray(data.returns)) {
          data.returns.forEach((r: ReturnItem) => {
            map[r.order_id] = r
          })
        }
        setReturnsMap(map)
      }
    } catch (e) {
      console.error('Error fetching returns:', e)
    }
  }

  async function handleUploadReturnPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingReturnPhoto(true)
    setReturnError(null)

    try {
      const fileToUpload = await compressImageIfNeeded(file)
      const formData = new FormData()
      formData.append('file', fileToUpload)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Gagal mengunggah foto bukti retur.')
      const data = await res.json()
      setReturnPhotoUrl(data.url)
    } catch (err: any) {
      setReturnError(err.message || 'Gagal mengunggah foto.')
    } finally {
      setUploadingReturnPhoto(false)
    }
  }

  async function handleSubmitReturn(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedReturnOrder) return
    setSubmittingReturn(true)
    setReturnError(null)
    setReturnSuccess(null)

    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedReturnOrder.id,
          reason: returnReason,
          details: returnDetails,
          photo_url: returnPhotoUrl,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mengajukan retur.')

      setReturnSuccess('Pengajuan retur barang berhasil dikirim! Menunggu verifikasi staff toko.')
      await fetchReturns()
      setTimeout(() => {
        setSelectedReturnOrder(null)
        setReturnReason('Ukuran / Warna Tidak Sesuai')
        setReturnDetails('')
        setReturnPhotoUrl(null)
        setReturnSuccess(null)
      }, 1500)
    } catch (err: any) {
      setReturnError(err.message || 'Terjadi kesalahan saat membuat pengajuan retur.')
    } finally {
      setSubmittingReturn(false)
    }
  }

  const [confirmModalOrderId, setConfirmModalOrderId] = useState<number | null>(null)
  const [cancelModalOrderId, setCancelModalOrderId] = useState<number | null>(null)

  async function handleCancelOrder(orderId: number) {
    try {
      setUpdatingId(orderId)
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal membatalkan pesanan.')
      }
      await fetchOrders()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal membatalkan pesanan.')
    } finally {
      setUpdatingId(null)
      setCancelModalOrderId(null)
    }
  }

  async function handleCompleteOrder(orderId: number) {
    try {
      setUpdatingId(orderId)
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menyelesikan pesanan.')
      }
      await fetchOrders()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyelesaikan pesanan.')
    } finally {
      setUpdatingId(null)
      setConfirmModalOrderId(null)
    }
  }

  async function openReviewModal(order: Order) {
    setSelectedReviewOrder(order)
    if (order.order_items && order.order_items.length > 0) {
      setActiveReviewItem(order.order_items[0])
    }

    // Fetch existing reviews for this order
    try {
      const res = await fetch(`/api/reviews?orderId=${order.id}`)
      if (res.ok) {
        const data = await res.json()
        const ids = new Set<number>(data.map((r: any) => r.product_id))
        setReviewedProductIds(ids)
      }
    } catch {}
  }

  return (
    <div className="flex-1 bg-zinc-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {(userRole === 'staff' || userRole === 'admin') && (
          <div className="p-4 mb-6 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
            <div>
              <strong className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                👔 Akun Staff Toko / Admin Aktif
              </strong>
              <p className="text-xs text-blue-800 mt-0.5">
                Untuk mengonfirmasi pembayaran & memproses pengiriman pesanan pembeli, silakan masuk ke Dashboard Pesanan Staff.
              </p>
            </div>
            <Link href="/staff/orders" className="shrink-0">
              <Button className="text-xs py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5">
                📦 Masuk Dashboard Staff <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Pesanan Saya</h1>
            <p className="text-sm text-zinc-500">Lacak status pesanan, konfirmasi pesanan diterima, & cetak struk</p>
          </div>
          <Link href="/">
            <Button variant="secondary" className="text-xs">Belanja Lagi</Button>
          </Link>
        </div>

        {/* Banner Kuota Retur */}
        <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200/80 rounded-xl p-3.5 sm:p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100/80 rounded-lg text-orange-700 shrink-0">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <strong className="text-xs sm:text-sm font-bold text-orange-950 block">Fitur Retur Barang Tidak Sesuai</strong>
              <p className="text-xs text-orange-800 mt-0.5">
                Barang cacat/rusak/tidak sesuai dapat diretur. Dibatasi <strong>maksimal 3 kali retur per bulan</strong> per akun.
              </p>
            </div>
          </div>
          <div className="shrink-0 bg-white px-3.5 py-2 rounded-xl border border-orange-200 text-center shadow-xs self-start sm:self-auto">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Sisa Kuota Retur</span>
            <span className="text-sm font-extrabold text-orange-600 font-mono">
              {quotaInfo.remainingQuota} / {quotaInfo.maxLimit} Tersedia
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-6 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center">
            <Package className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-zinc-900">Belum ada pesanan</h3>
            <p className="text-xs text-zinc-500 mt-1 mb-4">Anda belum pernah membuat pesanan barang.</p>
            <Link href="/">
              <Button>Mulai Belanja</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-zinc-100 text-zinc-800' }
              const isShipped = order.status === 'shipped'
              const isDelivered = order.status === 'delivered'
              const isCompleted = order.status === 'completed'
              const canCancel = ['pending', 'pending_confirmation'].includes(order.status)
              const canCompleteOrReview = isDelivered || isCompleted || (order.purchase_type === 'direct' && ['paid', 'completed'].includes(order.status))
              const existingReturn = returnsMap[order.id]

              return (
                <div key={order.id} className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-zinc-900">Pesanan #{order.id}</span>
                      <span className="text-zinc-400">•</span>
                      <span suppressHydrationWarning className="text-zinc-500">{formatDateTime(order.created_at)}</span>
                      <span className="text-zinc-400">•</span>
                      <span className="flex items-center gap-1 font-medium text-zinc-700">
                        {order.purchase_type === 'direct' ? (
                          <><Store className="h-3.5 w-3.5" /> Langsung di Toko</>
                        ) : (
                          <><Truck className="h-3.5 w-3.5" /> Online Kurir ({order.payment_method?.toUpperCase()})</>
                        )}
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="flex gap-3 text-sm items-center">
                        <div className="w-12 h-12 relative bg-zinc-100 rounded-md overflow-hidden shrink-0">
                          <Image src={item.image_url} alt={item.product_title} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-zinc-900 truncate">{item.product_title}</p>
                          <p className="text-xs text-zinc-500">{item.size ? `${item.size} / ` : ''}{item.color}</p>
                          {item.review_rating ? (
                            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 mt-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-flex">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span>Ulasan Anda: {item.review_rating}/5 Star</span>
                            </div>
                          ) : null}
                        </div>
                        <div className="text-right text-xs font-semibold tabular-nums text-zinc-900">
                          {item.quantity} × {formatPrice(item.price_at_purchase)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between border-t border-zinc-100 pt-3 gap-2 text-xs">
                    <div>
                      <span className="text-zinc-500">Total Pembayaran: </span>
                      <strong className="text-sm text-red-600 font-bold tabular-nums">{formatPrice(order.total_amount)}</strong>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {isShipped && (
                        <span className="text-[11px] text-purple-800 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 font-semibold flex items-center gap-1">
                          🚚 Kurir sedang mengantar paket Anda
                        </span>
                      )}

                      {isDelivered && !isCompleted && (!existingReturn || existingReturn.status === 'rejected') && (
                        <Button
                          onClick={() => setConfirmModalOrderId(order.id)}
                          disabled={updatingId === order.id}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {updatingId === order.id ? 'Memproses...' : 'Pesanan Diterima (Selesai)'}
                        </Button>
                      )}

                      {canCancel && (
                        <Button
                          onClick={() => setCancelModalOrderId(order.id)}
                          disabled={updatingId === order.id}
                          variant="secondary"
                          className="font-bold text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer text-red-600 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-700"
                        >
                          <X className="h-3.5 w-3.5" />
                          Batalkan Pesanan
                        </Button>
                      )}

                      {canCompleteOrReview && (!existingReturn || existingReturn.status === 'rejected') && (
                        <Button
                          onClick={async () => {
                            if (order.status === 'delivered') {
                              await handleCompleteOrder(order.id)
                            }
                            openReviewModal(order)
                          }}
                          variant="secondary"
                          className={`font-bold text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer ${
                            order.order_items?.some(i => i.review_rating)
                              ? 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900'
                              : 'border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900'
                          }`}
                        >
                          <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
                          {order.order_items?.some(i => i.review_rating) ? 'Ulasan Terkirim (Lihat/Edit)' : 'Beri Rating & Ulasan'}
                        </Button>
                      )}

                      {/* Tombol & Status Retur Barang (Hanya jika belum dikonfirmasi terima & belum diberi rating) */}
                      {(isDelivered || existingReturn) && (
                        existingReturn ? (
                          <div className="flex items-center gap-1.5">
                            {existingReturn.status === 'pending' && (
                              <span className="text-[11px] text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-300 font-bold flex items-center gap-1">
                                🟡 Retur Dikirim (Menunggu Penjemputan Kurir)
                              </span>
                            )}
                            {existingReturn.status === 'item_received' && (
                              <span className="text-[11px] text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-300 font-bold flex items-center gap-1">
                                📦 Barang Retur Diterima Kurir (Menunggu Verifikasi Staff)
                              </span>
                            )}
                            {existingReturn.status === 'approved' && (
                              <span className="text-[11px] text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300 font-bold flex items-center gap-1">
                                🟢 Retur Disetujui Staff Toko
                              </span>
                            )}
                            {existingReturn.status === 'rejected' && (
                              <span className="text-[11px] text-red-900 bg-red-50 px-2.5 py-1 rounded-lg border border-red-300 font-bold flex items-center gap-1" title={existingReturn.admin_notes || ''}>
                                🔴 Retur Ditolak Staff {existingReturn.admin_notes ? `(${existingReturn.admin_notes})` : ''}
                              </span>
                            )}
                          </div>
                        ) : !order.order_items?.some(i => i.review_rating) ? (
                          <Button
                            onClick={() => {
                              setSelectedReturnOrder(order)
                              setReturnReason('Ukuran / Warna Tidak Sesuai')
                              setReturnDetails('')
                              setReturnPhotoUrl(null)
                              setReturnError(null)
                              setReturnSuccess(null)
                            }}
                            disabled={quotaInfo.remainingQuota === 0}
                            variant="secondary"
                            className={`font-bold text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer ${
                              quotaInfo.remainingQuota === 0
                                ? 'opacity-50 cursor-not-allowed border-zinc-200 text-zinc-400 bg-zinc-100'
                                : 'border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-950'
                            }`}
                          >
                            <RotateCcw className="h-3.5 w-3.5 text-orange-600" />
                            Ajukan Retur Barang
                          </Button>
                        ) : null
                      )}

                      <Link href={`/orders/${order.id}`}>
                        <Button variant="secondary" className="text-xs flex items-center gap-1.5 py-1.5">
                          <FileText className="h-3.5 w-3.5" />
                          Detail & Struk
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal Rating & Review */}
        {selectedReviewOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 max-h-[85vh] sm:max-h-[90vh] flex flex-col relative shadow-2xl border border-zinc-100">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 shrink-0">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900">Rating & Ulasan Produk</h3>
                  <p className="text-[11px] text-zinc-500">Pesanan #{selectedReviewOrder.id}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedReviewOrder(null)
                    setActiveReviewItem(null)
                  }}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto pt-3 pr-3 sm:pr-4 space-y-3 flex-1">
                {/* Items tab selector if order has multiple items */}
                {selectedReviewOrder.order_items.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 border-b border-zinc-100 touch-pan-x no-scrollbar">
                    {selectedReviewOrder.order_items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveReviewItem(item)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-semibold shrink-0 transition-colors whitespace-nowrap
                          ${activeReviewItem?.id === item.id ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'}
                        `}
                      >
                        {item.product_title}
                      </button>
                    ))}
                  </div>
                )}

                {activeReviewItem && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3 p-2.5 bg-zinc-50 rounded-xl border border-zinc-200">
                      <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-zinc-200 shrink-0">
                        <Image src={activeReviewItem.image_url} alt={activeReviewItem.product_title} fill className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-zinc-900 truncate">{activeReviewItem.product_title}</h4>
                        <p className="text-[11px] text-zinc-500">{activeReviewItem.size ? `${activeReviewItem.size} / ` : ''}{activeReviewItem.color}</p>
                      </div>
                    </div>

                    <ReviewForm
                      productId={activeReviewItem.product_id || activeReviewItem.variant_id}
                      orderId={selectedReviewOrder.id}
                      productTitle={activeReviewItem.product_title}
                      initialRating={activeReviewItem.review_rating}
                      initialComment={activeReviewItem.review_comment}
                      onReviewAdded={async () => {
                        const updatedOrders = await fetchOrders()
                        if (selectedReviewOrder) {
                          const freshOrder = updatedOrders.find((o: Order) => o.id === selectedReviewOrder.id)
                          if (freshOrder && freshOrder.order_items) {
                            setSelectedReviewOrder(freshOrder)
                            const freshItem = freshOrder.order_items.find((i: OrderItem) => (i.product_id || i.variant_id) === (activeReviewItem?.product_id || activeReviewItem?.variant_id))
                            if (freshItem) {
                              setActiveReviewItem(freshItem)
                            }
                          }
                        }
                        setTimeout(() => {
                          setSelectedReviewOrder(null)
                          setActiveReviewItem(null)
                        }, 1500)
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Pengajuan Retur Barang */}
        {selectedReturnOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 max-h-[90vh] flex flex-col relative shadow-2xl border border-zinc-100">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 shrink-0">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                    <RotateCcw className="h-5 w-5 text-orange-600" />
                    <span>Ajukan Retur Barang</span>
                  </h3>
                  <p className="text-xs text-zinc-500">Pesanan #{selectedReturnOrder.id}</p>
                </div>
                <button
                  onClick={() => setSelectedReturnOrder(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitReturn} className="overflow-y-auto pt-3 space-y-4 flex-1 no-scrollbar">
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-950 space-y-1">
                  <div className="flex justify-between items-center font-bold">
                    <span>Sisa Kuota Retur Akun Bulan Ini:</span>
                    <span className="px-2 py-0.5 bg-orange-200 text-orange-900 rounded font-mono text-xs">{quotaInfo.remainingQuota} / {quotaInfo.maxLimit}</span>
                  </div>
                  <p className="text-[11px] text-orange-800">
                    Pastikan pengajuan retur disertai bukti foto barang yang tidak sesuai / rusak.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1">
                    Alasan Retur Barang <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full text-xs font-bold text-zinc-900 bg-white border border-zinc-300 focus:border-zinc-900 rounded-xl p-2.5 focus:outline-none cursor-pointer"
                  >
                    <option value="Ukuran / Warna Tidak Sesuai" className="bg-white text-zinc-900 font-semibold">Ukuran / Warna Tidak Sesuai</option>
                    <option value="Barang Cacat / Rusak" className="bg-white text-zinc-900 font-semibold">Barang Cacat / Rusak (Sobek / Noda / Cacat Pabrik)</option>
                    <option value="Produk Berbeda Dari Foto / Deskripsi" className="bg-white text-zinc-900 font-semibold">Produk Berbeda Dari Foto / Deskripsi</option>
                    <option value="Salah Kirim Produk oleh Toko" className="bg-white text-zinc-900 font-semibold">Salah Kirim Produk oleh Toko</option>
                    <option value="Lainnya" className="bg-white text-zinc-900 font-semibold">Lainnya (Jelaskan pada detail)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1">
                    Penjelasan Detail Permasalahan (Opsional)
                  </label>
                  <textarea
                    rows={3}
                    value={returnDetails}
                    onChange={(e) => setReturnDetails(e.target.value)}
                    placeholder="Contoh: Ukuran L di baju ini terlalu kecil dibandingkan panduan ukuran..."
                    className="w-full text-xs font-medium text-zinc-900 bg-white border border-zinc-300 focus:border-zinc-900 rounded-xl p-2.5 placeholder:text-zinc-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    Foto Bukti Barang Tidak Sesuai (Foto / Screenshot)
                  </label>
                  {returnPhotoUrl ? (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <div className="w-14 h-14 relative rounded-lg overflow-hidden border border-emerald-300 shrink-0">
                        <Image src={returnPhotoUrl} alt="Foto Bukti Retur" fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-emerald-800">✓ Bukti Foto Terunggah</p>
                        <button
                          type="button"
                          onClick={() => setReturnPhotoUrl(null)}
                          className="text-[11px] text-red-600 underline font-semibold mt-0.5"
                        >
                          Hapus & Ganti Foto
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-zinc-300 hover:border-orange-400 rounded-xl p-4 text-center cursor-pointer relative bg-zinc-50/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadReturnPhoto}
                        disabled={uploadingReturnPhoto}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      {uploadingReturnPhoto ? (
                        <div className="flex items-center justify-center gap-2 text-xs text-zinc-600">
                          <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                          <span>Mengunggah foto bukti...</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Upload className="h-5 w-5 text-zinc-400 mx-auto" />
                          <p className="text-xs font-bold text-zinc-700">Klik di sini untuk upload foto bukti</p>
                          <p className="text-[10px] text-zinc-400">PNG, JPG, JPEG hingga 5MB</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {returnError && (
                  <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium">
                    ⚠️ {returnError}
                  </div>
                )}

                {returnSuccess && (
                  <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold">
                    ✓ {returnSuccess}
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-zinc-100">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setSelectedReturnOrder(null)}
                    className="flex-1 text-xs"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingReturn || uploadingReturnPhoto}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {submittingReturn ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-4 w-4" />
                        Kirim Pengajuan Retur
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModalOrderId !== null}
        title="Konfirmasi Pesanan Diterima"
        description="Apakah Anda yakin telah menerima barang pesanan ini? Status pesanan akan diubah menjadi Selesai dan Anda dapat memberikan ulasan."
        confirmText="Ya, Pesanan Diterima"
        cancelText="Batal"
        variant="success"
        isLoading={updatingId === confirmModalOrderId}
        onConfirm={() => {
          if (confirmModalOrderId) {
            handleCompleteOrder(confirmModalOrderId)
          }
        }}
        onCancel={() => setConfirmModalOrderId(null)}
      />

      <ConfirmModal
        isOpen={cancelModalOrderId !== null}
        title="Konfirmasi Batalkan Pesanan"
        description="Apakah Anda yakin ingin membatalkan pesanan ini? Stok produk akan dikembalikan dan pesanan akan dibatalkan."
        confirmText="Ya, Batalkan Pesanan"
        cancelText="Batal Kembali"
        variant="danger"
        isLoading={updatingId === cancelModalOrderId}
        onConfirm={() => {
          if (cancelModalOrderId) {
            handleCancelOrder(cancelModalOrderId)
          }
        }}
        onCancel={() => setCancelModalOrderId(null)}
      />
    </div>
  )
}


