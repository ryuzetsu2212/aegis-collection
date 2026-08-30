'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MessageSquare, Send, Bot, Sparkles, User, ArrowLeft, Loader2, Smile, ImagePlus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
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

export default function CustomerChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
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
          if (data.user?.role === 'courier' || data.user?.role === 'staff' || data.user?.role === 'admin') {
            window.location.href = '/staff/chat'
            return
          }
        }
      } catch (err) {
        // Silent
      } finally {
        setAuthChecked(true)
      }
    }
    checkAuth()
  }, [])

  const fetchMessages = async () => {
    if (!user) return
    try {
      const res = await fetch('/api/chat?mark_read=1')
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (err) {
      console.error('Failed to fetch chat messages', err)
    }
  }

  useEffect(() => {
    if (!user) return
    fetchMessages()
    const interval = setInterval(fetchMessages, 2000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages])

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
        fetchMessages()
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
          fetchMessages()
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

  if (!authChecked) {
    return (
      <div className="flex-1 bg-zinc-50 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    )
  }

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
        <div className="mb-4">
          <Link
            href={user?.role === 'courier' ? '/courier' : '/'}
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {user?.role === 'courier' ? 'Kembali ke Dashboard Kurir' : 'Kembali ke Beranda'}
          </Link>
        </div>

        {/* Main Chat Card */}
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden max-w-full min-h-[500px] sm:min-h-[600px]">
          {/* Card Title Header */}
          <div className="bg-zinc-900 text-white p-4 flex items-center justify-between border-b border-zinc-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                <Bot className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h1 className="font-bold text-sm sm:text-base leading-tight flex items-center gap-2">
                  {user?.role === 'courier' ? 'Chat dengan Staff Toko' : 'Aegis Customer Service'}
                  <Sparkles className="h-4 w-4 text-amber-400 fill-amber-400 shrink-0" />
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {user?.role === 'courier'
                    ? 'Koordinasi pengantaran & kendala pengiriman'
                    : 'Bantuan & Konsultasi Pelanggan Bengkalis'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Tim CS Online</span>
            </div>
          </div>

          {!user ? (
            /* Guest State Card */
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-4 bg-zinc-50/50">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-bold text-zinc-900">Konsultasi dengan CS Toko</h2>
              <p className="text-xs sm:text-sm text-zinc-500 max-w-md leading-relaxed">
                Silakan masuk ke akun Anda terlebih dahulu untuk mengobrol langsung dengan tim customer service kami mengenai ketersediaan stok, pertanyaan produk, atau konfirmasi pesanan Anda.
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
          ) : user.role === 'staff' || user.role === 'admin' ? (
            /* Staff Notice */
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-3 bg-zinc-50/50">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <User className="h-7 w-7" />
              </div>
              <h2 className="text-base font-bold text-zinc-900">Anda Masuk Sebagai Staff Toko</h2>
              <p className="text-xs text-zinc-500 max-w-md leading-relaxed">
                Halaman ini khusus untuk percakapan Pelanggan/Kurir. Untuk melayani dan membalas pesan dari pelanggan toko, silakan buka Halaman Pusat Chat Staff.
              </p>
              <Link href="/staff/chat" className="pt-2">
                <Button className="text-xs font-bold px-5 py-2.5">Buka Pusat Chat Staff</Button>
              </Link>
            </div>
          ) : (
            <>
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
                    <p className="text-base font-bold text-zinc-800">Halo, Ada yang Bisa Kami Bantu?</p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                      Kirimkan pesan Anda di bawah ini untuk berkonsultasi seputar stok produk, rekomendasi pakaian, atau bantuan transaksi.
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
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] text-zinc-400 font-medium px-1">
                          <span>{isMe ? 'Anda' : (msg.sender_name || 'Tim CS Toko')}</span>
                          <span>•</span>
                          <span>
                            {formatChatTime(msg.created_at)}
                          </span>
                        </div>
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-2.5 text-xs sm:text-sm font-normal leading-relaxed shadow-xs ${
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

                <div className="flex items-center gap-2">
                  {/* Emoji Button */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 text-zinc-500 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors cursor-pointer shrink-0"
                    title="Sisipkan Emoji"
                  >
                    <Smile className="h-5 w-5" />
                  </button>

                  {/* Image Attachment Button */}
                  <label
                    className={`p-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors cursor-pointer shrink-0 flex items-center justify-center ${
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
                    placeholder="Tulis pesan pertanyaan Anda di sini..."
                    className="flex-1 bg-zinc-100 border border-zinc-200 rounded-full px-4 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white px-4 py-2.5 rounded-full transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-bold shrink-0"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>Kirim</span>
                        <Send className="h-3.5 w-3.5" />
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
