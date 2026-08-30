import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { Star } from 'lucide-react'

export interface ProductCardProps {
  id: string
  slug: string
  title: string
  price: number
  imageUrl: string
  category?: string
  rating?: number
  totalReviews?: number
  totalSold?: number
  stock?: number
}

export function ProductCard({
  id,
  slug,
  title,
  price,
  imageUrl,
  category,
  rating,
  totalReviews,
  totalSold,
  stock,
}: ProductCardProps) {
  const productId = parseInt(id)
  const discountedPrice = price * 0.5

  return (
    <div className="group relative">
      <Link href={`/products/${slug}`} className="block">
        <div className="aspect-[16/9] relative overflow-hidden bg-zinc-100 rounded-lg">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover w-full h-full transition-transform duration-300 group-hover:scale-105 ${
              stock === 0 ? 'grayscale opacity-75' : ''
            }`}
          />
          <span className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
            50% OFF
          </span>
          {stock === 0 && (
            <span className="absolute top-2 right-2 z-10 bg-zinc-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
              Stok Habis
            </span>
          )}
        </div>
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between gap-1">
            {category && (
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 truncate">
                {category}
              </p>
            )}
            <div className="flex items-center gap-1.5 shrink-0">
              {totalSold !== undefined && (
                <>
                  <span className="text-[10px] font-bold text-zinc-500">
                    {totalSold} Terjual
                  </span>
                  <span className="text-[10px] text-zinc-300">•</span>
                </>
              )}
              {rating !== undefined ? (
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>{rating > 0 ? Number(rating).toFixed(1) : '5.0'}</span>
                  <span className="text-[10px] text-zinc-400 font-normal">
                    ({totalReviews ?? 0})
                  </span>
                </div>
              ) : null}
            </div>
          </div>
          <h3 className="text-sm font-medium text-zinc-900 line-clamp-2">
            {title}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tabular-nums text-red-600">
              {formatPrice(discountedPrice)}
            </span>
            <span className="text-xs text-zinc-400 line-through tabular-nums font-normal">
              {formatPrice(price)}
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
}