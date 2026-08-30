const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')
const path = require('path')

const DB_PATH = path.join(process.cwd(), 'local.db')
const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')
db.exec('PRAGMA foreign_keys = OFF;')
db.exec('DROP TABLE IF EXISTS reviews;')
db.exec('DROP TABLE IF EXISTS wishlist;')
db.exec('DROP TABLE IF EXISTS order_items;')
db.exec('DROP TABLE IF EXISTS orders;')
db.exec('DROP TABLE IF EXISTS product_variants;')
db.exec('DROP TABLE IF EXISTS products;')
db.exec('DROP TABLE IF EXISTS categories;')
db.exec('DROP TABLE IF EXISTS users;')
db.exec('PRAGMA foreign_keys = ON;')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
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
    tracking_number TEXT,
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
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`)

const SALT_ROUNDS = 10
const hashedAdmin = bcrypt.hashSync('admin123', SALT_ROUNDS)
const hashedStaff = bcrypt.hashSync('staff123', SALT_ROUNDS)
const hashedUser = bcrypt.hashSync('user123', SALT_ROUNDS)

const insertUser = db.prepare(`
  INSERT INTO users (email, password_hash, full_name, role)
  VALUES (?, ?, ?, ?)
`)
insertUser.run('admin@toko.com', hashedAdmin, 'Administrator', 'admin')
insertUser.run('staff@toko.com', hashedStaff, 'Staff Toko', 'staff')
insertUser.run('user@toko.com', hashedUser, 'User Biasa', 'user')

const insertCategory = db.prepare(`
  INSERT INTO categories (name, slug) VALUES (?, ?)
`)

const catKaos = insertCategory.run('Kaos', 'kaos').lastInsertRowid
const catKemeja = insertCategory.run('Kemeja', 'kemeja').lastInsertRowid
const catJaket = insertCategory.run('Jaket', 'jaket').lastInsertRowid
const catCelana = insertCategory.run('Celana', 'celana').lastInsertRowid
const catSweater = insertCategory.run('Sweater & Hoodie', 'sweater-hoodie').lastInsertRowid

const insertProduct = db.prepare(`
  INSERT INTO products (category_id, title, slug, description, price, image_url, is_active)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`)

const insertVariant = db.prepare(`
  INSERT INTO product_variants (product_id, size, color, stock)
  VALUES (?, ?, ?, ?)
