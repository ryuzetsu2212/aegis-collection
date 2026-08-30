import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireRole(['admin'])

    const { id } = await params
    const userId = Number(id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'ID user tidak valid.' }, { status: 400 })
    }

    const db = await getDb()
    const targetUser = await db.prepare('SELECT id, email, role FROM users WHERE id = ?').get(userId) as any
    if (!targetUser) {
      return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })
    }

    const body = await request.json()
    const { role } = body

    if (!role || !['admin', 'staff', 'courier', 'user'].includes(role)) {
      return NextResponse.json(
        { error: 'Role tidak valid.' },
        { status: 400 }
      )
    }

    await db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId)

    await logAudit({
      user: adminUser,
      action: 'USER_ROLE_UPDATED',
      entityType: 'user',
      entityId: userId,
      details: {
        email: targetUser.email,
        role_sebelumnya: targetUser.role,
        role_baru: role,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json(
      { error: 'Gagal update role.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireRole(['admin'])

    const { id } = await params
    const userId = Number(id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'ID user tidak valid.' }, { status: 400 })
    }

    if (adminUser.id === userId) {
      return NextResponse.json({ error: 'Tidak dapat menghapus akun sendiri.' }, { status: 400 })
    }

    const db = await getDb()
    const targetUser = await db.prepare('SELECT id, email, role FROM users WHERE id = ?').get(userId) as any
    if (!targetUser) {
      return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })
    }

    await db.prepare('DELETE FROM users WHERE id = ?').run(userId)

    await logAudit({
      user: adminUser,
      action: 'USER_DELETED',
      entityType: 'user',
      entityId: userId,
      details: {
        email: targetUser.email,
        role: targetUser.role,
      },
    })

    return NextResponse.json({ success: true, message: 'Pengguna berhasil dihapus.' })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json(
      { error: 'Gagal menghapus user.' },
      { status: 500 }
    )
  }
}