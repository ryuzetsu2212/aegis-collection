import { Star, MessageCircle } from 'lucide-react'

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
}

export function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return <p className="text-sm text-zinc-500">Belum ada ulasan untuk produk ini.</p>
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-zinc-100 pb-4 last:border-b-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}`}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-zinc-900">{review.user_name}</span>
            <span className="text-xs text-zinc-400">
              {new Date(review.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>

          {review.comment && (
            <p className="mt-1.5 text-sm text-zinc-700 leading-relaxed">{review.comment}</p>
          )}

          {review.admin_reply && (
            <div className="mt-3 bg-zinc-50 border-l-4 border-zinc-900 rounded-r-xl p-3 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-zinc-900 mb-1">
                <MessageCircle className="h-3.5 w-3.5 text-blue-600" />
                <span>Balasan Penjual (Aegis Collection):</span>
              </div>
              <p className="text-zinc-600 leading-relaxed">{review.admin_reply}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}