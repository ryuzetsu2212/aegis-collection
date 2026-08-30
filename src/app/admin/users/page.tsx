'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Loader2, Users, Trash2, ShieldCheck, Calendar, Mail } from 'lucide-react'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

type UserRole = 'admin' | 'staff' | 'user' | 'courier'

interface User {
  id: number
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  staff: 'Staff Toko',
  user: 'Pelanggan',
  courier: 'Kurir',
}

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-900 border-purple-300 font-bold',
  staff: 'bg-blue-100 text-blue-900 border-blue-300 font-bold',
  user: 'bg-zinc-100 text-zinc-900 border-zinc-300 font-bold',
  courier: 'bg-amber-100 text-amber-950 border-amber-300 font-bold',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deleteModalUserId, setDeleteModalUserId] = useState<number | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      setLoading(true)
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('Gagal memuat daftar pengguna.')
      const data = await res.json()
      setUsers(data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat pengguna.')
    } finally {
      setLoading(false)
    }
  }

  async function updateRole(userId: number, newRole: UserRole) {
    try {
      setUpdating(userId)
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) throw new Error('Gagal memperbarui peran pengguna.')
      await fetchUsers()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal update peran.')
    } finally {
      setUpdating(null)
    }
  }

  async function deleteUser(userId: number) {
    try {
      setDeletingId(userId)
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menghapus pengguna.')
      }
      await fetchUsers()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus pengguna.')
    } finally {
      setDeletingId(null)
      setDeleteModalUserId(null)
    }
  }

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      u.email.toLowerCase().includes(q) ||
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      u.role.toLowerCase().includes(q)
    )
  })

  const roleOptions: UserRole[] = ['user', 'staff', 'courier', 'admin']

  return (
    <div className="min-h-screen bg-zinc-100 py-4 sm:py-8 px-3 sm:px-6 lg:px-8 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-purple-700 shrink-0" />
              <span className="truncate">Manajemen Pengguna & Peran</span>
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Kelola akun Pelanggan, Staff Toko, Kurir, dan Administrator
            </p>
          </div>

          <div className="w-full sm:w-64 shrink-0">
            <Input
              placeholder="Cari nama, email, atau role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs py-2 bg-white"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-8 sm:p-12 text-center shadow-xs">
            <Users className="h-10 w-10 sm:h-12 sm:w-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-xs sm:text-sm text-zinc-500">Tidak ada pengguna ditemukan.</p>
          </div>
        ) : (
          <>
            {/* Tampilan Kartu Khusus Mobile HP (sm:hidden) */}
            <div className="block sm:hidden space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-bold text-zinc-900 text-xs">#{user.id}</span>
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            ROLE_COLORS[user.role] || 'bg-zinc-100 text-zinc-900'
                          }`}
                        >
                          {ROLE_LABELS[user.role] || user.role}
                        </span>
                      </div>
                      <p className="font-bold text-zinc-900 text-sm truncate">
                        {user.full_name || 'Belum diisi'}
                      </p>
                    </div>

                    <button
                      onClick={() => setDeleteModalUserId(user.id)}
                      disabled={deletingId === user.id}
                      className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 shrink-0"
                      title="Hapus Pengguna"
                    >
                      {deletingId === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-500" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs text-zinc-600">
                    <div className="flex items-center gap-2 min-w-0">
                      <Mail className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span className="font-mono truncate text-[11px]">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span className="text-[11px] text-zinc-500">
                        {new Date(user.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-zinc-500">Ubah Peran:</span>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={user.role}
                        onChange={(e) => updateRole(user.id, e.target.value as UserRole)}
                        disabled={updating === user.id}
                        className="text-xs font-bold text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                      >
                        {roleOptions.map((r) => (
                          <option key={r} value={r} className="text-zinc-900 bg-white font-semibold">
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                      {updating === user.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tampilan Tabel Khusus Desktop / Tablet (hidden sm:block) */}
            <div className="hidden sm:block bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs divide-y divide-zinc-200">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="text-left py-3.5 px-4 font-semibold uppercase tracking-wider text-zinc-600">
                        ID & Nama Lengkap
                      </th>
                      <th className="text-left py-3.5 px-4 font-semibold uppercase tracking-wider text-zinc-600">
                        Email
                      </th>
                      <th className="text-left py-3.5 px-4 font-semibold uppercase tracking-wider text-zinc-600">
                        Peran (Role)
                      </th>
                      <th className="text-left py-3.5 px-4 font-semibold uppercase tracking-wider text-zinc-600">
                        Tanggal Terdaftar
                      </th>
                      <th className="text-left py-3.5 px-4 font-semibold uppercase tracking-wider text-zinc-600">
                        Aksi Peran
                      </th>
                      <th className="text-center py-3.5 px-4 font-semibold uppercase tracking-wider text-zinc-600">
                        Hapus
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-zinc-50/50">
                        <td className="py-3 px-4">
                          <span className="font-bold text-zinc-900">#{user.id}</span>
                          <p className="font-medium text-zinc-900">{user.full_name || 'Belum diisi'}</p>
                        </td>
                        <td className="py-3 px-4 text-zinc-700 font-mono">{user.email}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                              ROLE_COLORS[user.role] || 'bg-zinc-100 text-zinc-900'
                            }`}
                          >
                            {ROLE_LABELS[user.role] || user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-500">
                          {new Date(user.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <select
                              value={user.role}
                              onChange={(e) => updateRole(user.id, e.target.value as UserRole)}
                              disabled={updating === user.id}
                              className="text-xs font-bold text-zinc-900 bg-white border border-zinc-300 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-zinc-900 cursor-pointer"
                            >
                              {roleOptions.map((r) => (
                                <option key={r} value={r} className="text-zinc-900 bg-white font-semibold">
                                  {ROLE_LABELS[r]}
                                </option>
                              ))}
                            </select>
                            {updating === user.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setDeleteModalUserId(user.id)}
                            disabled={deletingId === user.id}
                            className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                            title="Hapus Pengguna"
                          >
                            {deletingId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModalUserId !== null}
        title="Hapus Akun Pengguna"
        description="Apakah Anda yakin ingin menghapus akun pengguna ini secara permanen?"
        confirmText="Ya, Hapus Pengguna"
        cancelText="Batal"
        variant="danger"
        isLoading={deletingId === deleteModalUserId}
        onConfirm={() => {
          if (deleteModalUserId) deleteUser(deleteModalUserId)
        }}
        onCancel={() => setDeleteModalUserId(null)}
      />
    </div>
  )
}