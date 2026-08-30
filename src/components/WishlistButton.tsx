'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { useCartStore } from '@/lib/store/useCartStore'

interface ProductData {
  id: number | string
  slug: string
  title: string
  price: number
  imageUrl?: string
  image_url?: string
  product_variants?: Array<{
    id: number
    size: string | null
    color: string
    stock: number
  }>
}

interface WishlistButtonProps {
  productId: number
  product?: ProductData
  className?: string
}

export function WishlistButton({ productId, product: initialProduct, className = '' }: WishlistButtonProps) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const syncWishlistItem = useCartStore((state) => state.syncWishlistItem)
  const removeByProductId = useCartStore((state) => state.removeByProductId)

  const getProductData = async (): Promise<ProductData | null> => {
    if (initialProduct && (initialProduct.image_url || initialProduct.imageUrl)) {
      return initialProduct
    }
    try {
      const res = await fetch(`/api/products?id=${productId}`)
      if (res.ok) {
        return await res.json()
      }
    } catch {}
    return initialProduct || null
  }

  const addProductToCart = async (productData?: ProductData | null) => {
    const data = productData || (await getProductData())
    if (!data) return

    const variants = data.product_variants || []
    const firstVariant = variants.length > 0 ? variants[0] : null
    const variantId = firstVariant ? String(firstVariant.id) : `p-${data.id}`
    const discountedPrice = data.price * 0.5

    syncWishlistItem({
      variantId,
      productId: String(data.id || productId),
      productTitle: data.title,
      productSlug: data.slug,
      imageUrl: data.image_url || data.imageUrl || '',
      size: firstVariant?.size || null,
      color: firstVariant?.color || 'Default',
      price: discountedPrice,
    })
  }

  useEffect(() => {
    let isMounted = true
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/wishlist')
        if (res.ok) {
          const data = await res.json()
          const foundItem = data.find((item: any) => String(item.product_id || item.id) === String(productId))
          if (foundItem) {
            if (isMounted) setIsWishlisted(true)
            
            // Check if product was already purchased in orders
            const ordersRes = await fetch('/api/orders')
            let isPurchased = false
            if (ordersRes.ok) {
              const orders = await ordersRes.json()
              if (Array.isArray(orders)) {
                isPurchased = orders.some((o: any) =>
                  o.status !== 'cancelled' &&
                  o.order_items?.some((oi: any) => String(oi.product_id) === String(productId))
                )
              }
            }

            if (!isPurchased) {
              await addProductToCart(foundItem)
            }
          } else {
            if (isMounted) setIsWishlisted(false)
          }
        }
      } catch {}
      if (isMounted) setLoading(false)
    }
    fetchStatus()
    return () => {
      isMounted = false
    }
  }, [productId])

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const newStatus = !isWishlisted
    setIsWishlisted(newStatus)
    setToastMessage(newStatus ? 'Disimpan ke Wishlist!' : 'Dihapus dari Wishlist')
    setTimeout(() => setToastMessage(null), 2000)

    try {
      if (!newStatus) {
        await fetch(`/api/wishlist?productId=${productId}`, { method: 'DELETE' })
        removeByProductId(String(productId))
      } else {
        await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        })
        await addProductToCart()
      }
    } catch (err) {
      console.error('Wishlist toggle failed', err)
      setIsWishlisted(!newStatus)
    }
  }

  if (loading) return null

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={toggle}
        className={`p-2 rounded-full border border-zinc-300 bg-white/90 hover:bg-zinc-100 transition-all shadow-sm active:scale-90 cursor-pointer ${className}`}
        aria-label="Toggle wishlist"
        title={isWishlisted ? 'Hapus dari Wishlist' : 'Tambah ke Wishlist'}
      >
        <Heart className={`h-5 w-5 transition-transform duration-200 ${isWishlisted ? 'fill-red-600 text-red-600 scale-110' : 'text-zinc-600'}`} />
      </button>

      {toastMessage && (
        <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xl whitespace-nowrap z-[100] animate-in fade-in zoom-in-95 duration-150">
          {toastMessage}
        </div>
      )}
    </div>
  )
}