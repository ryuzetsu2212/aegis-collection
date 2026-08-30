import { NextRequest, NextResponse } from 'next/server'
import { getDb, DbUser } from '@/lib/db'
import { getSession, hashPassword, verifyPassword } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()
    const user = db.prepare(
      'SELECT id, email, full_name, phone, address, kecamatan, village, maps_link, avatar_url, role, created_at FROM users WHERE id = ?'
    ).get(session.id) as DbUser | undefined

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone || '',
        address: user.address || '',
        kecamatan: user.kecamatan || '',
        village: user.village || '',
        maps_link: user.maps_link || '',
        avatar_url: user.avatar_url || '',
        role: user.role,
        created_at: user.created_at,
      },
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Gagal mengambil data profil.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { full_name, email, phone, address, kecamatan, village, maps_link, avatar_url, current_password, new_password } = body

    const db = await getDb()

    // Ambil data user saat ini dari DB
    const currentUser = await db.prepare('SELECT * FROM users WHERE id = ?').get(session.id) as DbUser | undefined
    if (!currentUser) {
      return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })
    }

    const targetFullName = full_name !== undefined ? full_name.trim() : (currentUser.full_name || '')
    const targetEmail = email !== undefined ? email.trim().toLowerCase() : currentUser.email.toLowerCase()

    if (!targetFullName) {
      return NextResponse.json({ error: 'Nama lengkap tidak boleh kosong.' }, { status: 400 })
    }

    if (!targetEmail) {
      return NextResponse.json({ error: 'Email tidak boleh kosong.' }, { status: 400 })
    }

    // Cek jika email diganti, pastikan tidak bentrok dengan user lain
    if (targetEmail !== currentUser.email.toLowerCase()) {
      const existing = await db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(targetEmail, session.id)
      if (existing) {
        return NextResponse.json({ error: 'Email sudah digunakan oleh akun lain.' }, { status: 400 })
      }
    }

    let newPasswordHash = currentUser.password_hash

    // Jika mencoba mengubah password
    if (new_password) {
      if (!current_password) {
        return NextResponse.json({ error: 'Harap masukkan password saat ini untuk konfirmasi.' }, { status: 400 })
      }

      if (new_password.length < 6) {
        return NextResponse.json({ error: 'Password baru minimal 6 karakter.' }, { status: 400 })
      }

      const isValidPassword = await verifyPassword(current_password, currentUser.password_hash)
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Password saat ini salah.' }, { status: 400 })
      }

      newPasswordHash = await hashPassword(new_password)
    }

    const targetPhone = phone !== undefined ? (phone ? phone.trim() : null) : (currentUser.phone || null)
    const targetAddress = address !== undefined ? (address ? address.trim() : null) : (currentUser.address || null)
    const targetKecamatan = kecamatan !== undefined ? (kecamatan ? kecamatan.trim() : null) : (currentUser.kecamatan || null)
    const targetVillage = village !== undefined ? (village ? village.trim() : null) : (currentUser.village || null)
    const targetMapsLink = maps_link !== undefined ? (maps_link ? maps_link.trim() : null) : (currentUser.maps_link || null)
    const targetAvatarUrl = avatar_url !== undefined ? (avatar_url ? avatar_url.trim() : null) : (currentUser.avatar_url || null)

    db.prepare(`
      UPDATE users 
      SET full_name = ?, email = ?, phone = ?, address = ?, kecamatan = ?, village = ?, maps_link = ?, avatar_url = ?, password_hash = ?
      WHERE id = ?
    `).run(
      targetFullName,
      targetEmail,
      targetPhone,
      targetAddress,
      targetKecamatan,
      targetVillage,
      targetMapsLink,
      targetAvatarUrl,
      newPasswordHash,
      session.id
    )

    const updatedUser = db.prepare(
      'SELECT id, email, full_name, phone, address, kecamatan, village, maps_link, avatar_url, role, created_at FROM users WHERE id = ?'
    ).get(session.id) as DbUser

    return NextResponse.json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        phone: updatedUser.phone || '',
        address: updatedUser.address || '',
        kecamatan: updatedUser.kecamatan || '',
        village: updatedUser.village || '',
        maps_link: updatedUser.maps_link || '',
        avatar_url: updatedUser.avatar_url || '',
        role: updatedUser.role,
        created_at: updatedUser.created_at,
      },
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Gagal memperbarui profil.' }, { status: 500 })
  }
}
