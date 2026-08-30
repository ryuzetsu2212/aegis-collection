'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Mail, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [resendCountdown, setResendCountdown] = useState(0)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [resendCountdown])

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (password !== confirmPassword) {
      setError('Password dan Konfirmasi Password tidak cocok.')
      return
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Gagal mengirim kode OTP.')
        setIsLoading(false)
        return
      }

      setSuccessMessage('Kode OTP berhasil dikirim ke ' + email)
      setStep(2)
      setResendCountdown(60)
    } catch (err) {
      setError('Terjadi kesalahan koneksi. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isLoading) return

    setError(null)
    setSuccessMessage(null)
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Gagal mengirim ulang OTP.')
        setIsLoading(false)
        return
      }

      setSuccessMessage('Kode OTP baru telah dikirimkan ke ' + email)
      setResendCountdown(60)
    } catch (err) {
      setError('Gagal mengirim ulang OTP. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!otp || otp.trim().length < 6) {
      setError('Masukkan 6 angka kode OTP verifikasi.')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          otp: otp.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registrasi gagal.')
        setIsLoading(false)
        return
      }

      window.location.assign('/')
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 bg-zinc-50">
      <div className="w-full max-w-md">
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              {step === 1 ? 'Buat Akun Baru' : 'Verifikasi Kode OTP'}
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              {step === 1 ? (
                <>
                  Sudah punya akun?{' '}
                  <Link
                    href="/login"
                    className="font-semibold text-zinc-900 hover:underline"
                  >
                    Masuk di sini
                  </Link>
                </>
              ) : (
                `Masukkan 6-digit kode verifikasi yang dikirim ke ${email}`
              )}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <Input
                id="fullName"
                type="text"
                label="Nama Lengkap"
                placeholder="Nama lengkap Anda"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />

              <Input
                id="email"
                type="email"
                label="Email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <Input
                id="password"
                type="password"
                label="Password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />

              <Input
                id="confirmPassword"
                type="password"
                label="Konfirmasi Password"
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full py-3 mt-2 flex items-center justify-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Kirim Kode OTP Ke Email
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label htmlFor="otp" className="block text-sm font-semibold text-zinc-800 mb-2">
                  Kode OTP 6-Digit
                </label>
                <div className="relative">
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    className="text-center font-mono text-base tracking-widest font-bold text-zinc-900 placeholder:text-zinc-400 placeholder:font-sans placeholder:tracking-normal placeholder:font-normal placeholder:text-xs"
                  />
                  <KeyRound className="absolute right-3.5 top-3.5 h-5 w-5 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full py-3"
              >
                Verifikasi & Daftar
              </Button>

              <div className="pt-2 flex items-center justify-between border-t border-zinc-100 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1)
                    setError(null)
                    setSuccessMessage(null)
                  }}
                  className="flex items-center gap-1 font-semibold text-zinc-600 hover:text-zinc-900 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Ubah Email / Data
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCountdown > 0 || isLoading}
                  className="font-semibold text-blue-700 hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                >
                  {resendCountdown > 0
                    ? `Kirim Ulang (${resendCountdown}s)`
                    : 'Kirim Ulang OTP'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
