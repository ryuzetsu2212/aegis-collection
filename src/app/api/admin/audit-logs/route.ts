import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'staff'])

    const db = await getDb()
    const { searchParams } = request.nextUrl
    const action = searchParams.get('action')
    const search = searchParams.get('search')
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit')) || 50))
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const offset = (page - 1) * limit

    let whereConditions: string[] = []
    let params: any[] = []

    if (action) {
      whereConditions.push('action = ?')
      params.push(action)
    }

    if (search) {
      whereConditions.push('(user_email LIKE ? OR action LIKE ? OR details LIKE ? OR entity_type LIKE ?)')
      const searchPattern = `%${search.trim()}%`
      params.push(searchPattern, searchPattern, searchPattern, searchPattern)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const countQuery = `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`
    const totalRow = await db.prepare(countQuery).get(...params) as { total: number }
    const total = totalRow ? totalRow.total : 0

    const query = `
      SELECT * FROM audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `
    const logs = await db.prepare(query).all(...params, limit, offset)

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('[GET /api/admin/audit-logs Error]', error)
    return NextResponse.json({ error: 'Gagal mengambil data audit log.' }, { status: 500 })
  }
}

