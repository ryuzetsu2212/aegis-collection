import { NextResponse, type NextRequest } from 'next/server'
import { verifyToken } from '@/lib/jwt'

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/chat', '/cart', '/products']
const STAFF_PATHS = ['/staff']
const ADMIN_PATHS = ['/admin']
const COURIER_PATHS = ['/courier']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip all API routes — let them handle their own auth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Skip internal Next.js requests (_next/static, _next/image, etc.)
  if (pathname.startsWith('/_next/')) {
    return NextResponse.next()
  }

  // Skip RSC (React Server Component) flight requests — these are internal
  // React data fetches that MUST NOT be redirected, or hydration breaks
  const isRSC = request.headers.get('rsc') === '1'
  const isPrefetch = request.headers.get('next-router-prefetch') === '1'

  const token = request.cookies.get('auth_token')?.value
  const user = token ? await verifyToken(token) : null

  // Courier accounts are restricted to /courier dashboard (no catalog/cart access)
  if (user?.role === 'courier' && (pathname === '/' || pathname.startsWith('/cart') || pathname.startsWith('/products'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/courier'
    return NextResponse.redirect(url)
  }

  // Allow public paths
  if (PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    return NextResponse.next()
  }

  // Check authentication for protected routes
  if (!user) {
    // For RSC/prefetch requests, don't redirect — just pass through
    // The page component itself will handle the unauthenticated state
    if (isRSC || isPrefetch) {
      return NextResponse.next()
    }

    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const safeRedirect = pathname.startsWith('/') && !pathname.startsWith('//') && !pathname.includes('javascript:') ? pathname : '/'
    url.searchParams.set('redirect', safeRedirect)
    return NextResponse.redirect(url)
  }

  const userRole = user.role

  // Courier routes require courier role
  if (COURIER_PATHS.some(path => pathname.startsWith(path))) {
    if (userRole !== 'courier') {
      const url = request.nextUrl.clone()
      url.pathname = userRole === 'staff' || userRole === 'admin' ? '/staff/orders' : '/'
      return NextResponse.redirect(url)
    }
  }

  // Staff routes require staff, admin, or courier role
  if (STAFF_PATHS.some(path => pathname.startsWith(path))) {
    if (userRole !== 'staff' && userRole !== 'admin' && userRole !== 'courier') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Admin routes require admin role
  if (ADMIN_PATHS.some(path => pathname.startsWith(path))) {
    if (userRole !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
}

