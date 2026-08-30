'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { User, Mail, Phone, MapPin, KeyRound, Shield, CheckCircle2, AlertCircle, Loader2, ShoppingBag, Calendar, Save, Map, Camera, Sparkles, Upload, X, Check, Truck, LogOut } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCartStore } from '@/lib/store/useCartStore'
import { compressImageIfNeeded } from '@/lib/imageCompressor'

const AVATAR_PRESETS = [
  { id: 'avatar-1', title: 'Casual Boy 2D', url: '/avatars/avatar-1.svg' },
  { id: 'avatar-2', title: 'Modern Girl 2D', url: '/avatars/avatar-2.svg' },
  { id: 'avatar-3', title: 'Gamer Cyber 2D', url: '/avatars/avatar-3.svg' },
  { id: 'avatar-4', title: 'Trendy Beret 2D', url: '/avatars/avatar-4.svg' },
  { id: 'avatar-5', title: 'Beanie Boy 2D', url: '/avatars/avatar-5.svg' },
  { id: 'avatar-6', title: 'Cute Cat Mascot 2D', url: '/avatars/avatar-6.svg' },
]

const BENGKALIS_DATA: Record<string, string[]> = {
  'Kecamatan Bengkalis': [
    'Kelurahan Bengkalis Kota',
    'Kelurahan Damon',
    'Kelurahan Rimba Sekampung',
    'Desa Air Putih',
    'Desa Kelapapati',
    'Desa Pedekik',
    'Desa Wonosari',
    'Desa Senggoro',
    'Desa Sebauk',
    'Desa Teluk Latak',
    'Desa Meskom',
    'Desa Prapat Tunggal',
    'Desa Penampi',
    'Desa Temuran',
    'Desa Pangkalan Batang',
    'Desa Pangkalan Batang Barat',
    'Desa Sungai Alam',
    'Desa Kelemantan',
    'Desa Kelemantan Barat',
    'Desa Sekodi',
    'Desa Ketam Putih',
    'Desa Sungai Batang',
  ],
  'Kecamatan Bantan': [
    'Desa Selat Baru',
    'Desa Bantan Tua',
    'Desa Bantan Air',
    'Desa Bantan Tengah',
    'Desa Bantan Timur',
    'Desa Berancah',
    'Desa Resam Lapis',
    'Desa Teluk Lancar',
    'Desa Teluk Papal',
    'Desa Jangkang',
    'Desa Deluk',
    'Desa Kembung Luar',
    'Desa Kembung Tinggi',
    'Desa Muntai',
    'Desa Muntai Barat',
    'Desa Teluk Pambang',
    'Desa Pambang Baru',
    'Desa Pambang Pesisir',
    'Desa Sukamaju',
    'Desa Mentayan',
  ],
}

interface ProfileData {
  id: number
  email: string
  full_name: string | null
  phone: string
  address: string
  kecamatan: string
  village: string
  maps_link: string
  avatar_url: string
  role: 'admin' | 'staff' | 'courier' | 'user'
  created_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [profile, setProfile] = useState<ProfileData | null>(null)
  
  // Profile form state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [kecamatan, setKecamatan] = useState<string>('Kecamatan Bengkalis')
  const [village, setVillage] = useState<string>('Kelurahan Bengkalis Kota')
  const [address, setAddress] = useState('')
  const [mapsLink, setMapsLink] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  // Avatar Modal Picker state
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Notification state
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState<string | null>(null)

  // Logout state
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleSignOut = async () => {
    setIsLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    useCartStore.getState().clearCart()
    window.location.href = '/'
  }

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/profile')
        if (res.status === 401) {
          window.location.href = '/login?redirect=/profile'
          return
        }
        if (!res.ok) {
          throw new Error('Gagal mengambil data profil.')
        }
        const data = await res.json()
        const userProf: ProfileData = data.user
        setProfile(userProf)
        setFullName(userProf.full_name || '')
        setEmail(userProf.email || '')
        setAvatarUrl(userProf.avatar_url || '')

        let effectivePhone = userProf.phone || ''
        let effectiveAddress = userProf.address || ''
        let effectiveKec = userProf.kecamatan || 'Kecamatan Bengkalis'
        let effectiveVil = userProf.village || 'Kelurahan Bengkalis Kota'
        let effectiveMaps = userProf.maps_link || ''

        try {
          const savedLoc = localStorage.getItem('toko_bengkalis_default_address')
          if (savedLoc) {
            const locData = JSON.parse(savedLoc)
            if (!effectivePhone && locData.phone) effectivePhone = locData.phone
            if (!effectiveAddress && locData.address) effectiveAddress = locData.address
            if (!userProf.kecamatan && locData.kecamatan) effectiveKec = locData.kecamatan
            if (!userProf.village && locData.village) effectiveVil = locData.village
            if (!effectiveMaps && locData.mapsLink) effectiveMaps = locData.mapsLink
          }
        } catch {}

