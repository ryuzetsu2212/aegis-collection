import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/db'
import { requireRole } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    await requireRole(['admin'])

    const supabase = getSupabase()
    const { searchParams } = new URL(request.url)

    const startDate = searchParams.get('start_date') || ''
    const endDate = searchParams.get('end_date') || ''
    const purchaseType = searchParams.get('purchase_type') || 'all'
    const statusFilter = searchParams.get('status') || 'all'
    const minAmount = searchParams.get('min_amount') || ''
    const maxAmount = searchParams.get('max_amount') || ''

    // 1. Fetch all orders with users for breakdown & stats
    const { data: allOrders, error: ordersErr } = await supabase
      .from('orders')
      .select('*, users(full_name, email)')
      .order('created_at', { ascending: false })

    if (ordersErr) throw new Error(ordersErr.message)

    const orders = allOrders || []
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]

    // Get week start (Monday)
    const d = new Date(now)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const weekStart = new Date(d.setDate(diff))
    weekStart.setHours(0, 0, 0, 0)

    const monthStr = todayStr.substring(0, 7)
    const yearStr = todayStr.substring(0, 4)

    let revenueToday = 0, revenueThisWeek = 0, revenueThisMonth = 0, revenueThisYear = 0
    let ordersToday = 0, ordersThisWeek = 0, ordersThisMonth = 0, ordersThisYear = 0

    orders.forEach(o => {
      const createdAt = new Date(o.created_at)
      const dateStr = o.created_at ? o.created_at.split('T')[0] : ''
      const isPaid = ['paid', 'shipped', 'completed'].includes(o.status)

      if (dateStr === todayStr) {
        ordersToday++
        if (isPaid) revenueToday += Number(o.total_amount) || 0
      }

      if (createdAt >= weekStart) {
        ordersThisWeek++
        if (isPaid) revenueThisWeek += Number(o.total_amount) || 0
      }

      if (dateStr.startsWith(monthStr)) {
        ordersThisMonth++
        if (isPaid) revenueThisMonth += Number(o.total_amount) || 0
      }

      if (dateStr.startsWith(yearStr)) {
        ordersThisYear++
        if (isPaid) revenueThisYear += Number(o.total_amount) || 0
      }
    })

    // 2. Filter orders based on query parameters
    const filteredOrders = orders.filter(o => {
      const dateStr = o.created_at ? o.created_at.split('T')[0] : ''
      if (startDate && dateStr < startDate) return false
      if (endDate && dateStr > endDate) return false
      if (purchaseType !== 'all' && o.purchase_type !== purchaseType) return false
      if (statusFilter !== 'all' && o.status !== statusFilter) return false
      if (minAmount && !isNaN(Number(minAmount)) && Number(o.total_amount) < Number(minAmount)) return false
      if (maxAmount && !isNaN(Number(maxAmount)) && Number(o.total_amount) > Number(maxAmount)) return false
      return true
    })

    let totalOrders = filteredOrders.length
    let totalRevenue = 0
    let pendingOrders = 0
    let completedOrders = 0
    let directOrders = 0
    let onlineOrders = 0

    filteredOrders.forEach(o => {
      const amt = Number(o.total_amount) || 0
      if (['paid', 'shipped', 'completed'].includes(o.status)) {
        totalRevenue += amt
      }
      if (['pending', 'pending_confirmation'].includes(o.status)) {
        pendingOrders++
      }
      if (o.status === 'completed') {
        completedOrders++
      }
      if (o.purchase_type === 'direct') {
        directOrders++
      } else {
        onlineOrders++
      }
    })

    // 3. Top Products
    const validOrderIds = new Set(filteredOrders.filter(o => ['paid', 'shipped', 'completed'].includes(o.status)).map(o => o.id))
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('*, product_variants(*, products(id, title, image_url))')

    const productSalesMap: Record<number, { id: number; title: string; image_url: string; total_sold: number; total_sales: number }> = {}

    if (orderItems) {
      orderItems.forEach(item => {
        if (validOrderIds.has(item.order_id)) {
          const p = item.product_variants?.products
          if (p) {
            if (!productSalesMap[p.id]) {
              productSalesMap[p.id] = {
                id: p.id,
                title: p.title,
                image_url: p.image_url,
                total_sold: 0,
                total_sales: 0,
              }
            }
            const qty = Number(item.quantity) || 0
            const price = Number(item.price_at_purchase) || 0
            productSalesMap[p.id].total_sold += qty
            productSalesMap[p.id].total_sales += qty * price
          }
        }
      })
    }

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, 5)

    // 4. Recent Orders
    const recentOrders = filteredOrders.slice(0, 10).map(o => ({
      id: o.id,
      total_amount: o.total_amount,
      status: o.status,
      purchase_type: o.purchase_type || 'online',
      payment_method: o.payment_method || 'cod',
      created_at: o.created_at,
      user_full_name: o.users?.full_name || 'Pelanggan',
      user_email: o.users?.email || '',
    }))

    // 5. Daily Revenue Trend Chart Data (Last 30 Days Continuous)
    const dbMap = new Map<string, { revenue: number; orders: number }>()
    orders.forEach(o => {
      const dateStr = o.created_at ? o.created_at.split('T')[0] : ''
      if (dateStr) {
        const cur = dbMap.get(dateStr) || { revenue: 0, orders: 0 }
        cur.orders++
        if (['paid', 'shipped', 'completed'].includes(o.status)) {
          cur.revenue += Number(o.total_amount) || 0
        }
        dbMap.set(dateStr, cur)
      }
    })

    const chartData: Array<{ date: string; revenue: number; orders: number }> = []
    const todayDate = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(todayDate)
      d.setDate(d.getDate() - i)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      const existing = dbMap.get(dateStr)
      chartData.push({
        date: dateStr,
        revenue: existing ? existing.revenue : 0,
        orders: existing ? existing.orders : 0,
      })
    }

    return NextResponse.json({
      breakdown: {
        revenueToday,
        revenueThisWeek,
        revenueThisMonth,
        revenueThisYear,
        ordersToday,
        ordersThisWeek,
        ordersThisMonth,
        ordersThisYear,
      },
      filteredStats: {
        totalOrders,
        totalRevenue,
        pendingOrders,
        completedOrders,
        directOrders,
        onlineOrders,
      },
      topProducts,
      recentOrders,
      chartData,
    })
  } catch (error: any) {
    console.error('Error fetching admin reports stats:', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Sesi Anda telah berakhir, silakan login ulang.' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Akses ditolak. Fitur ini khusus akun Administrator.' }, { status: 403 })
    }
    return NextResponse.json(
      { error: error?.message || 'Gagal memuat statistik.' },
      { status: 500 }
    )
  }
}