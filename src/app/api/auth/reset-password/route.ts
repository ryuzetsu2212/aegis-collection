import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/db'
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

    const supabase = getSupabase()

    // Cek record OTP dari Supabase
    const { data: otpRecord, error: otpErr } = await supabase
      .from('otp_codes')
      .select('code, expires_at')
      .eq('email', cleanEmail)
      .maybeSingle()

    if (otpErr) {
      console.error('Error fetching OTP record:', otpErr)
    }

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
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle()

    if (userErr || !user) {
      return NextResponse.json(
        { error: 'Pengguna dengan email ini tidak ditemukan.' },
        { status: 404 }
      )
    }

    // Hash password baru
    const hashed = await hashPassword(newPassword)

    // Update password_hash pada users
    const { error: updateErr } = await supabase
      .from('users')
      .update({ password_hash: hashed })
      .eq('email', cleanEmail)

    if (updateErr) {
      console.error('Error updating user password:', updateErr)
      return NextResponse.json(
        { error: 'Gagal memperbarui kata sandi.' },
        { status: 500 }
      )
    }

    // Hapus OTP setelah berhasil diganti
    await supabase
      .from('otp_codes')
      .delete()
      .eq('email', cleanEmail)

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
