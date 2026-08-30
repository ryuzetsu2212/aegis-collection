'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'

interface WishlistButtonProps {
  productId: number
  className?: string
}

export function WishlistButton({ productId, className = '' }: WishlistButtonProps) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/wishlist')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            const foundItem = data.some((item: any) => String(item.product_id || item.id) === String(productId))
            if (isMounted) setIsWishlisted(foundItem)
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
      } else {
        await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        })
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