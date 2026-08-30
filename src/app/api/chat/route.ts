import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getSupabase } from '@/lib/db'

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
    const supabase = getSupabase()

    if (targetRoomId) {
      const roomId = parseInt(targetRoomId, 10)

      // Mark unread messages from target user as read
      await supabase
        .from('chat_messages')
        .update({ is_read: 1 })
        .eq('sender_id', roomId)
        .eq('room_user_id', user.id)

      // Fetch messages exchanged between current user and target room
      const { data: rawRes, error: err } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`and(room_user_id.eq.${roomId},sender_id.eq.${user.id}),and(room_user_id.eq.${user.id},sender_id.eq.${roomId}),and(room_user_id.eq.${roomId},sender_id.eq.${roomId})`)
        .order('created_at', { ascending: true })

      if (err) {
        console.error('Error fetching room messages:', err)
      }

      const rawList = rawRes || []

      // Fetch sender user details manually to be 100% fail-safe
      const senderIds = Array.from(new Set(rawList.map((m: any) => m.sender_id)))
      let userMap: Record<number, any> = {}

      if (senderIds.length > 0) {
        const { data: senders } = await supabase
          .from('users')
          .select('id, full_name, avatar_url, role')
          .in('id', senderIds)

        if (senders) {
          senders.forEach((s: any) => {
            userMap[s.id] = s
          })
        }
      }

      const messages = rawList.map((m: any) => {
        const sender = userMap[m.sender_id]
        return {
          ...m,
          sender_name: sender?.full_name || 'User',
          sender_avatar: sender?.avatar_url || null,
          sender_role: sender?.role || 'user',
          created_at: normalizeIso(m.created_at),
        }
      })

      const { data: roomUser } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url, role')
        .eq('id', roomId)
        .maybeSingle()

      return NextResponse.json({ messages, roomUser })
    } else {
      // Room list view for ALL roles!
      let targetRoles: string[] = []
      if (user.role === 'admin') {
        targetRoles = ['staff', 'courier']
      } else if (user.role === 'staff') {
        targetRoles = ['courier', 'admin', 'staff']
      } else if (user.role === 'courier') {
        targetRoles = ['staff', 'admin']
      } else {
        // Pembeli (user) can pick which Staff/Admin to chat with
        targetRoles = ['staff', 'admin']
      }

      const { data: usersList } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url, role')
        .in('role', targetRoles)

      const { data: allMessages } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: false })

      const roomMap: Record<number, any> = {}

      if (usersList) {
        usersList.forEach(u => {
          if (u.id !== user.id) {
            roomMap[u.id] = {
              room_user_id: u.id,
              full_name: u.full_name,
              email: u.email,
              avatar_url: u.avatar_url,
              role: u.role,
              last_message: null,
              last_created_at: null,
              unread_count: 0,
            }
          }
        })
      }

      if (allMessages) {
        allMessages.forEach(m => {
          // Hanya proses pesan yang melibatkan pengguna yang sedang login
          if (m.sender_id === user.id || m.room_user_id === user.id) {
            const targetRoom = m.room_user_id === user.id ? m.sender_id : m.room_user_id
            if (roomMap[targetRoom]) {
              if (!roomMap[targetRoom].last_message) {
                roomMap[targetRoom].last_message = m.message
                roomMap[targetRoom].last_created_at = normalizeIso(m.created_at)
              }
              if (m.sender_id === targetRoom && m.room_user_id === user.id && m.is_read === 0) {
                roomMap[targetRoom].unread_count++
              }
            }
          }
        })
      }

      const rooms = Object.values(roomMap).sort((a, b) => {
        const timeA = a.last_created_at ? new Date(a.last_created_at).getTime() : 0
        const timeB = b.last_created_at ? new Date(b.last_created_at).getTime() : 0
        return timeB - timeA
      })

      return NextResponse.json({ rooms })
    }
  } catch (error: any) {
    console.error('Chat GET Error:', error)
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

    const supabase = getSupabase()
    let roomId = user.id
    if (room_user_id) {
      roomId = parseInt(room_user_id, 10)
    }

    const nowIso = new Date().toISOString()
    const { data: inserted, error: insertErr } = await supabase
      .from('chat_messages')
      .insert({
        sender_id: user.id,
        room_user_id: roomId,
        message: message.trim(),
        created_at: nowIso,
        is_read: 0,
      })
      .select('*')
      .single()

    if (insertErr) {
      console.error('Error inserting chat message:', insertErr)
      throw new Error(insertErr.message)
    }

    const newMessage = inserted
      ? {
          ...inserted,
          sender_name: user.full_name || 'User',
          sender_avatar: user.avatar_url || null,
          sender_role: user.role || 'user',
          created_at: normalizeIso(inserted.created_at),
        }
      : null

    return NextResponse.json({ success: true, message: newMessage })
  } catch (error: any) {
    console.error('Chat POST Error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, message } = await request.json()
    if (!id || !message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'ID pesan dan teks pesan baru wajib diisi' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data: existing, error: findErr } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (findErr || !existing) {
      return NextResponse.json({ error: 'Pesan tidak ditemukan' }, { status: 404 })
    }

    if (existing.sender_id !== user.id) {
      return NextResponse.json({ error: 'Anda hanya dapat mengedit pesan milik Anda sendiri.' }, { status: 403 })
    }

    // Batasan waktu maksimal 12 jam
    const ageMs = Date.now() - new Date(existing.created_at).getTime()
    const maxAgeMs = 12 * 60 * 60 * 1000
    if (ageMs > maxAgeMs) {
      return NextResponse.json({ error: 'Pesan yang dibuat lebih dari 12 jam lalu tidak dapat diedit lagi.' }, { status: 400 })
    }

    const { error: updateErr } = await supabase
      .from('chat_messages')
      .update({ message: message.trim() })
      .eq('id', id)

    if (updateErr) throw new Error(updateErr.message)

    return NextResponse.json({ success: true, message: 'Pesan berhasil diperbarui' })
  } catch (error: any) {
    console.error('Chat PUT Error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const idParam = searchParams.get('id')
    if (!idParam) {
      return NextResponse.json({ error: 'ID pesan wajib diisi' }, { status: 400 })
    }

    const messageId = parseInt(idParam, 10)
    const supabase = getSupabase()

    const { data: existing, error: findErr } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('id', messageId)
      .maybeSingle()

    if (findErr || !existing) {
      return NextResponse.json({ error: 'Pesan tidak ditemukan' }, { status: 404 })
    }

    if (existing.sender_id !== user.id) {
      return NextResponse.json({ error: 'Anda hanya dapat menghapus pesan milik Anda sendiri.' }, { status: 403 })
    }

    // Batasan waktu maksimal 12 jam
    const ageMs = Date.now() - new Date(existing.created_at).getTime()
    const maxAgeMs = 12 * 60 * 60 * 1000
    if (ageMs > maxAgeMs) {
      return NextResponse.json({ error: 'Pesan yang dibuat lebih dari 12 jam lalu tidak dapat dihapus lagi.' }, { status: 400 })
    }

    const { error: deleteErr } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId)

    if (deleteErr) throw new Error(deleteErr.message)

    return NextResponse.json({ success: true, message: 'Pesan berhasil dihapus' })
  } catch (error: any) {
    console.error('Chat DELETE Error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 })
  }
}
