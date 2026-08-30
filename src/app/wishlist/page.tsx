import { getDb } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { ProductCard } from '@/components/ProductCard'

export default async function WishlistPage() {
  try {
    const user = await requireAuth()
    const db = await getDb()
    const rawRows = await db.prepare(`
      SELECT p.id, p.slug, p.title, p.price, p.image_url, c.name as category_name
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `).all(user.id)
    const rows = (Array.isArray(rawRows) ? rawRows : []) as any[]

    return (
      <div className="flex-1 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-2xl font-bold mb-8">Wishlist</h1>
          {rows.length === 0 ? (
            <p className="text-zinc-500">Belum ada produk di wishlist.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rows.map((product: any) => (
                <ProductCard
                  key={product.id}
                  id={String(product.id)}
                  slug={product.slug}
                  title={product.title}
                  price={product.price}
                  imageUrl={product.image_url}
                  category={product.category_name || undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  } catch (error) {
    // If not authenticated, redirect to login
    return (
      <div className="flex-1 bg-zinc-50 p-8 text-center">
        <p className="text-zinc-500">Silakan login untuk melihat wishlist.</p>
      </div>
    )
  }
}