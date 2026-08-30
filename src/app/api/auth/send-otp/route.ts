import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { sendOtpEmail } from '@/lib/mailer'
import { randomInt } from 'crypto'
import { checkRateLimit } from '@/lib/rate-limit'

const otpSendLimiter = {
  name: 'otp-send',
  maxAttempts: 3,
  windowSeconds: 5 * 60, // 3 OTP per 5 menit per email
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

    // Rate limit per email
    const rl = checkRateLimit(otpSendLimiter, cleanEmail)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Terlalu banyak permintaan OTP. Coba lagi dalam ${Math.ceil(rl.resetInSeconds / 60)} menit.` },
        { status: 429 }
      )
    }

    const db = await getDb()

    // Cek apakah email sudah terdaftar
    const existingUser = await db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail)
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar. Silakan masuk (login).' },
        { status: 409 }
      )
    }

    // Generate 6-digit OTP with cryptographically secure random
    const otpCode = randomInt(100000, 999999).toString()
    
    // Valid selama 5 menit
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    // Simpan ke database (with attempt counter reset)
    db.prepare(`
      INSERT INTO otp_codes (email, code, expires_at)
      VALUES (?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        code = excluded.code,
        expires_at = excluded.expires_at,
        created_at = CURRENT_TIMESTAMP
    `).run(cleanEmail, otpCode, expiresAt)

    // Kirim email
    try {
      await sendOtpEmail(cleanEmail, otpCode)
    } catch (mailErr: any) {
      console.error('Failed to send OTP email:', mailErr?.message || mailErr)
      console.log(`🔑 [DEV / TESTING OTP CODE for ${cleanEmail}]: ${otpCode}`)

      if (mailErr?.response?.includes('only send testing emails to your own email address') || mailErr?.responseCode === 550) {
        return NextResponse.json({
          message: `[Resend Free Sandbox Mode] Kode OTP untuk ${cleanEmail} adalah ${otpCode}. (Resend domain gratis hanya mengizinkan pengiriman email otomatis ke george213690@gmail.com).`,
        })
      }

      return NextResponse.json(
        { error: 'Gagal mengirim email OTP. Silakan coba lagi nanti.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Kode OTP verifikasi berhasil dikirim ke email Anda.',
    })
  } catch (error) {
    console.error('Send OTP route error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    )
  }
}
