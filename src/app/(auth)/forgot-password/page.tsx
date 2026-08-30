'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)

  // Step 1: Minta Kode OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Gagal mengirim OTP.')
        setIsLoading(false)
        return
      }

      setSuccessMsg('Kode OTP reset kata sandi telah dikirim ke email Anda. Periksa Kotak Masuk / Spam.')
      setStep(2)
    } catch {
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    setError(null)
    setIsResending(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Gagal mengirim ulang OTP.')
      } else {
        setSuccessMsg('Kode OTP baru berhasil dikirim ulang ke email Anda.')
      }
    } catch {
      setError('Terjadi kesalahan saat mengirim ulang OTP.')
    } finally {
      setIsResending(false)
    }
  }

  // Step 2: Reset Kata Sandi
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok dengan kata sandi baru.')
      return
    }

    if (newPassword.length < 6) {
      setError('Kata sandi baru minimal harus 6 karakter.')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Gagal mereset kata sandi.')
        setIsLoading(false)
        return
      }

      setSuccessMsg('Selamat! Kata sandi Anda telah berhasil diubah.')
    } catch {
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
          
          <div className="mb-6">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 font-medium transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" /> Kembali ke Halaman Masuk
            </Link>
            
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-zinc-100 rounded-xl text-zinc-900">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-zinc-900">
                  Lupa Kata Sandi?
                </h1>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl font-medium">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl font-medium flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: Input Email */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <p className="text-xs text-zinc-600 leading-relaxed">
                Masukkan alamat email terdaftar Anda. Kami akan mengirimkan kode verifikasi (OTP) 6-digit untuk mereset kata sandi.
              </p>

              <Input
                id="email"
                type="email"
                label="Email Terdaftar"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full"
              >
                Kirim Kode OTP Reset
              </Button>
            </form>
          )}

          {/* STEP 2: Input Kode OTP & Password Baru */}
          {step === 2 && !successMsg?.includes('berhasil diubah') && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-xs text-zinc-600 flex items-center justify-between">
                <span className="truncate font-medium">{email}</span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-blue-600 hover:underline font-semibold shrink-0 ml-2 cursor-pointer"
                >
                  Ubah Email
                </button>
              </div>

              <div>
                <Input
                  id="otp"
                  type="text"
                  label="Kode OTP (6-Digit)"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className="text-center font-mono text-base tracking-widest font-bold text-zinc-900 placeholder:text-zinc-400 placeholder:font-sans placeholder:tracking-normal placeholder:font-normal placeholder:text-xs"
                />
                <div className="flex justify-end mt-1">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isResending}
                    className="text-[11px] text-zinc-500 hover:text-zinc-900 underline font-medium disabled:opacity-50 cursor-pointer"
                  >
                    {isResending ? 'Mengirim Ulang...' : 'Kirim Ulang Kode OTP'}
                  </button>
                </div>
              </div>

              <Input
                id="newPassword"
                type="password"
                label="Kata Sandi Baru"
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <Input
                id="confirmPassword"
                type="password"
                label="Konfirmasi Kata Sandi Baru"
                placeholder="Ulangi kata sandi baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full"
              >
                Simpan Kata Sandi Baru
              </Button>
            </form>
          )}

          {/* Selesai Reset */}
          {successMsg?.includes('berhasil diubah') && (
            <div className="mt-4 pt-2">
              <Link href="/login">
                <Button className="w-full">
                  Masuk Sekarang dengan Kata Sandi Baru
                </Button>
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

