import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireRole } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    await requireRole(['admin'])

    const db = await getDb()
    const { searchParams } = new URL(request.url)

    const startDate = searchParams.get('start_date') || ''
    const endDate = searchParams.get('end_date') || ''
    const purchaseType = searchParams.get('purchase_type') || 'all'
    const statusFilter = searchParams.get('status') || 'all'
    const minAmount = searchParams.get('min_amount') || ''
    const maxAmount = searchParams.get('max_amount') || ''

    // 1. Overall Revenue Breakdown (Hari Ini, Minggu Ini, Bulan Ini, Tahun Ini)
    const breakdown = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN date(created_at, 'localtime') = date('now', 'localtime') AND status IN ('paid', 'shipped', 'completed') THEN total_amount ELSE 0 END), 0) as revenueToday,
        COALESCE(SUM(CASE WHEN strftime('%Y-%W', created_at, 'localtime') = strftime('%Y-%W', 'now', 'localtime') AND status IN ('paid', 'shipped', 'completed') THEN total_amount ELSE 0 END), 0) as revenueThisWeek,
        COALESCE(SUM(CASE WHEN strftime('%Y-%m', created_at, 'localtime') = strftime('%Y-%m', 'now', 'localtime') AND status IN ('paid', 'shipped', 'completed') THEN total_amount ELSE 0 END), 0) as revenueThisMonth,
        COALESCE(SUM(CASE WHEN strftime('%Y', created_at, 'localtime') = strftime('%Y', 'now', 'localtime') AND status IN ('paid', 'shipped', 'completed') THEN total_amount ELSE 0 END), 0) as revenueThisYear,
        
        COALESCE(SUM(CASE WHEN date(created_at, 'localtime') = date('now', 'localtime') THEN 1 ELSE 0 END), 0) as ordersToday,
        COALESCE(SUM(CASE WHEN strftime('%Y-%W', created_at, 'localtime') = strftime('%Y-%W', 'now', 'localtime') THEN 1 ELSE 0 END), 0) as ordersThisWeek,
        COALESCE(SUM(CASE WHEN strftime('%Y-%m', created_at, 'localtime') = strftime('%Y-%m', 'now', 'localtime') THEN 1 ELSE 0 END), 0) as ordersThisMonth,
        COALESCE(SUM(CASE WHEN strftime('%Y', created_at, 'localtime') = strftime('%Y', 'now', 'localtime') THEN 1 ELSE 0 END), 0) as ordersThisYear
      FROM orders
    `).get() as any

    // 2. Build Filtered Query for Stats, Top Products, and Recent Orders
    let whereClauses: string[] = []
    let filterParams: any[] = []

    if (startDate) {
      whereClauses.push("date(created_at, 'localtime') >= date(?)")
      filterParams.push(startDate)
    }
    if (endDate) {
      whereClauses.push("date(created_at, 'localtime') <= date(?)")
      filterParams.push(endDate)
    }
    if (purchaseType && purchaseType !== 'all') {
      whereClauses.push("purchase_type = ?")
      filterParams.push(purchaseType)
    }
    if (statusFilter && statusFilter !== 'all') {
      whereClauses.push("status = ?")
      filterParams.push(statusFilter)
    }
    if (minAmount && !isNaN(Number(minAmount))) {
      whereClauses.push("total_amount >= ?")
      filterParams.push(Number(minAmount))
    }
    if (maxAmount && !isNaN(Number(maxAmount))) {
      whereClauses.push("total_amount <= ?")
      filterParams.push(Number(maxAmount))
    }

    const whereSql = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : ''

    const statsQuery = `
      SELECT 
        COUNT(*) as totalOrders,
        COALESCE(SUM(CASE WHEN status IN ('paid', 'shipped', 'completed') THEN total_amount ELSE 0 END), 0) as totalRevenue,
        COALESCE(SUM(CASE WHEN status IN ('pending', 'pending_confirmation') THEN 1 ELSE 0 END), 0) as pendingOrders,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completedOrders,
        COALESCE(SUM(CASE WHEN purchase_type = 'direct' THEN 1 ELSE 0 END), 0) as directOrders,
        COALESCE(SUM(CASE WHEN purchase_type = 'online' OR purchase_type IS NULL THEN 1 ELSE 0 END), 0) as onlineOrders
      FROM orders
      ${whereSql}
    `
    const stats = db.prepare(statsQuery).get(...filterParams) as any

    // Top Products with Filter
    let topProductsWhere = " WHERE o.status IN ('paid', 'shipped', 'completed')"
    if (whereClauses.length > 0) {
      const topWhereList = whereClauses.map(c => c.replace(/\bcreated_at\b/g, 'o.created_at').replace(/\bpurchase_type\b/g, 'o.purchase_type').replace(/\bstatus\b/g, 'o.status').replace(/\btotal_amount\b/g, 'o.total_amount'))
      topProductsWhere += ` AND ${topWhereList.join(' AND ')}`
    }

    const topProductsQuery = `
      SELECT 
        p.id,
        p.title,
        p.image_url,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.price_at_purchase) as total_sales
      FROM order_items oi
      JOIN product_variants pv ON oi.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      ${topProductsWhere}
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT 5
    `
    const topProducts = db.prepare(topProductsQuery).all(...filterParams) as any[]

    // Recent Orders with Filter
    let recentWhereSql = whereSql ? whereSql.replace(/\bcreated_at\b/g, 'o.created_at').replace(/\bpurchase_type\b/g, 'o.purchase_type').replace(/\bstatus\b/g, 'o.status').replace(/\btotal_amount\b/g, 'o.total_amount') : ''

    const recentOrdersQuery = `
      SELECT 
        o.id,
        o.total_amount,
        o.status,
        COALESCE(o.purchase_type, 'online') as purchase_type,
        COALESCE(o.payment_method, 'cod') as payment_method,
        o.created_at,
        u.full_name as user_full_name,
        u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ${recentWhereSql}
      ORDER BY o.created_at DESC
      LIMIT 10
    `
    const recentOrders = db.prepare(recentOrdersQuery).all(...filterParams) as any[]

    // 4. Daily Revenue Trend Chart Data (Last 30 Days Continuous)
    const dbChartData = db.prepare(`
      SELECT 
        strftime('%Y-%m-%d', created_at, 'localtime') as date,
        COALESCE(SUM(CASE WHEN status IN ('paid', 'shipped', 'completed') THEN total_amount ELSE 0 END), 0) as revenue,
        COUNT(id) as orders
      FROM orders
      WHERE date(created_at, 'localtime') >= date('now', 'localtime', '-29 days')
      GROUP BY date
      ORDER BY date ASC
    `).all() as any[]

    const dbMap = new Map<string, { revenue: number; orders: number }>()
    for (const item of dbChartData) {
      dbMap.set(item.date, { revenue: Number(item.revenue) || 0, orders: Number(item.orders) || 0 })
    }

    const chartData: Array<{ date: string; revenue: number; orders: number }> = []
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
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
        revenueToday: breakdown?.revenueToday || 0,
        revenueThisWeek: breakdown?.revenueThisWeek || 0,
        revenueThisMonth: breakdown?.revenueThisMonth || 0,
        revenueThisYear: breakdown?.revenueThisYear || 0,
        ordersToday: breakdown?.ordersToday || 0,
        ordersThisWeek: breakdown?.ordersThisWeek || 0,
        ordersThisMonth: breakdown?.ordersThisMonth || 0,
        ordersThisYear: breakdown?.ordersThisYear || 0,
      },
      filteredStats: {
        totalOrders: stats?.totalOrders || 0,
        totalRevenue: stats?.totalRevenue || 0,
        pendingOrders: stats?.pendingOrders || 0,
        completedOrders: stats?.completedOrders || 0,
        directOrders: stats?.directOrders || 0,
        onlineOrders: stats?.onlineOrders || 0,
      },
      topProducts: topProducts || [],
      recentOrders: recentOrders || [],
      chartData: chartData || [],
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