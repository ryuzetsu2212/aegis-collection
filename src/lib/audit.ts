import { getDb } from './db'
import { AuthUser } from './auth'

export interface LogAuditOptions {
  user?: AuthUser | null
  action: string
  entityType?: string | null
  entityId?: number | null
  details?: Record<string, any> | string | null
  ipAddress?: string | null
  req?: Request | null
}

export function extractClientIp(req?: Request | null, overrideIp?: string | null): string {
  if (overrideIp && overrideIp !== '127.0.0.1') return overrideIp

  if (req) {
    const xForwardedFor = req.headers.get('x-forwarded-for')
    if (xForwardedFor) {
      const firstIp = xForwardedFor.split(',')[0].trim()
      if (firstIp) return firstIp
    }
    const cfIp = req.headers.get('cf-connecting-ip')
    if (cfIp) return cfIp.trim()

    const xRealIp = req.headers.get('x-real-ip')
    if (xRealIp) return xRealIp.trim()
  }

  return overrideIp || '127.0.0.1'
}

export async function logAudit({
  user,
  action,
  entityType,
  entityId,
  details,
  ipAddress,
  req,
}: LogAuditOptions) {
  try {
    const db = await getDb()
    const finalIp = extractClientIp(req, ipAddress)

    const detailsStr =
      typeof details === 'object' && details !== null
        ? JSON.stringify(details)
        : details || null

    await db.prepare(`
      INSERT INTO audit_logs (user_id, user_email, user_role, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      user?.id || null,
      user?.email || null,
      user?.role || null,
      action,
      entityType || null,
      entityId || null,
      detailsStr,
      finalIp
    )
  } catch (err) {
    console.error('[logAudit Error]', err)
  }
}
