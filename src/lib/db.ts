import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    supabaseInstance = createClient(url, key, {
      auth: { persistSession: false },
    })
  }
  return supabaseInstance
}

async function execSql(sql: string, params: any[] = []): Promise<any> {
  const supabase = getSupabase()

  let cleanSql = sql
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/DATETIME\('now'\)/gi, 'CURRENT_TIMESTAMP')
    .replace(/DATETIME\(/gi, 'CAST(')

  const upper = cleanSql.toUpperCase()

  // 1. INSERT INTO table (col1, col2) VALUES (?, ?)
  if (upper.startsWith('INSERT INTO')) {
    const match = cleanSql.match(/INSERT\s+INTO\s+([a-z0-9_]+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i)
    if (match) {
      const tableName = match[1].trim()
      const cols = match[2].split(',').map(c => c.trim())
      const record: Record<string, any> = {}
      cols.forEach((col, idx) => {
        const val = params[idx]
        record[col] = val === undefined ? null : val
      })

      const { data, error } = await supabase
        .from(tableName)
        .insert(record)
        .select('id')
        .single()

      if (error) throw new Error(error.message)
      return [{ id: data?.id || 1 }]
    }
  }

  // 2. UPDATE table SET ... WHERE col = ?
  if (upper.startsWith('UPDATE')) {
    const match = cleanSql.match(/UPDATE\s+([a-z0-9_]+)\s+SET\s+(.+?)\s+WHERE\s+([a-z0-9_.]+)\s*=\s*(.+)/i)
    if (match) {
      const tableName = match[1].trim()
      const setClause = match[2].trim()
      const whereCol = match[3].trim().split('.').pop()!
      const whereVal = params[params.length - 1]

      const record: Record<string, any> = {}
      let pIdx = 0

      if (setClause.includes('stock = MAX(0, stock - ?)')) {
        const qty = params[pIdx++]
        const { data: cur } = await supabase.from(tableName).select('stock').eq(whereCol, whereVal).single()
        record['stock'] = Math.max(0, (cur ? Number(cur.stock) || 0 : 0) - qty)
      } else if (setClause.includes('stock = stock + ?')) {
        const qty = params[pIdx++]
        const { data: cur } = await supabase.from(tableName).select('stock').eq(whereCol, whereVal).single()
        record['stock'] = (cur ? Number(cur.stock) || 0 : 0) + qty
      } else if (setClause.includes('used_count = used_count + 1')) {
        const { data: cur } = await supabase.from(tableName).select('used_count').eq(whereCol, whereVal).single()
        record['used_count'] = (cur ? Number(cur.used_count) || 0 : 0) + 1
      } else if (setClause.includes('used_count = MAX(0, used_count - 1)')) {
        const { data: cur } = await supabase.from(tableName).select('used_count').eq(whereCol, whereVal).single()
        record['used_count'] = Math.max(0, (cur ? Number(cur.used_count) || 0 : 0) - 1)
      } else {
        const setAssignments = setClause.split(',')
        for (const assign of setAssignments) {
          const parts = assign.split('=').map(s => s.trim())
          const colName = parts[0]
          const valExpr = parts[1]
          if (valExpr === '?') {
            record[colName] = params[pIdx++]
          } else if (valExpr && valExpr.includes('CURRENT_TIMESTAMP')) {
            record[colName] = new Date().toISOString()
          }
        }
      }

      const { error } = await supabase.from(tableName).update(record).eq(whereCol, whereVal)
      if (error) throw new Error(error.message)
      return { success: true }
    }
  }

  // 3. DELETE FROM table WHERE col = ?
  if (upper.startsWith('DELETE FROM')) {
    const match = cleanSql.match(/DELETE\s+FROM\s+([a-z0-9_]+)(?:\s+WHERE\s+([a-z0-9_.]+)\s*(=|IN)\s*(.+))?/i)
    if (match) {
      const tableName = match[1].trim()
      const whereCol = match[2] ? match[2].trim().split('.').pop()! : null
      const op = match[3] ? match[3].toUpperCase() : null

      if (!whereCol) {
        const { error } = await supabase.from(tableName).delete().neq('id', 0)
        if (error) throw new Error(error.message)
        return { success: true }
      }

      if (op === '=') {
        const val = params[0]
        const { error } = await supabase.from(tableName).delete().eq(whereCol, val)
        if (error) throw new Error(error.message)
        return { success: true }
      } else if (op === 'IN') {
        const { error } = await supabase.from(tableName).delete().in(whereCol, params)
        if (error) throw new Error(error.message)
        return { success: true }
      }
    }
  }

  // 4. SELECT queries
  const selectMatch = cleanSql.match(/SELECT\s+(.+?)\s+FROM\s+([a-z0-9_]+)(?:\s+([a-z0-9_]+))?(?:\s+(LEFT\s+JOIN|JOIN)\s+.*)?(?:\s+WHERE\s+(.+?))?(?:\s+GROUP\s+BY\s+.+?)?(?:\s+ORDER\s+BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i)
  if (selectMatch) {
    const tableName = selectMatch[2].trim()
    const whereStr = selectMatch[5] || ''
    const orderStr = selectMatch[6] || ''
    const limitNum = selectMatch[7] ? parseInt(selectMatch[7], 10) : null

    let query = supabase.from(tableName).select('*')

    if (whereStr) {
      let pIdx = 0
      const conds = whereStr.split(/\s+AND\s+/i)
      for (const cond of conds) {
        const eqMatch = cond.match(/([a-z0-9_.]+)\s*=\s*\?/i)
        if (eqMatch) {
          const colName = eqMatch[1].split('.').pop()!
          const val = params[pIdx++]
          query = query.eq(colName, val)
        } else if (cond.includes('is_active = 1')) {
          query = query.eq('is_active', 1)
        } else if (cond.includes('IS NULL')) {
          const colName = cond.split(/\s+/)[0].split('.').pop()!
          query = query.is(colName, null)
        }
      }
    }

    if (orderStr) {
      const parts = orderStr.trim().split(/\s+/)
      const col = parts[0].split('.').pop()!
      const isAsc = Boolean(parts[1] && parts[1].toUpperCase() === 'ASC')
      query = query.order(col, { ascending: isAsc })
    }

    if (limitNum) {
      query = query.limit(limitNum)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data || []
  }

  // Append RETURNING id if it's an INSERT statement without RETURNING
  if (cleanSql.trim().toUpperCase().startsWith('INSERT') && !cleanSql.toUpperCase().includes('RETURNING')) {
    cleanSql += ' RETURNING id'
  }

  // Safely interpolate parameters into cleanSql using PostgreSQL dollar-quoting for strings
  if (params && params.length > 0) {
    let pIdx = 0
    cleanSql = cleanSql.replace(/\?/g, () => {
      const p = params[pIdx++]
      if (p === null || p === undefined) return 'NULL'
      if (typeof p === 'number') return String(p)
      if (typeof p === 'boolean') return p ? '1' : '0'
      const strP = String(p)
      const tag = 'T_' + Math.random().toString(36).slice(2, 7)
      return '$' + tag + '$' + strP + '$' + tag + '$'
    })
  }

  const { data, error } = await supabase.rpc('exec_sql', {
    sql_text: cleanSql,
    params: [],
  })

  if (error) {
    console.error('Supabase SQL Exec Error:', error.message, 'SQL:', cleanSql, 'Params:', params)
    throw new Error(error.message)
  }

  return data
}

export async function getDb(): Promise<any> {
  return {
    prepare(sql: string): any {
      return {
        get(...params: any[]): any {
          return execSql(sql, params).then(res => {
            if (Array.isArray(res)) return res[0] ?? undefined
            if (res && typeof res === 'object' && !('success' in res && Object.keys(res).length === 1)) return res
            return undefined
          })
        },
        all(...params: any[]): any {
          return execSql(sql, params).then(res => {
            if (Array.isArray(res)) return res
            return []
          })
        },
        run(...params: any[]): any {
          return execSql(sql, params).then(res => {
            let lastInsertRowid = 1
            if (Array.isArray(res) && res[0] && res[0].id) {
              lastInsertRowid = Number(res[0].id)
            }
            return {
              changes: 1,
              lastInsertRowid,
            }
          })
        },
      }
    },
    exec(sql: string): any {
      return execSql(sql, [])
    },
  }
}

export function closeDb() {
  // No-op for Supabase REST API
}

export type DbUser = {
  id: number
  email: string
  password_hash: string
  full_name: string | null
  phone?: string | null
  address?: string | null
  kecamatan?: string | null
  village?: string | null
  maps_link?: string | null
  avatar_url?: string | null
  role: 'admin' | 'staff' | 'courier' | 'user'
  created_at: string
}

export type DbCategory = {
  id: number
  name: string
  slug: string
}

export type DbProduct = {
  id: number
  category_id: number | null
  title: string
  slug: string
  description: string | null
  price: number
  image_url: string
  is_active: number
  created_at: string
}

export type DbProductVariant = {
  id: number
  product_id: number
  size: string | null
  color: string
  stock: number
}

export type DbOrder = {
  id: number
  user_id: number
  total_amount: number
  status: string
  purchase_type: string
  payment_method: string
  payment_proof_url: string | null
  payment_status: string
  tracking_number: string | null
  courier_phone?: string | null
  voucher_code?: string | null
  discount_amount?: number
  shipping_address: string
  created_at: string
}

export type DbOrderItem = {
  id: number
  order_id: number
  variant_id: number
  quantity: number
  price_at_purchase: number
}

export type DbVoucher = {
  id: number
  code: string
  voucher_type: 'discount' | 'shipping'
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_purchase: number
  max_discount: number | null
  usage_limit: number | null
  used_count: number
  is_active: number
  expires_at: string | null
  created_at: string
}

export type DbChatMessage = {
  id: number
  sender_id: number
  room_user_id: number
  message: string
  is_read: number
  created_at: string
}

export type DbBanner = {
  id: number
  title: string
  subtitle: string | null
  image_url: string | null
  link_url: string | null
  is_active: number
  position: number
  created_at: string
}
