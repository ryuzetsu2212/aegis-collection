import { NextRequest, NextResponse } from 'next/server'
import { registerUser, setAuthCookie } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'

const otpVerifyLimiter = {
  name: 'otp-verify',
  maxAttempts: 5,
  windowSeconds: 5 * 60, // max 5 percobaan OTP per 5 menit
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, full_name, otp } = body

    if (!email || !password || !full_name || !otp) {
      return NextResponse.json(
        { error: 'Semua field termasuk kode OTP wajib diisi.' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password minimal 8 karakter.' },
        { status: 400 }
      )
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: 'Password harus mengandung huruf besar, huruf kecil, dan angka.' },
        { status: 400 }
      )
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanOtp = String(otp).trim()

    // Rate limit OTP verification attempts per email
    const rl = checkRateLimit(otpVerifyLimiter, cleanEmail)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Terlalu banyak percobaan OTP. Coba lagi dalam ${Math.ceil(rl.resetInSeconds / 60)} menit.` },
        { status: 429 }
      )
    }

    const db = await getDb()

    // Verifikasi OTP dari database
    const otpRecord = await db.prepare('SELECT code, expires_at FROM otp_codes WHERE email = ?').get(cleanEmail) as {
      code: string
      expires_at: string
    } | undefined

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Kode OTP belum dikirim. Silakan minta kode OTP terlebih dahulu.' },
        { status: 400 }
      )
    }

    if (otpRecord.code !== cleanOtp) {
      return NextResponse.json(
        { error: 'Kode OTP tidak cocok atau salah.' },
        { status: 400 }
      )
    }

    if (new Date(otpRecord.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'Kode OTP sudah kadaluarsa. Silakan minta kode OTP baru.' },
        { status: 400 }
      )
    }

    // Proses registrasi user
    const result = await registerUser(cleanEmail, password, full_name)
    if (!result) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar.' },
        { status: 409 }
      )
    }

    // Hapus kode OTP setelah berhasil registrasi
    await db.prepare('DELETE FROM otp_codes WHERE email = ?').run(cleanEmail)

    await setAuthCookie(result.token)

    return NextResponse.json({
      user: result.user,
    })
  } catch (error) {
    console.error('Register route error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    )
  }
}