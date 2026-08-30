'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  ShoppingCart,
  User,
  LogOut,
  ShoppingBag,
  Truck,
  Menu,
  X,
  LayoutDashboard,
  Package,
  FolderTree,
  Ticket,
  Image as ImageIcon,
  Users,
  MessageSquare,
  ChevronRight,
  Store,
  ShieldAlert,
  Heart,
} from 'lucide-react'
import { useState, useEffect } from 'react'

import { useCartStore } from '@/lib/store/useCartStore'
import { Button } from './ui/Button'

interface AuthUser {
  id: number
  email: string
  full_name: string | null
  avatar_url?: string | null
  role: 'admin' | 'staff' | 'courier' | 'user'
}

export function Navbar({ initialUser }: { initialUser?: AuthUser | null }) {
  const pathname = usePathname()
  const [user, setUser] = useState<AuthUser | null>(initialUser || null)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const totalItems = useCartStore((state) => state.getTotalItems())
  const cartCount = mounted ? totalItems : 0

  const [activeBannerText, setActiveBannerText] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)

    // Sanitize leftover invalid cart items from local storage
    const storeState = useCartStore.getState()
    if (storeState.items?.length > 0) {
      const valid = storeState.items.filter((i) => i && i.productTitle && i.productId && Number(i.price) > 0)
      if (valid.length !== storeState.items.length) {
        useCartStore.setState({ items: valid })
      }
    }

    async function fetchUserAndBanner() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        }
      } catch (err) {}

      try {
        const bannerRes = await fetch('/api/banners')
        if (bannerRes.ok) {
          const bannerData = await bannerRes.json()
          const activeBanners = (bannerData.banners || []).filter((b: any) => b.is_active === 1)
          if (activeBanners.length > 0) {
            const b = activeBanners[0]
            const text = b.subtitle ? `${b.title} – ${b.subtitle}` : b.title
            setActiveBannerText(text)
          }
        }
      } catch (err) {}
    }
    fetchUserAndBanner()
  }, [])

  useEffect(() => {
    setIsUserMenuOpen(false)
    setIsMobileMenuOpen(false)
  }, [pathname])

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsUserMenuOpen(false)
    setIsMobileMenuOpen(false)
    if (isCourier) {
      window.location.href = '/courier'
      return
    }
    window.location.href = '/'
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {}
    setUser(null)
    useCartStore.getState().clearCart()
    window.location.href = '/'
  }

  const isActive = (path: string) => pathname === path
  const isAdmin = user?.role === 'admin'
  const isStaff = user?.role === 'staff'
  const isCourier = user?.role === 'courier'
  const canAccessCourier = isCourier

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 shadow-xs print:hidden">
      {/* Top Banner Promo Dinamis dari Admin Banner */}
      {activeBannerText && (
        <div className="bg-zinc-900 text-white text-[11px] font-medium py-1.5 px-3 text-center tracking-wide flex items-center justify-center gap-2 max-w-full overflow-hidden leading-snug">
          <span className="truncate sm:whitespace-normal">
            📢 {activeBannerText}
          </span>
        </div>
      )}

      <nav className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Sisi Kiri: Logo Brand & Navigasi Utama */}
          <div className="flex items-center gap-4 sm:gap-8 min-w-0">
            <Link
              href={isCourier ? '/courier' : '/'}
              onClick={handleHomeClick}
              className="flex items-center gap-2 text-base sm:text-xl font-extrabold tracking-wider text-zinc-900 cursor-pointer hover:opacity-80 transition-opacity min-w-0"
            >
              <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs shrink-0">
                <ShoppingBag className="h-4.5 w-4.5 text-amber-400 fill-amber-400/20" />
              </div>
              <span className="truncate">AEGIS COLLECTION</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {!isCourier && (
                <Link
                  href="/"
                  onClick={handleHomeClick}
                  className={`text-sm font-medium transition-colors cursor-pointer ${
                    isActive('/')
                      ? 'text-zinc-900 font-bold border-b-2 border-zinc-900 pb-0.5'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Katalog
                </Link>
              )}
              {user && !isCourier && (
                <Link
                  href={isAdmin || isStaff ? '/staff/orders' : '/orders'}
                  className={`text-sm font-medium transition-colors ${
                    isActive(isAdmin || isStaff ? '/staff/orders' : '/orders')
                      ? 'text-zinc-900 font-bold border-b-2 border-zinc-900 pb-0.5'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {isAdmin || isStaff ? 'Kelola Pesanan' : 'Pesanan Saya'}
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin/reports"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/admin/reports')
                      ? 'text-purple-700 font-bold border-b-2 border-purple-700 pb-0.5'
                      : 'text-zinc-600 hover:text-purple-700'
                  }`}
                >
                  Admin Dashboard
                </Link>
              )}
              {canAccessCourier && (
                <Link
                  href="/courier"
                  className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/courier')
                      ? 'text-amber-600 font-bold border-b-2 border-amber-600 pb-0.5'
                      : 'text-zinc-600 hover:text-amber-600'
                  }`}
                >
                  <Truck className="h-4 w-4" />
                  <span>Pengiriman Kurir</span>
                </Link>
              )}
              {!(isAdmin || isStaff || isCourier) && (
                <Link
                  href="/chat"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/chat')
                      ? 'text-zinc-900 font-bold border-b-2 border-zinc-900 pb-0.5'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Chat CS
                </Link>
              )}
            </div>
          </div>

          {/* Sisi Kanan Header */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Ikon Keranjang Belanja (HANYA TAMPIL DI DESKTOP, tersembunyi di mobile header) */}
            {!isCourier && (
              <Link
                href="/cart"
                className={`hidden md:flex relative p-2 rounded-full hover:bg-zinc-100 transition-colors items-center justify-center text-zinc-800 ${
                  isActive('/cart') ? 'bg-zinc-100 text-zinc-900' : ''
                }`}
                title="Keranjang Belanja"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] rounded-full h-4.5 w-4.5 min-w-[18px] px-1 flex items-center justify-center font-bold shadow-sm border border-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Profile Dropdown Button (HANYA TAMPIL DI DESKTOP, tersembunyi di mobile header) */}
            <div className="hidden md:flex items-center">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 text-sm font-semibold text-zinc-800 hover:text-zinc-900 bg-zinc-50 border border-zinc-200 py-1.5 px-3 rounded-full hover:bg-zinc-100 transition-all cursor-pointer"
                  >
                    {user.avatar_url ? (
                      <div className="w-6 h-6 rounded-full overflow-hidden relative border border-zinc-300 shrink-0">
                        <Image
                          src={user.avatar_url}
                          alt={user.full_name || 'Avatar'}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <User className="h-4 w-4 text-zinc-600" />
                    )}
                    <span className="max-w-[120px] truncate">
                      {user.role === 'admin'
                        ? 'Administrator'
                        : user.role === 'staff'
                        ? 'Staf Toko'
                        : user.role === 'courier'
                        ? 'Kurir'
                        : user.full_name || user.email}
                    </span>
                  </button>

                  {/* Desktop Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-xl shadow-xl py-1.5 z-50">
                      {(isAdmin || isStaff) && (
                        <>
                          <Link
                            href="/courier"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 flex items-center gap-1.5"
                          >
                            <Truck className="h-3.5 w-3.5" />
                            <span>Pengiriman Kurir</span>
                          </Link>
                          <Link
                            href="/staff/chat"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50"
                          >
                            {isAdmin ? 'Chat Internal Staf' : 'Pusat Chat CS Staf'}
                          </Link>
                          <Link
                            href="/staff/products"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                          >
                            Kelola Inventaris Produk
                          </Link>
                          <Link
                            href="/staff/categories"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                          >
                            Kelola Kategori
                          </Link>
                          <Link
                            href="/staff/vouchers"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                          >
                            Kelola Voucher Diskon
                          </Link>
                          {isAdmin && (
                            <>
                              <Link
                                href="/admin/banners"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="block px-4 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50"
                              >
                                Kelola Banner Promo
                              </Link>
                              <Link
                                href="/admin/users"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="block px-4 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50"
                              >
                                Kelola Pengguna
                              </Link>
                              <Link
                                href="/admin/audit-logs"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="block px-4 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50"
                              >
                                Log Aktivitas Sistem
                              </Link>
                            </>
                          )}
                          <hr className="my-1 border-zinc-100" />
                        </>
                      )}
                      <Link
                        href="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                      >
                        <User className="h-3.5 w-3.5 text-zinc-600" />
                        <span>Profil Saya</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          setShowLogoutModal(true)
                        }}
                        className="block w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        Keluar
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="secondary" className="text-xs px-3.5 py-1.5">
                      Masuk
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="text-xs px-3.5 py-1.5">Daftar</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Tombol Garis 3 (Hamburger Menu) untuk Mobile HP */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-zinc-700 hover:bg-zinc-100 md:hidden flex items-center justify-center cursor-pointer border border-zinc-200"
              title="Menu Navigasi Garis 3"
              aria-label="Menu Navigasi Garis 3"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 text-zinc-900" />
              ) : (
                <Menu className="h-5 w-5 text-zinc-900 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Drawer Menu Navigasi Garis 3 (Mobile Slide-Over Panel) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[9999] md:hidden flex">
          {/* Backdrop gelap */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer content sliding from right */}
          <div className="relative ml-auto w-[85%] max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
            {/* Header Drawer */}
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-900 text-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <ShoppingBag className="h-4.5 w-4.5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <span className="font-extrabold text-xs tracking-wider block truncate">
                    AEGIS COLLECTION
                  </span>
                  <span className="text-[10px] text-zinc-300 block truncate">
                    {user
                      ? user.role === 'admin'
                        ? '🛡️ Menu Administrator'
                        : user.role === 'staff'
                        ? '📋 Menu Staf Toko'
                        : user.role === 'courier'
                        ? '🚚 Menu Kurir'
                        : '👤 Menu Pelanggan'
                      : 'Menu Navigasi'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body Drawer Links */}
            <div className="p-3 space-y-4 flex-1">
              {/* Seksi Navigasi Utama Pembeli */}
              {!isCourier && (
                <div className="space-y-1">
                  <span className="px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    🛍️ Belanja & Navigasi
                  </span>

                  <Link
                    href="/"
                    onClick={handleHomeClick}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 text-zinc-900 font-semibold text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Store className="h-4 w-4 text-zinc-700" />
                      <span>Katalog Produk</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                  </Link>

                  {!(isAdmin || isStaff) && (
                    <Link
                      href="/chat"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 text-zinc-900 font-semibold text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <MessageSquare className="h-4 w-4 text-zinc-700" />
                        <span>Chat CS</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-400" />
                    </Link>
                  )}
                </div>
              )}

              {/* Seksi khusus Administrator & Staf */}
              {(isAdmin || isStaff) && (
                <div className="space-y-1 pt-2 border-t border-zinc-100">
                  <span className="px-3 text-[10px] font-bold text-purple-700 uppercase tracking-wider block mb-1">
                    {isAdmin ? '🛡️ Kelola Administrator' : '📋 Kelola Staf Toko'}
                  </span>

                  {isAdmin && (
                    <>
                      <Link
                        href="/admin/reports"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-950 font-bold text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <LayoutDashboard className="h-4 w-4 text-purple-700" />
                          <span>Admin Dashboard & Laporan</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-purple-400" />
                      </Link>

                      <Link
                        href="/admin/users"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-950 font-bold text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Users className="h-4 w-4 text-purple-700" />
                          <span>Kelola Pengguna & Peran</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-purple-400" />
                      </Link>

                      <Link
                        href="/admin/banners"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-950 font-bold text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <ImageIcon className="h-4 w-4 text-purple-700" />
                          <span>Kelola Banner Promo</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-purple-400" />
                      </Link>

                      <Link
                        href="/admin/audit-logs"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-950 font-bold text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <ShieldAlert className="h-4 w-4 text-purple-700" />
                          <span>Log Aktivitas Sistem</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-purple-400" />
                      </Link>
                    </>
                  )}

                  <Link
                    href="/staff/products"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 text-zinc-900 font-semibold text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Store className="h-4 w-4 text-zinc-700" />
                      <span>Kelola Inventaris Produk</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                  </Link>

                  <Link
                    href="/staff/categories"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 text-zinc-900 font-semibold text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <FolderTree className="h-4 w-4 text-zinc-700" />
                      <span>Kelola Kategori</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                  </Link>

                  <Link
                    href="/staff/vouchers"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 text-zinc-900 font-semibold text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Ticket className="h-4 w-4 text-zinc-700" />
                      <span>Kelola Voucher Diskon</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                  </Link>
                </div>
              )}

              {/* Seksi Kurir */}
              {canAccessCourier && (
                <div className="space-y-1 pt-2 border-t border-zinc-100">
                  <Link
                    href="/courier"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Truck className="h-4 w-4 text-amber-700" />
                      <span>Pengiriman Kurir</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-amber-400" />
                  </Link>
                </div>
              )}

              {/* Seksi Akun & Sesi */}
              <div className="space-y-1 pt-2 border-t border-zinc-100">
                <span className="px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  👤 Akun Anda
                </span>

                {user ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        setShowLogoutModal(true)
                      }}
                      className="flex items-center justify-between w-full p-2.5 rounded-xl hover:bg-red-50 text-red-600 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <LogOut className="h-4 w-4 text-red-600" />
                        <span>Keluar (Sign Out)</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-red-400" />
                    </button>
                  </>
                ) : (
                  <div className="p-2 space-y-2">
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full"
                    >
                      <Button variant="secondary" className="w-full text-xs py-2">
                        Masuk
                      </Button>
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full"
                    >
                      <Button className="w-full text-xs py-2">Daftar Akun Baru</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-zinc-100 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <LogOut className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-bold text-zinc-900 mb-1">
              Konfirmasi Keluar
            </h3>
            <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
              Apakah Anda yakin ingin keluar dari akun Anda?
            </p>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="flex-1 py-2 text-xs font-semibold cursor-pointer"
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  setIsLoggingOut(true)
                  await handleSignOut()
                  setIsLoggingOut(false)
                  setShowLogoutModal(false)
                }}
                isLoading={isLoggingOut}
                className="flex-1 py-2 text-xs font-semibold cursor-pointer"
              >
                Ya, Keluar
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}