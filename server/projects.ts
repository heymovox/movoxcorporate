/**
 * Projects API — staff and client access.
 *
 * Row-level scoping is enforced here, not in the UI:
 *   projects.viewAll     — every project
 *   projects.viewAssigned— only projects the caller is assigned to
 *   projects.viewOwn     — only projects where the caller is the client
 */
import express, { type Request, type Response, type Router } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';
import crypto from 'node:crypto';
import {
  requireStaff,
  requireCap,
  requireAnyCap,
  can,
  normaliseRole,
  type Capability,
} from './rbac.js';

const PROJECT_STATUS = ['planning', 'in_progress', 'review', 'on_hold', 'completed'] as const;
const PROJECT_PRIORITY = ['low', 'normal', 'high', 'urgent'] as const;
const UPDATE_KIND = ['status', 'message', 'request', 'note'] as const;
const URGENCY = ['normal', 'high', 'urgent'] as const;

const projectSchema = z.object({
  name: z.string().trim().min(2).max(200),
  description: z.string().max(4000).optional().default(''),
  client_id: z.union([z.string().uuid(), z.literal('')]).optional(),
  status: z.enum(PROJECT_STATUS).default('planning'),
  priority: z.enum(PROJECT_PRIORITY).default('normal'),
  start_date: z.union([z.string(), z.null()]).optional(),
  end_date: z.union([z.string(), z.null()]).optional(),
  budget: z.coerce.number().min(0).default(0),
  progress: z.coerce.number().int().min(0).max(100).default(0),
});

const projectPatch = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  description: z.string().optional(),
  client_id: z.union([z.string().uuid(), z.null()]).optional(),
  status: z.enum(PROJECT_STATUS).optional(),
  priority: z.enum(PROJECT_PRIORITY).optional(),
  start_date: z.union([z.string(), z.null()]).optional(),
  end_date: z.union([z.string(), z.null()]).optional(),
  budget: z.coerce.number().min(0).optional(),
  progress: z.coerce.number().int().min(0).max(100).optional(),
});

/**
 * Builds an AND fragment limiting a query to the projects the caller may see,
 * given the capability they hold. Params start at `startAt` so a fragment can
 * be appended to a query that already binds $1.
 */
function scopeForUser(
  user: { id: string; role: string },
  startAt = 1,
): { sql: string; params: any[] } {
  const role = normaliseRole(user.role);

  if (can(role, 'projects.viewAll')) {
    return { sql: '', params: [] };
  }
  if (can(role, 'projects.viewAssigned')) {
    return {
      sql: `AND p.id IN (SELECT project_id FROM project_members WHERE user_id = $${startAt})`,
      params: [user.id],
    };
  }
  if (can(role, 'projects.viewOwn')) {
    return { sql: `AND p.client_id = $${startAt}`, params: [user.id] };
  }
  // No project access at all — match nothing.
  return { sql: 'AND FALSE', params: [] };
}

