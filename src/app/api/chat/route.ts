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

    if (user.role === 'admin' || user.role === 'staff') {
      if (targetRoomId) {
        const roomId = parseInt(targetRoomId, 10)

        // Mark unread messages from target user as read
        await supabase
          .from('chat_messages')
          .update({ is_read: 1 })
          .eq('sender_id', roomId)

        // Fetch messages exchanged between staff/admin and target user
        const { data: rawRes, error: err } = await supabase
          .from('chat_messages')
          .select('*, sender:users!sender_id(full_name, avatar_url, role)')
          .or(`room_user_id.eq.${roomId},sender_id.eq.${roomId}`)
          .order('created_at', { ascending: true })

        if (err) throw new Error(err.message)

        const messages = (rawRes || []).map((m: any) => ({
          ...m,
          sender_name: m.sender?.full_name || 'User',
          sender_avatar: m.sender?.avatar_url || null,
          sender_role: m.sender?.role || 'user',
          created_at: normalizeIso(m.created_at),
        }))

        const { data: roomUser } = await supabase
          .from('users')
          .select('id, full_name, email, avatar_url, role')
          .eq('id', roomId)
          .maybeSingle()

        return NextResponse.json({ messages, roomUser })
      } else {
        // Staff/Admin room list view
        const targetRoles = user.role === 'admin' ? ['staff'] : ['user', 'courier', 'admin']
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
          })
        }

        if (allMessages) {
          allMessages.forEach(m => {
            const targetRoom = m.room_user_id === user.id ? m.sender_id : m.room_user_id
            if (roomMap[targetRoom]) {
              if (!roomMap[targetRoom].last_message) {
                roomMap[targetRoom].last_message = m.message
                roomMap[targetRoom].last_created_at = normalizeIso(m.created_at)
              }
              if (m.sender_id === targetRoom && m.is_read === 0) {
                roomMap[targetRoom].unread_count++
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
    } else {
      // Pembeli / Kurir biasa: Hanya memuat pesan milik room_user_id sendiri
      if (searchParams.get('mark_read') === 'true') {
        await supabase
          .from('chat_messages')
          .update({ is_read: 1 })
          .eq('room_user_id', user.id)
          .neq('sender_id', user.id)
      }

      const { data: rawRes, error: err } = await supabase
        .from('chat_messages')
        .select('*, sender:users!sender_id(full_name, avatar_url, role)')
        .or(`room_user_id.eq.${user.id},sender_id.eq.${user.id}`)
        .order('created_at', { ascending: true })

      if (err) throw new Error(err.message)

      const messages = (rawRes || []).map((m: any) => ({
        ...m,
        sender_name: m.sender?.full_name || 'User',
        sender_avatar: m.sender?.avatar_url || null,
        sender_role: m.sender?.role || 'user',
        created_at: normalizeIso(m.created_at),
      }))

      return NextResponse.json({ messages })
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

    if (user.role === 'admin' || user.role === 'staff') {
      if (!room_user_id) {
        return NextResponse.json({ error: 'room_user_id wajib diisi' }, { status: 400 })
      }
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
      .select('*, sender:users!sender_id(full_name, avatar_url, role)')
      .single()

    if (insertErr) throw new Error(insertErr.message)

    const newMessage = inserted
      ? {
          ...inserted,
          sender_name: inserted.sender?.full_name || user.full_name || 'User',
          sender_avatar: inserted.sender?.avatar_url || user.avatar_url || null,
          sender_role: inserted.sender?.role || user.role || 'user',
          created_at: normalizeIso(inserted.created_at),
        }
      : null

    return NextResponse.json({ success: true, message: newMessage })
  } catch (error: any) {
    console.error('Chat POST Error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 })
  }
}
