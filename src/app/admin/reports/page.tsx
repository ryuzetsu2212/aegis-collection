'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice, getCustomerDisplayName } from '@/lib/utils'
import {
  Loader2,
  ShoppingBag,
  DollarSign,
  Store,
  Truck,
  Trophy,
  ArrowRight,
  Filter,
  Calendar,
  RefreshCw,
  TrendingUp,
  Clock,
  CalendarDays,
  CalendarRange,
  Printer,
  BarChart3,
} from 'lucide-react'

interface TopProduct {
  id: number
  title: string
  image_url: string
  total_sold: number
  total_sales: number
}

interface ChartPoint {
  date: string
  revenue: number
  orders: number
}

interface RecentOrder {
  id: number
  total_amount: number
  status: string
  purchase_type: string
  payment_method: string
  created_at: string
  user_full_name: string | null
  user_email: string
}

interface RevenueBreakdown {
  revenueToday: number
  revenueThisWeek: number
  revenueThisMonth: number
  revenueThisYear: number
  ordersToday: number
  ordersThisWeek: number
  ordersThisMonth: number
  ordersThisYear: number
}

interface FilteredStats {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  completedOrders: number
  directOrders: number
  onlineOrders: number
}

const STATUS_BADGES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  pending_confirmation: 'bg-blue-100 text-blue-800',
  paid: 'bg-emerald-100 text-emerald-800',
  shipped: 'bg-purple-100 text-purple-800',
  completed: 'bg-zinc-100 text-zinc-800',
  cancelled: 'bg-rose-100 text-rose-800',
}

