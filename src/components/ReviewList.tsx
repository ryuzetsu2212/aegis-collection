'use client'

import { useState, useEffect } from 'react'
import { Star, MessageCircle, Pencil, Trash2, Send, Loader2, CornerDownRight, Sparkles } from 'lucide-react'

interface Review {
  id: number
  rating: number
  comment: string | null
  admin_reply?: string | null
  replied_at?: string | null
  user_name: string
  created_at: string
}

interface ReviewListProps {
  reviews: Review[]
  onReviewUpdated?: () => void
}

const QUICK_REPLY_TEMPLATES = [
  {
    label: '🙏 Terima Kasih & Awet',
    text: 'Halo Kak! Terima kasih banyak telah berbelanja di Aegis Collection. Semoga suka dan produknya awet ya kak! Ditunggu pesanan berikutnya! 😊🙏',
  },
  {
    label: '⭐ Bintang 5 & Kepuasan',
    text: 'Terima kasih atas ulasan positif dan bintang 5 nya Kak! Kepuasan Kakak adalah prioritas utama kami. Happy shopping! 🛍️✨',
  },
  {
    label: '📦 Pengiriman & Packing',
    text: 'Terima kasih Kak! Kami selalu berusaha memberikan pengemasan paling aman & rapi serta pengiriman cepat untuk Anda. 📦🚚',
  },
  {
    label: '⚠️ Permohonan Maaf & Solusi',
    text: 'Halo Kak, mohon maaf atas ketidaknyamanannya. Tim kami siap membantu! Silakan hubungi CS kami via Chat Toko agar kami tindaklanjuti segera ya Kak. 🙏',
  },
]

export function ReviewList({ reviews, onReviewUpdated }: ReviewListProps) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [replyingId, setReplyingId] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function checkMe() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setCurrentUser(data.user)
        }
      } catch {}
    }
    checkMe()
  }, [])

  const isAdminOrStaff = currentUser?.role === 'admin' || currentUser?.role === 'staff'

  const handleStartReply = (review: Review) => {
    setReplyingId(review.id)
    setReplyText(review.admin_reply || '')
  }

  const handleSaveReply = async (reviewId: number) => {
    if (!replyText.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, reply: replyText.trim() }),
      })
      if (res.ok) {
        setReplyingId(null)
        setReplyText('')
        if (onReviewUpdated) onReviewUpdated()
      }
    } catch (err) {
      console.error('Failed to save reply', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteReply = async (reviewId: number) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, deleteReply: true }),
      })
      if (res.ok) {
        setReplyingId(null)
        if (onReviewUpdated) onReviewUpdated()
      }
    } catch (err) {
      console.error('Failed to delete reply', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const safeReviews = Array.isArray(reviews) ? reviews : []
  if (safeReviews.length === 0) {
    return <p className="text-sm text-zinc-500 py-4">Belum ada ulasan untuk kategori/bintang ini.</p>
  }

  return (
    <div className="space-y-5">
      {safeReviews.map((review) => {
        const isReplyingThis = replyingId === review.id

        return (
          <div key={review.id} className="border-b border-zinc-100 pb-5 last:border-b-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'}`}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-zinc-900">{review.user_name}</span>
                <span className="text-xs text-zinc-400">
                  {new Date(review.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              {/* Admin / Staff Reply Trigger Button */}
              {isAdminOrStaff && !isReplyingThis && (
                <button
                  type="button"
                  onClick={() => handleStartReply(review)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                >
                  <CornerDownRight className="h-3.5 w-3.5 text-blue-600" />
                  <span>{review.admin_reply ? 'Edit Balasan' : 'Balas Ulasan'}</span>
                </button>
              )}
            </div>

            {review.comment && (
              <p className="mt-2 text-sm text-zinc-700 leading-relaxed pl-1">{review.comment}</p>
            )}

            {/* Display Admin / Staff Reply */}
            {review.admin_reply && !isReplyingThis && (
              <div className="mt-3 bg-zinc-50 border-l-4 border-zinc-900 rounded-r-2xl p-3.5 text-xs shadow-xs relative group">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                    <MessageCircle className="h-3.5 w-3.5 text-blue-600" />
                    <span>Balasan Penjual (Aegis Collection):</span>
                  </div>

                  {isAdminOrStaff && (
                    <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleStartReply(review)}
                        className="p-1 text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                        title="Edit Balasan"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteReply(review.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        title="Hapus Balasan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-zinc-700 leading-relaxed">{review.admin_reply}</p>
              </div>
            )}

            {/* Inline Admin/Staff Reply Form */}
            {isReplyingThis && (
              <div className="mt-3 bg-blue-50/60 border border-blue-200 rounded-2xl p-3.5 flex flex-col gap-2.5 animate-in fade-in duration-150">
                <label className="text-xs font-bold text-blue-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="h-4 w-4 text-blue-600" />
                    <span>Balas ulasan ini sebagai {currentUser.role === 'admin' ? 'Admin' : 'Staf Toko'}:</span>
                  </span>
                </label>

                {/* Quick Reply Templates */}
                <div className="space-y-1.5 pt-0.5">
                  <span className="text-[11px] font-bold text-zinc-600 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-500" /> Template Balasan Cepat (Klik untuk memilih):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_REPLY_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setReplyText(tmpl.text)}
                        className="text-[11px] font-semibold text-zinc-700 bg-white hover:bg-blue-50 border border-zinc-200 hover:border-blue-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-left shadow-2xs"
                        title={tmpl.text}
                      >
                        {tmpl.label}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Tuliskan balasan toko di sini..."
                  rows={3}
                  className="w-full text-xs text-zinc-900 bg-white border border-blue-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />

                <div className="flex items-center justify-between pt-1">
                  {review.admin_reply ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteReply(review.id)}
                      disabled={isSubmitting}
                      className="px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Hapus Balasan</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReplyingId(null)}
                      className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-200/60 rounded-lg cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveReply(review.id)}
                      disabled={isSubmitting || !replyText.trim()}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      <span>Kirim Balasan</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}