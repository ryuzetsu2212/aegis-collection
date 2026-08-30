'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageSquare, User, Send, Search, CheckCheck, RefreshCw, ShieldCheck, Smile, ImagePlus, Loader2, X } from 'lucide-react'
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

export default function StaffChatPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [roomUser, setRoomUser] = useState<any>(null)
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null)
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
        setRooms(data.rooms || [])
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

  const filteredRooms = rooms.filter(
    (r) =>
      r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase())
  )

  const isAdmin = currentUser?.role === 'admin'
  const isCourier = currentUser?.role === 'courier'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            {isAdmin ? (
              <ShieldCheck className="h-6 w-6 text-purple-600" />
            ) : isCourier ? (
              <MessageSquare className="h-6 w-6 text-amber-600" />
            ) : (
              <MessageSquare className="h-6 w-6 text-blue-600" />
            )}
            <span>
              {isAdmin
                ? 'Pusat Chat Admin Toko (Internal Staf)'
                : isCourier
                ? 'Pusat Chat Kurir (ke Staf & Admin)'
                : 'Pusat Chat CS & Internal Staf'}
            </span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {isAdmin
              ? 'Komunikasi dan koordinasi internal khusus antara Admin Toko dan Staf.'
              : isCourier
              ? 'Pilih salah satu nama Staf atau Admin toko di sebelah kiri untuk berkonsultasi seputar pengiriman.'
              : 'Kelola dan jawab pertanyaan pembeli, kurir, serta koordinasi internal toko.'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 hover:text-zinc-900 bg-white border border-zinc-200 px-3.5 py-2 rounded-xl shadow-sm hover:bg-zinc-100 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          {isRefreshing ? 'Memuat...' : 'Refresh'}
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[600px]">
        {/* Left Sidebar: Room List */}
        <div className="md:col-span-4 border-r border-zinc-200 flex flex-col bg-zinc-50/50">
          <div className="p-4 border-b border-zinc-200 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder={isAdmin ? 'Cari nama staf / email...' : isCourier ? 'Cari nama staf / admin...' : 'Cari pembeli / kurir / admin...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-100 border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
            {filteredRooms.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                {isAdmin ? 'Belum ada staf toko ditemukan.' : 'Belum ada percakapan aktif.'}
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isSelected = room.room_user_id === selectedRoomId
                const isImgLast = room.last_message?.startsWith('[IMAGE]')
                return (
                  <button
                    key={room.room_user_id}
                    onClick={() => setSelectedRoomId(room.room_user_id)}
                    className={`w-full text-left p-4 flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50/80 border-l-4 border-blue-600' : 'hover:bg-zinc-100/70'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center font-bold shrink-0">
                      {room.full_name?.charAt(0).toUpperCase() || room.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-zinc-900 truncate flex items-center gap-1.5">
                          <span>{room.full_name || room.email}</span>
                          {room.role === 'staff' && (
                            <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded-md font-extrabold border border-blue-200 shrink-0">
                              Staf Toko
                            </span>
                          )}
                          {room.role === 'courier' && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-md font-extrabold border border-amber-300 shrink-0">
                              Kurir
                            </span>
                          )}
                          {room.role === 'admin' && (
                            <span className="bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0.5 rounded-md font-extrabold border border-purple-300 shrink-0">
                              Admin
                            </span>
                          )}
                        </h4>
                        {room.last_created_at && (
                          <span className="text-[10px] text-zinc-400">
                            {formatChatTime(room.last_created_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">
                        {isImgLast ? '📷 [Gambar]' : (room.last_message || '-')}
                      </p>
                    </div>
                    {room.unread_count > 0 && (
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                        {room.unread_count}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right Main Chat Area */}
        <div className="md:col-span-8 flex flex-col bg-white">
          {selectedRoomId ? (
            <>
              {/* Active Room Header */}
              <div className="p-4 border-b border-zinc-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
                    {roomUser?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
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
                    <p className="text-[11px] text-zinc-500">{roomUser?.email}</p>
                  </div>
                </div>
              </div>

              {/* Messages Content */}
              <div ref={messagesContainerRef} className="flex-1 p-6 overflow-y-auto space-y-4 bg-zinc-50/30">
                {messages.map((msg) => {
                  const isMe = msg.sender_id === currentUser?.id
                  const isImageMsg = msg.message.startsWith('[IMAGE]')
                  const imgUrl = isImageMsg ? msg.message.replace('[IMAGE]', '') : ''

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-zinc-400 font-medium px-1">
                        <span>{isMe ? 'Anda' : (msg.sender_name || 'Pengguna')}</span>
                        <span>•</span>
                        <span>
                          {formatChatTime(msg.created_at)}
                        </span>
                      </div>
                      <div
                        className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-2.5 text-xs leading-relaxed shadow-sm ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white text-zinc-800 border border-zinc-200 rounded-bl-none'
                        }`}
                      >
                        {isImageMsg ? (
                          <div className="overflow-hidden rounded-xl bg-zinc-100 cursor-pointer group">
                            <img
                              src={imgUrl}
                              alt="Gambar Chat"
                              className="max-h-[240px] w-full object-cover group-hover:scale-102 transition-transform duration-200 rounded-xl"
                              onClick={() => setSelectedImageModal(imgUrl)}
                            />
                          </div>
                        ) : (
                          <div className="px-1.5 py-0.5">{msg.message}</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-200 bg-white flex flex-col gap-2 relative">
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

                <div className="flex items-center gap-2">
                  {/* Emoji Button */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 text-zinc-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Sisipkan Emoji"
                  >
                    <Smile className="h-5 w-5" />
                  </button>

                  {/* Image Attachment Button */}
                  <label
                    className={`p-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer shrink-0 flex items-center justify-center ${
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
                    placeholder={isAdmin ? 'Tulis pesan internal untuk staf...' : 'Balas pesan...'}
                    className="flex-1 bg-zinc-100 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Kirim
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400">
              <MessageSquare className="h-12 w-12 text-zinc-300 mb-3" />
              <p className="text-sm font-semibold text-zinc-700">Pilih percakapan dari daftar di sebelah kiri</p>
              <p className="text-xs text-zinc-500 mt-1">
                {isAdmin
                  ? 'Pilih salah satu staf toko untuk mengobrol dan berkoordinasi internal.'
                  : 'Untuk mulai membalas pertanyaan pembeli atau berkoordinasi.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
