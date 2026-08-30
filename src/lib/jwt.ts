import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

const jwtSecret = process.env.JWT_SECRET || 'tokopakaian-jwt-secret-key-development-mode-2026-safe-default'
const JWT_SECRET = new TextEncoder().encode(jwtSecret)

export interface AuthPayload extends JWTPayload {
  userId: number
  email: string
  role: string
}

export async function createToken(user: { id: number; email: string; role: string }): Promise<string> {
  const payload: AuthPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  }
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as AuthPayload
  } catch {
    return null
  }
}