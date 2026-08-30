'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice, getCustomerDisplayName } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Loader2, Check, Truck, Package, Store, Eye, CheckCircle2, FileText, X, Trash2, RotateCcw, AlertTriangle, Plus } from 'lucide-react'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import ModalTambahPesananKasir from '@/components/ModalTambahPesananKasir'
import type { OrderStatus, PurchaseType, PaymentMethod } from '@/types/database.types'

interface StaffReturnItem {
  id: number
  order_id: number
  user_id: number
  reason: string
  details: string | null
  photo_url: string | null
  status: 'pending' | 'approved' | 'rejected' | 'item_received'
  admin_notes: string | null
  created_at: string
  total_amount: number
  order_status: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
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
  courier_name?: string | null
  courier_phone?: string | null
  shipping_address: string
  created_at: string
  user_email: string
  user_full_name: string | null
  order_items: OrderItem[]
  return_id?: number | null
  return_status?: 'pending' | 'item_received' | 'approved' | 'rejected' | null
  return_reason?: string | null
  return_details?: string | null
  return_admin_notes?: string | null
}

interface CourierUser {
  id: number
  full_name: string
  email: string
  phone: string | null
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending Bayar', color: 'bg-amber-100 text-amber-900 border-amber-300' },
  pending_confirmation: { label: 'Perlu Konfirmasi', color: 'bg-blue-100 text-blue-900 border-blue-300' },
  paid: { label: 'Dikonfirmasi (Paid)', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  shipped: { label: 'Dikirim Kurir', color: 'bg-purple-100 text-purple-900 border-purple-300' },
  delivered: { label: 'Sampai di Tujuan', color: 'bg-indigo-100 text-indigo-900 border-indigo-300 font-semibold' },
  completed: { label: 'Selesai', color: 'bg-zinc-200 text-zinc-900 border-zinc-400' },
  cancelled: { label: 'Dibatalkan', color: 'bg-rose-100 text-rose-900 border-rose-300' },
}

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'pending_confirmation', 'paid', 'shipped', 'delivered', 'completed', 'cancelled']

