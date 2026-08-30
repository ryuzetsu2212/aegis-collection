'use client'

import { useState, useEffect } from 'react'
import { Ticket, Plus, Trash2, ToggleLeft, ToggleRight, AlertCircle, Check, Edit2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface Voucher {
  id: number
  code: string
  voucher_type: 'discount' | 'shipping'
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_purchase: number
  usage_limit: number | null
  used_count: number
  is_active: number
  expires_at: string | null
  created_at: string
}

export default function StaffVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [code, setCode] = useState('')
  const [voucherType, setVoucherType] = useState<'discount' | 'shipping'>('discount')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [minPurchase, setMinPurchase] = useState('0')
  const [usageLimit, setUsageLimit] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  const [editingVoucherId, setEditingVoucherId] = useState<number | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchVouchers = async () => {
    try {
      const res = await fetch('/api/vouchers')
      if (res.ok) {
        const data = await res.json()
        setVouchers(data.vouchers || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchVouchers()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!code.trim() || !discountValue) {
      setError('Kode voucher dan nilai diskon wajib diisi')
      return
    }

    try {
      if (editingVoucherId !== null) {
        const res = await fetch('/api/vouchers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingVoucherId,
            code,
            voucher_type: voucherType,
            discount_type: discountType,
            discount_value: discountValue,
            min_purchase: minPurchase,
            usage_limit: usageLimit || null,
            expires_at: expiresAt || null,
          }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Gagal mengubah voucher')

        setSuccess('Voucher berhasil diperbarui!')
        setEditingVoucherId(null)
      } else {
        const res = await fetch('/api/vouchers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            voucher_type: voucherType,
            discount_type: discountType,
            discount_value: discountValue,
            min_purchase: minPurchase,
            usage_limit: usageLimit || null,
            expires_at: expiresAt || null,
          }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Gagal menambahkan voucher')

        setSuccess(`Voucher ${voucherType === 'shipping' ? 'Ongkir' : 'Diskon'} berhasil dibuat!`)
      }

      setCode('')
      setDiscountValue('')
      setMinPurchase('0')
      setUsageLimit('')
      setExpiresAt('')
      fetchVouchers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const startEdit = (v: Voucher) => {
    setEditingVoucherId(v.id)
    setCode(v.code)
    setVoucherType(v.voucher_type)
    setDiscountType(v.discount_type)
    setDiscountValue(v.discount_value.toString())
    setMinPurchase(v.min_purchase.toString())
    setUsageLimit(v.usage_limit ? v.usage_limit.toString() : '')
    setExpiresAt(v.expires_at ? v.expires_at.split('T')[0] : '')
    setError(null)
    setSuccess(null)
  }

  const cancelEdit = () => {
    setEditingVoucherId(null)
    setCode('')
    setVoucherType('discount')
    setDiscountType('percentage')
    setDiscountValue('')
    setMinPurchase('0')
    setUsageLimit('')
    setExpiresAt('')
    setError(null)
    setSuccess(null)
  }

  const handleToggle = async (id: number, currentStatus: number) => {
    try {
      const res = await fetch('/api/vouchers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: currentStatus === 1 ? 0 : 1 }),
      })
      if (res.ok) fetchVouchers()
    } catch (err) {
      console.error(err)
    }
  }

  const [deleteModalVoucherId, setDeleteModalVoucherId] = useState<number | null>(null)

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/vouchers?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchVouchers()
    } catch (err) {
      console.error(err)
    } finally {
      setDeleteModalVoucherId(null)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-100 py-4 sm:py-8 px-3 sm:px-6 lg:px-8 w-full max-w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
            <Ticket className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight leading-tight">Kelola Kupon Voucher</h1>
            <p className="text-xs text-zinc-600 mt-0.5 leading-snug">Buat kupon diskon produk dan kupon potongan/gratis ongkir kurir.</p>
          </div>
        </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Form Tambah/Edit Voucher */}
        <div className="md:col-span-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm h-fit">
          <h2 className="text-base font-bold text-zinc-900 mb-4 flex items-center gap-2">
            {editingVoucherId ? (
              <Ticket className="h-4 w-4 text-amber-600 animate-pulse" />
            ) : (
              <Plus className="h-4 w-4 text-amber-600" />
            )}
            {editingVoucherId ? 'Edit Kupon' : 'Buat Kupon Baru'}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Kategori / Jenis Voucher</label>
              <select
                value={voucherType}
                onChange={(e: any) => setVoucherType(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="discount">🛍️ Voucher Diskon Produk</option>
                <option value="shipping">🚚 Voucher Potongan / Gratis Ongkir</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Kode Voucher</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={voucherType === 'shipping' ? 'FREEONGKIR' : 'DISCOUNTONE'}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold uppercase text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Perhitungan</label>
                <select
                  value={discountType}
                  onChange={(e: any) => setDiscountType(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 focus:outline-none"
                >
                  <option value="percentage">Persentase (%)</option>
                  <option value="fixed">Nominal Rp</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Nilai Potongan</label>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'percentage' ? '100 (Gratis Total)' : '10000'}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Minimal Belanja (Rp)</label>
              <input
                type="number"
                value={minPurchase}
                onChange={(e) => setMinPurchase(e.target.value)}
                placeholder="0"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Batas Penggunaan (Opsional)</label>
              <input
                type="number"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="Tanpa batas"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Tanggal Kedaluwarsa (Opsional)</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-900 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {editingVoucherId ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {editingVoucherId ? 'Simpan Perubahan' : 'Rilis Kupon'}
              </button>
              
              {editingVoucherId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Batal Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tabel List Voucher */}
        <div className="md:col-span-8 bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-zinc-200 bg-zinc-50/50">
            <h2 className="text-base font-bold text-zinc-900">Daftar Kupon Aktif ({vouchers.length})</h2>
          </div>

          <div className="divide-y divide-zinc-200">
            {vouchers.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">Belum ada voucher rilis.</div>
            ) : (
              vouchers.map((v) => (
                <div key={v.id} className="p-4 flex items-center justify-between hover:bg-zinc-50/80 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-sm text-zinc-900 bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-md border border-amber-300">
                        {v.code}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        v.voucher_type === 'shipping'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {v.voucher_type === 'shipping' ? '🚚 Voucher Ongkir' : '🛍️ Voucher Diskon'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        v.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-600'
                      }`}>
                        {v.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-zinc-700">
                      Potongan:{' '}
                      <span className="text-red-600 font-bold">
                        {v.discount_type === 'percentage' ? `${v.discount_value}%` : formatPrice(v.discount_value)}
                      </span>{' '}
                      • Min. Belanja: {formatPrice(v.min_purchase)}
                    </p>

                    <p className="text-[11px] text-zinc-400">
                      Digunakan: {v.used_count} / {v.usage_limit ? v.usage_limit : '∞'} kali
                      {v.expires_at && ` • Kedaluwarsa: ${new Date(v.expires_at).toLocaleDateString('id-ID')}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(v.id, v.is_active)}
                      className="p-2 text-zinc-600 hover:text-zinc-900 rounded-lg transition-colors cursor-pointer"
                      title={v.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {v.is_active ? (
                        <ToggleRight className="h-6 w-6 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-zinc-400" />
                      )}
                    </button>

                    <button
                      onClick={() => startEdit(v)}
                      className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit Voucher"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => setDeleteModalVoucherId(v.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModalVoucherId !== null}
        title="Hapus Kupon Voucher"
        description="Apakah Anda yakin ingin menghapus kupon voucher ini secara permanen?"
        confirmText="Ya, Hapus Voucher"
        cancelText="Batal"
        variant="danger"
        onConfirm={() => {
          if (deleteModalVoucherId) handleDelete(deleteModalVoucherId)
        }}
        onCancel={() => setDeleteModalVoucherId(null)}
      />
    </div>
  </div>
)
}

