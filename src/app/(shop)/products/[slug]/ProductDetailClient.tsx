'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/store/useCartStore'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Minus, Plus, ShoppingCart, Ruler, Sparkles, Star, MessageSquare, Zap, Filter } from 'lucide-react'
import { SizeChartModal } from '@/components/SizeChartModal'
import { ProductCard } from '@/components/ProductCard'
import { ReviewList } from '@/components/ReviewList'

interface ProductVariant {
  id: number
  product_id: number
  size: string | null
  color: string
  stock: number
}

interface Product {
  id: number
  slug: string
  title: string
  description: string | null
  price: number
  image_url: string
  category_name: string | null
  product_variants: ProductVariant[]
}

export function ProductDetailClient({
  product,
  relatedProducts = [],
}: {
  product: Product
  relatedProducts?: any[]
}) {
  const router = useRouter()
  const variants = Array.isArray(product.product_variants) ? product.product_variants : []
  const safeRelatedProducts = Array.isArray(relatedProducts) ? relatedProducts : []

  const initialColor = variants.length > 0 ? variants[0].color : null
  const initialSizes = variants.filter(v => v.size).map(v => v.size as string)
  const initialSize = initialSizes.length > 0 ? initialSizes[0] : null

  const [selectedSize, setSelectedSize] = useState<string | null>(initialSize)
  const [selectedColor, setSelectedColor] = useState<string | null>(initialColor)
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false)

  // Reviews State
  const [reviews, setReviews] = useState<any[]>([])
  const [totalReviews, setTotalReviews] = useState<number>(0)
  const [avgRating, setAvgRating] = useState<number>(5.0)
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | 'all'>('all')

  const addItem = useCartStore((state) => state.addItem)

  useEffect(() => {
    fetchReviews()
  }, [product.id])

  async function fetchReviews() {
    try {
      const res = await fetch(`/api/reviews?productId=${product.id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.reviews) {
          setReviews(data.reviews)
          setTotalReviews(data.total_reviews)
          setAvgRating(data.average_rating || 5.0)
        } else if (Array.isArray(data)) {
          setReviews(data)
          setTotalReviews(data.length)
        }
      }
    } catch {}
  }

  const getProductVariants = () => {
    return variants.filter(v => 
      (!selectedSize || v.size === selectedSize) &&
      (!selectedColor || v.color === selectedColor)
    )
  }

  const getAvailableStock = () => {
    const matchedVariants = getProductVariants()
    return matchedVariants.reduce((sum, v) => sum + v.stock, 0)
  }

  const getAvailableColors = () => {
    const matchedVariants = selectedSize 
      ? variants.filter(v => v.size === selectedSize)
      : variants
    return [...new Set(matchedVariants.map(v => v.color))]
  }

  const getAvailableSizes = () => {
    const matchedVariants = selectedColor
      ? variants.filter(v => v.color === selectedColor)
      : variants
    return [...new Set(matchedVariants.filter(v => v.size).map(v => v.size!))]
  }

  const handleAddToCart = () => {
    setError(null)

    if (!selectedColor && availableColors.length > 0) {
      setError('Pilih warna terlebih dahulu')
      return
    }

    const matchedVariants = getProductVariants()
    if (matchedVariants.length === 0) {
      setError('Varian tidak tersedia')
      return
    }

    const variant = matchedVariants[0]
    if (variant.stock < quantity) {
      setError('Stok tidak mencukupi')
      return
    }

    const discountedPrice = product.price * 0.5

    addItem({
      variantId: String(variant.id),
      productId: String(product.id),
      productTitle: product.title,
      productSlug: product.slug,
      imageUrl: product.image_url,
      size: selectedSize,
      color: selectedColor || variant.color || 'Default',
      price: discountedPrice,
    }, quantity)

    setQuantity(1)
    router.push('/cart')
  }

  const handleDirectCheckout = () => {
    setError(null)

    if (!selectedColor && availableColors.length > 0) {
      setError('Pilih warna terlebih dahulu')
      return
    }

    const matchedVariants = getProductVariants()
    if (matchedVariants.length === 0) {
      setError('Varian tidak tersedia')
      return
    }

    const variant = matchedVariants[0]
    if (variant.stock < quantity) {
      setError('Stok tidak mencukupi')
      return
    }

    const discountedPrice = product.price * 0.5

    const directItem = {
      variantId: String(variant.id),
      productId: String(product.id),
      productTitle: product.title,
      productSlug: product.slug,
      imageUrl: product.image_url,
      size: selectedSize,
      color: selectedColor || variant.color || 'Default',
      price: discountedPrice,
      quantity: quantity,
    }

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('toko_direct_buy_item', JSON.stringify(directItem))
    }

    router.push('/checkout?direct=true')
  }

  const availableStock = getAvailableStock()
  const availableColors = getAvailableColors()
  const availableSizes = getAvailableSizes()
  const discountedPrice = product.price * 0.5

  const categoryLower = (product.category_name?.toLowerCase() || '')
  const titleLower = product.title.toLowerCase()

  const isExplicitShoe =
    categoryLower.includes('sepatu') ||
    categoryLower.includes('sandal') ||
    categoryLower.includes('shoe') ||
    categoryLower.includes('footwear') ||
    titleLower.includes('sepatu') ||
    titleLower.includes('shoe') ||
    titleLower.includes('sneaker') ||
    titleLower.includes('sandal') ||
    titleLower.includes('boot') ||
    titleLower.includes('pantofel')

  const isExplicitApparel =
    categoryLower.includes('celana') ||
    categoryLower.includes('baju') ||
    categoryLower.includes('kaos') ||
    categoryLower.includes('kemeja') ||
    categoryLower.includes('jaket') ||
    categoryLower.includes('outer') ||
    categoryLower.includes('pakaian') ||
    categoryLower.includes('dress') ||
    categoryLower.includes('sweater') ||
    categoryLower.includes('hoodie') ||
    Boolean(titleLower.match(/(celana|chino|jeans|pants|trouser|short|skirt|rok|baju|kaos|kemeja|jaket|outer|pakaian|dress|shirt|t-shirt|hoodie|sweater)/i))

  const isShoeProduct =
    isExplicitShoe ||
    (!isExplicitApparel &&
      availableSizes.some((s) => {
        const num = Number(s)
        return !isNaN(num) && num >= 35 && num <= 48
      }))

  const isApparelProduct = !isShoeProduct

  const sizeChartType: 'shoe' | 'clothing' | null = isShoeProduct
    ? 'shoe'
    : isApparelProduct
    ? 'clothing'
    : null

  return (
    <div className="flex-1 bg-white">
      <SizeChartModal
        isOpen={isSizeChartOpen}
        onClose={() => setIsSizeChartOpen(false)}
        type={sizeChartType || 'clothing'}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image */}
          <div className="aspect-[16/9] md:aspect-square relative overflow-hidden bg-zinc-100 rounded-2xl shadow-sm">
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
            <span className="absolute top-4 left-4 z-10 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md uppercase tracking-wider">
              Diskon 50%
            </span>
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-between">
            <div>
              {product.category_name && (
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                  {product.category_name}
                </p>
              )}

              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900">
                {product.title}
              </h1>

              {/* Rating Summary Header */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center text-amber-500 font-bold text-sm">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400 mr-1" />
                  <span>{avgRating > 0 ? avgRating : '5.0'}</span>
                </div>
                <span className="text-xs text-zinc-300">•</span>
                <span className="text-xs text-zinc-600 font-medium">
                  {totalReviews > 0 ? `${totalReviews} Ulasan Pembeli` : 'Belum Ada Ulasan'}
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl font-bold tabular-nums text-red-600">
                  {formatPrice(discountedPrice)}
                </span>
                <span className="text-lg text-zinc-400 line-through tabular-nums font-normal">
                  {formatPrice(product.price)}
                </span>
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  -50%
                </span>
              </div>

              {product.description && (
                <p className="mt-4 text-sm text-zinc-600 leading-relaxed border-t border-b border-zinc-100 py-4">
                  {product.description}
                </p>
              )}

              <div className="mt-6 space-y-6">
                {/* Size Selector */}
                {availableSizes.length > 0 && (
                  <div>
                    <div className="mb-3">
                      <label className="text-sm font-semibold text-zinc-900">
                        Ukuran
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {availableSizes.map((size) => {
                        const isAvailable = variants
                          .filter(v => v.size === size && (v.color === selectedColor || !selectedColor))
                          .some(v => v.stock > 0)

                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedSize(size)}
                            disabled={!isAvailable}
                            className={`min-w-[44px] h-11 px-3 text-sm font-medium rounded-xl border transition-all cursor-pointer
                              ${selectedSize === size 
                                ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm' 
                                : 'bg-white text-zinc-800 border-zinc-200 hover:border-zinc-400'}
                              ${!isAvailable ? 'line-through opacity-40 cursor-not-allowed' : ''}
                            `}
                          >
                            {size}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Color Selector */}
                {availableColors.length > 0 && (
                  <div>
                    <div className="mb-3">
                      <label className="text-sm font-semibold text-zinc-900">
                        Warna
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {availableColors.map((color) => {
                        const isAvailable = variants
                          .filter(v => v.color === color && (v.size === selectedSize || !selectedSize))
                          .some(v => v.stock > 0)
                        const isSelected = selectedColor === color

                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => isAvailable && setSelectedColor(color)}
                            disabled={!isAvailable}
                            className={`min-w-[44px] h-11 px-4 text-sm font-medium rounded-xl border transition-all cursor-pointer flex items-center justify-center
                              ${isSelected 
                                ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm' 
                                : 'bg-white text-zinc-800 border-zinc-200 hover:border-zinc-400'}
                              ${!isAvailable ? 'line-through opacity-40 cursor-not-allowed' : ''}
                            `}
                          >
                            {color}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-900 mb-3">
                    Jumlah
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={availableStock === 0 || quantity <= 1}
                      className="w-10 h-10 flex items-center justify-center border border-zinc-200 rounded-xl hover:bg-zinc-100 text-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center text-base font-semibold text-zinc-900 tabular-nums">
                      {availableStock === 0 ? 0 : quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                      disabled={availableStock === 0 || quantity >= availableStock}
                      className="w-10 h-10 flex items-center justify-center border border-zinc-200 rounded-xl hover:bg-zinc-100 text-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-2.5 flex items-center gap-2">
                    {availableStock === 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-lg">
                        🚫 Stok Habis (Varian ini sedang tidak tersedia)
                      </span>
                    ) : (
                      <>
                        <p className="text-xs text-zinc-500">
                          Stok tersedia: <span className="font-bold text-zinc-900">{availableStock}</span>
                        </p>
                        {availableStock <= 5 && (
                          <span className="text-[11px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                            ⚠️ Stok Menipis
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {error && (
                  <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
                )}
              </div>
            </div>

            {/* Action buttons (Tambah ke Keranjang & Beli Sekarang) */}
            <div className="mt-8 pt-6 border-t border-zinc-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={availableStock === 0}
                  variant="secondary"
                  className={`w-full py-3.5 rounded-xl font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 ${
                    availableStock > 0
                      ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-300 cursor-pointer'
                      : 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {availableStock > 0 ? 'Tambah ke Keranjang' : 'Stok Habis'}
                </Button>

                <Button
                  type="button"
                  onClick={handleDirectCheckout}
                  disabled={availableStock === 0}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                    availableStock > 0
                      ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                      : 'bg-zinc-200 text-zinc-400 border border-zinc-300 cursor-not-allowed'
                  }`}
                >
                  <Zap className="h-4 w-4" />
                  {availableStock > 0 ? 'Beli Sekarang' : 'Stok Habis'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="mt-16 pt-10 border-t border-zinc-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-zinc-700" />
                Ulasan & Rating Pembeli
              </h2>
              <p className="text-xs text-zinc-500 mt-1">Ulasan asli dari pembeli yang telah menyelesaikan pesanan</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>{avgRating > 0 ? avgRating : '5.0'} / 5</span>
              <span className="text-amber-600 font-normal">({totalReviews} ulasan)</span>
            </div>
          </div>

          {/* Rating Star Filter Bar */}
          {reviews.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200/80">
              <span className="text-xs font-bold text-zinc-700 mr-1 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5 text-zinc-500" /> Filter Rating:
              </span>
              <button
                type="button"
                onClick={() => setSelectedStarFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedStarFilter === 'all'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200'
                }`}
              >
                Semua ({reviews.length})
              </button>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter((r) => Math.round(Number(r.rating)) === star).length
                const isActive = selectedStarFilter === star
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedStarFilter(star)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      isActive
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200'
                    }`}
                  >
                    <Star className={`h-3.5 w-3.5 ${isActive ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'}`} />
                    <span>{star}</span>
                    <span className={`text-[10px] ${isActive ? 'text-amber-100' : 'text-zinc-400'}`}>({count})</span>
                  </button>
                )
              })}
            </div>
          )}

          <ReviewList
            reviews={reviews.filter((r) => {
              if (selectedStarFilter === 'all') return true
              return Math.round(Number(r.rating)) === selectedStarFilter
            })}
          />
        </div>

        {/* Related Products Section */}
        {safeRelatedProducts.length > 0 && (
          <div className="mt-16 pt-10 border-t border-zinc-200">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight">
                Kamu Mungkin Juga Suka
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {safeRelatedProducts.map((relProduct) => (
                <ProductCard
                  key={relProduct.id}
                  id={String(relProduct.id)}
                  slug={relProduct.slug}
                  title={relProduct.title}
                  price={relProduct.price}
                  imageUrl={relProduct.image_url}
                  category={relProduct.category_name || undefined}
                  rating={relProduct.average_rating}
                  totalReviews={relProduct.total_reviews}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

