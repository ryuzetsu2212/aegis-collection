'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingCart, Package, User, Truck } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCartStore } from '@/lib/store/useCartStore'

interface AuthUser {
  id: number
  email: string
  full_name: string | null
  avatar_url?: string | null
  role: 'admin' | 'staff' | 'courier' | 'user'
}

export function BottomNav({ initialUser }: { initialUser?: AuthUser | null }) {
  const pathname = usePathname()
  const [user, setUser] = useState<AuthUser | null>(initialUser || null)
  const [mounted, setMounted] = useState(false)

  const totalItems = useCartStore((state) => state.getTotalItems())
  const cartCount = mounted ? totalItems : 0

  useEffect(() => {
    setMounted(true)
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        }
      } catch (err) {
        // silent
      }
    }
    fetchUser()
  }, [])

  const isCourier = user?.role === 'courier'
  const isAdmin = user?.role === 'admin'
  const isStaff = user?.role === 'staff'

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)

  if (isCourier) {
    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[999] bg-white border-t border-zinc-200 px-2 py-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] flex items-center justify-around print:hidden">
        <Link
          href="/courier"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
            isActive('/courier') ? 'text-amber-600 font-bold' : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Truck className={`h-5 w-5 mb-0.5 ${isActive('/courier') ? 'text-amber-600 stroke-[2.5]' : 'text-zinc-500'}`} />
          <span>Pengiriman</span>
        </Link>

        <Link
          href="/profile"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
            isActive('/profile') ? 'text-amber-600 font-bold' : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <User className={`h-5 w-5 mb-0.5 ${isActive('/profile') ? 'text-amber-600 stroke-[2.5]' : 'text-zinc-500'}`} />
          <span>Profil Saya</span>
        </Link>
      </div>
    )
  }

  const ordersPath = isAdmin || isStaff ? '/staff/orders' : '/orders'
  const accountPath = user ? '/profile' : '/login'

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[999] bg-white border-t border-zinc-200 px-1 py-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] flex items-center justify-around print:hidden">
      {/* 1. Beranda */}
      <Link
        href="/"
        className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
          isActive('/') ? 'text-zinc-900 font-bold' : 'text-zinc-500 hover:text-zinc-800'
        }`}
      >
        <Home className={`h-5 w-5 mb-0.5 ${isActive('/') ? 'text-zinc-900 stroke-[2.5]' : 'text-zinc-500'}`} />
        <span>Beranda</span>
      </Link>

      {/* 2. Keranjang Belanja */}
      <Link
        href="/cart"
        className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
          isActive('/cart') ? 'text-zinc-900 font-bold' : 'text-zinc-500 hover:text-zinc-800'
        }`}
      >
        <div className="relative">
          <ShoppingCart className={`h-5 w-5 mb-0.5 ${isActive('/cart') ? 'text-zinc-900 stroke-[2.5]' : 'text-zinc-500'}`} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center border border-white">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </div>
        <span>Keranjang</span>
      </Link>

      {/* 3. Pesanan */}
      <Link
        href={ordersPath}
        className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
          isActive('/orders') || isActive('/staff/orders') ? 'text-zinc-900 font-bold' : 'text-zinc-500 hover:text-zinc-800'
        }`}
      >
        <Package className={`h-5 w-5 mb-0.5 ${isActive('/orders') || isActive('/staff/orders') ? 'text-zinc-900 stroke-[2.5]' : 'text-zinc-500'}`} />
        <span>Pesanan</span>
      </Link>

      {/* 4. Profil */}
      <Link
        href={accountPath}
        className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
          isActive('/profile') || isActive('/login') || isActive('/register') ? 'text-zinc-900 font-bold' : 'text-zinc-500 hover:text-zinc-800'
        }`}
      >
        <User className={`h-5 w-5 mb-0.5 ${isActive('/profile') || isActive('/login') || isActive('/register') ? 'text-zinc-900 stroke-[2.5]' : 'text-zinc-500'}`} />
        <span>{user ? 'Profil' : 'Masuk'}</span>
      </Link>
    </div>
  )
}
