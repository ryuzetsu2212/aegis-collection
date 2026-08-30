'use client'

import { useState, useEffect } from 'react'
import { Image as ImageIcon, Plus, Trash2, ToggleLeft, ToggleRight, AlertCircle, Check, Upload } from 'lucide-react'
import Image from 'next/image'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface Banner {
  id: number
  title: string
  subtitle: string | null
  image_url: string | null
  link_url: string | null
  is_active: number
  position: number
}

import { compressImageIfNeeded } from '@/lib/imageCompressor'

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [position, setPosition] = useState('0')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/banners')
      if (res.ok) {
        const data = await res.json()
        setBanners(data.banners || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchBanners()
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    try {
      const compressedFile = await compressImageIfNeeded(file)
      const formData = new FormData()
      formData.append('file', compressedFile)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Gagal upload banner image')
      const data = await res.json()
      setImageUrl(data.url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!title.trim()) {
      setError('Judul banner wajib diisi')
      return
    }

    try {
      const res = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subtitle,
          image_url: imageUrl,
          position,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menambahkan banner')

      setTitle('')
      setSubtitle('')
      setImageUrl('')
      setPosition('0')
      setSuccess('Banner promo baru berhasil dipublikasikan!')
      fetchBanners()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleToggle = async (id: number, currentStatus: number) => {
    try {
      const res = await fetch('/api/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: currentStatus === 1 ? 0 : 1 }),
      })
      if (res.ok) fetchBanners()
    } catch (err) {
      console.error(err)
    }
  }

  const [deleteModalBannerId, setDeleteModalBannerId] = useState<number | null>(null)

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/banners?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchBanners()
    } catch (err) {
      console.error(err)
    } finally {
      setDeleteModalBannerId(null)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-100 py-4 sm:py-8 px-3 sm:px-6 lg:px-8 w-full max-w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight leading-tight">
              Kelola Banner Promo Admin
            </h1>
            <p className="text-xs text-zinc-600 mt-0.5 leading-snug">
              Atur konten hero banner promo utama di halaman katalog website.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 max-w-full">
          {/* Form Tambah Banner */}
          <div className="md:col-span-4 bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200 shadow-sm h-fit max-w-full">
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-purple-600 shrink-0" />
              Tambah Banner Promo Baru
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Judul Utama Banner</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Misal: Diskon Spesial Akhir Bulan Up to 50%"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Sub-Deskripsi (Opsional)</label>
                <textarea
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Dapatkan pakaian pilihan terbaik dengan gratis ongkir Bengkalis."
                  rows={2}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Gambar Banner</label>
                {imageUrl ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-zinc-300 mb-2">
                    <Image src={imageUrl} alt="Preview Banner" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full text-xs font-bold shadow-md cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-zinc-300 rounded-xl p-4 text-center relative bg-zinc-50 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Upload className="h-5 w-5 text-zinc-400 mx-auto mb-1" />
                    <span className="text-xs text-zinc-600 font-semibold">
                      {uploading ? 'Mengunggah gambar...' : 'Klik untuk upload gambar banner'}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Tampilkan Banner
              </button>
            </form>
          </div>

          {/* Tabel Banners */}
          <div className="md:col-span-8 bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden max-w-full">
            <div className="p-4 sm:p-5 border-b border-zinc-200 bg-zinc-50/50">
              <h2 className="text-sm sm:text-base font-bold text-zinc-900">Daftar Banner Promo ({banners.length})</h2>
            </div>

            <div className="divide-y divide-zinc-200">
              {banners.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">Belum ada banner promo ditambahkan.</div>
              ) : (
                banners.map((b) => (
                  <div key={b.id} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-zinc-50/80 transition-colors gap-3 min-w-0 max-w-full">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {b.image_url ? (
                        <div className="w-16 h-12 sm:w-20 sm:h-14 relative rounded-lg overflow-hidden border border-zinc-200 shrink-0">
                          <Image src={b.image_url} alt={b.title} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-12 sm:w-20 sm:h-14 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                          <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-400" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 pr-2">
                        <h3 className="text-xs sm:text-sm font-bold text-zinc-900 truncate">{b.title}</h3>
                        {b.subtitle && <p className="text-[11px] sm:text-xs text-zinc-500 line-clamp-1">{b.subtitle}</p>}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100">
                      <button
                        onClick={() => handleToggle(b.id, b.is_active)}
                        className="p-1.5 sm:p-2 text-zinc-600 hover:text-zinc-900 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
                      >
                        {b.is_active ? (
                          <ToggleRight className="h-6 w-6 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-zinc-400" />
                        )}
                        <span className="sm:hidden text-[10px] text-zinc-500">
                          {b.is_active ? 'Aktif' : 'Non-aktif'}
                        </span>
                      </button>
                      <button
                        onClick={() => setDeleteModalBannerId(b.id)}
                        className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModalBannerId !== null}
        title="Hapus Banner Promo"
        description="Apakah Anda yakin ingin menghapus banner promo ini secara permanen?"
        confirmText="Ya, Hapus Banner"
        cancelText="Batal"
        variant="danger"
        onConfirm={() => {
          if (deleteModalBannerId) handleDelete(deleteModalBannerId)
        }}
        onCancel={() => setDeleteModalBannerId(null)}
      />
    </div>
  )
}
