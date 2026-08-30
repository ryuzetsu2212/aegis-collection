import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { getDb, DbUser } from './db'
import { createToken, verifyToken } from './jwt'

const SALT_ROUNDS = 10

export interface AuthUser {
  id: number
  email: string
  full_name: string | null
  phone?: string | null
  address?: string | null
  kecamatan?: string | null
  village?: string | null
  maps_link?: string | null
  avatar_url?: string | null
  role: 'admin' | 'staff' | 'courier' | 'user'
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}



export async function getSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) return null

  const db = await getDb()
  const user = db.prepare(
    'SELECT id, email, full_name, phone, address, kecamatan, village, maps_link, avatar_url, role FROM users WHERE id = ?'
  ).get(payload.userId) as DbUser | undefined

  if (!user) return null

  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    phone: user.phone || null,
    address: user.address || null,
    kecamatan: user.kecamatan || null,
    village: user.village || null,
    maps_link: user.maps_link || null,
    avatar_url: user.avatar_url || null,
    role: user.role as 'admin' | 'staff' | 'courier' | 'user',
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  return getSession()
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getSession()
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}

export async function requireRole(roles: ('admin' | 'staff' | 'courier' | 'user')[]): Promise<AuthUser> {
  const user = await requireAuth()
  if (!roles.includes(user.role)) throw new Error('FORBIDDEN')
  return user
}

export function hasRole(user: AuthUser, roles: ('admin' | 'staff' | 'courier' | 'user')[]): boolean {
  return roles.includes(user.role)
}

export async function loginUser(email: string, password: string): Promise<{ user: AuthUser; token: string } | null> {
  const db = await getDb()
  const cleanEmail = email.trim().toLowerCase()
  const user = db.prepare(
    'SELECT id, email, password_hash, full_name, role FROM users WHERE LOWER(email) = ?'
  ).get(cleanEmail) as DbUser | undefined

  if (!user) return null

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) return null

  const token = await createToken(user)

  return {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role as 'admin' | 'staff' | 'courier' | 'user',
    },
    token,
  }
}

export async function registerUser(
  email: string,
  password: string,
  full_name: string
): Promise<{ user: AuthUser; token: string } | null> {
  const db = await getDb()
  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) return null

  const hashed = await hashPassword(password)
  const result = db.prepare(
    'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)'
  ).run(email, hashed, full_name, 'user')

  const userId = result.lastInsertRowid as number
  const user = db.prepare(
    'SELECT id, email, full_name, role FROM users WHERE id = ?'
  ).get(userId) as DbUser

  const token = await createToken(user)

  return {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role as 'admin' | 'staff' | 'courier' | 'user',
    },
    token,
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours (matches JWT expiry)
    path: '/',
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('auth_token')
}
