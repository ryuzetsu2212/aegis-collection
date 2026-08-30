'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

function LoginForm() {
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get('redirect') || '/'
  const sanitizedRedirect = rawRedirect
    .replace(/[\0-\x1F\x7F]/g, '')
    .trim()
  const isSafe = /^\/[^\/]/.test(sanitizedRedirect) && 
    !/^(javascript|data|vbscript|file|about):/i.test(sanitizedRedirect) &&
    !sanitizedRedirect.includes('\\') &&
    sanitizedRedirect.length <= 2048
  const redirectTo = isSafe ? sanitizedRedirect : '/'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || 'Email atau password salah.')
        setIsLoading(false)
        return
      }

      let finalRedirect = redirectTo
      if (data.user?.role === 'courier') {
        finalRedirect = '/courier'
      } else if (redirectTo === '/' && data.user?.role) {
        if (data.user.role === 'admin') {
          finalRedirect = '/admin/reports'
        } else if (data.user.role === 'staff') {
          finalRedirect = '/staff/orders'
        }
      }
      
      window.location.assign(finalRedirect)
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 bg-zinc-950">
      <div className="w-full max-w-md">
        <div className="bg-white border border-zinc-200 rounded-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Masuk ke Akun
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Belum punya akun?{' '}
              <Link 
                href="/register" 
                className="font-medium text-zinc-900 hover:underline"
              >
                Daftar di sini
              </Link>
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}
            
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
            
            <div>
              <Input
                id="password"
                type="password"
                label="Password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <div className="flex justify-end mt-1.5">
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:underline"
                >
                  Lupa kata sandi?
                </Link>
              </div>
            </div>
            
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full"
            >
              Masuk
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
