'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { MessageSquare, Send, Bot, Sparkles, User, ArrowLeft, Loader2, Smile, ImagePlus, X, RefreshCw, Users, ShieldCheck, Truck, Pencil, Trash2, Check, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatChatTime } from '@/lib/formatDate'
import { compressImageIfNeeded } from '@/lib/imageCompressor'

interface Room {
  room_user_id: number
  full_name: string | null
  email: string
  avatar_url: string | null
  role?: string
  last_message: string | null
  last_created_at: string | null
  unread_count: number
}

interface Message {
  id: number
  sender_id: number
  room_user_id: number
  message: string
  is_read: number
  created_at: string
  sender_name: string | null
  sender_role: string
}

const EMOJI_LIST = [
  '😊', '👍', '❤️', '🙏', '😂', '🔥', '📦', '🚚',
  '💯', '✨', '🛒', '🛍️', '👕', '👗', '📞', '📍',
  '💬', '✅', '❌', '😍', '🥰', '🤩', '😜', '😎',
  '🤔', '🥳', '🙌', '👏', '🤝', '💪', '👌', '✌️'
]

const MAX_EDIT_AGE_MS = 12 * 60 * 60 * 1000 // 12 Hours

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null)

  // Multi-room (Dropdown selection) state for ALL roles (User, Courier, Staff, Admin)
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
  const [roomUser, setRoomUser] = useState<any>(null)
  const [isRefreshingRooms, setIsRefreshingRooms] = useState(false)

  // Edit message state
  const [editingMsgId, setEditingMsgId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        }
      } catch (err) {
        // Silent
      } finally {
        setAuthChecked(true)
      }
    }
    checkAuth()
  }, [])

  // Fetch Rooms for all logged in users
  const fetchRooms = async () => {
    if (!user) return
    try {
      const res = await fetch('/api/chat')
      if (res.ok) {
        const data = await res.json()
        const fetchedRooms: Room[] = data.rooms || []
        setRooms(fetchedRooms)

        // Auto select first room if none selected
        if (!selectedRoomId && fetchedRooms.length > 0) {
          setSelectedRoomId(fetchedRooms[0].room_user_id)
        }
      }
    } catch (err) {
      console.error('Failed to fetch rooms', err)
    }
  }

  // Fetch Room Messages when a specific room is selected
  const fetchRoomMessages = async (roomId: number) => {
    try {
      const res = await fetch(`/api/chat?room_user_id=${roomId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        setRoomUser(data.roomUser)
      }
    } catch (err) {
      console.error('Failed to fetch room messages', err)
    }
  }

  useEffect(() => {
    if (!user) return
    fetchRooms()
    const interval = setInterval(() => {
      fetchRooms()
      if (selectedRoomId) fetchRoomMessages(selectedRoomId)
    }, 2000)
    return () => clearInterval(interval)
  }, [user, selectedRoomId])

  useEffect(() => {
    if (user && selectedRoomId) {
      fetchRoomMessages(selectedRoomId)
    }
  }, [selectedRoomId])

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleRefreshRooms = async () => {
    setIsRefreshingRooms(true)
    await fetchRooms()
    if (selectedRoomId) await fetchRoomMessages(selectedRoomId)
    setTimeout(() => setIsRefreshingRooms(false), 400)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !user || loading) return

    const text = input.trim()
    setInput('')
    setShowEmojiPicker(false)
    setLoading(true)

    try {
      const bodyPayload: any = { message: text }
      if (selectedRoomId) {
        bodyPayload.room_user_id = selectedRoomId
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      })

      if (res.ok) {
        if (selectedRoomId) {
          fetchRoomMessages(selectedRoomId)
          fetchRooms()
        }
      }
    } catch (err) {
      console.error('Failed to send message', err)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setIsUploadingImage(true)
    try {
      const compressedFile = await compressImageIfNeeded(file)
      const formData = new FormData()
      formData.append('file', compressedFile)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (uploadRes.ok) {
        const { url } = await uploadRes.json()
        const bodyPayload: any = { message: `[IMAGE]${url}` }
        if (selectedRoomId) {
          bodyPayload.room_user_id = selectedRoomId
        }

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
        })

        if (res.ok) {
          if (selectedRoomId) {
            fetchRoomMessages(selectedRoomId)
            fetchRooms()
          }
        }
      } else {
        alert('Gagal mengunggah gambar.')
      }
    } catch (err) {
      console.error('Image upload failed', err)
    } finally {
      setIsUploadingImage(false)
      if (e.target) e.target.value = ''
    }
  }

  // Handle Edit Message
  const handleStartEdit = (msg: Message) => {
    setEditingMsgId(msg.id)
    setEditingText(msg.message)
  }

  const handleSaveEdit = async (msgId: number) => {
    if (!editingText.trim() || isSavingEdit) return
    setIsSavingEdit(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: msgId, message: editingText.trim() }),
      })
      if (res.ok) {
        setEditingMsgId(null)
        if (selectedRoomId) fetchRoomMessages(selectedRoomId)
      } else {
        const data = await res.json()
        alert(data.error || 'Gagal mengedit pesan.')
      }
    } catch (err) {
      alert('Terjadi kesalahan saat mengedit pesan.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Handle Delete Message
  const handleDeleteMessage = async (msgId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pesan ini?')) return
    try {
      const res = await fetch(`/api/chat?id=${msgId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        if (selectedRoomId) fetchRoomMessages(selectedRoomId)
      } else {
        const data = await res.json()
        alert(data.error || 'Gagal menghapus pesan.')
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menghapus pesan.')
    }
  }

  if (!authChecked) {
    return (
      <div className="flex-1 bg-zinc-50 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    )
  }

  const isCourier = user?.role === 'courier'
  const isStaffOrAdmin = user?.role === 'staff' || user?.role === 'admin'

  return (
    <div className="flex-1 bg-zinc-50 flex flex-col">
      {/* Full Preview Image Modal */}
      {selectedImageModal && (
        <div
          className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedImageModal(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center p-2">
            <button
              type="button"
              onClick={() => setSelectedImageModal(null)}
              className="absolute -top-3 -right-3 bg-white text-zinc-900 p-2 rounded-full hover:bg-zinc-200 transition-colors shadow-lg cursor-pointer z-10"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={selectedImageModal}
              alt="Foto Penuh"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 w-full flex-1 flex flex-col min-h-0">
        {/* Header Back Button */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            href={isCourier ? '/courier' : '/'}
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-zinc-600 hover:text-zinc-900 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {isCourier ? 'Kembali ke Dashboard Kurir' : 'Kembali ke Beranda'}
          </Link>

          {user && (
            <button
              type="button"
              onClick={handleRefreshRooms}
              disabled={isRefreshingRooms}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 px-3 py-1.5 rounded-xl hover:bg-zinc-100 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingRooms ? 'animate-spin text-blue-600' : ''}`} />
              <span>Refresh Chat</span>
            </button>
          )}
        </div>

        {/* Main Chat Card */}
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden max-w-full min-h-[500px] sm:min-h-[600px]">
          {/* Card Title Header */}
          <div className="bg-zinc-900 text-white p-4 flex items-center justify-between border-b border-zinc-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                {isCourier ? (
                  <Truck className="h-5 w-5 text-amber-400" />
                ) : isStaffOrAdmin ? (
                  <Users className="h-5 w-5 text-blue-400" />
                ) : (
                  <Bot className="h-5 w-5 text-amber-400" />
                )}
              </div>
              <div>
                <h1 className="font-bold text-sm sm:text-base text-white leading-tight flex items-center gap-2">
                  {isCourier
                    ? 'Pusat Chat Kurir (ke Staf & Admin)'
                    : isStaffOrAdmin
                    ? 'Pusat Chat Admin Toko (Internal Staf)'
                    : 'Aegis Customer Service'}
                  <Sparkles className="h-4 w-4 text-amber-400 fill-amber-400 shrink-0" />
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {isCourier
                    ? 'Pilih Staf atau Admin toko dari dropdown di bawah untuk mengobrol'
                    : isStaffOrAdmin
                    ? 'Kelola dan jawab pesan kurir atau staf internal'
                    : 'Pilih Staf atau Admin toko dari dropdown untuk mulai berkonsultasi'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Online</span>
            </div>
          </div>

          {!user ? (
            /* Guest State Card */
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-4 bg-zinc-50/50">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-bold text-zinc-900">Konsultasi dengan Toko</h2>
              <p className="text-xs sm:text-sm text-zinc-500 max-w-md leading-relaxed">
                Silakan masuk ke akun Anda terlebih dahulu untuk mengobrol langsung dengan tim toko.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                <Link href="/login" className="flex-1">
                  <Button className="w-full text-xs font-bold py-2.5">Masuk Akun</Button>
                </Link>
                <Link href="/register" className="flex-1">
                  <Button variant="secondary" className="w-full text-xs font-bold py-2.5">
                    Daftar Akun Baru
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* DROPDOWN SELECTOR UNTUK SEMUA PERAN (Pembeli, Kurir, Staf, & Admin) */}
              <div className="p-3 bg-zinc-100 border-b border-zinc-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                <label className="text-xs font-bold text-zinc-800 whitespace-nowrap flex items-center gap-1.5">
                  {isCourier ? (
                    <>
                      <Truck className="h-4 w-4 text-amber-600" />
                      <span>Pilih Staf / Admin yang mau di-chat:</span>
                    </>
                  ) : isStaffOrAdmin ? (
                    <>
                      <Users className="h-4 w-4 text-blue-600" />
                      <span>Pilih Percakapan / Pengguna:</span>
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4 text-amber-600" />
                      <span>Pilih Staf / Admin yang mau di-chat:</span>
                    </>
                  )}
                </label>

                <select
                  value={selectedRoomId || ''}
                  onChange={(e) => setSelectedRoomId(Number(e.target.value))}
                  className="flex-1 bg-white border border-zinc-300 text-zinc-900 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-xs cursor-pointer"
                >
                  {rooms.length === 0 && (
                    <option value="">-- Belum ada akun staf/admin tersedia --</option>
                  )}
                  {rooms.map((r) => {
                    const roleLabel =
                      r.role === 'admin'
                        ? '👑 Administrator'
                        : r.role === 'staff'
                        ? '📦 Staf Toko'
                        : r.role === 'courier'
                        ? '🚚 Kurir'
                        : '👤 Pembeli'

                    const unreadBadge = r.unread_count > 0 ? ` 🔴 (${r.unread_count} pesan baru)` : ''
                    return (
                      <option key={r.room_user_id} value={r.room_user_id}>
                        {r.full_name || r.email} — [{roleLabel}]{unreadBadge}
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Messages Body */}
              <div
                ref={messagesContainerRef}
                className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-zinc-50/50 min-h-[350px]"
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 my-auto">
                    <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                      <MessageSquare className="h-7 w-7 text-zinc-400" />
                    </div>
                    <p className="text-base font-bold text-zinc-800">
                      Belum ada pesan dalam percakapan ini
                    </p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                      Silakan ketikkan pesan Anda di bawah ini untuk memulai percakapan.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === user.id
                    const isImageMsg = msg.message.startsWith('[IMAGE]')
                    const imgUrl = isImageMsg ? msg.message.replace('[IMAGE]', '') : ''

                    // Check 12 hours limit for edit/delete
                    const ageMs = Date.now() - new Date(msg.created_at).getTime()
                    const canModify = isMe && ageMs <= MAX_EDIT_AGE_MS
                    const isEditing = editingMsgId === msg.id

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] text-zinc-400 font-medium px-1">
                          <span>{isMe ? 'Anda' : (msg.sender_name || 'Pengguna')}</span>
                          <span>•</span>
                          <span>{formatChatTime(msg.created_at)}</span>
                        </div>

                        <div className="flex items-center gap-1 max-w-[85%] sm:max-w-[75%]">
                          {/* Left-side action buttons for sent messages */}
                          {canModify && !isEditing && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                              {!isImageMsg && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(msg)}
                                  className="p-1 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Pesan (Batas 12 Jam)"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Pesan (Batas 12 Jam)"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Message Bubble / Inline Edit Form */}
                          {isEditing ? (
                            <div className="bg-white border border-amber-300 rounded-2xl p-2.5 shadow-md flex-1 flex flex-col gap-2">
                              <input
                                type="text"
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="w-full text-xs text-zinc-900 border border-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                              />
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingMsgId(null)}
                                  className="px-2 py-1 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-100 rounded-md cursor-pointer"
                                >
                                  Batal
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(msg.id)}
                                  disabled={isSavingEdit || !editingText.trim()}
                                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-md cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                >
                                  {isSavingEdit ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                  Simpan
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`rounded-2xl p-2.5 text-xs sm:text-sm font-normal leading-relaxed shadow-xs ${
                                isMe
                                  ? 'bg-zinc-900 text-white rounded-br-none'
                                  : 'bg-white text-zinc-800 border border-zinc-200 rounded-bl-none'
                              }`}
                            >
                              {isImageMsg ? (
                                <div className="overflow-hidden rounded-xl bg-zinc-100 cursor-pointer group/img">
                                  <img
                                    src={imgUrl}
                                    alt="Gambar Chat"
                                    className="max-h-[240px] w-full object-cover group-hover/img:scale-102 transition-transform duration-200 rounded-xl"
                                    onClick={() => setSelectedImageModal(imgUrl)}
                                  />
                                </div>
                              ) : (
                                <div className="px-1.5 py-0.5">{msg.message}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white border-t border-zinc-200 flex flex-col gap-2 shrink-0 relative">
                {/* Quick Emoji Picker */}
                {showEmojiPicker && (
                  <div className="bg-white border border-zinc-200 rounded-2xl p-3 shadow-xl max-h-48 overflow-y-auto space-y-2 mb-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 pb-1 border-b border-zinc-100">
                      <span>Pilih Emoji</span>
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(false)}
                        className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-8 sm:grid-cols-12 gap-1 text-lg">
                      {EMOJI_LIST.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setInput((prev) => prev + emoji)}
                          className="p-1 hover:bg-zinc-100 rounded-lg text-center transition-colors cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Emoji Button */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1.5 sm:p-2 text-zinc-500 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors cursor-pointer shrink-0"
                    title="Sisipkan Emoji"
                  >
                    <Smile className="h-5 w-5" />
                  </button>

                  {/* Image Attachment Button */}
                  <label
                    className={`p-1.5 sm:p-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors cursor-pointer shrink-0 flex items-center justify-center ${
                      isUploadingImage ? 'opacity-50 cursor-wait' : ''
                    }`}
                    title="Kirim Gambar"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    ) : (
                      <ImagePlus className="h-5 w-5" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Tulis pesan Anda..."
                    className="flex-1 min-w-0 bg-zinc-100 border border-zinc-200 rounded-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 truncate"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white p-2.5 sm:px-4 sm:py-2.5 rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                    title="Kirim Pesan"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span className="hidden sm:inline text-xs font-bold">Kirim</span>
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
