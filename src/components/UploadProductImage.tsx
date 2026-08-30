'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2 } from 'lucide-react'
import { compressImageIfNeeded } from '@/lib/imageCompressor'

interface UploadProductImageProps {
  value?: string
  onChange: (url: string) => void
  disabled?: boolean
}

export function UploadProductImage({ value, onChange, disabled }: UploadProductImageProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0]
    if (!rawFile) return

    if (!rawFile.type.startsWith('image/')) {
      setError('File harus berupa gambar.')
      return
    }

    try {
      setUploading(true)
      setError(null)

      const file = await compressImageIfNeeded(rawFile)
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal upload gambar.')
      }

      const data = await res.json()
      onChange(data.url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah gambar.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    onChange('')
  }

  return (
    <div className="w-full space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wider text-black">
        Foto Produk
      </label>

      {value ? (
        <div className="relative aspect-[16/9] w-64 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 group">
          <Image
            src={value}
            alt="Preview produk"
            fill
            className="object-cover"
            sizes="256px"
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="absolute top-2 right-2 rounded-full bg-zinc-900/80 p-1.5 text-white hover:bg-red-600 transition-colors"
            title="Hapus foto"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center aspect-[16/9] max-w-sm border-2 border-dashed border-zinc-300 rounded-lg p-6 hover:border-zinc-400 bg-zinc-50 transition-colors">
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-zinc-500">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-xs">Mengunggah gambar...</span>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full text-center">
              <Upload className="h-8 w-8 text-zinc-500 mb-2" />
              <span className="text-sm font-bold text-black">Klik untuk upload foto</span>
              <span className="text-xs text-zinc-600 font-medium mt-1">PNG, JPG, WEBP maks 5MB</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={disabled || uploading}
                className="hidden"
              />
            </label>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  )
}
