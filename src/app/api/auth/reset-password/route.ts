import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, otp, newPassword } = body

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid.' },
        { status: 400 }
      )
    }

    if (!otp || typeof otp !== 'string' || otp.trim().length !== 6) {
      return NextResponse.json(
        { error: 'Kode OTP harus berupa 6 digit angka.' },
        { status: 400 }
      )
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Kata sandi baru minimal harus 6 karakter.' },
        { status: 400 }
      )
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanOtp = otp.trim()

    const db = await getDb()

    // Cek record OTP
    const otpRecord = await db.prepare('SELECT code, expires_at FROM otp_codes WHERE email = ?').get(cleanEmail) as { code: string; expires_at: string } | undefined

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Kode OTP tidak ditemukan atau sudah kadaluarsa. Silakan minta kode OTP baru.' },
        { status: 400 }
      )
    }

    if (otpRecord.code !== cleanOtp) {
      return NextResponse.json(
        { error: 'Kode OTP yang Anda masukkan salah.' },
        { status: 400 }
      )
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Kode OTP sudah kadaluarsa (lebih dari 5 menit). Silakan minta kode baru.' },
        { status: 400 }
      )
    }

    // Cek apakah user ada
    const user = await db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail)
    if (!user) {
      return NextResponse.json(
        { error: 'Pengguna dengan email ini tidak ditemukan.' },
        { status: 404 }
      )
    }

    // Hash password baru
    const hashed = await hashPassword(newPassword)

    // Update password_hash pada users
    await db.prepare('UPDATE users SET password_hash = ? WHERE LOWER(email) = ?').run(hashed, cleanEmail)

    // Hapus OTP setelah berhasil diganti
    await db.prepare('DELETE FROM otp_codes WHERE email = ?').run(cleanEmail)

    return NextResponse.json({
      message: 'Kata sandi Anda berhasil diperbarui! Silakan masuk dengan kata sandi baru.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    )
  }
}

