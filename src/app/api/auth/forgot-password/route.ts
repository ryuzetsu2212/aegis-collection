import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/mailer'
import { randomInt } from 'crypto'
import { checkRateLimit } from '@/lib/rate-limit'

const forgotPasswordLimiter = {
  name: 'forgot-password-send',
  maxAttempts: 3,
  windowSeconds: 5 * 60,
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid.' },
        { status: 400 }
      )
    }

    const cleanEmail = email.trim().toLowerCase()

    const rl = checkRateLimit(forgotPasswordLimiter, cleanEmail)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Terlalu banyak permintaan reset OTP. Coba lagi dalam ${Math.ceil(rl.resetInSeconds / 60)} menit.` },
        { status: 429 }
      )
    }

    const db = await getDb()

    // Cek apakah email terdaftar di tabel users (berlaku untuk semua 4 role: user/customer, admin, staff, courier)
    const existingUser = db.prepare('SELECT id, role FROM users WHERE LOWER(email) = ?').get(cleanEmail)
    if (!existingUser) {
      return NextResponse.json(
        { error: 'Email tersebut belum terdaftar dalam sistem.' },
        { status: 404 }
      )
    }

    // Generate 6-digit OTP code
    const otpCode = randomInt(100000, 999999).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    // Save to otp_codes table
    db.prepare(`
      INSERT INTO otp_codes (email, code, expires_at)
      VALUES (?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        code = excluded.code,
        expires_at = excluded.expires_at,
        created_at = CURRENT_TIMESTAMP
    `).run(cleanEmail, otpCode, expiresAt)

    // Send email via Resend / SMTP
    try {
      await sendPasswordResetEmail(cleanEmail, otpCode)
    } catch (mailErr: any) {
      console.error('Failed to send Password Reset OTP email:', mailErr?.message || mailErr)
      console.log(`🔑 [DEV / TESTING OTP CODE for ${cleanEmail}]: ${otpCode}`)

      if (mailErr?.response?.includes('only send testing emails to your own email address') || mailErr?.responseCode === 550) {
        return NextResponse.json({
          message: `[Resend Free Sandbox Mode] Kode OTP untuk ${cleanEmail} adalah ${otpCode}. (Resend domain gratis hanya mengizinkan pengiriman email otomatis ke george213690@gmail.com).`,
        })
      }

      return NextResponse.json(
        { error: 'Gagal mengirim email reset kata sandi. Silakan coba lagi nanti.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Kode OTP reset kata sandi telah dikirim ke email Anda.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    )
  }
}

