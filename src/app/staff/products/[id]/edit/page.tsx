'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { UploadProductImage } from '@/components/UploadProductImage'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react'

interface Category {
  id: number
  name: string
  slug: string
}

interface VariantInput {
  id?: number
  size: string
  color: string
  stock: number
}

const AVAILABLE_SIZES = ['S', 'M', 'L', 'XL', 'All Size']

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const productId = resolvedParams.id
  const router = useRouter()

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [price, setPrice] = useState<number | ''>('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isActive, setIsActive] = useState(true)

  const [variants, setVariants] = useState<VariantInput[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [catRes, prodRes] = await Promise.all([
          fetch('/api/categories'),
          fetch(`/api/products/${productId}`),
        ])

        if (catRes.ok) {
          const catData = await catRes.json()
          const catList = Array.isArray(catData) ? catData : Array.isArray(catData?.categories) ? catData.categories : []
          setCategories(catList)
        }

        if (!prodRes.ok) {
          throw new Error('Produk tidak ditemukan.')
        }

        const prodData = await prodRes.json()
        setTitle(prodData.title || '')
        setSlug(prodData.slug || '')
        setPrice(prodData.price ?? '')
        setCategoryId(prodData.category_id ?? null)
        setDescription(prodData.description || '')
        setImageUrl(prodData.image_url || '')
        setIsActive(prodData.is_active === 1)

        if (Array.isArray(prodData.product_variants) && prodData.product_variants.length > 0) {
          setVariants(
            prodData.product_variants.map((v: any) => ({
              id: v.id,
              size: v.size || 'M',
              color: v.color || 'Standard',
              stock: v.stock ?? 0,
            }))
          )
        } else {
          setVariants([{ size: 'M', color: 'Standard', stock: 0 }])
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Gagal memuat data produk.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [productId])

  const handleTitleChange = (val: string) => {
    setTitle(val)
  }

  const addVariant = () => {
    setVariants([...variants, { size: 'M', color: 'Hitam', stock: 1 }])
  }

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  const updateVariant = (index: number, field: keyof VariantInput, value: string | number) => {
    const next = [...variants]
    next[index] = { ...next[index], [field]: value }
    setVariants(next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !slug || !price || !imageUrl) {
      setError('Mohon lengkapi semua field utama (Nama, Slug, Harga, Foto).')
      return
    }

    if (variants.length === 0) {
      setError('Minimal harus ada 1 varian produk.')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const payload = {
        title,
        slug,
        price: Number(price),
        category_id: categoryId,
        description: description || null,
        image_url: imageUrl,
        is_active: isActive,
        variants: variants.map((v) => ({
          size: v.size || null,
          color: v.color.trim() || 'Standard',
          stock: Number(v.stock) || 0,
        })),
      }

      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal memperbarui produk.')
      }

      router.push('/staff/products')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui produk.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menghapus produk.')
      }

      router.push('/staff/products')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus produk.')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 py-12 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/staff/products"
              className="p-2 text-zinc-500 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900">
                Edit Produk #{productId}
              </h1>
              <p className="text-xs text-zinc-500">Perbarui rincian produk, varian, dan stok</p>
            </div>
          </div>

          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold"
          >
            <Trash2 className="h-4 w-4" /> Hapus Produk
          </Button>
        </div>

        {error && (
          <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-black border-b border-zinc-100 pb-3">
              Informasi Utama
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <UploadProductImage
                value={imageUrl}
                onChange={(url) => setImageUrl(url)}
                disabled={saving}
              />

              <div className="space-y-4">
                <Input
                  label="Nama Produk"
                  placeholder="Contoh: Kaos Polos Cotton Combed"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                />

                <Input
                  label="Slug URL"
                  placeholder="kaos-polos-cotton-combed"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />

                <Input
                  label="Harga (Rp)"
                  type="number"
                  placeholder="150000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                  required
                />

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-black mb-1">
                    Kategori
                  </label>
                  <select
                    value={categoryId ?? ''}
                    onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full h-10 px-3 py-2 text-sm text-black font-medium bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    <option value="" className="text-black">-- Pilih Kategori --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="text-black font-medium">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-black mb-1">
                    Status Produk
                  </label>
                  <select
                    value={isActive ? 'true' : 'false'}
                    onChange={(e) => setIsActive(e.target.value === 'true')}
                    className="w-full h-10 px-3 py-2 text-sm text-black font-medium bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    <option value="true" className="text-black font-medium">Aktif (Tampil di Toko)</option>
                    <option value="false" className="text-black font-medium">Nonaktif (Disembunyikan)</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-black mb-1">
                Deskripsi Produk
              </label>
              <textarea
                rows={4}
                placeholder="Tuliskan deskripsi lengkap..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 text-sm text-black font-medium bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 placeholder:text-zinc-500"
              />
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-black">
                  Varian & Stok
                </h2>
                <p className="text-xs text-zinc-600 font-medium">Kombinasi ukuran, warna, & stok</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={addVariant}
                className="flex items-center gap-1.5 text-xs py-1.5 text-black font-bold"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Varian
              </Button>
            </div>

            <div className="space-y-3">
              {variants.map((v, i) => (
                <div
                  key={i}
                  className="flex flex-wrap sm:flex-nowrap items-end gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-lg"
                >
                  <div className="w-full sm:w-1/3">
                    <label className="block text-xs font-semibold text-black mb-1">Ukuran</label>
                    <select
                      value={v.size}
                      onChange={(e) => updateVariant(i, 'size', e.target.value)}
                      className="w-full h-9 px-2 text-xs text-black font-semibold bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    >
                      {AVAILABLE_SIZES.map((sz) => (
                        <option key={sz} value={sz} className="text-black font-semibold">
                          {sz}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full sm:w-1/3">
                    <label className="block text-xs font-semibold text-black mb-1">Warna</label>
                    <input
                      type="text"
                      placeholder="Hitam"
                      value={v.color}
                      onChange={(e) => updateVariant(i, 'color', e.target.value)}
                      className="w-full h-9 px-3 text-xs text-black font-medium bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-500"
                      required
                    />
                  </div>

                  <div className="w-full sm:w-1/3">
                    <label className="block text-xs font-semibold text-black mb-1">Stok</label>
                    <input
                      type="number"
                      min="0"
                      value={v.stock}
                      onChange={(e) => updateVariant(i, 'stock', Number(e.target.value))}
                      className="w-full h-9 px-3 text-xs text-black font-medium bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-500"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeVariant(i)}
                    disabled={variants.length === 1}
                    className="p-2 text-zinc-400 hover:text-red-600 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/staff/products">
              <Button type="button" variant="secondary" disabled={saving}>
                Batal
              </Button>
            </Link>
            <Button type="submit" disabled={saving} className="min-w-[140px] font-bold">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
              <h3 className="text-lg font-bold text-zinc-900">Konfirmasi Hapus Produk</h3>
              <p className="text-sm text-zinc-600">
                Apakah Anda yakin ingin menghapus permanen produk <strong className="text-zinc-900">&quot;{title}&quot;</strong>? Semua varian stok akan ikut terhapus.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="font-bold"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Ya, Hapus Produk'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

