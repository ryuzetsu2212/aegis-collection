'use client'

import { useState, useEffect } from 'react'
import { Tag, Plus, Edit, Trash2, Check, X, AlertCircle } from 'lucide-react'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface Category {
  id: number
  name: string
  slug: string
}

export default function StaffCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : Array.isArray(data?.categories) ? data.categories : []
        setCategories(list)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleNameChange = (val: string) => {
    setName(val)
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!name.trim() || !slug.trim()) {
      setError('Nama dan slug kategori wajib diisi')
      return
    }

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menambahkan kategori')

      setName('')
      setSlug('')
      setSuccess('Kategori baru berhasil ditambahkan!')
      fetchCategories()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleUpdate = async (id: number) => {
    setError(null)
    setSuccess(null)

    if (!editName.trim() || !editSlug.trim()) {
      setError('Nama dan slug kategori wajib diisi')
      return
    }

    try {
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editName, slug: editSlug }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah kategori')

      setEditId(null)
      setSuccess('Kategori berhasil diperbarui!')
      fetchCategories()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const [deleteModalCategoryId, setDeleteModalCategoryId] = useState<number | null>(null)

  const handleDelete = async (id: number) => {
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus kategori')

      setSuccess('Kategori berhasil dihapus!')
      fetchCategories()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeleteModalCategoryId(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 w-full max-w-full overflow-x-hidden">
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-zinc-200 shadow-sm mb-4 sm:mb-6 flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
          <Tag className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm sm:text-base font-extrabold text-zinc-900 tracking-tight leading-tight">
            Kelola Kategori Pakaian
          </h1>
          <p className="text-[11px] sm:text-xs text-zinc-500 leading-normal">
            Tambah, ubah, dan atur kategori katalog produk toko.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 max-w-full">
        {/* Form Tambah Kategori */}
        <div className="md:col-span-4 bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200 shadow-sm h-fit max-w-full">
          <h2 className="text-sm sm:text-base font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-purple-600 shrink-0" />
            Tambah Kategori Baru
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Nama Kategori</label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Misal: Kemeja Pria"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">URL Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="misal: kemeja-pria"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-600 font-mono focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Simpan Kategori
            </button>
          </form>
        </div>

        {/* Tabel Kategori */}
        <div className="md:col-span-8 bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden max-w-full">
          {(() => {
            const safeCategories = Array.isArray(categories) ? categories : []
            return (
              <>
                <div className="p-4 sm:p-5 border-b border-zinc-200 bg-zinc-50/50">
                  <h2 className="text-sm sm:text-base font-bold text-zinc-900">
                    Daftar Kategori ({safeCategories.length})
                  </h2>
                </div>

                <div className="divide-y divide-zinc-200">
                  {safeCategories.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 text-xs">Belum ada kategori ditambahkan.</div>
                  ) : (
                    safeCategories.map((cat) => {
                const isEditing = editId === cat.id
                return (
                  <div
                    key={cat.id}
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-zinc-50/80 transition-colors gap-3 min-w-0 max-w-full"
                  >
                    {isEditing ? (
                      <div className="flex-1 flex flex-col sm:flex-row gap-2 min-w-0">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => {
                            setEditName(e.target.value)
                            setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
                          }}
                          className="flex-1 bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                        />
                        <input
                          type="text"
                          value={editSlug}
                          onChange={(e) => setEditSlug(e.target.value)}
                          className="w-full sm:w-32 bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs text-zinc-600 font-mono"
                        />
                      </div>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs sm:text-sm font-bold text-zinc-900 truncate">{cat.name}</h3>
                        <p className="text-[11px] sm:text-xs text-zinc-400 font-mono truncate">
                          /category/{cat.slug}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleUpdate(cat.id)}
                            className="p-1.5 sm:p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditId(null)}
                            className="p-1.5 sm:p-2 bg-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-300 transition-colors cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditId(cat.id)
                              setEditName(cat.name)
                              setEditSlug(cat.slug)
                            }}
                            className="p-1.5 sm:p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModalCategoryId(cat.id)}
                            className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
                  })
                )}
              </div>
            </>
          )
        })()}
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModalCategoryId !== null}
        title="Hapus Kategori"
        description="Apakah Anda yakin ingin menghapus kategori ini secara permanen?"
        confirmText="Ya, Hapus Kategori"
        cancelText="Batal"
        variant="danger"
        onConfirm={() => {
          if (deleteModalCategoryId) handleDelete(deleteModalCategoryId)
        }}
        onCancel={() => setDeleteModalCategoryId(null)}
      />
    </div>
  )
}
