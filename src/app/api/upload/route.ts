import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { requireRole } from '@/lib/auth'

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
    const fullPath = join(UPLOAD_DIR, fileName)

    let url = `/uploads/${fileName}`

    try {
      await mkdir(join(UPLOAD_DIR, 'items'), { recursive: true })
      await writeFile(fullPath, buffer)
    } catch (fsErr) {
      console.warn('FileSystem write failed or read-only (Vercel serverless environment). Using Data URI fallback:', fsErr)
      url = `data:${file.type};base64,${buffer.toString('base64')}`
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