export default function StaffOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [couriers, setCouriers] = useState<CourierUser[]>([])
  const [selectedCouriers, setSelectedCouriers] = useState<Record<number, string>>({})
  const [courierNames, setCourierNames] = useState<Record<number, string>>({})
  const [courierPhones, setCourierPhones] = useState<Record<number, string>>({})
  const [editingCourier, setEditingCourier] = useState<Record<number, boolean>>({})

  // Returns State
  const [activeTab, setActiveTab] = useState<'orders' | 'returns'>('orders')
  const [returnsList, setReturnsList] = useState<StaffReturnItem[]>([])
  const [updatingReturnId, setUpdatingReturnId] = useState<number | null>(null)
  const [rejectNotesMap, setRejectNotesMap] = useState<Record<number, string>>({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<number | null>(null)
  const [trackingNumbers, setTrackingNumbers] = useState<Record<number, string>>({})
  const [selectedProof, setSelectedProof] = useState<string | null>(null)
  const [proofModalTitle, setProofModalTitle] = useState<string>('Bukti Gambar')

  useEffect(() => {
    fetchOrders()
    fetchCouriers()
    fetchReturns()
  }, [])

  async function fetchCouriers() {
    try {
      const res = await fetch('/api/couriers')
      if (res.ok) {
        const data = await res.json()
        setCouriers(data || [])
      }
    } catch {}
  }

  async function fetchReturns() {
    try {
      const res = await fetch('/api/returns')
      if (res.ok) {
        const data = await res.json()
        setReturnsList(data.returns || [])
      }
    } catch (e) {
      console.error('Error fetching staff returns:', e)
    }
  }

  async function handleUpdateReturnStatus(returnId: number, newStatus: 'approved' | 'rejected') {
    try {
      setUpdatingReturnId(returnId)
      const res = await fetch(`/api/returns/${returnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          admin_notes: rejectNotesMap[returnId] || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal memperbarui status retur.')
      }
      await fetchReturns()
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui status retur.')
    } finally {
      setUpdatingReturnId(null)
    }
  }

  async function fetchOrders() {
    try {
      setLoading(true)
      const res = await fetch('/api/orders')
      if (!res.ok) throw new Error('Gagal memuat pesanan.')
      const data = await res.json()
      setOrders(data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat pesanan.')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(orderId: number, status: OrderStatus) {
    try {
      setUpdating(orderId)
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Gagal update status.')
      await fetchOrders()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal update status.')
    } finally {
      setUpdating(null)
    }
  }

  async function confirmPayment(orderId: number) {
    try {
      setUpdating(orderId)
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm_payment: true }),
      })
      if (!res.ok) throw new Error('Gagal konfirmasi pembayaran.')
      await fetchOrders()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal konfirmasi pembayaran.')
    } finally {
      setUpdating(null)
    }
  }

  async function updateCourierAndTracking(orderId: number) {
    const tracking = trackingNumbers[orderId]?.trim() || ''
    const selectedCourierId = selectedCouriers[orderId]
    
    let name = courierNames[orderId]?.trim() || ''
    let phone = courierPhones[orderId]?.trim() || ''

    if (selectedCourierId && selectedCourierId !== 'custom') {
      const found = couriers.find(c => String(c.id) === selectedCourierId)
      if (found) {
        name = found.full_name
        phone = found.phone || ''
      }
    }

    try {
      setUpdating(orderId)
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tracking_number: tracking || `RESI-KURIR-${orderId}`,
          courier_name: name,
          courier_phone: phone,
          status: 'shipped',
        }),
      })
      if (!res.ok) throw new Error('Gagal menugaskan kurir.')
      setEditingCourier(prev => ({ ...prev, [orderId]: false }))
      await fetchOrders()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menugaskan kurir.')
    } finally {
      setUpdating(null)
    }
  }

  const [deleteModalOrderId, setDeleteModalOrderId] = useState<number | null>(null)
  const [deleteCancelledModalOpen, setDeleteCancelledModalOpen] = useState(false)
  const [posModalOpen, setPosModalOpen] = useState(false)

  async function deleteOrder(orderId: number) {
    try {
      setUpdating(orderId)
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menghapus pesanan.')
      }
      await fetchOrders()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus pesanan.')
    } finally {
      setUpdating(null)
      setDeleteModalOrderId(null)
    }
  }

  async function deleteCancelledOrders() {
    const cancelledOrders = orders.filter(o => o.status === 'cancelled')
    if (cancelledOrders.length === 0) {
      setError('Tidak ada pesanan berkategori Dibatalkan.')
      return
    }

    try {
      setLoading(true)
      for (const order of cancelledOrders) {
        await fetch(`/api/orders/${order.id}`, { method: 'DELETE' })
      }
      await fetchOrders()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus pesanan dibatalkan.')
    } finally {
      setLoading(false)
      setDeleteCancelledModalOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Kelola Pesanan Toko & Kurir</h1>
            <p className="text-xs text-zinc-500">Konfirmasi pembayaran, verifikasi bukti transfer, & input resi kurir</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPosModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" /> + Tambah Transaksi Kasir (Beli Langsung)
            </button>
            <button
              onClick={deleteCancelledOrders}
              className="px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> Hapus Dibatalkan
            </button>
            <Button onClick={fetchOrders} variant="secondary" className="text-xs">
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 mb-6 border-b border-zinc-200 pb-3">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Semua Pesanan ({orders.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('returns')
              fetchReturns()
            }}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'returns'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-white text-orange-950 border border-orange-200 hover:bg-orange-50'
            }`}
          >
            <RotateCcw className="h-4 w-4 text-orange-500" />
            <span>Verifikasi Retur Barang</span>
            {returnsList.filter(r => r.status === 'pending').length > 0 && (
              <span className="px-2 py-0.5 bg-orange-100 text-orange-900 rounded-full font-black text-[10px]">
                {returnsList.filter(r => r.status === 'pending').length} Pending
              </span>
            )}
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : activeTab === 'returns' ? (
          /* TAB RETUR BARANG */
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm space-y-4 p-4 sm:p-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-orange-600" />
                  <span>Daftar Pengajuan Retur Barang Pelanggan</span>
                </h3>
                <p className="text-xs text-zinc-500">Verifikasi alasan retur & foto bukti dari pembeli</p>
              </div>
              <Button onClick={fetchReturns} variant="secondary" className="text-xs">
                Refresh Retur
              </Button>
            </div>

            {returnsList.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs">
                <RotateCcw className="h-10 w-10 text-zinc-300 mx-auto mb-2" />
                <p className="font-semibold text-zinc-700">Belum ada pengajuan retur barang dari pelanggan.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs divide-y divide-zinc-200">
                  <thead className="bg-zinc-50 text-zinc-600">
                    <tr>
                      <th className="text-left py-3 px-3 font-bold uppercase tracking-wider">Retur & Pesanan</th>
                      <th className="text-left py-3 px-3 font-bold uppercase tracking-wider">Pelanggan</th>
                      <th className="text-left py-3 px-3 font-bold uppercase tracking-wider">Alasan Retur & Detail</th>
                      <th className="text-left py-3 px-3 font-bold uppercase tracking-wider">Bukti Foto</th>
                      <th className="text-left py-3 px-3 font-bold uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-3 font-bold uppercase tracking-wider">Aksi Verifikasi Staff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {returnsList.map((r) => (
                      <tr key={r.id} className="hover:bg-zinc-50/50">
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-orange-950">Retur #{r.id}</div>
                          <div className="font-semibold text-zinc-700">Pesanan #{r.order_id}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            {new Date(r.created_at).toLocaleDateString('id-ID')}
                          </div>
                          <div className="text-xs font-bold text-red-600 mt-1">
                            {formatPrice(r.total_amount)}
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-bold text-zinc-900">{r.customer_name}</div>
                          <div className="text-[11px] text-zinc-500">{r.customer_email}</div>
                          {r.customer_phone && (
                            <div className="text-[11px] text-zinc-600 font-mono">📞 {r.customer_phone}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-3 max-w-xs">
                          <span className="inline-block px-2 py-0.5 rounded bg-orange-100 text-orange-900 font-bold text-[11px] mb-1">
                            {r.reason}
                          </span>
                          {r.details && (
                            <p className="text-xs text-zinc-700 bg-zinc-50 p-2 rounded-lg border border-zinc-200 mt-1 leading-relaxed">
                              "{r.details}"
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          {r.photo_url ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProof(r.photo_url)
                                setProofModalTitle('Foto Bukti Retur Barang Pelanggan')
                              }}
                              className="group relative w-14 h-14 rounded-lg overflow-hidden border border-zinc-200 hover:border-orange-500 transition-all shadow-xs block cursor-pointer"
                            >
                              <Image src={r.photo_url} alt="Bukti Retur" fill className="object-cover" />
                              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center text-white">
                                <Eye className="h-4 w-4" />
                              </div>
                            </button>
                          ) : (
                            <span className="text-[11px] text-zinc-400 italic">Tidak ada foto</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          {r.status === 'pending' && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              🟡 Menunggu Penjemputan Kurir
                            </span>
                          )}
                          {r.status === 'item_received' && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                              📦 Barang Diterima Kurir (Siap Diverifikasi)
                            </span>
                          )}
                          {r.status === 'approved' && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              🟢 Disetujui Staff
                            </span>
                          )}
                          {r.status === 'rejected' && (
                            <div>
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-900 border border-red-300">
                                🔴 Ditolak Staff
                              </span>
                              {r.admin_notes && (
                                <p className="text-[10px] text-red-700 mt-1 italic">
                                  "{r.admin_notes}"
                                </p>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          {['pending', 'item_received'].includes(r.status) ? (
                            <div className="space-y-2 max-w-xs">
                              {r.status === 'pending' && (
                                <p className="text-[10px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200 font-semibold mb-1">
                                  ⏳ Kurir belum mengonfirmasi penerimaan barang
                                </p>
                              )}
                              <Button
                                onClick={() => handleUpdateReturnStatus(r.id, 'approved')}
                                disabled={updatingReturnId === r.id}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1 px-2.5 flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5" />
                                {updatingReturnId === r.id ? 'Memproses...' : 'Setujui Retur'}
                              </Button>

                              <div className="space-y-1">
                                <input
                                  type="text"
                                  placeholder="Catatan penolakan..."
                                  value={rejectNotesMap[r.id] || ''}
                                  onChange={(e) => setRejectNotesMap(prev => ({ ...prev, [r.id]: e.target.value }))}
                                  className="w-full text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 bg-white border border-zinc-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-zinc-500"
                                />
                                <Button
                                  onClick={() => handleUpdateReturnStatus(r.id, 'rejected')}
                                  disabled={updatingReturnId === r.id}
                                  variant="secondary"
                                  className="w-full text-red-600 hover:text-red-700 border-red-200 bg-red-50 hover:bg-red-100 text-xs py-1 px-2.5 font-bold flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  Tolak Retur
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-zinc-400 font-semibold">Selesai Diverifikasi</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center">
            <Package className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">Belum ada pesanan.</p>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs divide-y divide-zinc-200">
                <thead className="bg-zinc-50 text-zinc-600">
                  <tr>
                    <th className="text-left py-3.5 px-4 font-semibold uppercase tracking-wider">Pesanan</th>
                    <th className="text-left py-3.5 px-4 font-semibold uppercase tracking-wider">Metode</th>
                    <th className="text-left py-3.5 px-4 font-semibold uppercase tracking-wider">Pelanggan</th>
                    <th className="text-left py-3.5 px-4 font-semibold uppercase tracking-wider">Total</th>
                    <th className="text-left py-3.5 px-4 font-semibold uppercase tracking-wider">Bukti Bayar</th>
                    <th className="text-left py-3.5 px-4 font-semibold uppercase tracking-wider">Status</th>
                    <th className="text-left py-3.5 px-4 font-semibold uppercase tracking-wider">Penugasan Kurir & Resi</th>
                    <th className="text-left py-3.5 px-4 font-semibold uppercase tracking-wider">Aksi Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {orders.map((order) => {
                    const statusLabel = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-zinc-200 text-zinc-900 border-zinc-300 font-semibold' }
                    const isDirectOrder = order.purchase_type === 'direct' || order.payment_method === 'cash' || order.payment_method === 'cash_store'
                    return (
                      <tr key={order.id} className="hover:bg-zinc-50/50">
                        <td className="py-3 px-4">
                          <div className="font-bold text-zinc-900">#{order.id}</div>
                          <div className="text-[11px] text-zinc-400">
                            {new Date(order.created_at).toLocaleDateString('id-ID')}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 font-semibold text-zinc-900">
                            {order.purchase_type === 'direct' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <Store className="h-3 w-3" /> Langsung
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                <Truck className="h-3 w-3" /> Online
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-bold text-zinc-700 uppercase mt-0.5">
                            {order.payment_method === 'bank_transfer' || order.payment_method === 'transfer'
                              ? 'BANK BCA'
                              : order.payment_method === 'cash_store' || order.payment_method === 'cash'
                              ? 'TUNAI KASIR'
                              : order.payment_method?.replace('_', ' ')}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-zinc-900">
                            {getCustomerDisplayName(order)}
                          </div>
                          <div className="text-[11px] text-zinc-500 truncate max-w-[140px]" title={order.shipping_address}>
                            {order.shipping_address}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-bold tabular-nums text-zinc-900">
                          {formatPrice(order.total_amount)}
                        </td>

                        <td className="py-3 px-4">
                          {order.status === 'cancelled' ? (
                            <span className="text-[11px] font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 inline-block">
                              ❌ Transaksi Dibatalkan
                            </span>
                          ) : order.payment_method === 'qris' ? (
                            <span className="text-[11px] font-bold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 inline-block">
                              📱 QRIS Kasir (Terverifikasi)
                            </span>
                          ) : order.payment_method === 'bank_transfer' ? (
                            <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 inline-block">
                              🏦 EDC / Transfer Kasir
                            </span>
                          ) : isDirectOrder ? (
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                              💵 Tunai Kasir (Struk)
                            </span>
                          ) : order.payment_proof_url ? (
                            <button
                              onClick={() => {
                                setSelectedProof(order.payment_proof_url)
                                setProofModalTitle('Bukti Pembayaran Transfer Pelanggan')
                              }}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline font-medium"
                            >
                              <Eye className="h-3.5 w-3.5" /> Lihat Bukti
                            </button>
                          ) : (
                            <span className="text-[11px] text-zinc-400 italic">Belum Upload</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {order.return_id ? (
                            <div className="space-y-1">
                              <span className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                                order.return_status === 'item_received'
                                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                                  : order.return_status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : order.return_status === 'rejected'
                                  ? 'bg-rose-100 text-rose-900 border-rose-300'
                                  : 'bg-amber-100 text-amber-900 border-amber-300'
                              }`}>
                                {order.return_status === 'item_received'
                                  ? '📦 Retur Diterima Kurir'
                                  : order.return_status === 'approved'
                                  ? '🟢 Retur Disetujui'
                                  : order.return_status === 'rejected'
                                  ? '🔴 Retur Ditolak'
                                  : '🟡 Retur Dikirim'}
                              </span>
                              <div className="text-[10px] text-zinc-500 font-medium">
                                (Pesanan: {statusLabel.label})
                              </div>
                            </div>
                          ) : (
                            <span className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${statusLabel.color}`}>
                              {statusLabel.label}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 min-w-[230px]">
                          {isDirectOrder ? (
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                              🏬 Pembelian Langsung Toko (Tanpa Kurir)
                            </span>
                          ) : order.status === 'cancelled' ? (
                            <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 inline-block">
                              🚫 Pesanan Dibatalkan
                            </span>
                          ) : (order.tracking_number || order.courier_name) && !editingCourier[order.id] ? (
                            <div className="space-y-1 bg-zinc-50 border border-zinc-200 p-2 rounded-xl">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-semibold text-zinc-900 flex items-center gap-1 text-[11px]">
                                  <Truck className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                                  <span>{order.courier_name || 'Kurir Toko'}</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setEditingCourier(prev => ({ ...prev, [order.id]: true }))}
                                  className="text-[10px] text-blue-600 hover:underline font-semibold"
                                >
                                  Edit Kurir
                                </button>
                              </div>
                              {order.courier_phone && (
                                <p className="text-[10px] text-zinc-500 font-mono">📞 {order.courier_phone}</p>
                              )}
                              <div className="text-[10px] font-mono text-zinc-700 bg-white px-1.5 py-0.5 rounded border border-zinc-200 inline-block mt-0.5">
                                Resi: {order.tracking_number || '-'}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5 p-1 bg-zinc-50/50 border border-zinc-200 rounded-xl p-2">
                              {/* Select Kurir */}
                              <select
                                value={selectedCouriers[order.id] || ''}
                                onChange={(e) => {
                                  const val = e.target.value
                                  setSelectedCouriers(prev => ({ ...prev, [order.id]: val }))
                                  if (val !== 'custom' && val !== '') {
                                    const found = couriers.find(c => String(c.id) === val)
                                    if (found) {
                                      setCourierNames(prev => ({ ...prev, [order.id]: found.full_name }))
                                      setCourierPhones(prev => ({ ...prev, [order.id]: found.phone || '' }))
                                    }
                                  }
                                }}
                                className="w-full px-2 py-1 text-[11px] bg-white text-zinc-900 border border-zinc-300 rounded-lg font-semibold focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
                              >
                                <option value="">-- Pilih Kurir Pengantar --</option>
                                {couriers.map((c) => (
                                  <option key={c.id} value={String(c.id)}>
                                    👤 {c.full_name} ({c.phone || 'No HP -'})
                                  </option>
                                ))}
                                <option value="custom">✏️ Input Manual Nama Kurir</option>
                              </select>

                              {selectedCouriers[order.id] === 'custom' && (
                                <div className="space-y-1 pt-1">
                                  <input
                                    type="text"
                                    placeholder="Nama Kurir (Contoh: Budi)"
                                    value={courierNames[order.id] || ''}
                                    onChange={(e) => setCourierNames(prev => ({ ...prev, [order.id]: e.target.value }))}
                                    className="w-full px-2 py-1 text-[11px] bg-white border border-zinc-300 rounded-lg font-semibold"
                                  />
                                  <input
                                    type="text"
                                    placeholder="No HP Kurir (0812...)"
                                    value={courierPhones[order.id] || ''}
                                    onChange={(e) => setCourierPhones(prev => ({ ...prev, [order.id]: e.target.value }))}
                                    className="w-full px-2 py-1 text-[11px] bg-white border border-zinc-300 rounded-lg font-semibold"
                                  />
                                </div>
                              )}

                              <div className="flex items-center gap-1 pt-0.5">
                                <input
                                  type="text"
                                  placeholder="No Resi (Opsional)"
                                  value={trackingNumbers[order.id] || ''}
                                  onChange={(e) => setTrackingNumbers((prev) => ({ ...prev, [order.id]: e.target.value }))}
                                  className="flex-1 min-w-0 px-2 py-1 text-[11px] bg-white border border-zinc-300 rounded-lg placeholder:text-zinc-400 font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateCourierAndTracking(order.id)}
                                  disabled={updating === order.id}
                                  className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-[11px] font-bold shrink-0 cursor-pointer disabled:opacity-40 shadow-xs"
                                >
                                  {updating === order.id ? '...' : '✓ Simpan'}
                                </button>
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 min-w-[210px]">
                          <div className="flex flex-col gap-1.5 items-start">
                            {Boolean(order.return_id) && (
                              <button
                                onClick={() => setActiveTab('returns')}
                                className="w-full px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
                                title="Buka Tab Pengajuan Retur untuk Verifikasi Staff"
                              >
                                <RotateCcw className="h-3.5 w-3.5" /> Verifikasi Retur
                              </button>
                            )}

                            {['pending', 'pending_confirmation'].includes(order.status) && (
                              <button
                                onClick={() => confirmPayment(order.id)}
                                disabled={updating === order.id}
                                className="w-full px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 shadow-sm transition-all"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Konfirmasi Bayar
                              </button>
                            )}

                            <div className="flex items-center gap-1.5 w-full">
                              <Link href={`/orders/${order.id}`} target="_blank" className="shrink-0">
                                <button
                                  className="px-2 py-1 text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-lg flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer"
                                  title="Lihat & Cetak Struk Digital"
                                >
                                  <FileText className="h-3.5 w-3.5 text-zinc-600" /> Struk
                                </button>
                              </Link>

                              <select
                                value={order.status}
                                onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                                disabled={updating === order.id}
                                className="flex-1 min-w-0 text-xs bg-white text-zinc-900 font-bold border border-zinc-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-zinc-900 cursor-pointer"
                              >
                                {STATUS_OPTIONS.map((s) => {
                                  const isDisableOpt = (!isDirectOrder && s === 'completed') || (isDirectOrder && s === 'shipped')
                                  const isOnlineComp = !isDirectOrder && s === 'completed'
                                  return (
                                    <option
                                      key={s}
                                      value={s}
                                      disabled={isDisableOpt}
                                      style={isDisableOpt ? { color: '#9ca3af' } : undefined}
                                      className={isDisableOpt ? 'text-zinc-400 font-normal py-1' : 'bg-white text-zinc-900 font-semibold py-1'}
                                    >
                                      {STATUS_LABELS[s]?.label || s} {isOnlineComp ? '(Oleh Pembeli/Kurir)' : ''}
                                    </option>
                                  )
                                })}
                              </select>

                              {order.status === 'cancelled' && (
                                <button
                                  onClick={() => setDeleteModalOrderId(order.id)}
                                  disabled={updating === order.id}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                                  title="Hapus Pesanan Dibatalkan Ini"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal View Bukti Pembayaran */}
        {selectedProof && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 relative shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="text-sm font-bold text-zinc-900">{proofModalTitle}</h3>
                <button
                  onClick={() => setSelectedProof(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="relative aspect-[4/3] w-full bg-zinc-100 rounded-xl overflow-hidden border">
                <Image src={selectedProof} alt={proofModalTitle} fill className="object-contain" />
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="secondary" onClick={() => setSelectedProof(null)}>
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>

      <ConfirmModal
        isOpen={deleteModalOrderId !== null}
        title="Hapus Pesanan Permanen"
        description={`Apakah Anda yakin ingin menghapus permanen pesanan #${deleteModalOrderId}? Data pesanan yang dihapus tidak dapat dikembalikan.`}
        confirmText="Ya, Hapus Pesanan"
        cancelText="Batal"
        variant="danger"
        isLoading={updating === deleteModalOrderId}
        onConfirm={() => {
          if (deleteModalOrderId) deleteOrder(deleteModalOrderId)
        }}
        onCancel={() => setDeleteModalOrderId(null)}
      />

      <ConfirmModal
        isOpen={deleteCancelledModalOpen}
        title="Hapus Pesanan Dibatalkan"
        description="Apakah Anda yakin ingin menghapus seluruh pesanan berkategori Dibatalkan secara massal?"
        confirmText="Ya, Hapus Semua"
        cancelText="Batal"
        variant="danger"
        isLoading={loading}
        onConfirm={deleteCancelledOrders}
        onCancel={() => setDeleteCancelledModalOpen(false)}
      />

      <ModalTambahPesananKasir
        isOpen={posModalOpen}
        onClose={() => setPosModalOpen(false)}
        onSuccess={fetchOrders}
      />
    </div>
  )
}