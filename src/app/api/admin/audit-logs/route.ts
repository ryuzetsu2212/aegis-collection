import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/db'
import { requireRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'staff'])

    const supabase = getSupabase()
    const { searchParams } = request.nextUrl
    const action = searchParams.get('action')
    const search = searchParams.get('search')
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit')) || 50))
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const offset = (page - 1) * limit

    let query = supabase.from('audit_logs').select('*', { count: 'exact' })

    if (action) {
      query = query.eq('action', action)
    }

    if (search) {
      const cleanQ = search.trim()
      query = query.or(`user_email.ilike.%${cleanQ}%,action.ilike.%${cleanQ}%,details.ilike.%${cleanQ}%,entity_type.ilike.%${cleanQ}%`)
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data: logs, count, error } = await query

    if (error) {
      return NextResponse.json({
        logs: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      })
    }

    const total = count || 0
    return NextResponse.json({
      logs: logs || [],
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
    return NextResponse.json({
      logs: [],
      total: 0,
      page: 1,
      limit: 25,
      totalPages: 0,
    })
  }
}

