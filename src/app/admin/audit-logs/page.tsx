'use client'

import { useState, useEffect } from 'react'
import { formatDateTime } from '@/lib/utils'
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  RefreshCw, 
  Clock, 
  User, 
  FileText, 
  Info,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react'

interface AuditLog {
  id: number
  user_id: number | null
  user_email: string | null
  user_role: string | null
  action: string
  entity_type: string | null
  entity_id: number | null
  details: string | null
  ip_address: string | null
  created_at: string
}

const ACTION_LABELS: Record<string, string> = {
  ORDER_CREATED: 'Pesanan Dibuat',
  ORDER_RECEIVED: 'Pesanan Diterima',
  ORDER_CANCELLED: 'Pesanan Dibatalkan',
  ORDER_UPDATED: 'Pesanan Diperbarui',
  COURIER_ASSIGNED: 'Penugasan Kurir',
  RETURN_REQUESTED: 'Pengajuan Retur',
  RETURN_APPROVED: 'Retur Disetujui',
  RETURN_STATUS_UPDATED: 'Status Retur Diperbarui',
  USER_ROLE_UPDATED: 'Role Pengguna Diperbarui',
  USER_DELETED: 'Pengguna Dihapus',
}

const getActionLabel = (action: string) => {
  return ACTION_LABELS[action] || action
}

const ENTITY_LABELS: Record<string, string> = {
  order: 'Pesanan',
  return: 'Retur',
  user: 'Pengguna',
  banner: 'Banner',
  product: 'Produk',
}

