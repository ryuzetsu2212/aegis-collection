import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = path.join(process.cwd(), 'local.db')

let dbInstance: Database.Database | null = null

export async function getDb(): Promise<Database.Database> {
  if (!dbInstance) {
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    dbInstance = new Database(DB_PATH)
    dbInstance.pragma('journal_mode = WAL')
    initSchema(dbInstance)
    runMigrations(dbInstance)

    // Seed jika belum ada data
    const userCount = dbInstance.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
    if (userCount.count === 0) {
      const { seedDatabase } = await import('./seed')
      await seedDatabase()
    }

    const bannerCount = dbInstance.prepare('SELECT COUNT(*) as count FROM banners').get() as { count: number }
    if (bannerCount.count === 0) {
      dbInstance.prepare(`
        INSERT INTO banners (title, subtitle, image_url, is_active, position)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        'Diskon 50% Untuk Semua Produk',
        'Promo Spesial Toko AEGIS Collection – Dapatkan potongan harga 50% untuk seluruh koleksi pakaian dengan gratis ongkir area Bengkalis Kota!',
        '/images/banner_all_products.svg',
        1,
        1
      )
    }
  }
  return dbInstance
}

function runMigrations(db: Database.Database) {
  try {
    const userColumns = db.prepare(`PRAGMA table_info(users)`).all() as { name: string }[]
    if (userColumns && userColumns.length > 0) {
      const userColNames = new Set(userColumns.map(c => c.name))
      if (!userColNames.has('phone')) db.exec(`ALTER TABLE users ADD COLUMN phone TEXT`)
      if (!userColNames.has('address')) db.exec(`ALTER TABLE users ADD COLUMN address TEXT`)
      if (!userColNames.has('kecamatan')) db.exec(`ALTER TABLE users ADD COLUMN kecamatan TEXT`)
      if (!userColNames.has('village')) db.exec(`ALTER TABLE users ADD COLUMN village TEXT`)
      if (!userColNames.has('maps_link')) db.exec(`ALTER TABLE users ADD COLUMN maps_link TEXT`)
      if (!userColNames.has('avatar_url')) db.exec(`ALTER TABLE users ADD COLUMN avatar_url TEXT`)
    }

    const orderColumns = db.prepare(`PRAGMA table_info(orders)`).all() as { name: string }[]
    if (orderColumns && orderColumns.length > 0) {
      const columnNames = new Set(orderColumns.map(c => c.name))
      if (!columnNames.has('purchase_type')) {
        db.exec(`ALTER TABLE orders ADD COLUMN purchase_type TEXT NOT NULL DEFAULT 'online'`)
      }
      if (!columnNames.has('payment_method')) {
        db.exec(`ALTER TABLE orders ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'cod'`)
      }
      if (!columnNames.has('payment_proof_url')) {
        db.exec(`ALTER TABLE orders ADD COLUMN payment_proof_url TEXT`)
      }
      if (!columnNames.has('payment_status')) {
        db.exec(`ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid'`)
      }
      if (!columnNames.has('voucher_code')) {
        db.exec(`ALTER TABLE orders ADD COLUMN voucher_code TEXT`)
      }
      if (!columnNames.has('discount_amount')) {
        db.exec(`ALTER TABLE orders ADD COLUMN discount_amount INTEGER DEFAULT 0`)
      }
      if (!columnNames.has('courier_name')) {
        db.exec(`ALTER TABLE orders ADD COLUMN courier_name TEXT`)
      }
      if (!columnNames.has('courier_phone')) {
        db.exec(`ALTER TABLE orders ADD COLUMN courier_phone TEXT`)
      }
      if (!columnNames.has('shipping_cost')) {
        db.exec(`ALTER TABLE orders ADD COLUMN shipping_cost INTEGER DEFAULT 0`)
      }
    }

    const reviewColumns = db.prepare(`PRAGMA table_info(reviews)`).all() as { name: string }[]
    if (reviewColumns && reviewColumns.length > 0) {
      const colNames = new Set(reviewColumns.map(c => c.name))
      if (!colNames.has('admin_reply')) {
        db.exec(`ALTER TABLE reviews ADD COLUMN admin_reply TEXT`)
      }
      if (!colNames.has('replied_at')) {
        db.exec(`ALTER TABLE reviews ADD COLUMN replied_at DATETIME`)
      }
      if (!colNames.has('order_id')) {
        db.exec(`ALTER TABLE reviews ADD COLUMN order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL`)
      }
    }

    const voucherColumns = db.prepare(`PRAGMA table_info(vouchers)`).all() as { name: string }[]
    if (voucherColumns && voucherColumns.length > 0) {
      const colNames = new Set(voucherColumns.map(c => c.name))
      if (!colNames.has('voucher_type')) {
        db.exec(`ALTER TABLE vouchers ADD COLUMN voucher_type TEXT NOT NULL DEFAULT 'discount'`)
      }
    }

    // Always ensure new tables exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS vouchers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        voucher_type TEXT NOT NULL DEFAULT 'discount',
        discount_type TEXT NOT NULL DEFAULT 'percentage',
        discount_value INTEGER NOT NULL,
        min_purchase INTEGER DEFAULT 0,
        max_discount INTEGER,
        usage_limit INTEGER,
        used_count INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL REFERENCES users(id),
        room_user_id INTEGER NOT NULL REFERENCES users(id),
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS banners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        subtitle TEXT,
        image_url TEXT,
        link_url TEXT,
        is_active INTEGER DEFAULT 1,
        position INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS otp_codes (
        email TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS returns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        details TEXT,
        photo_url TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        admin_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_chat_room ON chat_messages(room_user_id);
      CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
      CREATE INDEX IF NOT EXISTS idx_returns_user ON returns(user_id);
      CREATE INDEX IF NOT EXISTS idx_returns_order ON returns(order_id);
    `)

    // Migration: Fix existing order items and order totals saved with full original prices instead of 50% discount
    const unDiscountedItems = db.prepare(`
      SELECT oi.id, oi.order_id, oi.quantity, p.price as original_price
      FROM order_items oi
      JOIN product_variants pv ON oi.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE oi.price_at_purchase >= ROUND(p.price * 0.9)
    `).all() as { id: number; order_id: number; quantity: number; original_price: number }[]

    if (unDiscountedItems.length > 0) {
      const updatedOrderIds = new Set<number>()
      const updateItemStmt = db.prepare('UPDATE order_items SET price_at_purchase = ? WHERE id = ?')

      for (const item of unDiscountedItems) {
        const discounted = Math.round(item.original_price * 0.5)
        updateItemStmt.run(discounted, item.id)
        updatedOrderIds.add(item.order_id)
      }

      for (const orderId of updatedOrderIds) {
        const order = db.prepare('SELECT discount_amount, shipping_cost FROM orders WHERE id = ?').get(orderId) as { discount_amount: number; shipping_cost: number } | undefined
        if (order) {
          const itemsSum = db.prepare(`
            SELECT SUM(quantity * price_at_purchase) as total
            FROM order_items
            WHERE order_id = ?
          `).get(orderId) as { total: number } | undefined

          const itemsTotal = itemsSum?.total || 0
          const discount = order.discount_amount || 0
          const shipping = order.shipping_cost || 0
          const newTotal = Math.max(0, itemsTotal - discount) + shipping

          db.prepare('UPDATE orders SET total_amount = ? WHERE id = ?').run(newTotal, orderId)
        }
      }
    }
  } catch (err) {
    console.error('Failed to run migrations:', err)
  }
}

function initSchema(db: Database.Database) {
  const tables = db.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users', 'categories', 'products', 'product_variants', 'orders', 'order_items', 'wishlist', 'reviews', 'vouchers', 'chat_messages', 'banners', 'otp_codes')`
  ).all() as { name: string }[]

  const existing = new Set(tables.map(t => t.name))

  if (existing.size === 12) return

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      phone TEXT,
      address TEXT,
      kecamatan TEXT,
      village TEXT,
      maps_link TEXT,
      avatar_url TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      size TEXT,
      color TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      total_amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      purchase_type TEXT NOT NULL DEFAULT 'online',
      payment_method TEXT NOT NULL DEFAULT 'cod',
      payment_proof_url TEXT,
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      tracking_number TEXT,
      courier_phone TEXT,
      voucher_code TEXT,
      discount_amount INTEGER DEFAULT 0,
      shipping_address TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      variant_id INTEGER NOT NULL REFERENCES product_variants(id),
      quantity INTEGER NOT NULL,
      price_at_purchase INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

    CREATE TABLE IF NOT EXISTS wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      admin_reply TEXT,
      replied_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vouchers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL DEFAULT 'percentage',
      discount_value INTEGER NOT NULL,
      min_purchase INTEGER DEFAULT 0,
      max_discount INTEGER,
      usage_limit INTEGER,
      used_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL REFERENCES users(id),
      room_user_id INTEGER NOT NULL REFERENCES users(id),
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      subtitle TEXT,
      image_url TEXT,
      link_url TEXT,
      is_active INTEGER DEFAULT 1,
      position INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);
    CREATE INDEX IF NOT EXISTS idx_wishlist_product ON wishlist(product_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_room ON chat_messages(room_user_id);
    CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
  `)
}

export function closeDb() {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
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
