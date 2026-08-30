import { NextRequest, NextResponse } from 'next/server'
import { loginUser, setAuthCookie } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

const loginLimiter = {
  name: 'login',
  maxAttempts: 5,
  windowSeconds: 15 * 60, // 15 minutes
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rl = checkRateLimit(loginLimiter, ip)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Terlalu banyak percobaan login. Coba lagi dalam ${Math.ceil(rl.resetInSeconds / 60)} menit.` },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi.' },
        { status: 400 }
      )
    }

    const result = await loginUser(email, password)
    if (!result) {
      return NextResponse.json(
        { error: 'Email atau password salah.' },
        { status: 401 }
      )
    }

    await setAuthCookie(result.token)

    return NextResponse.json({
      user: result.user,
    })
  } catch {
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    )
  }
}