export function createProjectsRouter(pool: Pool, authenticate: (req: Request, res: Response, next: any) => any): Router {
  const router = express.Router();
  router.use(authenticate);

  const me = (req: Request) => (req as any).admin as { id: string; role: string };

  // ---------------------------------------------------------------- list
  router.get(
    '/api/projects',
    requireAnyCap([
      'projects.viewAll',
      'projects.viewAssigned',
      'projects.viewOwn',
    ] as Capability[]),
    async (req: Request, res: Response) => {
      try {
        const user = me(req);
        const scope = scopeForUser(user);
        const params = [...scope.params];
        const where: string[] = [];

        if (typeof req.query.status === 'string' && req.query.status) {
          params.push(req.query.status);
          where.push(`p.status = $${params.length}`);
        }
        if (typeof req.query.search === 'string' && req.query.search) {
          params.push(`%${req.query.search}%`);
          where.push(
            `(p.name ILIKE $${params.length} OR p.code ILIKE $${params.length} OR p.description ILIKE $${params.length})`,
          );
        }
        if (typeof req.query.mine === 'string' && req.query.mine === 'true') {
          params.push(user.id);
          where.push(
            `p.id IN (SELECT project_id FROM project_members WHERE user_id = $${params.length})`,
          );
        }

        // Always anchor with WHERE 1=1: the scope fragment starts with AND, so
        // without it the condition is absorbed into the LEFT JOIN's ON clause and
        // silently matches every row.
        const whereSql = `WHERE 1=1 ${[scope.sql, ...where].filter(Boolean).join(' ')}`;

        const result = await pool.query(
          `SELECT p.*,
                  c.name AS client_name, c.company AS client_company, c.email AS client_email,
                  (SELECT count(*) FROM project_members m WHERE m.project_id = p.id) AS member_count,
                  (SELECT json_agg(json_build_object(
                      'id', u.id, 'name', u.name, 'role', u.role
                    )) FROM project_members m JOIN admin_users u ON u.id = m.user_id
                   WHERE m.project_id = p.id) AS members,
                  (SELECT count(*) FROM project_updates u2 WHERE u2.project_id = p.id) AS update_count,
                  (SELECT count(*) FROM project_files f WHERE f.project_id = p.id) AS file_count,
                  (SELECT count(*) FROM project_updates u3
                     WHERE u3.project_id = p.id AND u3.resolved_at IS NULL
                       AND u3.kind IN ('request','status')) AS open_requests
           FROM projects p
           LEFT JOIN admin_users c ON c.id = p.client_id
           ${whereSql}
           ORDER BY p.updated_at DESC`,
          params,
        );

        return res.json({ ok: true, items: result.rows });
      } catch (err) {
        console.error('GET /api/projects failed:', err);
        return res.status(500).json({ ok: false, error: 'Could not load projects.' });
      }
    },
  );

  // ---------------------------------------------------------------- read
  router.get(
    '/api/projects/:id',
    requireAnyCap([
      'projects.viewAll',
      'projects.viewAssigned',
      'projects.viewOwn',
    ] as Capability[]),
    async (req: Request, res: Response) => {
      try {
        const user = me(req);
        const scope = scopeForUser(user, 2);
        const result = await pool.query(
          `SELECT p.*,
                  c.name AS client_name, c.company AS client_company, c.email AS client_email,
                  (SELECT json_agg(json_build_object('id', u.id, 'name', u.name, 'role', u.role))
                     FROM project_members m JOIN admin_users u ON u.id = m.user_id
                    WHERE m.project_id = p.id) AS members
           FROM projects p
           LEFT JOIN admin_users c ON c.id = p.client_id
           WHERE p.id = $1 ${scope.sql}`,
          [req.params.id, ...scope.params],
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ ok: false, error: 'Not found or not permitted.' });
        }
        return res.json({ ok: true, project: result.rows[0] });
      } catch (err) {
        console.error('GET /api/projects/:id failed:', err);
        return res.status(500).json({ ok: false, error: 'Could not load the project.' });
      }
    },
  );

  // --------------------------------------------------------------- create
  router.post('/api/projects', requireCap('projects.create'), async (req: Request, res: Response) => {
    const parsed = projectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ ok: false, error: 'Validation failed.', details: parsed.error.flatten() });
    }
    const d = parsed.data;
    const user = me(req);

    // PRJ-XXXX, retrying on collision
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const code = `PRJ-${crypto.randomInt(1000, 9999)}`;
      try {
        const result = await pool.query(
          `INSERT INTO projects
             (code, name, description, client_id, status, priority, start_date, end_date, budget, progress, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING *`,
          [
            code, d.name, d.description, d.client_id || null, d.status, d.priority,
            d.start_date || null, d.end_date || null, d.budget, d.progress, user.id,
          ],
        );
        return res.status(201).json({ ok: true, project: result.rows[0] });
      } catch (err: any) {
        if (err?.code === '23505') continue;
        console.error('POST /api/projects failed:', err);
        return res.status(500).json({ ok: false, error: 'Could not create the project.' });
      }
    }
    return res.status(500).json({ ok: false, error: 'Could not allocate a project code.' });
  });

  // --------------------------------------------------------------- update
  router.patch('/api/projects/:id', requireCap('projects.edit'), async (req: Request, res: Response) => {
    const parsed = projectPatch.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ ok: false, error: 'Validation failed.', details: parsed.error.flatten() });
    }

    // team members may only move status/progress on projects they are assigned to
    const role = normaliseRole(me(req).role);
    if (!can(role, 'projects.edit')) {
      return res.status(403).json({ ok: false, error: 'Not permitted to edit project details.' });
    }

    const d = parsed.data as Record<string, any>;
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    for (const key of Object.keys(d)) {
      sets.push(`${key} = $${i++}`);
      params.push(d[key] === '' ? null : d[key]);
    }
    if (!sets.length) return res.json({ ok: true, project: null });
    sets.push('updated_at = now()');

    try {
      const result = await pool.query(
        `UPDATE projects SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
        [...params, req.params.id],
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Not found.' });
      }
      return res.json({ ok: true, project: result.rows[0] });
    } catch (err) {
      console.error('PATCH /api/projects/:id failed:', err);
      return res.status(500).json({ ok: false, error: 'Could not update the project.' });
    }
  });

  /** Status-only update — the one field assigned team members may change. */
  router.patch(
    '/api/projects/:id/status',
    requireCap('projects.updateStatus'),
    async (req: Request, res: Response) => {
      const parsed = z
        .object({
          status: z.enum(PROJECT_STATUS).optional(),
          progress: z.coerce.number().int().min(0).max(100).optional(),
        })
        .safeParse(req.body);

      if (!parsed.success) {
        return res.status(422).json({ ok: false, error: 'Validation failed.' });
      }

      // Team members are limited to projects assigned to them.
      const user = me(req);
      if (!can(user.role, 'projects.viewAll')) {
        const assigned = await pool.query(
          'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
          [req.params.id, user.id],
        );
        if (assigned.rows.length === 0) {
          return res.status(403).json({ ok: false, error: 'You are not assigned to this project.' });
        }
      }

      const d = parsed.data;
      try {
        const result = await pool.query(
          `UPDATE projects
           SET status = COALESCE($1, status),
               progress = COALESCE($2, progress),
               updated_at = now()
           WHERE id = $3 RETURNING *`,
          [d.status ?? null, d.progress ?? null, req.params.id],
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ ok: false, error: 'Not found.' });
        }
        return res.json({ ok: true, project: result.rows[0] });
      } catch (err) {
        console.error('PATCH project status failed:', err);
        return res.status(500).json({ ok: false, error: 'Could not update status.' });
      }
    },
  );

  // --------------------------------------------------------------- delete
  router.delete('/api/projects/:id', requireCap('projects.delete'), async (req: Request, res: Response) => {
    try {
      const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [
        req.params.id,
      ]);
      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Not found.' });
      }
      return res.json({ ok: true });
    } catch (err) {
      console.error('DELETE project failed:', err);
      return res.status(500).json({ ok: false, error: 'Could not delete the project.' });
    }
  });

  // ------------------------------------------------------- assignments
  router.get('/api/projects/:id/members', async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT m.id, m.user_id, m.assigned_at,
                u.name, u.email, u.role, u.company
         FROM project_members m
         JOIN admin_users u ON u.id = m.user_id
         WHERE m.project_id = $1
         ORDER BY u.name`,
        [req.params.id],
      );
      return res.json({ ok: true, items: result.rows });
    } catch (err) {
      console.error('GET project members failed:', err);
      return res.status(500).json({ ok: false, error: 'Could not load members.' });
    }
  });

  router.post('/api/projects/:id/members', requireCap('projects.assign'), async (req: Request, res: Response) => {
    const parsed = z.object({ user_id: z.string().uuid() }).safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ ok: false, error: 'A user_id is required.' });
    }
    const assigner = me(req);

    // Only staff may be assigned — a client is never project staff.
    const target = await pool.query('SELECT id, role FROM admin_users WHERE id = $1', [
      parsed.data.user_id,
    ]);
    if (target.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'User not found.' });
    }
    if (normaliseRole(target.rows[0].role) === 'client') {
      return res.status(400).json({ ok: false, error: 'Clients cannot be assigned as project staff.' });
    }

    try {
      const result = await pool.query(
        `INSERT INTO project_members (project_id, user_id, assigned_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (project_id, user_id) DO NOTHING
         RETURNING *`,
        [req.params.id, parsed.data.user_id, assigner.id],
      );
      if (result.rows.length === 0) {
        return res.status(409).json({ ok: false, error: 'That person is already assigned.' });
      }
      return res.status(201).json({ ok: true, member: result.rows[0] });
    } catch (err) {
      console.error('POST project member failed:', err);
      return res.status(500).json({ ok: false, error: 'Could not assign the user.' });
    }
  });

  router.delete(
    '/api/projects/:id/members/:userId',
    requireCap('projects.assign'),
    async (req: Request, res: Response) => {
      try {
        const result = await pool.query(
          'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 RETURNING id',
          [req.params.id, req.params.userId],
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ ok: false, error: 'Not found.' });
        }
        return res.json({ ok: true });
      } catch (err) {
        console.error('DELETE project member failed:', err);
        return res.status(500).json({ ok: false, error: 'Could not remove the assignment.' });
      }
    },
  );

  // ------------------------------------------------------------- updates
  router.get('/api/projects/:id/updates', async (req: Request, res: Response) => {
    try {
      const user = me(req);
      const scope = scopeForUser(user, 2);
      const projectId = req.params.id;

      const permitted = await pool.query(
        `SELECT 1 FROM projects p WHERE p.id = $1 ${scope.sql}`,
        [projectId, ...scope.params],
      );
      if (permitted.rows.length === 0) {
        return res.status(403).json({ ok: false, error: 'Not permitted.' });
      }

      // Clients never see internal-only notes.
      const hideInternal = can(user.role, 'projects.viewAll') ? '' : 'AND u.visibility = $2';
      const params: any[] = [projectId];
      if (hideInternal) params.push('shared');

      const result = await pool.query(
        `SELECT u.*, a.name AS author_name, a.role AS author_role
         FROM project_updates u
         LEFT JOIN admin_users a ON a.id = u.author_id
         WHERE u.project_id = $1 ${hideInternal}
         ORDER BY u.created_at DESC`,
        params,
      );
      return res.json({ ok: true, items: result.rows });
    } catch (err) {
      console.error('GET project updates failed:', err);
      return res.status(500).json({ ok: false, error: 'Could not load updates.' });
    }
  });

  router.post('/api/projects/:id/updates', requireCap('projects.reply'), async (req: Request, res: Response) => {
    const parsed = z
      .object({
        kind: z.enum(UPDATE_KIND).default('message'),
        body: z.string().trim().max(4000).default(''),
        urgency: z.enum(URGENCY).default('normal'),
        visibility: z.enum(['shared', 'internal']).default('shared'),
        status: z.enum(PROJECT_STATUS).optional(),
        progress: z.coerce.number().int().min(0).max(100).optional(),
      })
      .safeParse(req.body);

    if (!parsed.success) {
      return res.status(422).json({ ok: false, error: 'Validation failed.', details: parsed.error.flatten() });
    }

    const user = me(req);
    const scope = scopeForUser(user, 2);
    const permitted = await pool.query(
        `SELECT 1 FROM projects p WHERE p.id = $1 ${scope.sql}`,
      [req.params.id, ...scope.params],
    );
    if (permitted.rows.length === 0) {
      return res.status(403).json({ ok: false, error: 'Not permitted.' });
    }

    // Clients may only post shared messages/requests, never internal notes.
    const visibility = can(user.role, 'projects.viewAll')
      ? parsed.data.visibility
      : 'shared';
    const kind = can(user.role, 'projects.updateStatus')
      ? parsed.data.kind
      : parsed.data.kind === 'request'
        ? 'request'
        : 'message';

    try {
      const result = await pool.query(
        `INSERT INTO project_updates (project_id, author_id, kind, body, urgency, visibility)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [req.params.id, user.id, kind, parsed.data.body, parsed.data.urgency, visibility],
      );

      // A status update also moves the project itself.
      if (kind === 'status' && parsed.data.status) {
        await pool.query(
          `UPDATE projects SET status = $1, progress = COALESCE($2, progress), updated_at = now() WHERE id = $3`,
          [parsed.data.status, parsed.data.progress ?? null, req.params.id],
        );
      }

      return res.status(201).json({ ok: true, update: result.rows[0] });
    } catch (err) {
      console.error('POST project update failed:', err);
      return res.status(500).json({ ok: false, error: 'Could not post the update.' });
    }
  });

  /** Mark a client request as handled. */
  router.patch(
    '/api/projects/updates/:updateId/resolve',
    requireStaff(),
    async (req: Request, res: Response) => {
      try {
        const user = me(req);
        const result = await pool.query(
          `UPDATE project_updates SET resolved_at = now(), resolved_by = $1 WHERE id = $2 RETURNING *`,
          [user.id, req.params.updateId],
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ ok: false, error: 'Not found.' });
        }
        return res.json({ ok: true, update: result.rows[0] });
      } catch (err) {
        console.error('PATCH resolve update failed:', err);
        return res.status(500).json({ ok: false, error: 'Could not resolve the request.' });
      }
    },
  );

  // --------------------------------------------------------------- files
  router.get('/api/projects/:id/files', async (req: Request, res: Response) => {
    try {
      const user = me(req);
      const scope = scopeForUser(user, 2);
      const permitted = await pool.query(
        `SELECT 1 FROM projects p WHERE p.id = $1 ${scope.sql}`,
        [req.params.id, ...scope.params],
      );
      if (permitted.rows.length === 0) {
        return res.status(403).json({ ok: false, error: 'Not permitted.' });
      }

      const result = await pool.query(
        `SELECT f.*, u.name AS uploader_name
         FROM project_files f
         LEFT JOIN admin_users u ON u.id = f.uploaded_by
         WHERE f.project_id = $1 ORDER BY f.created_at DESC`,
        [req.params.id],
      );
      return res.json({ ok: true, items: result.rows });
    } catch (err) {
      console.error('GET project files failed:', err);
      return res.status(500).json({ ok: false, error: 'Could not load files.' });
    }
  });

  router.post('/api/projects/:id/files', requireCap('projects.uploadFiles'), async (req: Request, res: Response) => {
    const parsed = z
      .object({
        filename: z.string().trim().min(1).max(255),
        storage_key: z.string().trim().min(1).max(500),
        public_url: z.string().trim().max(500).optional().default(''),
        content_type: z.string().trim().max(120).optional().default(''),
        size_bytes: z.coerce.number().int().min(0).default(0),
        client_finalized: z.boolean().optional().default(false),
      })
      .safeParse(req.body);

    if (!parsed.success) {
      return res.status(422).json({ ok: false, error: 'Validation failed.', details: parsed.error.flatten() });
    }

    const user = me(req);
    if (!can(user.role, 'projects.viewAll')) {
      const assigned = await pool.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [req.params.id, user.id],
      );
      if (assigned.rows.length === 0) {
        return res.status(403).json({ ok: false, error: 'You are not assigned to this project.' });
      }
    }

    const d = parsed.data;
    try {
      const result = await pool.query(
        `INSERT INTO project_files
           (project_id, uploaded_by, filename, storage_key, public_url, content_type, size_bytes, client_finalized)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [req.params.id, user.id, d.filename, d.storage_key, d.public_url, d.content_type, d.size_bytes, d.client_finalized],
      );
      return res.status(201).json({ ok: true, file: result.rows[0] });
    } catch (err) {
      console.error('POST project file failed:', err);
      return res.status(500).json({ ok: false, error: 'Could not record the file.' });
    }
  });

  router.delete('/api/projects/files/:fileId', requireStaff(), async (req: Request, res: Response) => {
    try {
      const result = await pool.query('DELETE FROM project_files WHERE id = $1 RETURNING id', [
        req.params.fileId,
      ]);
      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Not found.' });
      }
      return res.json({ ok: true });
    } catch (err) {
      console.error('DELETE project file failed:', err);
      return res.status(500).json({ ok: false, error: 'Could not delete the file.' });
    }
  });

  // -------------------------------------------------------------- lookup
  /** Staff directory used by the assignment picker (staff roles only). */
  router.get('/api/staff', requireCap('users.view'), async (_req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT id, name, email, role, company, is_active
         FROM admin_users
         WHERE role <> 'client' AND is_active
         ORDER BY name`,
      );
      return res.json({ ok: true, items: result.rows });
    } catch (err) {
      console.error('GET /api/staff failed:', err);
      return res.status(500).json({ ok: false, error: 'Could not load the staff list.' });
    }
  });

  /** Clients available to attach to a project (admins only). */
  router.get('/api/clients', requireCap('projects.create'), async (_req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT id, name, email, company, phone
         FROM admin_users WHERE role = 'client' AND is_active ORDER BY name`,
      );
      return res.json({ ok: true, items: result.rows });
    } catch (err) {
      console.error('GET /api/clients failed:', err);
      return res.status(500).json({ ok: false, error: 'Could not load clients.' });
    }
  });

  return router;
}
