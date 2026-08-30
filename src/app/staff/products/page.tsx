'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Plus, Edit, Trash2, Package, Loader2 } from 'lucide-react'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface ProductWithVariants {
  id: number
  title: string
  slug: string
  price: number
  image_url: string
  is_active: number | boolean
  category_name: string | null
  product_variants: { stock: number }[]
}

export default function StaffProductsPage() {
  const [products, setProducts] = useState<ProductWithVariants[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      setLoading(true)
      const res = await fetch('/api/products?active=false&limit=1000')
      if (!res.ok) throw new Error('Gagal memuat produk.')
      const data = await res.json()
      const productList = Array.isArray(data.products)
        ? data.products
        : Array.isArray(data)
        ? data
        : []
      setProducts(productList)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat produk.')
    } finally {
      setLoading(false)
    }
  }

  const [deleteModalProduct, setDeleteModalProduct] = useState<{ id: number; title: string } | null>(null)

  async function deleteProduct(id: number, title: string) {
    try {
      setDeletingId(id)
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menghapus produk.')
      }
      await fetchProducts()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus produk.')
    } finally {
      setDeletingId(null)
      setDeleteModalProduct(null)
    }
  }

  const totalStock = (variants: { stock: number }[]) =>
    variants.reduce((sum, v) => sum + v.stock, 0)

  return (

    <div className="min-h-screen bg-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Kelola Inventaris Produk
            </h1>
            <p className="text-xs text-zinc-500">Kelola daftar produk dan stok</p>
          </div>
          <Link href="/staff/products/new">
            <Button className="flex items-center gap-2 text-sm">
              <Plus className="h-4 w-4" />
              Tambah Produk
            </Button>
          </Link>
        </div>

        {error && (
          <div className="p-3 mb-4 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : !Array.isArray(products) || products.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center">
            <Package className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">Belum ada produk.</p>
            <Link href="/staff/products/new" className="text-sm text-zinc-900 font-medium hover:underline">
              Tambah produk pertama
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-zinc-600">Produk</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-zinc-600">Kategori</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-zinc-600">Harga</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-zinc-600">Stok Total</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-zinc-600">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-zinc-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {products?.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/50">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <div className="w-16 aspect-[16/9] relative bg-zinc-100 rounded-md overflow-hidden">
                        <Image
                          src={p.image_url}
                          alt={p.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <span className="font-medium text-zinc-900 line-clamp-1">{p.title}</span>
                    </td>
                    <td className="py-3 px-4 text-zinc-600">
                      {p.category_name || '-'}
                    </td>
                    <td className="py-3 px-4 font-semibold tabular-nums text-zinc-900">
                      {formatPrice(p.price)}
                    </td>
                    <td className="py-3 px-4 text-zinc-700">
                      {(() => {
                        const stock = totalStock(p.product_variants || [])
                        const isLowStock = stock < 5
                        return (
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-zinc-900'}`}>
                              {stock}
                            </span>
                            {isLowStock && (
                              <span className="bg-red-100 text-red-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse border border-red-300">
                                ⚠️ Stok Menipis
                              </span>
                            )}
                          </div>
                        )
                      })()}
                    </td>
                    <td className="py-3 px-4">
                      {(() => {
                        const active = Number(p.is_active) === 1 || p.is_active === true
                        return (
                          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                            active
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/staff/products/${p.id}/edit`}
                          className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                          title="Edit Produk"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteModalProduct({ id: p.id, title: p.title })}
                          disabled={deletingId === p.id}
                          className="p-2 text-zinc-400 hover:text-red-600 disabled:opacity-30 transition-colors cursor-pointer"
                          title="Hapus Produk"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModalProduct !== null}
        title="Hapus Produk"
        description={`Apakah Anda yakin ingin menghapus permanen produk "${deleteModalProduct?.title}"?`}
        confirmText="Ya, Hapus Produk"
        cancelText="Batal"
        variant="danger"
        isLoading={deletingId === deleteModalProduct?.id}
        onConfirm={() => {
          if (deleteModalProduct) {
            deleteProduct(deleteModalProduct.id, deleteModalProduct.title)
          }
        }}
        onCancel={() => setDeleteModalProduct(null)}
      />
    </div>
  )
}