export default function AdminReportsPage() {
  const [breakdown, setBreakdown] = useState<RevenueBreakdown>({
    revenueToday: 0,
    revenueThisWeek: 0,
    revenueThisMonth: 0,
    revenueThisYear: 0,
    ordersToday: 0,
    ordersThisWeek: 0,
    ordersThisMonth: 0,
    ordersThisYear: 0,
  })

  const [filteredStats, setFilteredStats] = useState<FilteredStats>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    directOrders: 0,
    onlineOrders: 0,
  })

  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter States
  const [presetPeriod, setPresetPeriod] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [purchaseType, setPurchaseType] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [minAmount, setMinAmount] = useState<string>('')
  const [maxAmount, setMaxAmount] = useState<string>('')

  useEffect(() => {
    fetchStats()
  }, [startDate, endDate, purchaseType, statusFilter, minAmount, maxAmount])

  // Handle Preset Date Filter
  const handlePresetChange = (preset: string) => {
    setPresetPeriod(preset)
    const today = new Date()
    const formatDate = (d: Date) => d.toISOString().split('T')[0]

    if (preset === 'today') {
      setStartDate(formatDate(today))
      setEndDate(formatDate(today))
    } else if (preset === 'week') {
      const startOfWeek = new Date(today)
      const day = today.getDay()
      const diff = today.getDate() - day + (day === 0 ? -6 : 1)
      startOfWeek.setDate(diff)
      setStartDate(formatDate(startOfWeek))
      setEndDate(formatDate(today))
    } else if (preset === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      setStartDate(formatDate(startOfMonth))
      setEndDate(formatDate(today))
    } else if (preset === 'year') {
      const startOfYear = new Date(today.getFullYear(), 0, 1)
      setStartDate(formatDate(startOfYear))
      setEndDate(formatDate(today))
    } else {
      setStartDate('')
      setEndDate('')
    }
  }

  const handleResetFilters = () => {
    setPresetPeriod('all')
    setStartDate('')
    setEndDate('')
    setPurchaseType('all')
    setStatusFilter('all')
    setMinAmount('')
    setMaxAmount('')
  }

  async function fetchStats() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (startDate) params.set('start_date', startDate)
      if (endDate) params.set('end_date', endDate)
      if (purchaseType !== 'all') params.set('purchase_type', purchaseType)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (minAmount) params.set('min_amount', minAmount)
      if (maxAmount) params.set('max_amount', maxAmount)

      const res = await fetch(`/api/reports/stats?${params.toString()}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Gagal memuat laporan statistik.')
      }
      const data = await res.json()

      if (data.breakdown) setBreakdown(data.breakdown)
      if (data.filteredStats) setFilteredStats(data.filteredStats)
      setTopProducts(data.topProducts || [])
      setRecentOrders(data.recentOrders || [])
      setChartData(data.chartData || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat laporan.')
    } finally {
      setLoading(false)
    }
  }

  // Cetak Laporan PDF Per Periode (Hari Ini, Minggu Ini, Bulan Ini, Tahun Ini)
  const handlePrintTimeframe = (period: 'today' | 'week' | 'month' | 'year') => {
    let title = ''
    let revenueAmount = 0
    let totalOrders = 0

    if (period === 'today') {
      title = 'Laporan Pendapatan Hari Ini'
      revenueAmount = breakdown.revenueToday
      totalOrders = breakdown.ordersToday
    } else if (period === 'week') {
      title = 'Laporan Pendapatan Minggu Ini'
      revenueAmount = breakdown.revenueThisWeek
      totalOrders = breakdown.ordersThisWeek
    } else if (period === 'month') {
      title = 'Laporan Pendapatan Bulan Ini'
      revenueAmount = breakdown.revenueThisMonth
      totalOrders = breakdown.ordersThisMonth
    } else if (period === 'year') {
      title = 'Laporan Pendapatan Tahun Ini'
      revenueAmount = breakdown.revenueThisYear
      totalOrders = breakdown.ordersThisYear
    }

    const todayStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const ordersRowsHtml = recentOrders.length === 0
      ? '<tr><td colspan="6" style="text-align:center; padding:15px; color:#71717a;">Belum ada rincian pesanan tercatat.</td></tr>'
      : recentOrders.map((o) => `
        <tr>
          <td>#${o.id}</td>
          <td>${new Date(o.created_at).toLocaleDateString('id-ID')}</td>
          <td>${getCustomerDisplayName(o)}</td>
          <td>${o.purchase_type === 'direct' ? 'Langsung Toko (Kasir)' : 'Online (Kurir)'}</td>
          <td>${o.status.toUpperCase()}</td>
          <td style="font-weight:700; text-align:right;">${formatPrice(o.total_amount)}</td>
        </tr>
      `).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - Aegis Collection</title>
          <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 25px; color: #09090b; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #09090b; padding-bottom: 12px; margin-bottom: 20px; }
            .brand { font-size: 20px; font-weight: 900; letter-spacing: 1px; color: #18181b; }
            .sub-brand { font-size: 11px; color: #71717a; margin-top: 2px; }
            .report-title { font-size: 16px; font-weight: 800; color: #6b21a8; text-transform: uppercase; margin-top: 6px; }
            .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
            .kpi-card { border: 1px solid #e4e4e7; background: #fafafa; padding: 14px; border-radius: 8px; }
            .kpi-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #71717a; }
            .kpi-val { font-size: 22px; font-weight: 900; color: #09090b; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #e4e4e7; padding: 7px 10px; font-size: 11px; text-align: left; }
            th { background: #f4f4f5; font-weight: 700; text-transform: uppercase; font-size: 10px; }
            .footer-sign { margin-top: 45px; display: flex; justify-content: space-between; font-size: 11px; }
            .sign-box { text-align: center; width: 180px; }
            .sign-space { height: 50px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">AEGIS COLLECTION BENGKALIS</div>
              <div class="sub-brand">Toko Pakaian & Fashion Terpercaya</div>
              <div class="report-title">${title}</div>
            </div>
            <div style="text-align: right; font-size: 11px; color: #71717a;">
              <div><strong>Tanggal Cetak:</strong> ${todayStr}</div>
              <div><strong>Status Sistem:</strong> Terverifikasi (Official)</div>
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">TOTAL PENDAPATAN (${period.toUpperCase()})</div>
              <div class="kpi-val">${formatPrice(revenueAmount)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">TOTAL TRANSAKSI MASUK</div>
              <div class="kpi-val">${totalOrders} Pesanan</div>
            </div>
          </div>

          <div style="font-weight: 700; font-size: 12px; margin-bottom: 6px;">Rincian Transaksi Terbaru Terkait</div>
          <table>
            <thead>
              <tr>
                <th>No. Order</th>
                <th>Tanggal</th>
                <th>Nama Pelanggan</th>
                <th>Tipe Pembelian</th>
                <th>Status</th>
                <th style="text-align:right;">Nominal Total</th>
              </tr>
            </thead>
            <tbody>
              ${ordersRowsHtml}
            </tbody>
          </table>

          <div class="footer-sign">
            <div class="sign-box">
              <div>Diperiksa Oleh:</div>
              <div class="sign-space"></div>
              <div>( _____________________ )<br/>Staff Toko</div>
            </div>
            <div class="sign-box">
              <div>Disetujui Oleh:</div>
              <div class="sign-space"></div>
              <div>( _____________________ )<br/>Administrator</div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="min-h-screen bg-zinc-100 py-4 sm:py-8 px-3 sm:px-6 lg:px-8 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 w-full max-w-full overflow-hidden">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-purple-700 shrink-0" />
              <span>Dashboard & Ringkasan Laporan Admin</span>
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Analisis statistik pendapatan, rincian periode, dan performa penjualan produk
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* 1. RINGKASAN PENDAPATAN HARI INI, MINGGU INI, BULAN INI, TAHUN INI */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-purple-600" />
              <span>Ringkasan Pendapatan Berdasarkan Waktu</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Hari Ini */}
            <div className="bg-white border border-emerald-200 rounded-2xl p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider">
                    Hari Ini
                  </span>
                  <Clock className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-base sm:text-2xl font-extrabold text-zinc-900 tabular-nums truncate">
                  {formatPrice(breakdown.revenueToday)}
                </p>
                <p className="text-[10px] sm:text-xs text-zinc-500 mt-1">
                  {breakdown.ordersToday} pesanan masuk
                </p>
              </div>

              <button
                type="button"
                onClick={() => handlePrintTimeframe('today')}
                className="mt-3.5 w-full py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Cetak Laporan Hari Ini (PDF)</span>
              </button>
            </div>

            {/* Minggu Ini */}
            <div className="bg-white border border-blue-200 rounded-2xl p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] sm:text-xs font-bold text-blue-700 uppercase tracking-wider">
                    Minggu Ini
                  </span>
                  <CalendarDays className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-base sm:text-2xl font-extrabold text-zinc-900 tabular-nums truncate">
                  {formatPrice(breakdown.revenueThisWeek)}
                </p>
                <p className="text-[10px] sm:text-xs text-zinc-500 mt-1">
                  {breakdown.ordersThisWeek} pesanan masuk
                </p>
              </div>

              <button
                type="button"
                onClick={() => handlePrintTimeframe('week')}
                className="mt-3.5 w-full py-1.5 px-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Cetak Laporan Minggu Ini (PDF)</span>
              </button>
            </div>

            {/* Bulan Ini */}
            <div className="bg-white border border-purple-200 rounded-2xl p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] sm:text-xs font-bold text-purple-700 uppercase tracking-wider">
                    Bulan Ini
                  </span>
                  <Calendar className="h-4 w-4 text-purple-500" />
                </div>
                <p className="text-base sm:text-2xl font-extrabold text-zinc-900 tabular-nums truncate">
                  {formatPrice(breakdown.revenueThisMonth)}
                </p>
                <p className="text-[10px] sm:text-xs text-zinc-500 mt-1">
                  {breakdown.ordersThisMonth} pesanan masuk
                </p>
              </div>

              <button
                type="button"
                onClick={() => handlePrintTimeframe('month')}
                className="mt-3.5 w-full py-1.5 px-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Cetak Laporan Bulan Ini (PDF)</span>
              </button>
            </div>

            {/* Tahun Ini */}
            <div className="bg-white border border-amber-200 rounded-2xl p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] sm:text-xs font-bold text-amber-700 uppercase tracking-wider">
                    Tahun Ini
                  </span>
                  <CalendarRange className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-base sm:text-2xl font-extrabold text-zinc-900 tabular-nums truncate">
                  {formatPrice(breakdown.revenueThisYear)}
                </p>
                <p className="text-[10px] sm:text-xs text-zinc-500 mt-1">
                  {breakdown.ordersThisYear} pesanan masuk
                </p>
              </div>

              <button
                type="button"
                onClick={() => handlePrintTimeframe('year')}
                className="mt-3.5 w-full py-1.5 px-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Cetak Laporan Tahun Ini (PDF)</span>
              </button>
            </div>
          </div>
        </div>

        {/* 1.5. GRAFIK VISUAL TREND PENDAPATAN HARIAN */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h2 className="text-xs sm:text-sm font-bold text-zinc-900 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-600 shrink-0" />
              <span>Grafik Visual Trend Pendapatan Harian (30 Hari Terakhir)</span>
            </h2>
            <span className="text-[10px] sm:text-xs font-semibold text-zinc-400">
              {chartData.length} hari tercatat
            </span>
          </div>

          {chartData.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-8">Belum ada data grafik trend pendapatan.</p>
          ) : (
            <div className="pt-2">
              <div className="h-48 sm:h-56 flex items-end justify-between gap-0.5 sm:gap-1.5 border-b border-zinc-200 pb-2 px-1">
                {(() => {
                  const maxRev = Math.max(...chartData.map((c) => c.revenue), 1)
                  return chartData.map((item) => {
                    const heightPercent = Math.max(Math.round((item.revenue / maxRev) * 100), item.revenue > 0 ? 6 : 2)
                    const dayLabel = new Date(item.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                    return (
                      <div key={item.date} className="h-full flex-1 flex flex-col justify-end items-center gap-1 group relative min-w-0">
                        {/* Tooltip Hover */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                          <div className="bg-zinc-900 text-white text-[10px] py-1 px-2.5 rounded-lg shadow-lg whitespace-nowrap font-medium text-center">
                            <div className="font-bold">{dayLabel}</div>
                            <div className="text-emerald-300 font-bold">{formatPrice(item.revenue)}</div>
                            <div className="text-zinc-400">{item.orders} pesanan</div>
                          </div>
                        </div>

                        {/* Bar Visual */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full max-w-[16px] sm:max-w-[24px] rounded-t-xs sm:rounded-t-sm transition-all group-hover:brightness-110 ${
                            item.revenue > 0
                              ? 'bg-gradient-to-t from-purple-700 to-indigo-500 shadow-xs'
                              : 'bg-zinc-100 border border-zinc-200'
                          }`}
                        />
                      </div>
                    )
                  })
                })()}
              </div>

              {/* Labels Axis X */}
              <div className="flex justify-between gap-0.5 sm:gap-1.5 pt-2 text-[9px] sm:text-[10px] font-semibold text-zinc-500">
                {chartData.map((item) => (
                  <span key={item.date} className="flex-1 text-center truncate">
                    {new Date(item.date + 'T00:00:00').getDate()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2. FILTER INTERAKTIF LAPORAN (PERIODE TANGGAL, HARGA, STATUS, DLL) */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
            <h2 className="text-xs sm:text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Filter className="h-4 w-4 text-purple-600 shrink-0" />
              <span>Filter Laporan Lanjutan & Pencarian Data</span>
            </h2>

            <button
              onClick={handleResetFilters}
              className="text-xs text-purple-700 font-bold hover:text-purple-900 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-bold text-zinc-500 mr-1">Preset Periode:</span>
            {[
              { id: 'all', label: 'Semua Waktu' },
              { id: 'today', label: 'Hari Ini' },
              { id: 'week', label: '7 Hari Terakhir' },
              { id: 'month', label: 'Bulan Ini' },
              { id: 'year', label: 'Tahun Ini' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetChange(p.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  presetPeriod === p.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Form Inputs Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            {/* Tanggal Mulai */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 mb-1">Dari Tanggal</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setPresetPeriod('custom')
                  setStartDate(e.target.value)
                }}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            {/* Tanggal Selesai */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 mb-1">Sampai Tanggal</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setPresetPeriod('custom')
                  setEndDate(e.target.value)
                }}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            {/* Jenis Pembelian */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 mb-1">Tipe Pembelian</label>
              <select
                value={purchaseType}
                onChange={(e) => setPurchaseType(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="all">Semua Tipe</option>
                <option value="direct">Langsung Toko (Kasir)</option>
                <option value="online">Online (Kurir)</option>
              </select>
            </div>

            {/* Status Pesanan */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 mb-1">Status Pesanan</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="all">Semua Status</option>
                <option value="completed">Completed (Selesai)</option>
                <option value="paid">Paid (Terbayar)</option>
                <option value="shipped">Shipped (Dikirim)</option>
                <option value="pending">Pending (Menunggu)</option>
                <option value="cancelled">Cancelled (Dibatalkan)</option>
              </select>
            </div>

            {/* Rentang Harga Min/Max */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 mb-1">Nominal Order (Min - Max)</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  placeholder="Min Rp"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="w-1/2 bg-zinc-50 border border-zinc-200 rounded-xl px-2 py-1.5 text-xs text-zinc-900 focus:outline-none"
                />
                <span className="text-zinc-400 text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max Rp"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="w-1/2 bg-zinc-50 border border-zinc-200 rounded-xl px-2 py-1.5 text-xs text-zinc-900 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. HASIL STATISTIK SESUAI FILTER */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-full">
              {/* Total Pendapatan Toko Filtered */}
              <div className="bg-white border border-emerald-200 rounded-xl p-3.5 sm:p-5 flex items-start gap-3 sm:gap-4 shadow-sm max-w-full overflow-hidden">
                <div className="p-2 sm:p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 shrink-0">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider truncate">
                    Pendapatan (Filtered)
                  </p>
                  <p className="text-lg sm:text-xl font-extrabold text-zinc-900 mt-0.5 sm:mt-1 tabular-nums truncate">
                    {formatPrice(filteredStats.totalRevenue)}
                  </p>
                </div>
              </div>

              {/* Total Keseluruhan Pesanan Filtered */}
              <div className="bg-white border border-blue-200 rounded-xl p-3.5 sm:p-5 flex items-start gap-3 sm:gap-4 shadow-sm max-w-full overflow-hidden">
                <div className="p-2 sm:p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 shrink-0">
                  <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider truncate">
                    Total Pesanan
                  </p>
                  <p className="text-lg sm:text-xl font-extrabold text-zinc-900 mt-0.5 sm:mt-1 tabular-nums truncate">
                    {filteredStats.totalOrders} Pesanan
                  </p>
                </div>
              </div>

              {/* Pembelian Langsung Toko */}
              <div className="bg-white border border-amber-200 rounded-xl p-3.5 sm:p-5 flex items-start gap-3 sm:gap-4 shadow-sm max-w-full overflow-hidden">
                <div className="p-2 sm:p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 shrink-0">
                  <Store className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider truncate">
                    Langsung di Toko
                  </p>
                  <p className="text-lg sm:text-xl font-extrabold text-zinc-900 mt-0.5 sm:mt-1 tabular-nums truncate">
                    {filteredStats.directOrders} Pesanan
                  </p>
                </div>
              </div>

              {/* Pembelian Online (Kurir) */}
              <div className="bg-white border border-purple-200 rounded-xl p-3.5 sm:p-5 flex items-start gap-3 sm:gap-4 shadow-sm max-w-full overflow-hidden">
                <div className="p-2 sm:p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 shrink-0">
                  <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider truncate">
                    Online (Kurir)
                  </p>
                  <p className="text-lg sm:text-xl font-extrabold text-zinc-900 mt-0.5 sm:mt-1 tabular-nums truncate">
                    {filteredStats.onlineOrders} Pesanan
                  </p>
                </div>
              </div>
            </div>

            {/* 4. TOP PRODUCTS & RECENT ORDERS LIST */}
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 max-w-full">
              {/* Top Products */}
              <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-4 max-w-full overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 border-b border-zinc-100 pb-3">
                  <h2 className="text-xs sm:text-sm font-bold text-zinc-900 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500 shrink-0" /> Top 5 Produk Terlaris (Best Seller)
                  </h2>
                  <span className="text-[10px] sm:text-[11px] text-zinc-400 font-medium">
                    Berdasarkan Total Terjual
                  </span>
                </div>

                {topProducts.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-6">
                    Belum ada data penjualan terkonfirmasi untuk filter ini.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {topProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center gap-2.5 sm:gap-3 text-xs min-w-0 max-w-full">
                        <span className="font-bold text-zinc-400 w-4 text-center shrink-0">#{index + 1}</span>
                        <div className="w-9 h-9 sm:w-10 sm:h-10 relative bg-zinc-100 rounded-md overflow-hidden shrink-0 border border-zinc-200">
                          <Image src={product.image_url} alt={product.title} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 pr-1">
                          <p className="font-semibold text-zinc-900 truncate text-xs">{product.title}</p>
                          <p className="text-[10px] sm:text-[11px] text-zinc-500">{product.total_sold} pcs terjual</p>
                        </div>
                        <div className="font-bold text-zinc-900 tabular-nums text-xs shrink-0 text-right">
                          {formatPrice(product.total_sales)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Orders */}
              <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-4 max-w-full overflow-hidden">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <h2 className="text-xs sm:text-sm font-bold text-zinc-900 flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-blue-600 shrink-0" /> Pesanan Terbaru Masuk
                  </h2>
                  <Link
                    href="/staff/orders"
                    className="text-[10px] sm:text-[11px] text-blue-600 hover:underline font-semibold flex items-center gap-1 shrink-0"
                  >
                    Lihat Semua <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                {recentOrders.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-6">
                    Belum ada pesanan untuk filter ini.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between gap-2 text-xs border-b border-zinc-50 pb-2.5 last:border-none min-w-0 max-w-full"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-bold text-zinc-900 shrink-0">#{order.id}</span>
                            <span className="text-zinc-500 font-medium truncate text-xs">
                              {getCustomerDisplayName(order)}
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5 truncate">
                            {new Date(order.created_at).toLocaleDateString('id-ID')} •{' '}
                            {order.purchase_type === 'direct' ? 'Langsung Toko' : 'Online Kurir'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold ${
                              STATUS_BADGES[order.status] || 'bg-zinc-100'
                            }`}
                          >
                            {order.status}
                          </span>
                          <p className="font-bold text-zinc-900 tabular-nums text-xs mt-0.5">
                            {formatPrice(order.total_amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}