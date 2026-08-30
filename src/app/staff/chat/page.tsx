'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, RefreshCw, ShieldCheck, Smile, ImagePlus, Loader2, X, Users, Truck, Pencil, Trash2, Check } from 'lucide-react'
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

export default function StaffChatPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [roomUser, setRoomUser] = useState<any>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null)

  // Edit message state
  const [editingMsgId, setEditingMsgId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setCurrentUser(data.user)
        }
      } catch (err) {}
    }
    fetchMe()
  }, [])

  const fetchRooms = async () => {
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

  const fetchRoomMessages = async (roomId: number) => {
    try {
      const res = await fetch(`/api/chat?room_user_id=${roomId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        setRoomUser(data.roomUser)
      }
    } catch (err) {
      console.error('Failed to fetch messages', err)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchRooms()
    if (selectedRoomId) await fetchRoomMessages(selectedRoomId)
    setTimeout(() => setIsRefreshing(false), 400)
  }

  useEffect(() => {
    fetchRooms()
    const interval = setInterval(() => {
      fetchRooms()
      if (selectedRoomId) fetchRoomMessages(selectedRoomId)
    }, 2000)
    return () => clearInterval(interval)
  }, [selectedRoomId])

  useEffect(() => {
    if (selectedRoomId) {
      fetchRoomMessages(selectedRoomId)
    }
  }, [selectedRoomId])

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRoomId || !input.trim() || loading) return

    const text = input.trim()
    setInput('')
    setShowEmojiPicker(false)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_user_id: selectedRoomId,
          message: text,
        }),
      })

      if (res.ok) {
        fetchRoomMessages(selectedRoomId)
        fetchRooms()
      }
    } catch (err) {
      console.error('Failed to send message', err)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedRoomId) return

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
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            room_user_id: selectedRoomId,
            message: `[IMAGE]${url}`,
          }),
        })

        if (res.ok) {
          fetchRoomMessages(selectedRoomId)
          fetchRooms()
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

  const isAdmin = currentUser?.role === 'admin'
  const isCourier = currentUser?.role === 'courier'

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

      <div className="bg-zinc-900 text-white p-5 rounded-2xl mb-4 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            {isAdmin ? (
              <ShieldCheck className="h-5 w-5 text-purple-400" />
            ) : isCourier ? (
              <Truck className="h-5 w-5 text-amber-400" />
            ) : (
              <MessageSquare className="h-5 w-5 text-blue-400" />
            )}
            <span>
              {isAdmin
                ? 'Pusat Chat Admin Toko (Internal Staf)'
                : isCourier
                ? 'Pusat Chat Kurir (ke Staf & Admin)'
                : 'Pusat Chat CS & Internal Staf'}
            </span>
          </h1>
          <p className="text-xs text-zinc-300 mt-1">
            {isAdmin
              ? 'Komunikasi dan koordinasi internal antara Admin, Staf, dan Kurir.'
              : isCourier
              ? 'Pilih Staf atau Admin toko dari dropdown di bawah untuk berkonsultasi seputar pengiriman.'
              : 'Kelola dan jawab pesan kurir, staf toko, serta admin.'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2 rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          {isRefreshing ? 'Memuat...' : 'Refresh'}
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[550px]">
        {/* DROPDOWN SELECTOR FOR ROOMS */}
        <div className="p-3 bg-zinc-100 border-b border-zinc-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <label className="text-xs font-bold text-zinc-800 whitespace-nowrap flex items-center gap-1.5">
            {isCourier ? (
              <>
                <Truck className="h-4 w-4 text-amber-600" />
                <span>Pilih Staf / Admin yang mau di-chat:</span>
              </>
            ) : (
              <>
                <Users className="h-4 w-4 text-blue-600" />
                <span>Pilih Percakapan / Pengguna:</span>
              </>
            )}
          </label>

          <select
            value={selectedRoomId || ''}
            onChange={(e) => setSelectedRoomId(Number(e.target.value))}
            className="flex-1 bg-white border border-zinc-300 text-zinc-900 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-xs cursor-pointer"
          >
            {rooms.length === 0 && (
              <option value="">-- Belum ada akun pengguna tersedia --</option>
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

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedRoomId ? (
            <>
              {/* Active Room Header */}
              <div className="p-3.5 border-b border-zinc-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
                    {roomUser?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                      <span>{roomUser?.full_name || roomUser?.email}</span>
                      {roomUser?.role === 'staff' && (
                        <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          Staf Toko
                        </span>
                      )}
                      {roomUser?.role === 'admin' && (
                        <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          Admin Toko
                        </span>
                      )}
                      {roomUser?.role === 'courier' && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          Kurir
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-zinc-500">{roomUser?.email}</p>
                  </div>
                </div>
              </div>

              {/* Messages Content */}
              <div ref={messagesContainerRef} className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-zinc-50/30 min-h-[350px]">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 my-auto">
                    <MessageSquare className="h-8 w-8 text-zinc-400 mb-2" />
                    <p className="text-xs font-bold text-zinc-800">Belum ada pesan</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Tulis pesan pertama Anda di bawah ini.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser?.id
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
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] text-zinc-400 font-medium px-1">
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
              <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-white border-t border-zinc-200 flex flex-col gap-2 shrink-0 relative">
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
                    placeholder={isCourier ? 'Tulis pesan koordinasi...' : 'Tulis pesan...'}
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
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400">
              <MessageSquare className="h-10 w-10 text-zinc-300 mb-2" />
              <p className="text-xs font-bold text-zinc-700">Pilih akun dari dropdown di atas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
