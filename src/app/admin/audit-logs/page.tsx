'use client'

import { useState, useEffect } from 'react'
import {
  ShieldAlert,
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Info,
  RefreshCw,
  FileText,
} from 'lucide-react'
import { formatChatTime } from '@/lib/formatDate'

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
  COURIER_ASSIGNED: 'Penugasan Kurir',
  ORDER_CANCELLED: 'Pesanan Dibatalkan',
  ORDER_UPDATED: 'Pesanan Diperbarui',
  RETURN_REQUESTED: 'Pengajuan Retur',
  RETURN_APPROVED: 'Retur Disetujui',
  RETURN_STATUS_UPDATED: 'Status Retur Diperbarui',
  USER_ROLE_UPDATED: 'Role Pengguna Diperbarui',
  USER_DELETED: 'Pengguna Dihapus',
}

const ENTITY_LABELS: Record<string, string> = {
  orders: 'Pesanan',
  users: 'Pengguna',
  return_requests: 'Retur',
}

function getActionLabel(action: string): string {
  return ACTION_LABELS[action] || action
}

function getEntityLabel(entityType: string): string {
  return ENTITY_LABELS[entityType] || entityType
}

function formatDateTime(isoString: string): string {
  if (!isoString) return '-'
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return isoString
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalLogs, setTotalLogs] = useState(0)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      })
      if (search.trim()) query.append('search', search.trim())
      if (actionFilter) query.append('action', actionFilter)

      const res = await fetch(`/api/admin/audit-logs?${query.toString()}`)
      const data = await res.json()

      if (res.ok) {
        setLogs(data.logs || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalLogs(data.pagination?.totalLogs || 0)
      } else {
        setError(data.error || 'Gagal memuat log aktivitas')
      }
    } catch (err: any) {
      setError('Terjadi kesalahan koneksi saat mengambil log aktivitas.')
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
        {/* Header Card */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-purple-700 shrink-0" />
              <h1 className="text-lg sm:text-2xl font-bold text-zinc-900 tracking-tight">
                Log Aktivitas Sistem (Audit Logs)
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-600 mt-1">
              Rekam jejak aktivitas penting, perubahan status pesanan, persetujuan retur, dan manajemen hak akses.
            </p>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            suppressHydrationWarning
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer disabled:opacity-50 shrink-0 w-full sm:w-auto shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Log</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col md:flex-row gap-3 sm:gap-4 justify-between items-stretch md:items-center">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-auto flex-1 max-w-md">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
              <input
                type="text"
                placeholder="Cari email, aksi, atau ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-zinc-300 rounded-xl text-xs sm:text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 truncate"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer shrink-0"
            >
              Cari
            </button>
          </form>

          {/* Action Filter Select */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-zinc-700 shrink-0">
              <Filter className="w-4 h-4 text-zinc-500" />
              <span>Filter Aksi:</span>
            </div>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value)
                setPage(1)
              }}
              className="w-full max-w-full border border-zinc-300 rounded-xl text-xs sm:text-sm px-3 py-2 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 font-semibold cursor-pointer truncate"
            >
              <option value="">Semua Aksi</option>
              <option value="ORDER_CREATED">Pesanan Dibuat (ORDER_CREATED)</option>
              <option value="ORDER_RECEIVED">Pesanan Diterima (ORDER_RECEIVED)</option>
              <option value="COURIER_ASSIGNED">Penugasan Kurir (COURIER_ASSIGNED)</option>
              <option value="ORDER_CANCELLED">Pesanan Dibatalkan (ORDER_CANCELLED)</option>
              <option value="ORDER_UPDATED">Pesanan Diperbarui (ORDER_UPDATED)</option>
              <option value="RETURN_REQUESTED">Pengajuan Retur (RETURN_REQUESTED)</option>
              <option value="RETURN_APPROVED">Retur Disetujui (RETURN_APPROVED)</option>
              <option value="RETURN_STATUS_UPDATED">Status Retur Diperbarui (RETURN_STATUS_UPDATED)</option>
              <option value="USER_ROLE_UPDATED">Role Pengguna Diperbarui (USER_ROLE_UPDATED)</option>
              <option value="USER_DELETED">Pengguna Dihapus (USER_DELETED)</option>
            </select>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm flex items-center gap-2">
            <Info className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Mobile View: Cards (Hidden on sm screens, visible on HP screens) */}
        <div className="block sm:hidden space-y-3">
          {loading ? (
            <div className="bg-white p-8 rounded-2xl border border-zinc-200 text-center text-xs text-zinc-400">
              Memuat data log aktivitas...
            </div>
          ) : logs.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-zinc-200 text-center text-xs text-zinc-400">
              Tidak ditemukan log aktivitas yang sesuai.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border truncate ${getActionBadgeColor(
                      log.action
                    )}`}
                  >
                    {getActionLabel(log.action)}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    {formatDateTime(log.created_at)}
                  </span>
                </div>

                <div className="text-xs text-zinc-900 font-bold flex items-center gap-1.5 pt-0.5">
                  <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate">{log.user_email || 'Sistem / Tamu'}</span>
                  {log.user_role && (
                    <span className="text-[10px] text-zinc-400 capitalize shrink-0 font-normal">
                      ({log.user_role})
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-100">
                  <div className="text-zinc-600 font-mono text-[11px]">
                    {log.entity_type ? `${getEntityLabel(log.entity_type)} #${log.entity_id}` : '-'}
                  </div>
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Detail</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table (Hidden on HP screens, visible on sm screens) */}
        <div className="hidden sm:block bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden mb-6">
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
                          className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium rounded-md transition cursor-pointer"
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
                className="p-1.5 rounded-lg border border-zinc-300 hover:bg-white disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium">
                Halaman {page} dari {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-zinc-300 hover:bg-white disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Detail JSON */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-700" />
                  <h3 className="font-bold text-zinc-900 text-base sm:text-lg">Detail Log #{selectedLog.id}</h3>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-zinc-400 hover:text-zinc-600 font-bold p-1 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
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
                  <pre className="bg-zinc-900 text-zinc-100 text-xs p-3 rounded-xl overflow-x-auto font-mono max-h-60">
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
                  className="w-full sm:w-auto px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
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
