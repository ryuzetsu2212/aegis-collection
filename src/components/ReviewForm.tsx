'use client'

import { useState, useEffect } from 'react'
import { Star, CheckCircle2 } from 'lucide-react'
import { Button } from './ui/Button'

interface ReviewFormProps {
  productId: number
  orderId?: number
  productTitle?: string
  initialRating?: number | null
  initialComment?: string | null
  onReviewAdded: () => void
}

const COMMENT_TEMPLATES = [
  'Bahan berkualitas & sangat nyaman 👍',
  'Jahitan rapi & ukuran pas di badan ✨',
  'Pengiriman cepat & pengemasan rapi 📦',
  'Respon seller cepat & ramah 💬',
  'Sangat puas, produk sesuai foto! 💯',
]

export function ReviewForm({
  productId,
  orderId,
  productTitle,
  initialRating,
  initialComment,
  onReviewAdded,
}: ReviewFormProps) {
  const [rating, setRating] = useState<number>(initialRating || 0)
  const [comment, setComment] = useState<string>(initialComment || '')
  const [submitting, setSubmitting] = useState(false)
  const [submittedSuccess, setSubmittedSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setRating(initialRating || 0)
    setComment(initialComment || '')
  }, [initialRating, initialComment, productId])

  const handleTemplateClick = (tmpl: string) => {
    if (comment.includes(tmpl)) {
      const updated = comment
        .replace(tmpl, '')
        .replace(/(^\s*[\.\,\s]+|[\.\,\s]+$)/g, '')
        .trim()
      setComment(updated)
    } else {
      setComment((prev) => {
        const clean = prev.trim()
        if (!clean) return tmpl
        if (clean.endsWith('.') || clean.endsWith('!')) return `${clean} ${tmpl}`
        return `${clean}. ${tmpl}`
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      setError('Pilih rating minimal 1 bintang.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, orderId, rating, comment }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Gagal menyimpan ulasan.')
        setSubmitting(false)
        return
      }
      setSubmittedSuccess(true)
      onReviewAdded()
    } catch (err) {
      setError('Terjadi kesalahan.')
    }
    setSubmitting(false)
  }

  if (submittedSuccess) {
    return (
      <div className="mt-4 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2 animate-in fade-in duration-300">
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-extrabold text-emerald-950">Ulasan Berhasil Disimpan!</h4>
        <p className="text-xs text-emerald-800">Terima kasih atas ulasan & penilaian bintang yang Anda berikan.</p>
      </div>
    )
  }

  const isEditing = Boolean(initialRating && initialRating > 0)

  return (
    <form onSubmit={handleSubmit} className="mt-2.5 space-y-2.5">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-bold text-zinc-900">Rating Produk</label>
          {isEditing && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Mengedit Ulasan Anda ({initialRating}/5)
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="focus:outline-none cursor-pointer p-0.5 hover:scale-110 transition-transform"
            >
              <Star
                className={`h-6.5 w-6.5 ${star <= rating ? 'fill-amber-400 text-amber-400 drop-shadow-xs' : 'text-zinc-300'}`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="comment" className="block text-xs font-bold text-zinc-900 mb-1">
          Komentar (opsional)
        </label>
        
        {/* Template Buttons / Quick Review Chips */}
        <div className="mb-1.5 space-y-1">
          <p className="text-[10px] text-zinc-500 font-medium">Pilih template ulasan cepat:</p>
          <div className="flex overflow-x-auto gap-1.5 pb-1 touch-pan-x no-scrollbar">
            {COMMENT_TEMPLATES.map((tmpl) => {
              const isSelected = comment.includes(tmpl)
              return (
                <button
                  key={tmpl}
                  type="button"
                  onClick={() => handleTemplateClick(tmpl)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer font-medium whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300'
                  }`}
                >
                  {tmpl}
                </button>
              )
            })}
          </div>
        </div>

        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-800 text-xs text-zinc-900"
          placeholder="Tuliskan pengalaman Anda menggunakan produk ini..."
        />
      </div>
      {error && <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-lg">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full py-2.5 font-bold text-xs">
        {submitting ? 'Menyimpan...' : isEditing ? 'Perbarui Ulasan' : 'Kirim Ulasan'}
      </Button>
    </form>
  )
}