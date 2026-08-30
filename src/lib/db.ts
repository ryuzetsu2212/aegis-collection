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

  // Replace SQLite specific functions / pragmas
  let cleanSql = sql
    .trim()
    .replace(/DATETIME\('now'\)/gi, 'CURRENT_TIMESTAMP')
    .replace(/DATETIME\(/gi, 'CAST(')

  // Append RETURNING id if it's an INSERT statement without RETURNING
  if (cleanSql.trim().toUpperCase().startsWith('INSERT') && !cleanSql.toUpperCase().includes('RETURNING')) {
    cleanSql += ' RETURNING id'
  }

  // Safely interpolate parameters into cleanSql to avoid PostgreSQL type mismatches in PL/pgSQL
  if (params && params.length > 0) {
    let pIdx = 0
    cleanSql = cleanSql.replace(/\?/g, () => {
      const p = params[pIdx++]
      if (p === null || p === undefined) return 'NULL'
      if (typeof p === 'number') return String(p)
      if (typeof p === 'boolean') return p ? '1' : '0'
      return "'" + String(p).replace(/'/g, "''") + "'"
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
            return res ?? undefined
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
