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

    // Ensure audit_logs table exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        user_email TEXT,
        user_role TEXT,
        action TEXT NOT NULL,
        entity_type TEXT,
        entity_id INTEGER,
        details TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
    `)

    const detailsStr =
      typeof details === 'object' && details !== null
        ? JSON.stringify(details)
        : details || null

    db.prepare(`
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

