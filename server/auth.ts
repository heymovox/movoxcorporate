import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  company: string | null;
  is_active: boolean;
}

export function generateToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): { id: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}

/**
 * Authenticate admin: verify JWT then re-read role from DB so role changes
 * take effect immediately.
 */
export async function authenticateAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return;
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return;
  }
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT id, email, name, role, company, is_active FROM admin_users WHERE id = $1',
      [payload.id],
    );
    if (result.rows.length === 0) {
      res.status(401).json({ ok: false, error: 'Unauthorized' });
      return;
    }
    const user = result.rows[0];
    if (!user.is_active) {
      res.status(403).json({ ok: false, error: 'This account has been deactivated.' });
      return;
    }
    (req as any).admin = user as AdminUser;
    next();
  } finally {
    client.release();
  }
}
