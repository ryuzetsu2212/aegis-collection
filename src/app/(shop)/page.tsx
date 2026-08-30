import { Suspense } from 'react'
import { getDb, DbBanner } from '@/lib/db'
import { ProductCard } from '@/components/ProductCard'
import { SearchBar } from '@/components/SearchBar'
import { AdvancedFilter } from '@/components/AdvancedFilter'
import { Pagination } from '@/components/Pagination'
import Image from 'next/image'

interface ProductWithCategory {
  id: number
  slug: string
  title: string
  price: number
  image_url: string
  category_name: string | null
  average_rating?: number
  total_reviews?: number
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    category?: string
    sort?: string
    min_price?: string
    max_price?: string
    page?: string
  }>
}) {
  const {
    q = '',
    category = '',
    sort = 'newest',
    min_price = '',
    max_price = '',
    page: pageStr = '1',
  } = await searchParams

  const db = await getDb()
  const page = Math.max(1, parseInt(pageStr) || 1)
  const limit = 12

  // Fetch active banners
  const banners = db.prepare('SELECT * FROM banners WHERE is_active = 1 ORDER BY position ASC').all() as DbBanner[]

  // Build query for products with filters
  let baseWhere = ' FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = 1'
  const params: any[] = []

  if (q) {
    baseWhere += ' AND (p.title LIKE ? OR p.description LIKE ?)'
    const like = `%${q}%`
    params.push(like, like)
  }

  if (category) {
    baseWhere += ' AND c.slug = ?'
    params.push(category)
  }

  if (min_price && !isNaN(Number(min_price))) {
    baseWhere += ' AND (p.price * 0.5) >= ?'
    params.push(Number(min_price))
  }

  if (max_price && !isNaN(Number(max_price))) {
    baseWhere += ' AND (p.price * 0.5) <= ?'
    params.push(Number(max_price))
  }

  // Get total count
  const countQuery = 'SELECT COUNT(*) as total' + baseWhere
  const countStmt = db.prepare(countQuery)
  const totalRow = countStmt.get(...params) as { total: number } | undefined
  const total = totalRow?.total ?? 0
  const totalPages = Math.ceil(total / limit)

  let query = `
    SELECT 
      p.id,
      p.slug,
      p.title,
      p.price,
      p.image_url,
      c.name as category_name,
      c.slug as category_slug,
      COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = p.id), 0) as average_rating,
      COALESCE((SELECT COUNT(*) FROM reviews WHERE product_id = p.id), 0) as total_reviews
  ` + baseWhere

  // Order by sorting option (based on discounted selling price)
  if (sort === 'price_asc') {
    query += ' ORDER BY (p.price * 0.5) ASC'
  } else if (sort === 'price_desc') {
    query += ' ORDER BY (p.price * 0.5) DESC'
  } else {
    query += ' ORDER BY p.created_at DESC'
  }

  const offset = (page - 1) * limit
  query += ' LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const rows = db.prepare(query).all(...params) as ProductWithCategory[]
  const categories = db.prepare('SELECT id, name, slug FROM categories ORDER BY name').all() as { id: number; name: string; slug: string }[]

  return (
    <div className="flex-1 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner Promo Hero Slider/Card jika ada */}
        {banners.length > 0 && (
          <div className="mb-10 rounded-3xl overflow-hidden bg-zinc-900 text-white shadow-xl relative p-8 sm:p-12 border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 z-10 max-w-xl">
              <span className="bg-amber-400 text-zinc-950 text-xs font-black uppercase px-3 py-1 rounded-full tracking-wider">
                Special Promo Toko
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                {banners[0].title}
              </h2>
              {banners[0].subtitle && (
                <p className="text-zinc-300 text-sm leading-relaxed">{banners[0].subtitle}</p>
              )}
            </div>
            {banners[0].image_url && (
              <div className="w-full md:w-80 h-48 relative rounded-2xl overflow-hidden border border-zinc-700 shadow-md shrink-0">
                <Image
                  src={banners[0].image_url}
                  alt={banners[0].title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
          </div>
        )}

        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900">
              Koleksi Pakaian Pilihan
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Temukan pakaian fashion berkualitas tinggi dengan penawaran terbaik.
            </p>
          </div>
        </div>

        {/* Search and Advanced Filter */}
        <div className="space-y-4 mb-8">
          <SearchBar initialQuery={q} />
          <Suspense fallback={null}>
            <AdvancedFilter categories={categories} />
          </Suspense>
        </div>

        {/* Product Grid */}
        {total === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-zinc-200 shadow-sm">
            <p className="text-sm font-semibold text-zinc-700">Tidak ada produk yang cocok dengan filter Anda.</p>
            <p className="text-xs text-zinc-400 mt-1">Coba ubah kata kunci pencarian atau reset filter harga.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rows.map((product) => (
                <ProductCard
                  key={product.id}
                  id={String(product.id)}
                  slug={product.slug}
                  title={product.title}
                  price={product.price}
                  imageUrl={product.image_url}
                  category={product.category_name || undefined}
                  rating={product.average_rating}
                  totalReviews={product.total_reviews}
                />
              ))}
            </div>
            <Suspense fallback={null}>
              <Pagination currentPage={page} totalPages={totalPages} />
            </Suspense>
          </>
        )}
      </div>
    </div>
  )
}