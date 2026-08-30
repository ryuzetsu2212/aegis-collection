'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageSquare, X, Send, Bot, User, Sparkles, Smile, ImagePlus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { formatChatTime } from '@/lib/formatDate'
import { compressImageIfNeeded } from '@/lib/imageCompressor'

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

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null)
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
      }
    }
    checkAuth()

    const handleOpenChat = () => setIsOpen(true)
    window.addEventListener('open-cs-chat', handleOpenChat)
    return () => window.removeEventListener('open-cs-chat', handleOpenChat)
  }, [])

  const fetchMessages = async (shouldMarkRead = false) => {
    if (!user) return
    try {
      const url = shouldMarkRead || isOpen ? '/api/chat?mark_read=1' : '/api/chat'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        
        // Count unread from staff/admin
        const unread = (data.messages || []).filter(
          (m: Message) => m.sender_id !== user.id && m.is_read === 0
        ).length
        setUnreadCount(unread)
      }
    } catch (err) {
      console.error('Failed to fetch chat messages', err)
    }
  }

  useEffect(() => {
    if (!user) return
    fetchMessages(isOpen)
    const interval = setInterval(() => fetchMessages(isOpen), 2000)
    return () => clearInterval(interval)
  }, [user, isOpen])

  useEffect(() => {
    if (isOpen && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages, isOpen])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !user || loading) return

    const text = input.trim()
    setInput('')
    setShowEmojiPicker(false)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      if (res.ok) {
        fetchMessages(true)
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
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `[IMAGE]${url}` }),
        })

        if (res.ok) {
          fetchMessages(true)
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

  if (user?.role === 'admin' || user?.role === 'staff') {
    return null // Hide for staff/admin
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[99999] pointer-events-auto print:hidden">
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

      {/* Floating Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="relative flex items-center gap-2 bg-zinc-900 text-white px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-full shadow-2xl hover:bg-zinc-800 hover:scale-105 active:scale-95 transition-all cursor-pointer font-semibold text-xs sm:text-sm border border-zinc-700 touch-manipulation select-none"
        >
          <MessageSquare className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-amber-400 shrink-0" />
          <span>Chat Bantuan CS</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] sm:text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce border-2 border-white">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:right-6 left-4 sm:left-auto w-[calc(100vw-32px)] sm:w-[380px] h-[80vh] max-h-[520px] bg-white rounded-2xl shadow-2xl border border-zinc-200 flex flex-col overflow-hidden z-[99999] animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-zinc-900 text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-zinc-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm leading-tight flex items-center gap-1.5">
                  Aegis Customer Service
                  <Sparkles className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
                </h3>
                <p className="text-[10px] sm:text-[11px] text-zinc-400">Tim Toko Siap Membantu Anda</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer touch-manipulation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {!user ? (
            /* Guest Prompt */
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-3 bg-zinc-50/50">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-1">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-zinc-900 text-sm">Ingin Chat dengan CS Toko?</h4>
              <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                Silakan masuk ke akun Anda terlebih dahulu untuk mulai berkonsultasi seputar produk, stok, atau pesanan.
              </p>
              <div className="pt-2 flex gap-2 w-full max-w-xs">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2 px-3 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors text-center"
                >
                  Masuk Akun
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2 px-3 bg-white border border-zinc-300 text-zinc-800 rounded-xl text-xs font-bold hover:bg-zinc-100 transition-colors text-center"
                >
                  Daftar
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Messages Body */}
              <div ref={messagesContainerRef} className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3 bg-zinc-50/50">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-500">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                      <MessageSquare className="h-6 w-6 text-zinc-400" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-700">Ada yang bisa kami bantu?</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Kirim pesan di bawah ini untuk konsultasi produk, stok, atau pertanyaan seputar pesanan Anda.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === user.id
                    const isImageMsg = msg.message.startsWith('[IMAGE]')
                    const imgUrl = isImageMsg ? msg.message.replace('[IMAGE]', '') : ''

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] text-zinc-400 font-medium px-1">
                          <span>{isMe ? 'Anda' : (msg.sender_name || 'Tim CS Toko')}</span>
                          <span>•</span>
                          <span>
                            {formatChatTime(msg.created_at)}
                          </span>
                        </div>
                        <div
                          className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-2.5 text-xs font-normal leading-relaxed shadow-sm ${
                            isMe
                              ? 'bg-zinc-900 text-white rounded-br-none'
                              : 'bg-white text-zinc-800 border border-zinc-200 rounded-bl-none'
                          }`}
                        >
                          {isImageMsg ? (
                            <div className="overflow-hidden rounded-xl bg-zinc-100 cursor-pointer group">
                              <img
                                src={imgUrl}
                                alt="Gambar Chat"
                                className="max-h-[200px] w-full object-cover group-hover:scale-102 transition-transform duration-200 rounded-xl"
                                onClick={() => setSelectedImageModal(imgUrl)}
                              />
                            </div>
                          ) : (
                            <div className="px-1 py-0.5">{msg.message}</div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Input Footer */}
              <form onSubmit={handleSend} className="p-3 bg-white border-t border-zinc-200 flex flex-col gap-2 shrink-0 relative">
                {/* Quick Emoji Picker */}
                {showEmojiPicker && (
                  <div className="bg-white border border-zinc-200 rounded-2xl p-2.5 shadow-xl max-h-40 overflow-y-auto space-y-1.5 mb-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 pb-1 border-b border-zinc-100">
                      <span>Pilih Emoji</span>
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(false)}
                        className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-8 gap-1 text-base">
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

                <div className="flex items-center gap-1.5">
                  {/* Emoji Button */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 text-zinc-500 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors cursor-pointer shrink-0"
                    title="Sisipkan Emoji"
                  >
                    <Smile className="h-4.5 w-4.5" />
                  </button>

                  {/* Image Attachment Button */}
                  <label
                    className={`p-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors cursor-pointer shrink-0 flex items-center justify-center ${
                      isUploadingImage ? 'opacity-50 cursor-wait' : ''
                    }`}
                    title="Kirim Gambar"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin text-blue-600" />
                    ) : (
                      <ImagePlus className="h-4.5 w-4.5" />
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
                    className="flex-1 bg-zinc-100 border border-zinc-200 rounded-full px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white p-2.5 rounded-full transition-all cursor-pointer flex items-center justify-center shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  )
}
