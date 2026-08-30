import { NextResponse } from 'next/server'
import { clearAuthCookie, getSession } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function POST(request: Request) {
  const user = await getSession()
  if (user) {
    await logAudit({
      user,
      action: 'USER_LOGOUT',
      entityType: 'user',
      entityId: user.id,
      details: {
        email: user.email,
        peran: user.role,
      },
      req: request,
    })
  }
  await clearAuthCookie()
  return NextResponse.json({ success: true })
}