        setPhone(effectivePhone)
        setAddress(effectiveAddress)
        setKecamatan(effectiveKec)
        setVillage(effectiveVil)
        setMapsLink(effectiveMaps)

        if (!userProf.phone && !userProf.address && (effectivePhone || effectiveAddress)) {
          fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: effectivePhone,
              address: effectiveAddress,
              kecamatan: effectiveKec,
              village: effectiveVil,
              maps_link: effectiveMaps,
            }),
          }).catch(() => {})
        }
      } catch (err) {
        setProfileError(err instanceof Error ? err.message : 'Gagal memuat profil.')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleKecamatanChange = (newKec: string) => {
    setKecamatan(newKec)
    const available = BENGKALIS_DATA[newKec] || []
    if (available.length > 0) {
      setVillage(available[0])
    }
  }

  const handleCustomAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setProfileError('File foto profil harus berupa gambar.')
      return
    }

    setUploadingAvatar(true)
    setProfileError(null)

    try {
      const compressedFile = await compressImageIfNeeded(file)
      const formData = new FormData()
      formData.append('file', compressedFile)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal unggah foto profil.')
      }

      const data = await res.json()
      setAvatarUrl(data.url)

      // Simpan langsung avatar baru ke DB
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          avatar_url: data.url,
        }),
      })

      if (profile) {
        setProfile({ ...profile, avatar_url: data.url })
      }
      setProfileSuccess('Foto profil pribadi berhasil diperbarui!')
      setShowSuccessModal('Foto profil pribadi Anda berhasil diperbarui!')
      setShowAvatarPicker(false)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Gagal unggah foto profil.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSelectPresetAvatar = async (presetUrl: string) => {
    setAvatarUrl(presetUrl)
    setProfileError(null)

    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          avatar_url: presetUrl,
        }),
      })

      if (profile) {
        setProfile({ ...profile, avatar_url: presetUrl })
      }
      setProfileSuccess('Avatar animasi 2D berhasil diperbarui!')
      setShowSuccessModal('Avatar animasi 2D Anda berhasil diperbarui!')
      setShowAvatarPicker(false)
    } catch (err) {
      setProfileError('Gagal menyimpan avatar.')
    }
  }

  const handleResetAvatar = async () => {
    setAvatarUrl('')
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          avatar_url: '',
        }),
      })
      if (profile) {
        setProfile({ ...profile, avatar_url: '' })
      }
      setProfileSuccess('Foto profil berhasil diatur ulang ke inisial nama.')
      setShowSuccessModal('Foto profil berhasil diatur ulang ke inisial nama.')
      setShowAvatarPicker(false)
    } catch {}
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileSuccess(null)
    setProfileError(null)

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          address,
          kecamatan,
          village,
          maps_link: mapsLink,
          avatar_url: avatarUrl,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui profil.')
      }

      setProfile(data.user)

      try {
        localStorage.setItem('toko_bengkalis_default_address', JSON.stringify({
          kecamatan,
          village,
          address,
          phone,
          mapsLink,
        }))
      } catch {}

      setProfileSuccess('Profil & Alamat Pengiriman berhasil diperbarui!')
      setShowSuccessModal('Profil & Alamat Pengiriman Anda berhasil diperbarui!')
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Gagal memperbarui profil.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordSuccess(null)
    setPasswordError(null)

    if (!currentPassword) {
      setPasswordError('Harap masukkan password saat ini.')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('Password baru minimal 6 karakter.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi password baru tidak cocok.')
      return
    }

    setSavingPassword(true)

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          address,
          kecamatan,
          village,
          maps_link: mapsLink,
          avatar_url: avatarUrl,
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui kata sandi.')
      }

      setPasswordSuccess('Kata sandi berhasil diubah!')
      setShowSuccessModal('Kata sandi / Password Anda berhasil diperbarui!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Gagal memperbarui kata sandi.')
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-zinc-900" />
          <p className="text-sm text-zinc-500 font-medium">Memuat data profil...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex-1 max-w-4xl mx-auto p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-zinc-900">Gagal Memuat Profil</h2>
        <p className="text-sm text-zinc-500 mt-1">{profileError || 'Silakan masuk kembali.'}</p>
        <Link href="/login" className="inline-block mt-4">
          <Button>Masuk Ke Akun</Button>
        </Link>
      </div>
    )
  }

  const roleLabel = {
    admin: '👑 Administrator',
    staff: '📦 Staff Toko',
    courier: '🚚 Kurir Lapangan',
    user: '👤 Pelanggan',
  }[profile.role]

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex-1 bg-zinc-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Profil Card */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6 relative">
          
          {/* Avatar Profile with Change Button */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-zinc-900 shadow-md bg-zinc-900 text-white font-extrabold text-2xl flex items-center justify-center relative">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={profile.full_name || 'Avatar'}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : profile.full_name ? (
                getInitials(profile.full_name)
              ) : (
                <User className="h-10 w-10" />
              )}
            </div>
            
            <button
              type="button"
              onClick={() => setShowAvatarPicker(true)}
              className="absolute bottom-0 right-0 p-2 bg-zinc-900 text-white rounded-full hover:bg-zinc-800 transition-transform transform group-hover:scale-105 shadow-lg border-2 border-white cursor-pointer"
              title="Ganti Foto / Avatar Profil"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                {profile.full_name || 'Pengguna'}
              </h1>
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 w-fit mx-auto sm:mx-0">
                {roleLabel}
              </span>
            </div>

            <p className="text-sm text-zinc-500 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="h-4 w-4 text-zinc-400" />
              {profile.email}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-zinc-500 pt-1">
              <button
                type="button"
                onClick={() => setShowAvatarPicker(true)}
                className="inline-flex items-center gap-1.5 text-blue-600 font-semibold hover:underline cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" /> Ganti Foto / Avatar 2D
              </button>
              <span>•</span>
              <span className="flex items-center gap-1 text-zinc-400">
                <Calendar className="h-3.5 w-3.5" />
                Bergabung: {new Date(profile.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="shrink-0 w-full sm:w-auto hidden sm:flex flex-col sm:flex-row gap-2">
            {profile.role === 'user' && (
              <>
                <Link href="/orders" className="w-full sm:w-auto">
                  <Button variant="secondary" className="w-full text-xs font-semibold flex items-center justify-center gap-2 py-2">
                    <ShoppingBag className="h-4 w-4" />
                    Pesanan Saya
                  </Button>
                </Link>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowLogoutModal(true)}
                  className="w-full sm:w-auto text-xs font-semibold flex items-center justify-center gap-2 py-2 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar Akun
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Modal Picker Avatar / Foto Profil */}
        {showAvatarPicker && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-zinc-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
              
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Pilih Foto Profil atau Avatar 2D
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Gunakan karakter animasi 2D keren atau unggah foto Anda sendiri.</p>
                </div>
                <button
                  onClick={() => setShowAvatarPicker(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Section 1: Presets Avatar 2D */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  ✨ Karakter Animasi 2D
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = avatarUrl === preset.url
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPresetAvatar(preset.url)}
                        className={`group relative p-2.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-zinc-900 bg-zinc-900/5 ring-2 ring-zinc-900 scale-105'
                            : 'border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50'
                        }`}
                      >
                        <div className="w-16 h-16 rounded-full overflow-hidden relative shadow-sm border border-zinc-200">
                          <Image
                            src={preset.url}
                            alt={preset.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-zinc-900/40 flex items-center justify-center">
                              <Check className="h-6 w-6 text-white" />
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-zinc-700 group-hover:text-zinc-900 text-center leading-tight">
                          {preset.title}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Section 2: Upload Foto Pribadi */}
              <div className="space-y-3 pt-4 border-t border-zinc-100">
                <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  📸 Upload Foto Pribadi Dari Galeri / HP
                </h4>
                <div className="border-2 border-dashed border-zinc-300 hover:border-zinc-400 rounded-xl p-5 text-center cursor-pointer relative bg-zinc-50/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCustomAvatarUpload}
                    disabled={uploadingAvatar}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  {uploadingAvatar ? (
                    <div className="flex items-center justify-center gap-2 text-xs text-zinc-600">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Mengunggah foto profil...</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Upload className="h-6 w-6 text-zinc-500 mx-auto" />
                      <p className="text-xs font-semibold text-zinc-800">Klik di sini untuk upload foto dari galeri</p>
                      <p className="text-[11px] text-zinc-400">Format PNG, JPG, WEBP hingga 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Reset ke Inisial Nama */}
              <div className="pt-2 border-t border-zinc-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleResetAvatar}
                  className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                >
                  Hapus Foto & Gunakan Inisial
                </button>
                <Button variant="secondary" onClick={() => setShowAvatarPicker(false)} className="text-xs">
                  Tutup
                </Button>
              </div>

            </div>
          </div>
        )}

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Form Edit Profil (2 cols) */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-bold text-zinc-900 mb-1 flex items-center gap-2">
                <User className="h-5 w-5 text-zinc-700" />
                Informasi Pribadi & Alamat Pengiriman
              </h2>
              <p className="text-xs text-zinc-500 mb-6">
                Data alamat dan nomor WhatsApp di sini akan otomatis terhubung saat Anda melakukan checkout pesanan.
              </p>

              {profileSuccess && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <Input
                  label="Nama Lengkap"
                  placeholder="Masukkan nama lengkap"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />

                <Input
                  label="Alamat Email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-zinc-900 mb-1.5 flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-zinc-500" />
                    Nomor Telepon / WhatsApp
                  </label>
                  <Input
                    placeholder="Contoh: 0812-3456-7890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">Digunakan kurir toko untuk konfirmasi pengiriman & pesan WhatsApp.</p>
                </div>

                {/* Dropdown Kecamatan & Desa */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-900 mb-1.5">
                      Kecamatan Default (Pulau Bengkalis)
                    </label>
                    <select
                      value={kecamatan}
                      onChange={(e) => handleKecamatanChange(e.target.value)}
                      className="w-full h-10 px-3 py-2 text-xs bg-white text-zinc-900 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 font-semibold cursor-pointer"
                    >
                      {Object.keys(BENGKALIS_DATA).map((kec) => (
                        <option key={kec} value={kec} className="bg-white text-zinc-900 font-semibold py-1">
                          {kec}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-900 mb-1.5">
                      Desa / Kelurahan Default
                    </label>
                    <select
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      className="w-full h-10 px-3 py-2 text-xs bg-white text-zinc-900 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 font-semibold cursor-pointer"
                    >
                      {(BENGKALIS_DATA[kecamatan] || []).map((v) => (
                        <option key={v} value={v} className="bg-white text-zinc-900 font-semibold py-1">
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-900 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-zinc-500" />
                    Alamat Detail (Jalan, Nomor Rumah, RT/RW, Dusun)
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm text-zinc-900 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 placeholder:text-zinc-400"
                    placeholder="Contoh: Jl. Antara Gang Mulia No. 12, RT 02/RW 03"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-900 mb-1 flex items-center gap-1.5">
                    <Map className="h-3.5 w-3.5 text-blue-600" /> Link Pin Point Google Maps Rumah (Opsional)
                  </label>
                  <Input
                    placeholder="Contoh: https://maps.google.com/?q=..."
                    value={mapsLink}
                    onChange={(e) => setMapsLink(e.target.value)}
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">Otomatis terisi saat memilih GPS pada halaman checkout.</p>
                </div>

                <div className="pt-3">
                  <Button type="submit" isLoading={savingProfile} className="w-full sm:w-auto px-6 py-2.5">
                    <Save className="h-4 w-4" />
                    Simpan Perubahan Profil
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Form Ubah Password (1 col) */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-zinc-900 mb-1 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-zinc-700" />
                Ubah Kata Sandi
              </h2>
              <p className="text-xs text-zinc-500 mb-4">
                Pastikan akun Anda tetap aman dengan membuat kata sandi yang kuat.
              </p>

              {passwordSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-3.5">
                <Input
                  label="Password Saat Ini"
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />

                <Input
                  label="Password Baru"
                  type="password"
                  placeholder="Min. 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />

                <Input
                  label="Konfirmasi Password Baru"
                  type="password"
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <div className="pt-2">
                  <Button type="submit" variant="secondary" isLoading={savingPassword} className="w-full text-xs font-semibold py-2.5">
                    <Shield className="h-4 w-4 text-zinc-700" />
                    Ubah Password
                  </Button>
                </div>
              </form>
            </div>

            {/* Card Keluar Akun (Khusus Pelanggan) */}
            {profile?.role === 'user' && (
              <div className="hidden sm:block bg-white border border-red-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-bold text-red-600 mb-1 flex items-center gap-2">
                  <LogOut className="h-4 w-4 text-red-600" />
                  Keluar dari Akun
                </h2>
                <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                  Sesi login Anda akan diakhiri. Anda dapat masuk kembali kapan saja.
                </p>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowLogoutModal(true)}
                  className="w-full text-xs font-semibold py-2.5 cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar dari Akun Saya
                </Button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Modal Pop-Up Berhasil diperbarui */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-zinc-100 text-center animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h3 className="text-lg font-bold text-zinc-900 mb-1">
              Berhasil Diperbarui!
            </h3>
            <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
              {showSuccessModal}
            </p>

            <Button
              onClick={() => setShowSuccessModal(null)}
              className="w-full py-2.5 text-xs font-semibold cursor-pointer"
            >
              OK, Mengerti
            </Button>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-zinc-100 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-200">
              <LogOut className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-bold text-zinc-900 mb-1">
              Konfirmasi Keluar
            </h3>
            <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
              Apakah Anda yakin ingin keluar dari akun Anda?
            </p>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="flex-1 py-2 text-xs font-semibold cursor-pointer"
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleSignOut}
                isLoading={isLoggingOut}
                className="flex-1 py-2 text-xs font-semibold cursor-pointer"
              >
                Ya, Keluar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
