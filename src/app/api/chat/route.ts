import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'

function normalizeIso(ts: string | null | undefined) {
  if (!ts) return ts
  let iso = ts.trim()
  if (!iso.endsWith('Z') && !iso.includes('+')) {
    iso = iso.includes(' ') ? iso.replace(' ', 'T') + 'Z' : iso + 'Z'
  }
  return iso
}

export async function GET(request: Request) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const targetRoomId = searchParams.get('room_user_id')
    const db = await getDb()

    if (user.role === 'admin' || user.role === 'staff') {
      if (targetRoomId) {
        const roomId = parseInt(targetRoomId, 10)
        
        // Mark as read messages from target user sent to current user
        await db.prepare('UPDATE chat_messages SET is_read = 1 WHERE sender_id = ? AND (room_user_id = ? OR room_user_id = ?)').run(roomId, user.id, roomId)

        // Select all messages exchanged between current user and target user
        const rawMessages = db.prepare(`
          SELECT c.*, u.full_name as sender_name, u.avatar_url as sender_avatar, u.role as sender_role
          FROM chat_messages c
          JOIN users u ON c.sender_id = u.id
          WHERE (c.room_user_id = ? AND (c.sender_id = ? OR c.sender_id = ?))
             OR (c.room_user_id = ? AND (c.sender_id = ? OR c.sender_id = ?))
          ORDER BY c.created_at ASC
        `).all(roomId, user.id, roomId, user.id, user.id, roomId) as any[]

        const messages = rawMessages.map((m) => ({
          ...m,
          created_at: normalizeIso(m.created_at),
        }))

        const roomUser = await db.prepare('SELECT id, full_name, email, avatar_url, role FROM users WHERE id = ?').get(roomId)

        return NextResponse.json({ messages, roomUser })
      } else {
        let rawRooms: any[] = []

        if (user.role === 'admin') {
          // Admin ONLY chats with Staff members!
          rawRooms = db.prepare(`
            SELECT 
              u.id as room_user_id,
              u.full_name,
              u.email,
              u.avatar_url,
              u.role,
              (
                SELECT message FROM chat_messages 
                WHERE (room_user_id = u.id AND (sender_id = ? OR sender_id = u.id))
                   OR (room_user_id = ? AND (sender_id = ? OR sender_id = u.id))
                ORDER BY created_at DESC LIMIT 1
              ) as last_message,
              (
                SELECT created_at FROM chat_messages 
                WHERE (room_user_id = u.id AND (sender_id = ? OR sender_id = u.id))
                   OR (room_user_id = ? AND (sender_id = ? OR sender_id = u.id))
                ORDER BY created_at DESC LIMIT 1
              ) as last_created_at,
              (
                SELECT COUNT(*) FROM chat_messages 
                WHERE sender_id = u.id 
                  AND (room_user_id = ? OR room_user_id = u.id) 
                  AND is_read = 0
              ) as unread_count
            FROM users u
            WHERE u.role = 'staff'
            ORDER BY COALESCE(last_created_at, '1970-01-01') DESC, u.full_name ASC
          `).all(
            user.id, user.id, user.id, // last_message
            user.id, user.id, user.id, // last_created_at
            user.id                    // unread_count
          ) as any[]
        } else {
          // Staff sees Buyers, Couriers, and Admin
          rawRooms = db.prepare(`
            SELECT 
              u.id as room_user_id,
              u.full_name,
              u.email,
              u.avatar_url,
              u.role,
              (
                SELECT message FROM chat_messages 
                WHERE (room_user_id = u.id AND (sender_id = ? OR sender_id = u.id))
                   OR (room_user_id = ? AND (sender_id = ? OR sender_id = u.id))
                ORDER BY created_at DESC LIMIT 1
              ) as last_message,
              (
                SELECT created_at FROM chat_messages 
                WHERE (room_user_id = u.id AND (sender_id = ? OR sender_id = u.id))
                   OR (room_user_id = ? AND (sender_id = ? OR sender_id = u.id))
                ORDER BY created_at DESC LIMIT 1
              ) as last_created_at,
              (
                SELECT COUNT(*) FROM chat_messages 
                WHERE sender_id = u.id 
                  AND (room_user_id = ? OR room_user_id = u.id) 
                  AND is_read = 0
              ) as unread_count
            FROM users u
            WHERE (u.role IN ('user', 'courier') AND EXISTS (
                    SELECT 1 FROM chat_messages 
                    WHERE (room_user_id = u.id AND (sender_id = ? OR sender_id = u.id))
                       OR (room_user_id = ? AND (sender_id = ? OR sender_id = u.id))
                  ))
               OR u.role = 'admin'
            ORDER BY COALESCE(last_created_at, '1970-01-01') DESC, u.full_name ASC
          `).all(
            user.id, user.id, user.id, // last_message
            user.id, user.id, user.id, // last_created_at
            user.id,                   // unread_count
            user.id, user.id, user.id  // WHERE EXISTS
          ) as any[]
        }

        const rooms = rawRooms.map((r) => ({
          ...r,
          last_created_at: normalizeIso(r.last_created_at),
        }))

        return NextResponse.json({ rooms })
      }
    } else {
      if (searchParams.get('mark_read') === '1') {
        await db.prepare('UPDATE chat_messages SET is_read = 1 WHERE (room_user_id = ? OR sender_id = ?) AND sender_id != ?').run(user.id, user.id, user.id)
      }

      const rawMessages = db.prepare(`
        SELECT c.*, u.full_name as sender_name, u.avatar_url as sender_avatar, u.role as sender_role
        FROM chat_messages c
        JOIN users u ON c.sender_id = u.id
        WHERE c.room_user_id = ? OR c.sender_id = ?
        ORDER BY c.created_at ASC
      `).all(user.id, user.id) as any[]

      const messages = rawMessages.map((m) => ({
        ...m,
        created_at: normalizeIso(m.created_at),
      }))

      return NextResponse.json({ messages })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, room_user_id } = await request.json()
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Pesan tidak boleh kosong' }, { status: 400 })
    }

    const db = await getDb()
    let roomId = user.id

    if (user.role === 'admin' || user.role === 'staff') {
      if (!room_user_id) {
        return NextResponse.json({ error: 'room_user_id wajib diisi' }, { status: 400 })
      }
      roomId = parseInt(room_user_id, 10)
    }

    const nowIso = new Date().toISOString()
    const result = db.prepare(`
      INSERT INTO chat_messages (sender_id, room_user_id, message, created_at)
      VALUES (?, ?, ?, ?)
    `).run(user.id, roomId, message.trim(), nowIso)

    const rawMessage = db.prepare(`
      SELECT c.*, u.full_name as sender_name, u.avatar_url as sender_avatar, u.role as sender_role
      FROM chat_messages c
      JOIN users u ON c.sender_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid) as any

    const newMessage = rawMessage
      ? { ...rawMessage, created_at: normalizeIso(rawMessage.created_at) }
      : null

    return NextResponse.json({ success: true, message: newMessage })
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 })
  }
}
