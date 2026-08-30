import { getDb } from './db'
import { AuthUser } from './auth'

export interface LogAuditOptions {
  user?: AuthUser | null
  action: string
  entityType?: string | null
  entityId?: number | null
  details?: Record<string, any> | string | null
  ipAddress?: string | null
}

export async function logAudit({
  user,
  action,
  entityType,
  entityId,
  details,
  ipAddress = '127.0.0.1',
}: LogAuditOptions) {
  try {
    const db = await getDb()

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
      ipAddress
    )
  } catch (err) {
    console.error('[logAudit Error]', err)
  }
}

