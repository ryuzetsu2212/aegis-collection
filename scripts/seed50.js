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

const categoriesMap = {
  kaos_pria: insertCategory.run('Kaos Pria', 'kaos-pria').lastInsertRowid,
  kemeja_pria: insertCategory.run('Kemeja Pria', 'kemeja-pria').lastInsertRowid,
  jaket_outerwear: insertCategory.run('Jaket & Outerwear', 'jaket-outerwear').lastInsertRowid,
  celana_pria: insertCategory.run('Celana Pria', 'celana-pria').lastInsertRowid,
  sweater_hoodie: insertCategory.run('Sweater & Hoodie', 'sweater-hoodie').lastInsertRowid,
  sepatu_pria: insertCategory.run('Sepatu Pria & Unisex', 'sepatu-pria').lastInsertRowid,
  sepatu_wanita: insertCategory.run('Sepatu & Heels Wanita', 'sepatu-heels-wanita').lastInsertRowid,
  aksesoris: insertCategory.run('Aksesoris', 'aksesoris').lastInsertRowid,
}

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
    category_id: categoriesMap.kemeja_pria,
    title: 'Kemeja Flanel Kotak Red-Navy',
    slug: 'kemeja-flanel-kotak-red-navy',
    description: 'Kemeja flanel lengan panjang motif kotak-kotak merah navy dengan saku dada ganda.',
    price: 250000,
    image_url: '/images/vektorin_photorealistic_general_professional_10_commercial_product_shot_of_a_r.webp',
    variants: [
      { size: 'S', color: 'Merah-Navy', stock: 15 },
      { size: 'M', color: 'Merah-Navy', stock: 25 },
      { size: 'L', color: 'Merah-Navy', stock: 20 },
      { size: 'XL', color: 'Merah-Navy', stock: 10 },
    ]
  },
  {
    category_id: categoriesMap.sweater_hoodie,
    title: 'Hoodie Oversized Black Fleece',
    slug: 'hoodie-oversized-black-fleece',
    description: 'Hoodie polos oversized warna hitam berbahan fleece tebal dengan saku kangguru.',
    price: 350000,
    image_url: '/images/vektorin_photorealistic_general_professional_10_commercial_studio_product_phot.webp',
    variants: [
      { size: 'M', color: 'Hitam', stock: 18 },
      { size: 'L', color: 'Hitam', stock: 22 },
      { size: 'XL', color: 'Hitam', stock: 14 },
    ]
  },
  {
    category_id: categoriesMap.sepatu_wanita,
    title: 'Sepatu High Heels Strappy Gold',
    slug: 'sepatu-high-heels-strappy-gold',
    description: 'High heels wanita tali silang warna emas metalik elegan untuk pesta dan acara formal.',
    price: 520000,
    image_url: '/images/vektorin_photorealistic_general_professional_10_luxury_e_commerce_product_phot.webp',
    variants: [
      { size: '36', color: 'Gold', stock: 8 },
      { size: '37', color: 'Gold', stock: 12 },
      { size: '38', color: 'Gold', stock: 15 },
      { size: '39', color: 'Gold', stock: 10 },
    ]
  },
  {
    category_id: categoriesMap.kaos_pria,
    title: 'Kaos Pocket Slub Cotton Olive',
    slug: 'kaos-pocket-slub-cotton-olive',
    description: 'Kaos polos warna olive green berbahan cotton slub dengan aksen saku di dada.',
    price: 165000,
    image_url: '/images/vektorin_photorealistic_general_professional_11_close_up_commercial_photograph.webp',
    variants: [
      { size: 'S', color: 'Olive Green', stock: 10 },
      { size: 'M', color: 'Olive Green', stock: 20 },
      { size: 'L', color: 'Olive Green', stock: 16 },
      { size: 'XL', color: 'Olive Green', stock: 8 },
    ]
  },
  {
    category_id: categoriesMap.celana_pria,
    title: 'Celana Chino Navy & Sabuk Kulit',
    slug: 'celana-chino-navy-sabuk-kulit',
    description: 'Celana chino kasual warna navy dengan potongan slim fit dan detail jahitan rapi.',
    price: 330000,
    image_url: '/images/vektorin_photorealistic_general_professional_11_flat_lay_shot_of_navy_blue_cas.webp',
    variants: [
      { size: '29', color: 'Navy', stock: 10 },
      { size: '30', color: 'Navy', stock: 14 },
      { size: '31', color: 'Navy', stock: 12 },
      { size: '32', color: 'Navy', stock: 15 },
    ]
  },
  {
    category_id: categoriesMap.sepatu_pria,
    title: 'Sepatu Sneakers Strap Athletic Hitam',
    slug: 'sepatu-sneakers-strap-athletic-hitam',
    description: 'Sneakers sporty serba hitam berbahan mesh & sintetis dengan strap velcro pengunci.',
    price: 420000,
    image_url: '/images/vektorin_photorealistic_general_professional_11_minimalist_e_commerce_photo_of.webp',
    variants: [
      { size: '40', color: 'Hitam', stock: 12 },
      { size: '41', color: 'Hitam', stock: 18 },
      { size: '42', color: 'Hitam', stock: 15 },
      { size: '43', color: 'Hitam', stock: 9 },
    ]
  },
  {
    category_id: categoriesMap.celana_pria,
    title: 'Celana Jogger Cotton Fleece Hitam',
    slug: 'celana-jogger-cotton-fleece-hitam',
    description: 'Celana jogger santai warna hitam dengan tali serut pinggang dan karet di pergelangan kaki.',
    price: 275000,
    image_url: '/images/vektorin_photorealistic_general_professional_12_clean_product_photograph_of_bl.webp',
    variants: [
      { size: 'S', color: 'Hitam', stock: 10 },
      { size: 'M', color: 'Hitam', stock: 20 },
      { size: 'L', color: 'Hitam', stock: 15 },
      { size: 'XL', color: 'Hitam', stock: 8 },
    ]
  },
  {
    category_id: categoriesMap.kaos_pria,
    title: 'Kaos Stripes Classic Navy-Putih',
    slug: 'kaos-stripes-classic-navy-putih',
    description: 'Kaos kasual garis-garis horizontal biru navy dan putih berbahan katun adem.',
    price: 170000,
    image_url: '/images/vektorin_photorealistic_general_professional_12_flat_lay_product_photography_o.webp',
    variants: [
      { size: 'S', color: 'Navy-Putih', stock: 12 },
      { size: 'M', color: 'Navy-Putih', stock: 18 },
      { size: 'L', color: 'Navy-Putih', stock: 14 },
      { size: 'XL', color: 'Navy-Putih', stock: 9 },
    ]
  },
  {
    category_id: categoriesMap.sepatu_pria,
    title: 'Sepatu Running Sporty Orange Mesh',
    slug: 'sepatu-running-sporty-orange-mesh',
    description: 'Sepatu olahraga/running ringan warna orange terang berbahan breathable mesh.',
    price: 450000,
    image_url: '/images/vektorin_photorealistic_general_professional_12_high_contrast_photography_of_a.webp',
    variants: [
      { size: '39', color: 'Orange', stock: 8 },
      { size: '40', color: 'Orange', stock: 14 },
      { size: '41', color: 'Orange', stock: 16 },
      { size: '42', color: 'Orange', stock: 10 },
    ]
  },
  {
    category_id: categoriesMap.celana_pria,
    title: 'Celana Cargo Tactical Olive Army',
    slug: 'celana-cargo-tactical-olive-army',
    description: 'Celana cargo outdoor berbahan ripstop warna hijau army dengan banyak kantong serbaguna.',
    price: 340000,
    image_url: '/images/vektorin_photorealistic_general_professional_13_front_product_photo_of_olive_g.webp',
    variants: [
      { size: '30', color: 'Olive Army', stock: 12 },
      { size: '31', color: 'Olive Army', stock: 15 },
      { size: '32', color: 'Olive Army', stock: 18 },
      { size: '33', color: 'Olive Army', stock: 10 },
    ]
  },
  {
    category_id: categoriesMap.kaos_pria,
    title: 'Kaos Polo Pria Classic Navy',
    slug: 'kaos-polo-pria-classic-navy',
    description: 'Kaos polo berkera bahan katun pique warna biru navy elegan dengan kancing dada.',
    price: 195000,
    image_url: '/images/vektorin_photorealistic_general_professional_13_product_photograph_of_a_dark_n.webp',
    variants: [
      { size: 'S', color: 'Navy', stock: 10 },
      { size: 'M', color: 'Navy', stock: 22 },
      { size: 'L', color: 'Navy', stock: 18 },
      { size: 'XL', color: 'Navy', stock: 12 },
    ]
  },
  {
    category_id: categoriesMap.sepatu_pria,
    title: 'Sepatu Sneakers Samba Leather Hitam',
    slug: 'sepatu-sneakers-samba-leather-hitam',
    description: 'Sneakers kulit klasik hitam bergaris putih dengan sol karet (gum sole) coklat retro.',
    price: 480000,
    image_url: '/images/vektorin_photorealistic_general_professional_13_studio_shot_of_a_classic_black.webp',
    variants: [
      { size: '40', color: 'Hitam-Putih', stock: 15 },
      { size: '41', color: 'Hitam-Putih', stock: 20 },
      { size: '42', color: 'Hitam-Putih', stock: 18 },
      { size: '43', color: 'Hitam-Putih', stock: 12 },
    ]
  },
  {
    category_id: categoriesMap.celana_pria,
    title: 'Celana Jeans Raw Denim Selvedge Indigo',
    slug: 'celana-jeans-raw-denim-selvedge-indigo',
    description: 'Celana jeans denim tebal warna indigo tua dengan aksen lipatan selvedge di bagian bawah.',
    price: 450000,
    image_url: '/images/vektorin_photorealistic_general_professional_14_commercial_product_shot_of_dar.webp',
    variants: [
      { size: '29', color: 'Dark Indigo', stock: 9 },
      { size: '30', color: 'Dark Indigo', stock: 14 },
      { size: '31', color: 'Dark Indigo', stock: 16 },
      { size: '32', color: 'Dark Indigo', stock: 11 },
    ]
  },
  {
    category_id: categoriesMap.kaos_pria,
    title: 'Kaos Vintage Wash Hitam Oversized',
    slug: 'kaos-vintage-wash-hitam-oversized',
    description: 'Kaos oversized gaya streetwear dengan efek washed hitam pudar yang estetik.',
    price: 185000,
    image_url: '/images/vektorin_photorealistic_general_professional_14_front_view_shot_of_a_vintage_b.webp',
    variants: [
      { size: 'M', color: 'Washed Black', stock: 16 },
      { size: 'L', color: 'Washed Black', stock: 24 },
      { size: 'XL', color: 'Washed Black', stock: 15 },
    ]
  },
  {
    category_id: categoriesMap.sepatu_pria,
    title: 'Sepatu Running ZoomX Grey Performance',
    slug: 'sepatu-running-zoomx-grey-performance',
    description: 'Sepatu lari bernuansa futuristik warna abu-abu berbahan mesh ringan dengan bantalan tebal.',
    price: 590000,
    image_url: '/images/vektorin_photorealistic_general_professional_14_product_photography_of_a_futur.webp',
    variants: [
      { size: '40', color: 'Abu-abu', stock: 10 },
      { size: '41', color: 'Abu-abu', stock: 15 },
      { size: '42', color: 'Abu-abu', stock: 12 },
      { size: '43', color: 'Abu-abu', stock: 8 },
    ]
  },
  {
    category_id: categoriesMap.kaos_pria,
    title: 'Kaos Polos Cotton Combed Putih',
    slug: 'kaos-polos-cotton-combed-putih',
    description: 'Kaos polos katun combed 30s warna putih bersih dengan potongan reguler fit.',
    price: 150000,
    image_url: '/images/vektorin_photorealistic_general_professional_15_clean_studio_product_photograp.webp',
    variants: [
      { size: 'S', color: 'Putih', stock: 25 },
      { size: 'M', color: 'Putih', stock: 35 },
      { size: 'L', color: 'Putih', stock: 30 },
      { size: 'XL', color: 'Putih', stock: 20 },
    ]
  },
  {
    category_id: categoriesMap.sepatu_pria,
    title: 'Sepatu Lari Spikes Track & Field Kuning',
    slug: 'sepatu-lari-spikes-track-field-kuning',
    description: 'Sepatu lari lintasan (track spikes) warna kuning terang dengan pul besi akselerasi.',
    price: 510000,
    image_url: '/images/vektorin_photorealistic_general_professional_15_dynamic_flat_lay_of_a_pair_of_.webp',
    variants: [
      { size: '39', color: 'Kuning', stock: 6 },
      { size: '40', color: 'Kuning', stock: 10 },
      { size: '41', color: 'Kuning', stock: 12 },
      { size: '42', color: 'Kuning', stock: 8 },
    ]
  },
  {
    category_id: categoriesMap.celana_pria,
    title: 'Celana Chino Slim Fit Khaki & Sabuk',
    slug: 'celana-chino-slim-fit-khaki-sabuk',
    description: 'Celana chino katun warna khaki dengan lipatan rapi dan sabuk kulit coklat.',
    price: 320000,
    image_url: '/images/vektorin_photorealistic_general_professional_15_flat_lay_product_photography_o.webp',
    variants: [
      { size: '29', color: 'Khaki', stock: 12 },
      { size: '30', color: 'Khaki', stock: 18 },
      { size: '31', color: 'Khaki', stock: 15 },
      { size: '32', color: 'Khaki', stock: 20 },
    ]
  },
  {
    category_id: categoriesMap.sepatu_wanita,
    title: 'Sepatu Slip-On Knit Pink Pastel',
    slug: 'sepatu-slip-on-knit-pink-pastel',
    description: 'Sepatu wanita model slip-on berbahan knit rajut elastis warna pink pastel yang lembut.',
    price: 360000,
    image_url: '/images/vektorin_photorealistic_general_professional_16_e_commerce_product_photograph_.webp',
    variants: [
      { size: '36', color: 'Pink Pastel', stock: 10 },
      { size: '37', color: 'Pink Pastel', stock: 16 },
      { size: '38', color: 'Pink Pastel', stock: 14 },
      { size: '39', color: 'Pink Pastel', stock: 8 },
    ]
  },
  {
    category_id: categoriesMap.sepatu_pria,
    title: 'Sepatu Trail Running Outdoor Blue',
    slug: 'sepatu-trail-running-outdoor-blue',
    description: 'Sepatu lari outdoor/hiking warna biru dengan sol bergerigi kuat penjelajah medan.',
    price: 620000,
    image_url: '/images/vektorin_photorealistic_general_professional_17_close_up_macro_photography_of_.webp',
    variants: [
      { size: '40', color: 'Biru', stock: 9 },
      { size: '41', color: 'Biru', stock: 14 },
      { size: '42', color: 'Biru', stock: 12 },
      { size: '43', color: 'Biru', stock: 7 },
    ]
  },
  {
    category_id: categoriesMap.sepatu_pria,
    title: 'Sepatu High-Top Sneakers Merah Hitam',
    slug: 'sepatu-high-top-sneakers-merah-hitam',
    description: 'Sneakers high-top gaya basket/action warna merah hitam dinamis dengan rincian aksen tegas.',
    price: 550000,
    image_url: '/images/vektorin_photorealistic_general_professional_18_action_style_product_photo_of_.webp',
    variants: [
      { size: '40', color: 'Merah-Hitam', stock: 10 },
      { size: '41', color: 'Merah-Hitam', stock: 15 },
      { size: '42', color: 'Merah-Hitam', stock: 12 },
      { size: '43', color: 'Merah-Hitam', stock: 8 },
    ]
  },
  {
    category_id: categoriesMap.sepatu_pria,
    title: 'Sepatu Sneakers Leather Putih Silver',
    slug: 'sepatu-sneakers-leather-putih-silver',
    description: 'Sneakers kasual bahan kulit sintetis warna putih bersih dengan logo aksen silver metalik.',
    price: 410000,
    image_url: '/images/vektorin_photorealistic_general_professional_19_commercial_studio_shot_of_a_pr.webp',
    variants: [
      { size: '39', color: 'Putih-Silver', stock: 12 },
      { size: '40', color: 'Putih-Silver', stock: 18 },
      { size: '41', color: 'Putih-Silver', stock: 15 },
      { size: '42', color: 'Putih-Silver', stock: 10 },
    ]
  },
  {
    category_id: categoriesMap.aksesoris,
    title: 'Topi Beanie Rajut Navy Blue',
    slug: 'topi-beanie-rajut-navy-blue',
    description: 'Kupluk/beanie hangat berbahan wool rajut warna biru navy yang elastis dan nyaman.',
    price: 120000,
    image_url: '/images/vektorin_photorealistic_general_professional_1_close_up_product_shot_of_a_rib.webp',
    variants: [
      { size: 'All Size', color: 'Navy Blue', stock: 25 }
    ]
  },
  {
    category_id: categoriesMap.jaket_outerwear,
    title: 'Blazer Wool-Blend Navy Casual',
    slug: 'blazer-wool-blend-navy-casual',
    description: 'Jas/blazer kasual pria berbahan wool-blend warna navy terlipat rapi gaya eksklusif.',
    price: 580000,
    image_url: '/images/vektorin_photorealistic_general_professional_1_e_commerce_product_photo_of_a_.webp',
    variants: [
      { size: 'M', color: 'Navy', stock: 8 },
      { size: 'L', color: 'Navy', stock: 12 },
      { size: 'XL', color: 'Navy', stock: 6 },
    ]
  },
  {
    category_id: categoriesMap.sepatu_wanita,
    title: 'Sepatu Mules Kitten Heel Leather Navy',
    slug: 'sepatu-mules-kitten-heel-leather-navy',
    description: 'Sepatu mules wanita heels rendah warna navy berbahan kulit dengan aksen gesper silver.',
    price: 430000,
    image_url: '/images/vektorin_photorealistic_general_professional_1_e_commerce_shot_of_a_chic_navy.webp',
    variants: [
      { size: '36', color: 'Navy', stock: 8 },
      { size: '37', color: 'Navy', stock: 12 },
      { size: '38', color: 'Navy', stock: 10 },
      { size: '39', color: 'Navy', stock: 6 },
    ]
  },
  {
    category_id: categoriesMap.sepatu_pria,
    title: 'Sepatu Running Neon Green Sporty',
    slug: 'sepatu-running-neon-green-sporty',
    description: 'Sepatu olahraga lari warna hijau neon mencolok berbahan breathable mesh untuk performa tinggi.',
    price: 470000,
    image_url: '/images/vektorin_photorealistic_general_professional_20_dynamic_product_photography_of.webp',
    variants: [
      { size: '39', color: 'Hijau Neon', stock: 9 },
      { size: '40', color: 'Hijau Neon', stock: 14 },
      { size: '41', color: 'Hijau Neon', stock: 16 },
      { size: '42', color: 'Hijau Neon', stock: 10 },
    ]
  },
  {
    category_id: categoriesMap.sepatu_wanita,
    title: 'Sepatu High Heels Velvet Emerald Green',
    slug: 'sepatu-high-heels-velvet-emerald-green',
    description: 'High heels platform bahan beludru halus warna hijau zamrud (emerald green) dengan strap engkel.',
    price: 490000,
    image_url: '/images/vektorin_photorealistic_general_professional_2_commercial_product_photography.webp',
    variants: [
      { size: '36', color: 'Emerald Green', stock: 6 },
      { size: '37', color: 'Emerald Green', stock: 10 },
      { size: '38', color: 'Emerald Green', stock: 12 },
      { size: '39', color: 'Emerald Green', stock: 8 },
    ]
  },
  {
    category_id: categoriesMap.jaket_outerwear,
    title: 'Jaket Windbreaker Sporty Hitam-Cyan',
    slug: 'jaket-windbreaker-sporty-hitam-cyan',
    description: 'Jaket parasut penahan angin warna hitam dengan ritsleting & lis cyan waterproof.',
    price: 390000,
    image_url: '/images/vektorin_photorealistic_general_professional_2_high_contrast_product_photogra.webp',
    variants: [
      { size: 'S', color: 'Hitam-Cyan', stock: 10 },
      { size: 'M', color: 'Hitam-Cyan', stock: 18 },
      { size: 'L', color: 'Hitam-Cyan', stock: 15 },
      { size: 'XL', color: 'Hitam-Cyan', stock: 8 },
    ]
  },
  {
    category_id: categoriesMap.aksesoris,
    title: 'Tas Waist Bag Tactical Hitam Buckle',
    slug: 'tas-waist-bag-tactical-hitam-buckle',
    description: 'Tas pinggang/selempang tactical warna hitam bahan nylon kedap air dengan gesper metalik.',
    price: 210000,
    image_url: '/images/vektorin_photorealistic_general_professional_2_studio_product_photo_of_a_matt.webp',
    variants: [
      { size: 'All Size', color: 'Hitam', stock: 20 }
    ]
  },
  {
    category_id: categoriesMap.aksesoris,
    title: 'Tas Canvas Tote Bag Natural Cream',
    slug: 'tas-canvas-tote-bag-natural-cream',
    description: 'Tas kain tote bag ramah lingkungan berbahan kanvas polos warna natural off-white.',
    price: 135000,
    image_url: '/images/vektorin_photorealistic_general_professional_3_flat_lay_photography_of_a_natu.webp',
    variants: [
      { size: 'All Size', color: 'Natural Cream', stock: 30 }
    ]
  },
  {
    category_id: categoriesMap.sepatu_wanita,
    title: 'Sepatu High Heels Slingback Snakeskin',
    slug: 'sepatu-high-heels-slingback-snakeskin',
    description: 'High heels wanita bermotif kulit ular (snakeskin) dengan model slingback lancip dan aksesoris gelang emas.',
    price: 530000,
    image_url: '/images/vektorin_photorealistic_general_professional_3_flat_lay_style_product_photo_o.webp',
    variants: [
      { size: '36', color: 'Snakeskin', stock: 7 },
      { size: '37', color: 'Snakeskin', stock: 11 },
      { size: '38', color: 'Snakeskin', stock: 9 },
      { size: '39', color: 'Snakeskin', stock: 5 },
    ]
  },
  {
    category_id: categoriesMap.jaket_outerwear,
    title: 'Jaket Parka Winter Fur Hoodie Olive',
    slug: 'jaket-parka-winter-fur-hoodie-olive',
    description: 'Jaket parka winter tebal warna olive green dengan kerah fur (bulu) penahan angin dan saku depan.',
    price: 650000,
    image_url: '/images/vektorin_photorealistic_general_professional_3_front_view_product_photograph_.webp',
    variants: [
      { size: 'M', color: 'Olive Green', stock: 8 },
      { size: 'L', color: 'Olive Green', stock: 12 },
      { size: 'XL', color: 'Olive Green', stock: 6 },
    ]
  },
  {
    category_id: categoriesMap.sepatu_wanita,
    title: 'Sepatu Heels Transparan PVC Mules',
    slug: 'sepatu-heels-transparan-pvc-mules',
    description: 'Sepatu mules heels wanita bahan PVC bening transparan dengan hak block heels gaya modern.',
    price: 460000,
    image_url: '/images/vektorin_photorealistic_general_professional_4_high_fashion_product_shot_of_a.webp',
    variants: [
      { size: '36', color: 'Transparan', stock: 8 },
      { size: '37', color: 'Transparan', stock: 12 },
      { size: '38', color: 'Transparan', stock: 10 },
      { size: '39', color: 'Transparan', stock: 6 },
    ]
  },
  {
    category_id: categoriesMap.aksesoris,
    title: 'Topi Bucket Hat Hitam Streetwear',
    slug: 'topi-bucket-hat-hitam-streetwear',
    description: 'Topi bucket hat kasual bahan katun warna hitam polos dengan bordir logo minimalis di depan.',
    price: 145000,
    image_url: '/images/vektorin_photorealistic_general_professional_4_product_photograph_of_a_black_.webp',
    variants: [
      { size: 'All Size', color: 'Hitam', stock: 22 }
    ]
  },
  {
    category_id: categoriesMap.jaket_outerwear,
    title: 'Jaket Leather Bomber Hitam Classic',
    slug: 'jaket-leather-bomber-hitam-classic',
    description: 'Jaket bomber pria bahan kulit asli (genuine leather) warna hitam dengan ritsleting kuningan.',
    price: 680000,
    image_url: '/images/vektorin_photorealistic_general_professional_4_studio_product_photo_of_a_blac.webp',
    variants: [
      { size: 'M', color: 'Hitam', stock: 7 },
      { size: 'L', color: 'Hitam', stock: 10 },
      { size: 'XL', color: 'Hitam', stock: 5 },
    ]
  },
  {
    category_id: categoriesMap.sepatu_wanita,
    title: 'Sepatu High Heels Sequins Silver',
    slug: 'sepatu-high-heels-sequins-silver',
    description: 'Sepatu heels pesta wanita bertabur glitter/sequins warna silver berkilau dengan strap pergelangan kaki.',
    price: 540000,
    image_url: '/images/vektorin_photorealistic_general_professional_5_close_up_photography_of_a_silv.webp',
    variants: [
      { size: '36', color: 'Silver Sparkling', stock: 6 },
      { size: '37', color: 'Silver Sparkling', stock: 10 },
      { size: '38', color: 'Silver Sparkling', stock: 8 },
      { size: '39', color: 'Silver Sparkling', stock: 5 },
    ]
  },
  {
    category_id: categoriesMap.jaket_outerwear,
    title: 'Jaket Denim Trucker Vintage Blue',
    slug: 'jaket-denim-trucker-vintage-blue',
    description: 'Jaket jeans/denim klasik model trucker warna biru washed vintage dengan kancing tembaga.',
    price: 470000,
    image_url: '/images/vektorin_photorealistic_general_professional_5_commercial_product_shot_of_a_v.webp',
    variants: [
      { size: 'S', color: 'Vintage Blue', stock: 8 },
      { size: 'M', color: 'Vintage Blue', stock: 14 },
      { size: 'L', color: 'Vintage Blue', stock: 12 },
      { size: 'XL', color: 'Vintage Blue', stock: 7 },
    ]
  },
  {
    category_id: categoriesMap.sepatu_pria,
    title: 'Sepatu Sneakers Canvas Low-Top Off-White',
    slug: 'sepatu-sneakers-canvas-low-top-off-white',
    description: 'Sneakers kasual bertali bahan kanvas warna off-white/cream dengan garis merah & navy di sol.',
    price: 380000,
    image_url: '/images/vektorin_photorealistic_general_professional_5_commercial_studio_product_phot.webp',
    variants: [
      { size: '39', color: 'Off-White', stock: 12 },
      { size: '40', color: 'Off-White', stock: 18 },
      { size: '41', color: 'Off-White', stock: 16 },
      { size: '42', color: 'Off-White', stock: 10 },
    ]
  },
  {
    category_id: categoriesMap.jaket_outerwear,
    title: 'Rompi Sweater Rajut Vintage Motif',
    slug: 'rompi-sweater-rajut-vintage-motif',
    description: 'Rompi vest rajut vintage leher V (V-neck) motif etnik/fair-isle nuansa warna coklat tanah.',
    price: 260000,
    image_url: '/images/vektorin_photorealistic_general_professional_6_flat_lay_product_photo_of_a_vi.webp',
    variants: [
      { size: 'S', color: 'Coklat Etnik', stock: 8 },
      { size: 'M', color: 'Coklat Etnik', stock: 14 },
      { size: 'L', color: 'Coklat Etnik', stock: 10 },
      { size: 'XL', color: 'Coklat Etnik', stock: 6 },
    ]
  },
  {
    category_id: categoriesMap.kemeja_pria,
    title: 'Kemeja Cuban Collar Linen Sage Green',
    slug: 'kemeja-cuban-collar-linen-sage-green',
    description: 'Kemeja linen santai lengan pendek kerah cuban/camp collar warna sage green yang sejuk.',
    price: 295000,
    image_url: '/images/vektorin_photorealistic_general_professional_6_front_view_product_photo_of_a_.webp',
    variants: [
      { size: 'S', color: 'Sage Green', stock: 10 },
      { size: 'M', color: 'Sage Green', stock: 16 },
      { size: 'L', color: 'Sage Green', stock: 14 },
      { size: 'XL', color: 'Sage Green', stock: 8 },
    ]
  },
  {
    category_id: categoriesMap.sepatu_wanita,
    title: 'Sepatu High Heels Stiletto Suede Magenta',
    slug: 'sepatu-high-heels-stiletto-suede-magenta',
    description: 'High heels stiletto lancip wanita berbahan suede warna pink magenta cerah yang glamor.',
    price: 495000,
    image_url: '/images/vektorin_photorealistic_general_professional_6_studio_product_photo_of_a_bold.webp',
    variants: [
      { size: '36', color: 'Pink Magenta', stock: 6 },
      { size: '37', color: 'Pink Magenta', stock: 10 },
      { size: '38', color: 'Pink Magenta', stock: 8 },
      { size: '39', color: 'Pink Magenta', stock: 5 },
    ]
  },
  {
    category_id: categoriesMap.sepatu_wanita,
    title: 'Sandal Heels Ankle Strap Suede Nude',
    slug: 'sandal-heels-ankle-strap-suede-nude',
    description: 'Sandal heels hak tahu (block heel) wanita bahan suede halus warna nude beige netral.',
    price: 410000,
    image_url: '/images/vektorin_photorealistic_general_professional_7_e_commerce_catalog_photo_of_a_.webp',
    variants: [
      { size: '36', color: 'Nude Beige', stock: 8 },
      { size: '37', color: 'Nude Beige', stock: 14 },
      { size: '38', color: 'Nude Beige', stock: 12 },
      { size: '39', color: 'Nude Beige', stock: 7 },
    ]
  },
  {
    category_id: categoriesMap.jaket_outerwear,
    title: 'Jaket Fleece Full-Zip Charcoal',
    slug: 'jaket-fleece-full-zip-charcoal',
    description: 'Jaket luaran hangat berbahan fleece tebal warna charcoal dengan ritsleting penuh.',
    price: 380000,
    image_url: '/images/vektorin_photorealistic_general_professional_7_front_view_product_shot_of_a_d.webp',
    variants: [
      { size: 'M', color: 'Charcoal', stock: 12 },
      { size: 'L', color: 'Charcoal', stock: 18 },
      { size: 'XL', color: 'Charcoal', stock: 10 },
    ]
  },
  {
    category_id: categoriesMap.kemeja_pria,
    title: 'Kemeja Batik Modern Coklat Emas',
    slug: 'kemeja-batik-modern-coklat-emas',
    description: 'Kemeja batik pria lengan panjang motif parang/modern kombinasi warna coklat & emas eksklusif.',
    price: 330000,
    image_url: '/images/vektorin_photorealistic_general_professional_7_studio_product_photography_of_.webp',
    variants: [
      { size: 'S', color: 'Coklat-Emas', stock: 8 },
      { size: 'M', color: 'Coklat-Emas', stock: 15 },
      { size: 'L', color: 'Coklat-Emas', stock: 12 },
      { size: 'XL', color: 'Coklat-Emas', stock: 6 },
    ]
  },
  {
    category_id: categoriesMap.sweater_hoodie,
    title: 'Sweater Rajut Cable Knit Cream',
    slug: 'sweater-rajut-cable-knit-cream',
    description: 'Sweater rajut tebal motif cable knit warna cream/broken white terlipat rapi.',
    price: 360000,
    image_url: '/images/vektorin_photorealistic_general_professional_8_close_up_studio_product_photog.webp',
    variants: [
      { size: 'S', color: 'Cream', stock: 7 },
      { size: 'M', color: 'Cream', stock: 14 },
      { size: 'L', color: 'Cream', stock: 10 },
      { size: 'XL', color: 'Cream', stock: 6 },
    ]
  },
  {
    category_id: categoriesMap.kemeja_pria,
    title: 'Kemeja Linen Casual Beige Natural',
    slug: 'kemeja-linen-casual-beige-natural',
    description: 'Kemeja bahan linen alami lengan panjang warna beige natural gaya kasual santai.',
    price: 290000,
    image_url: '/images/vektorin_photorealistic_general_professional_8_flat_lay_photography_of_an_unb.webp',
    variants: [
      { size: 'S', color: 'Beige Natural', stock: 10 },
      { size: 'M', color: 'Beige Natural', stock: 16 },
      { size: 'L', color: 'Beige Natural', stock: 14 },
      { size: 'XL', color: 'Beige Natural', stock: 8 },
    ]
  },
  {
    category_id: categoriesMap.sepatu_wanita,
    title: 'Sepatu High Heels Pesta Satin Kristal',
    slug: 'sepatu-high-heels-pesta-satin-kristal',
    description: 'High heels pengantin/pesta bahan satin warna ivory putih dengan hiasan payet kristal mewah.',
    price: 680000,
    image_url: '/images/vektorin_photorealistic_general_professional_8_product_photography_of_a_brida.webp',
    variants: [
      { size: '36', color: 'Ivory Crystal', stock: 5 },
      { size: '37', color: 'Ivory Crystal', stock: 8 },
      { size: '38', color: 'Ivory Crystal', stock: 10 },
      { size: '39', color: 'Ivory Crystal', stock: 6 },
    ]
  },
  {
    category_id: categoriesMap.sepatu_wanita,
    title: 'Sepatu High Heels Patent Leather Hitam',
    slug: 'sepatu-high-heels-patent-leather-hitam',
    description: 'High heels lancip bahan kulit mengkilap (patent leather) warna hitam dengan sol bawah merah.',
    price: 570000,
    image_url: '/images/vektorin_photorealistic_general_professional_9_commercial_studio_shot_of_a_cl.webp',
    variants: [
      { size: '36', color: 'Hitam Sol Merah', stock: 6 },
      { size: '37', color: 'Hitam Sol Merah', stock: 12 },
      { size: '38', color: 'Hitam Sol Merah', stock: 10 },
      { size: '39', color: 'Hitam Sol Merah', stock: 5 },
    ]
  },
  {
    category_id: categoriesMap.kemeja_pria,
    title: 'Kemeja Putih Formal Oxford',
    slug: 'kemeja-putih-formal-oxford',
    description: 'Kemeja formal katun Oxford warna putih bersih terlipat rapi untuk pakaian kerja/resmi.',
    price: 285000,
    image_url: '/images/vektorin_photorealistic_general_professional_9_e_commerce_product_photograph_.webp',
    variants: [
      { size: 'S', color: 'Putih', stock: 14 },
      { size: 'M', color: 'Putih', stock: 20 },
      { size: 'L', color: 'Putih', stock: 18 },
      { size: 'XL', color: 'Putih', stock: 10 },
    ]
  },
  {
    category_id: categoriesMap.sweater_hoodie,
    title: 'Sweater Crewneck Cotton Terry Abu Misty',
    slug: 'sweater-crewneck-cotton-terry-abu-misty',
    description: 'Sweater leher bulat (crewneck) warna abu-abu misty berbahan baby terry lembut.',
    price: 295000,
    image_url: '/images/vektorin_photorealistic_general_professional_9_flat_lay_photography_of_a_heat.webp',
    variants: [
      { size: 'S', color: 'Abu Misty', stock: 12 },
      { size: 'M', color: 'Abu Misty', stock: 18 },
      { size: 'L', color: 'Abu Misty', stock: 15 },
      { size: 'XL', color: 'Abu Misty', stock: 9 },
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

const countP = db.prepare('SELECT COUNT(*) as total FROM products').get()
const countC = db.prepare('SELECT COUNT(*) as total FROM categories').get()
console.log(`SUCCESS: Total products in database: ${countP.total}, Categories: ${countC.total}`)
db.close()

