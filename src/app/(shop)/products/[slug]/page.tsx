import { getDb, DbProductVariant } from '@/lib/db'
import { PackageX, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ProductDetailClient } from './ProductDetailClient'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const db = await getDb()

  const row = (await db.prepare(`
    SELECT 
      p.*,
      c.name as category_name,
      c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.slug = ?
    LIMIT 1
  `).get(slug)) as any

  if (!row) {
    return (
      <div className="flex-1 bg-zinc-50/60 flex items-center justify-center min-h-[65vh] px-4 py-16">
        <div className="max-w-md w-full text-center bg-white p-8 md:p-10 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4 text-zinc-500">
            <PackageX className="w-8 h-8 stroke-[1.75]" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight">
            Produk Tidak Ditemukan
          </h1>
          <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
            Maaf, produk yang Anda cari tidak tersedia, telah dihapus, atau tautan yang Anda buka tidak valid.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full justify-center">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-xl shadow-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Katalog
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const rawVariants = await db.prepare(
    'SELECT id, product_id, size, color, stock FROM product_variants WHERE product_id = ?'
  ).all(row.id)
  const variants = (Array.isArray(rawVariants) ? rawVariants : []) as DbProductVariant[]

  let relatedProducts: any[] = []
  if (row.category_id) {
    const rawRelated = await db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
      LIMIT 4
    `).all(row.category_id, row.id)
    relatedProducts = Array.isArray(rawRelated) ? rawRelated : []
  }

  const product = {
    ...row,
    product_variants: variants,
  }

  return <ProductDetailClient product={product} relatedProducts={relatedProducts} />
}
