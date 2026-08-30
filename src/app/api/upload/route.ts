import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { requireRole } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// Magic bytes for common image formats
const MAGIC_BYTES: Record<string, Buffer> = {
  'jpg': Buffer.from([0xFF, 0xD8, 0xFF]),
  'jpeg': Buffer.from([0xFF, 0xD8, 0xFF]),
  'png': Buffer.from([0x89, 0x50, 0x4E, 0x47]),
  'gif': Buffer.from([0x47, 0x49, 0x46, 0x38]),
  'webp': Buffer.from([0x52, 0x49, 0x46, 0x46]),
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(request: NextRequest) {
  try {
    // Allow all authenticated users (customers, staff, admin, courier) to upload images
    await requireRole(['admin', 'staff', 'courier', 'user'])

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'Tidak ada file yang diupload.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran file maksimal 5MB.' },
        { status: 400 }
      )
    }

    // Validate MIME type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File harus berupa gambar.' },
        { status: 400 }
      )
    }

    // Validate extension (whitelist only)
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `Ekstensi file tidak diizinkan. Gunakan: ${ALLOWED_EXTENSIONS.join(', ')}.` },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Validate magic bytes (file signature)
    const expectedMagic = MAGIC_BYTES[ext]
    if (expectedMagic && !buffer.slice(0, expectedMagic.length).equals(expectedMagic)) {
      return NextResponse.json(
        { error: 'File bukan gambar yang valid (magic bytes mismatch).' },
        { status: 400 }
      )
    }

    // Use safe filename with whitelisted extension
    const fileName = `items/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`
    let url: string | null = null

    // 1. Attempt upload to Supabase Storage Bucket ('uploads')
    const supabase = getSupabaseClient()
    if (supabase) {
      try {
        await supabase.storage.createBucket('uploads', { public: true }).catch(() => {})

        const { data, error } = await supabase.storage
          .from('uploads')
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: true,
          })

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(fileName)
          if (publicUrlData?.publicUrl) {
            url = publicUrlData.publicUrl
          }
        } else if (error) {
          console.warn('Supabase storage upload warning:', error.message)
        }
      } catch (sbErr) {
        console.warn('Supabase storage exception:', sbErr)
      }
    }

    // 2. If Supabase Storage wasn't used or failed, attempt local filesystem write or Data URI fallback
    if (!url) {
      try {
        const fullPath = join(UPLOAD_DIR, fileName)
        await mkdir(join(UPLOAD_DIR, 'items'), { recursive: true })
        await writeFile(fullPath, buffer)
        url = `/uploads/${fileName}`
      } catch (fsErr) {
        console.warn('FileSystem write failed or read-only (Vercel serverless). Using Data URI fallback:', fsErr)
        url = `data:${file.type};base64,${buffer.toString('base64')}`
      }
    }

    return NextResponse.json({ url })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json(
      { error: 'Gagal upload gambar.' },
      { status: 500 }
    )
  }
}