const getEntityLabel = (entityType: string | null) => {
  if (!entityType) return ''
  const lower = entityType.toLowerCase()
  return ENTITY_LABELS[lower] || entityType
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalLogs, setTotalLogs] = useState(0)

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '25')
      if (search.trim()) params.set('search', search.trim())
      if (actionFilter) params.set('action', actionFilter)

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal memuat log aktivitas.')
      }

      setLogs(data.logs || [])
      setTotalPages(data.totalPages || 1)
      setTotalLogs(data.total || 0)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan pada server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page, actionFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchLogs()
  }

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'ORDER_CREATED':
      case 'ORDER_RECEIVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300'
      case 'COURIER_ASSIGNED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300'
      case 'ORDER_CANCELLED':
      case 'USER_DELETED':
        return 'bg-rose-100 text-rose-800 border-rose-300'
      case 'RETURN_REQUESTED':
        return 'bg-sky-100 text-sky-800 border-sky-300'
      case 'RETURN_APPROVED':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'USER_ROLE_UPDATED':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'ORDER_UPDATED':
      case 'RETURN_STATUS_UPDATED':
        return 'bg-amber-100 text-amber-800 border-amber-300'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300'
    }
  }

  return (
    <div className="min-h-screen bg-zinc-100 py-4 sm:py-8 px-3 sm:px-6 lg:px-8 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-zinc-200">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-purple-700 shrink-0" />
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">Log Aktivitas Sistem (Audit Logs)</h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-600 mt-1">
              Rekam jejak aktivitas penting, perubahan status pesanan, persetujuan retur, dan manajemen hak akses pengguna.
            </p>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            suppressHydrationWarning
            className="mt-4 md:mt-0 flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Log
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-auto flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
              <input
                type="text"
                placeholder="Cari email, aksi, atau ID entitas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-sm font-medium rounded-lg transition"
            >
              Cari
            </button>
          </form>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <Filter className="w-4 h-4 text-zinc-400" />
              <span>Aksi:</span>
            </div>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value)
                setPage(1)
              }}
              className="border border-zinc-300 rounded-lg text-sm px-3 py-2 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 font-medium"
            >
              <option value="" className="text-zinc-900 bg-white">Semua Aksi</option>
              <option value="ORDER_CREATED" className="text-zinc-900 bg-white">Pesanan Dibuat (ORDER_CREATED)</option>
              <option value="ORDER_RECEIVED" className="text-zinc-900 bg-white">Pesanan Diterima (ORDER_RECEIVED)</option>
              <option value="COURIER_ASSIGNED" className="text-zinc-900 bg-white">Penugasan Kurir (COURIER_ASSIGNED)</option>
              <option value="ORDER_CANCELLED" className="text-zinc-900 bg-white">Pesanan Dibatalkan (ORDER_CANCELLED)</option>
              <option value="ORDER_UPDATED" className="text-zinc-900 bg-white">Pesanan Diperbarui (ORDER_UPDATED)</option>
              <option value="RETURN_REQUESTED" className="text-zinc-900 bg-white">Pengajuan Retur (RETURN_REQUESTED)</option>
              <option value="RETURN_APPROVED" className="text-zinc-900 bg-white">Retur Disetujui (RETURN_APPROVED)</option>
              <option value="RETURN_STATUS_UPDATED" className="text-zinc-900 bg-white">Status Retur Diperbarui (RETURN_STATUS_UPDATED)</option>
              <option value="USER_ROLE_UPDATED" className="text-zinc-900 bg-white">Role Pengguna Diperbarui (USER_ROLE_UPDATED)</option>
              <option value="USER_DELETED" className="text-zinc-900 bg-white">Pengguna Dihapus (USER_DELETED)</option>
            </select>
          </div>
        </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
          <Info className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-700">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
              <tr>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Pengguna</th>
                <th className="px-4 py-3">Aksi</th>
                <th className="px-4 py-3">Entitas</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-zinc-400">
                    Memuat data log aktivitas...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-zinc-400">
                    Tidak ditemukan log aktivitas yang sesuai.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50/80 transition">
                    <td className="px-4 py-3.5 whitespace-nowrap text-zinc-600 font-mono text-xs">
                      <div className="flex items-center gap-1.5" suppressHydrationWarning>
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        {formatDateTime(log.created_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-zinc-400" />
                          {log.user_email || 'Sistem / Tamu'}
                        </span>
                        {log.user_role && (
                          <span className="text-xs text-zinc-400 capitalize">
                            Role: {log.user_role}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {log.entity_type ? (
                        <span className="capitalize font-mono text-xs text-zinc-700">
                          {getEntityLabel(log.entity_type)} #{log.entity_id}
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs font-mono text-zinc-500">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium rounded-md transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Lihat
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="bg-zinc-50 px-4 py-3 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-zinc-600">
          <div>
            Menampilkan <span className="font-semibold text-zinc-900">{logs.length}</span> dari{' '}
            <span className="font-semibold text-zinc-900">{totalLogs}</span> total log.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-zinc-300 hover:bg-white disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium">
              Halaman {page} dari {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-zinc-300 hover:bg-white disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Detail JSON */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-zinc-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-zinc-900" />
                <h3 className="font-bold text-zinc-900 text-lg">Detail Log #{selectedLog.id}</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-zinc-400 hover:text-zinc-600 font-bold p-1 rounded hover:bg-zinc-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-zinc-400 text-xs block">Waktu:</span>
                <span className="font-mono text-zinc-800" suppressHydrationWarning>
                  {formatDateTime(selectedLog.created_at)}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 text-xs block">Pelaku (User):</span>
                <span className="font-medium text-zinc-900">
                  {selectedLog.user_email || 'Sistem'} ({selectedLog.user_role || 'N/A'})
                </span>
              </div>
              <div>
                <span className="text-zinc-400 text-xs block">Aksi / Entitas:</span>
                <span className="font-mono font-semibold text-zinc-800">
                  {getActionLabel(selectedLog.action)} ({selectedLog.action}){' '}
                  {selectedLog.entity_type ? `- ${getEntityLabel(selectedLog.entity_type)} #${selectedLog.entity_id}` : ''}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 text-xs block mb-1">Raw Payload / Details:</span>
                <pre className="bg-zinc-900 text-zinc-100 text-xs p-3 rounded-lg overflow-x-auto font-mono max-h-60">
                  {selectedLog.details
                    ? (() => {
                        try {
                          return JSON.stringify(JSON.parse(selectedLog.details), null, 2)
                        } catch {
                          return selectedLog.details
                        }
                      })()
                    : 'Tidak ada detail tambahan.'}
                </pre>
              </div>
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-medium transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