`)

const products = [
  {
    category_id: catKaos,
    title: 'Kaos Polos Premium',
    slug: 'kaos-polos-premium',
    description: 'Kaos polos katun combed 30s premium, sangat nyaman dan adem dipakai sehari-hari.',
    price: 150000,
    image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=600&fit=crop',
    variants: [
      { size: 'S', color: 'Putih', stock: 20 },
      { size: 'M', color: 'Putih', stock: 30 },
      { size: 'L', color: 'Putih', stock: 25 },
      { size: 'XL', color: 'Putih', stock: 15 },
      { size: 'S', color: 'Hitam', stock: 18 },
      { size: 'M', color: 'Hitam', stock: 28 },
      { size: 'L', color: 'Hitam', stock: 22 },
      { size: 'XL', color: 'Hitam', stock: 12 },
    ]
  },
  {
    category_id: catKemeja,
    title: 'Kemeja Flanel Kotak',
    slug: 'kemeja-flanel-kotak',
    description: 'Kemeja flanel kotak-kotak klasik dengan nuansa merah dan navy untuk gaya kasual abadi.',
    price: 250000,
    image_url: 'https://images.unsplash.com/photo-1602810319428-019690571b5b?w=400&h=600&fit=crop',
    variants: [
      { size: 'S', color: 'Merah', stock: 10 },
      { size: 'M', color: 'Merah', stock: 15 },
      { size: 'L', color: 'Merah', stock: 12 },
      { size: 'XL', color: 'Merah', stock: 8 },
      { size: 'S', color: 'Biru', stock: 10 },
      { size: 'M', color: 'Biru', stock: 14 },
      { size: 'L', color: 'Biru', stock: 10 },
      { size: 'XL', color: 'Biru', stock: 6 },
    ]
  },
  {
    category_id: catJaket,
    title: 'Jaket Denim Classic',
    slug: 'jaket-denim-classic',
    description: 'Jaket denim klasik berbahan kualitas tinggi dengan jahitan kokoh dan potongan stylish.',
    price: 450000,
    image_url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400&h=600&fit=crop',
    variants: [
      { size: 'S', color: 'Biru Tua', stock: 8 },
      { size: 'M', color: 'Biru Tua', stock: 12 },
      { size: 'L', color: 'Biru Tua', stock: 10 },
      { size: 'XL', color: 'Biru Tua', stock: 6 },
    ]
  },
  {
    category_id: catKaos,
    title: 'Kaos Graphic Vintage',
    slug: 'kaos-graphic-vintage',
    description: 'Kaos bergaya streetwear dengan artwork vintage aesthetic yang keren.',
    price: 180000,
    image_url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&h=600&fit=crop',
    variants: [
      { size: 'S', color: 'Abu-abu', stock: 15 },
      { size: 'M', color: 'Abu-abu', stock: 20 },
      { size: 'L', color: 'Abu-abu', stock: 18 },
      { size: 'XL', color: 'Abu-abu', stock: 10 },
      { size: 'S', color: 'Hitam', stock: 12 },
      { size: 'M', color: 'Hitam', stock: 18 },
      { size: 'L', color: 'Hitam', stock: 14 },
      { size: 'XL', color: 'Hitam', stock: 8 },
    ]
  },
  {
    category_id: catKaos,
    title: 'Kaos Polos Navy Cotton',
    slug: 'kaos-polos-navy',
    description: 'Kaos katun polos warna navy elegan yang pas dipadukan dengan berbagai luaran.',
    price: 155000,
    image_url: 'https://images.unsplash.com/photo-1583744946564-b52b9a7a8d10?w=400&h=600&fit=crop',
    variants: [
      { size: 'S', color: 'Navy', stock: 10 },
      { size: 'M', color: 'Navy', stock: 20 },
      { size: 'L', color: 'Navy', stock: 18 },
      { size: 'XL', color: 'Navy', stock: 8 },
    ]
  },
  {
    category_id: catKemeja,
    title: 'Kemeja Putih Formal Slim Fit',
    slug: 'kemeja-putih-formal',
    description: 'Kemeja putih formal berbahan poplin halus, memberikan kesan rapi dan profesional.',
    price: 280000,
    image_url: 'https://images.unsplash.com/photo-1598032895397-b4d30a3ea682?w=400&h=600&fit=crop',
    variants: [
      { size: 'S', color: 'Putih', stock: 12 },
      { size: 'M', color: 'Putih', stock: 18 },
      { size: 'L', color: 'Putih', stock: 15 },
      { size: 'XL', color: 'Putih', stock: 8 },
    ]
  },
  {
    category_id: catJaket,
    title: 'Jaket Parka Winter Hoodie',
    slug: 'jaket-parka-hoodie',
    description: 'Jaket parka tebal dilapisi furing lembut dan dilengkapi hoodie penahan angin.',
    price: 550000,
    image_url: 'https://images.unsplash.com/photo-1544022613-e87ca75a784c?w=400&h=600&fit=crop',
    variants: [
      { size: 'S', color: 'Hitam', stock: 6 },
      { size: 'M', color: 'Hitam', stock: 10 },
      { size: 'L', color: 'Hitam', stock: 8 },
      { size: 'XL', color: 'Hitam', stock: 4 },
    ]
  },
  {
    category_id: catKaos,
    title: 'Kaos Stripes Minimalist',
    slug: 'kaos-stripes-casual',
    description: 'Kaos motif garis horizontal simpel yang cocok untuk kegiatan hangout santai.',
    price: 165000,
    image_url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=600&fit=crop',
    variants: [
      { size: 'S', color: 'Biru-Putih', stock: 14 },
      { size: 'M', color: 'Biru-Putih', stock: 22 },
      { size: 'L', color: 'Biru-Putih', stock: 18 },
      { size: 'XL', color: 'Biru-Putih', stock: 10 },
    ]
  },
  {
    category_id: catCelana,
    title: 'Celana Chino Slim Fit',
    slug: 'celana-chino-slim-fit',
    description: 'Celana chino berbahan katun stretchy yang nyaman digunakan saat santai maupun kerja.',
    price: 320000,
    image_url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=600&fit=crop',
    variants: [
      { size: '28', color: 'Khaki', stock: 10 },
      { size: '30', color: 'Khaki', stock: 15 },
      { size: '32', color: 'Khaki', stock: 12 },
      { size: '34', color: 'Khaki', stock: 8 },
      { size: '30', color: 'Hitam', stock: 14 },
      { size: '32', color: 'Hitam', stock: 16 },
    ]
  },
  {
    category_id: catCelana,
    title: 'Celana Jeans Regular Fit',
    slug: 'celana-jeans-regular-fit',
    description: 'Celana jeans potongan reguler dari bahan denim tebal dan tahan lama.',
    price: 380000,
    image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=600&fit=crop',
    variants: [
      { size: '29', color: 'Indigo', stock: 8 },
      { size: '30', color: 'Indigo', stock: 12 },
      { size: '31', color: 'Indigo', stock: 14 },
      { size: '32', color: 'Indigo', stock: 10 },
    ]
  },
  {
    category_id: catSweater,
    title: 'Hoodie Oversized Black',
    slug: 'hoodie-oversized-black',
    description: 'Hoodie oversized warna hitam berbahan cotton fleece tebal dan hangat.',
    price: 350000,
    image_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&h=600&fit=crop',
    variants: [
      { size: 'M', color: 'Hitam', stock: 15 },
      { size: 'L', color: 'Hitam', stock: 20 },
      { size: 'XL', color: 'Hitam', stock: 12 },
    ]
  },
  {
    category_id: catSweater,
    title: 'Sweater Crewneck Grey',
    slug: 'sweater-crewneck-grey',
    description: 'Sweater leher bulat warna abu-abu misty dengan jahitan rib elastis di lengan.',
    price: 290000,
    image_url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=600&fit=crop',
    variants: [
      { size: 'S', color: 'Abu Misty', stock: 10 },
      { size: 'M', color: 'Abu Misty', stock: 18 },
      { size: 'L', color: 'Abu Misty', stock: 15 },
      { size: 'XL', color: 'Abu Misty', stock: 8 },
    ]
  },
  {
    category_id: catKemeja,
    title: 'Kemeja Linen Casual White',
    slug: 'kemeja-linen-casual',
    description: 'Kemeja berbahan linen alami yang ringan, memberikan rasa sejuk di cuaca hangat.',
    price: 295000,
    image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=600&fit=crop',
    variants: [
      { size: 'S', color: 'Putih', stock: 8 },
      { size: 'M', color: 'Putih', stock: 14 },
      { size: 'L', color: 'Putih', stock: 12 },
      { size: 'XL', color: 'Putih', stock: 6 },
    ]
  },
  {
    category_id: catJaket,
    title: 'Jaket Leather Bomber',
    slug: 'jaket-leather-bomber',
    description: 'Jaket bomber bernuansa kulit sintetis kualitas tinggi untuk penampilan tegas dan maskulin.',
    price: 650000,
    image_url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=600&fit=crop',
    variants: [
      { size: 'M', color: 'Hitam', stock: 7 },
      { size: 'L', color: 'Hitam', stock: 10 },
      { size: 'XL', color: 'Hitam', stock: 5 },
    ]
  },
  {
    category_id: catCelana,
    title: 'Celana Cargo Tactical',
    slug: 'celana-cargo-tactical',
    description: 'Celana cargo outdoor dengan banyak kantong serbaguna dan bahan ripstop tahan gores.',
    price: 340000,
    image_url: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=400&h=600&fit=crop',
    variants: [
      { size: '30', color: 'Hijau Army', stock: 12 },
      { size: '32', color: 'Hijau Army', stock: 15 },
      { size: '34', color: 'Hijau Army', stock: 9 },
    ]
  },
  {
    category_id: catKaos,
    title: 'Kaos Pocket T-Shirt Olive',
    slug: 'kaos-pocket-olive',
    description: 'Kaos polos dilengkapi saku di dada berwarna olive yang trendy.',
    price: 160000,
    image_url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=600&fit=crop',
    variants: [
      { size: 'S', color: 'Olive', stock: 10 },
      { size: 'M', color: 'Olive', stock: 16 },
      { size: 'L', color: 'Olive', stock: 14 },
      { size: 'XL', color: 'Olive', stock: 8 },
    ]
  },
  {
    category_id: catKemeja,
    title: 'Kemeja Batik Modern Pattern',
    slug: 'kemeja-batik-modern',
    description: 'Kemeja motif batik kontemporer yang stylish untuk acara keluarga maupun formal.',
    price: 310000,
    image_url: 'https://images.unsplash.com/photo-1563630423968-d3250c900946?w=400&h=600&fit=crop',
    variants: [
      { size: 'S', color: 'Coklat', stock: 6 },
      { size: 'M', color: 'Coklat', stock: 12 },
      { size: 'L', color: 'Coklat', stock: 10 },
      { size: 'XL', color: 'Coklat', stock: 5 },
    ]
  },
  {
    category_id: catJaket,
    title: 'Jaket Windbreaker Sporty',
    slug: 'jaket-windbreaker-sporty',
    description: 'Jaket windbreaker berbahan parasut waterproof ringan untuk olahraga & perjalanan.',
    price: 390000,
    image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=600&fit=crop',
    variants: [
      { size: 'M', color: 'Biru-Hitam', stock: 10 },
      { size: 'L', color: 'Biru-Hitam', stock: 14 },
      { size: 'XL', color: 'Biru-Hitam', stock: 8 },
    ]
  },
  {
    category_id: catSweater,
    title: 'Sweater Knit Cable Cream',
    slug: 'sweater-knit-cable',
    description: 'Sweater rajut motif cable knitted warna cream yang tebal, hangat, dan estetik.',
    price: 360000,
    image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=600&fit=crop',
    variants: [
      { size: 'S', color: 'Cream', stock: 7 },
      { size: 'M', color: 'Cream', stock: 11 },
      { size: 'L', color: 'Cream', stock: 9 },
    ]
  },
  {
    category_id: catCelana,
    title: 'Celana Short Pants Casual',
    slug: 'celana-short-pants',
    description: 'Celana pendek kasual santai berbahan katun combed fleksibel dengan pinggang karet.',
    price: 190000,
    image_url: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&h=600&fit=crop',
    variants: [
      { size: 'M', color: 'Abu-abu', stock: 15 },
      { size: 'L', color: 'Abu-abu', stock: 20 },
      { size: 'XL', color: 'Abu-abu', stock: 12 },
    ]
  },
]

for (const p of products) {
  const result = insertProduct.run(
    p.category_id,
    p.title,
    p.slug,
    p.description,
    p.price,
    p.image_url,
    1
  )
  const productId = result.lastInsertRowid
  for (const v of p.variants) {
    insertVariant.run(productId, v.size, v.color, v.stock)
  }
}

const count = db.prepare('SELECT COUNT(*) as total FROM products').get()
console.log('SUCCESS: Total products in database:', count.total)
db.close()

