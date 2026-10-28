import express, { type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import dotenv from 'dotenv';
import { pool } from './db';
import { authenticateAdmin, generateToken } from './auth';
import { can, normaliseRole, requireCap as cap } from './rbac';
import { r2Upload, r2Delete, r2PublicUrl, R2_BUCKET, R2_PUBLIC_URL } from './r2';

dotenv.config();

const PORT = Number(process.env.PORT || 8787);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? 'https://heymovox.com';

const ALLOWED_ORIGINS = new Set<string>([
  ALLOWED_ORIGIN,
  'https://heymovox.com',
  'https://www.heymovox.com',
  'https://admin.heymovox.com',
  'https://portal.heymovox.com',
  ...(process.env.ALLOWED_ORIGINS ?? '').split(',').map(o => o.trim()).filter(Boolean),
]);

if (process.env.NODE_ENV !== 'production') {
  for (let port = 5173; port <= 5180; port++) {
    ALLOWED_ORIGINS.add(`http://localhost:${port}`);
    ALLOWED_ORIGINS.add(`http://127.0.0.1:${port}`);
    ALLOWED_ORIGINS.add(`http://admin.localhost:${port}`);
    ALLOWED_ORIGINS.add(`http://portal.localhost:${port}`);
  }
}

const app = express();

// ---- middleware ----
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] ?? 'Authorization, Content-Type');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') {
    res.sendStatus(origin && !ALLOWED_ORIGINS.has(origin) ? 403 : 204);
    return;
  }
  next();
});

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json({ limit: '32kb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 5 },
});

// ---- rate limiter ----
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 10;

function publicWriteLimiter(mountPath: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'POST') return next();
    const origin = req.headers.origin;
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return res.status(403).json({ ok: false, error: 'Origin not allowed.' });
    }
    const now = Date.now();
    const key = `${mountPath}|${req.ip ?? 'unknown'}`;
    const bucket = rateBuckets.get(key);
    if (!bucket || bucket.resetAt < now) {
      rateBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    } else if (bucket.count >= MAX_REQUESTS) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
      return res.status(429).json({ ok: false, error: 'Too many requests. Please try again later.' });
    } else {
      bucket.count += 1;
    }
    next();
  };
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
app.get('/api/health', async (_req, res) => {
  let database: 'ok' | 'unconfigured' | 'unreachable' = 'unconfigured';
  if (process.env.DATABASE_URL) {
    try {
      await pool.query('SELECT 1');
      database = 'ok';
    } catch {
      database = 'unreachable';
    }
  }
  res.json({
    ok: database === 'ok',
    env: {
      database,
      jwt_secret: Boolean(process.env.JWT_SECRET),
      r2: Boolean(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_S3_API_URL && process.env.R2_BUCKET_NAME),
    },
  });
});

// ---------------------------------------------------------------------------
// Maintenance mode
// ---------------------------------------------------------------------------
app.get('/api/content/maintenance', async (_req, res) => {
  try {
    const result = await pool.query("SELECT value FROM settings WHERE key = 'maintenance_mode'");
    const maintenance = result.rows.length > 0 && result.rows[0].value === true;
    res.json({ ok: true, maintenance });
  } catch {
    res.json({ ok: true, maintenance: false });
  }
});

// ---------------------------------------------------------------------------
// Admin auth
// ---------------------------------------------------------------------------
const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

app.post('/api/admin/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid credentials.' });
  }
  try {
    const result = await pool.query(
      'SELECT id, email, password_hash, name, role FROM admin_users WHERE email = $1 AND is_active = true',
      [parsed.data.email],
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials.' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(parsed.data.password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials.' });
    }
    await pool.query('UPDATE admin_users SET last_login = now() WHERE id = $1', [user.id]);
    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    return res.json({ ok: true, token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error('Login failed:', err);
    return res.status(500).json({ ok: false, error: 'Sign in unavailable.' });
  }
});

app.post('/api/admin/logout', authenticateAdmin, async (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/admin/me', authenticateAdmin, async (req, res) => {
  const admin = (req as any).admin;
  res.json({ ok: true, user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } });
});

// ---------------------------------------------------------------------------
// Enquiries (public form submission)
// ---------------------------------------------------------------------------
app.use('/api/enquiries', publicWriteLimiter('/api/enquiries'));

app.post('/api/enquiries', async (req, res) => {
  const parsed = z.object({
    name: z.string().trim().min(2).max(80),
    business: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(120),
    phone: z.string().trim().max(20).optional().default(''),
    service: z.string().min(1).max(60),
    budget: z.string().min(1).max(40),
    timeline: z.string().min(1).max(40),
    brief: z.string().trim().min(30).max(4000),
    consent: z.literal(true),
    website: z.string().max(120).optional().default(''),
  }).safeParse(req.body);

  if (!parsed.success || parsed.data.website !== '') {
    return res.status(422).json({ ok: false, error: 'Invalid enquiry.' });
  }

  const d = parsed.data;
  try {
    const result = await pool.query(
      `INSERT INTO enquiries (id, name, business, email, phone, service, budget, timeline, brief, consent, source, ip_address, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$true,'enquiry',$10,$11) RETURNING id`,
      [crypto.randomUUID(), d.name, d.business, d.email, d.phone, d.service, d.budget, d.timeline, d.brief, req.ip, req.headers['user-agent'] ?? null],
    );
    return res.status(201).json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    console.error('Enquiry insert failed:', err);
    return res.status(500).json({ ok: false, error: 'Could not submit enquiry.' });
  }
});

// ---------------------------------------------------------------------------
// Newsletter
// ---------------------------------------------------------------------------
app.use('/api/newsletter', publicWriteLimiter('/api/newsletter'));

app.post('/api/newsletter', async (req, res) => {
  const parsed = z.object({
    email: z.string().trim().email().max(120),
    website: z.string().max(120).optional().default(''),
  }).safeParse(req.body);

  if (parsed.success && parsed.data.website !== '') {
    return res.status(200).json({ ok: true });
  }
  if (!parsed.success) {
    return res.status(422).json({ ok: false, error: 'Invalid email.' });
  }

  const email = parsed.data.email.toLowerCase();
  try {
    const result = await pool.query(
      `INSERT INTO enquiries (id, name, business, email, service, budget, timeline, brief, consent, source, ip_address, user_agent)
       VALUES ($1,'Newsletter subscriber','Newsletter',$2,'Newsletter','n/a','n/a','Subscribed via footer',true,'newsletter',$3,$4)
       ON CONFLICT (email) WHERE source = 'newsletter'
       DO UPDATE SET created_at = now() RETURNING id`,
      [crypto.randomUUID(), email, req.ip, req.headers['user-agent'] ?? null],
    );
    return res.status(201).json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    console.error('Newsletter insert failed:', err);
    return res.status(500).json({ ok: false, error: 'Could not subscribe.' });
  }
});

// ---------------------------------------------------------------------------
// Admin dashboard stats
// ---------------------------------------------------------------------------
app.get('/api/admin/stats', authenticateAdmin, async (_req, res) => {
  const [enquiriesCount, enquiriesToday, projectsCount, invoicesPending] = await Promise.all([
    pool.query("SELECT COUNT(*) as count FROM enquiries WHERE source = 'enquiry'"),
    pool.query(`SELECT COUNT(*) as count FROM enquiries WHERE source = 'enquiry' AND created_at >= CURRENT_DATE`),
    pool.query("SELECT COUNT(*) as count FROM projects"),
    pool.query("SELECT COUNT(*) as count FROM invoices WHERE status IN ('draft','sent','overdue')"),
  ]);
  res.json({
    ok: true,
    stats: {
      total_enquiries: parseInt(enquiriesCount.rows[0].count),
      today_enquiries: parseInt(enquiriesToday.rows[0].count),
      total_projects: parseInt(projectsCount.rows[0].count),
      pending_invoices: parseInt(invoicesPending.rows[0].count),
    },
  });
});

// ---------------------------------------------------------------------------
// Admin enquiries list
// ---------------------------------------------------------------------------
app.get('/api/admin/enquiries', authenticateAdmin, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;
  const source = req.query.source as string | undefined;

  const params: any[] = [];
  let whereClause = '';
  let paramIndex = 1;

  if (source) {
    whereClause = `WHERE source = $${paramIndex++}`;
    params.push(source);
  }

  params.push(limit, offset);
  const [countResult, dataResult] = await Promise.all([
    pool.query(`SELECT COUNT(*) as total FROM enquiries ${whereClause}`, params.slice(0, -2)),
    pool.query(
      `SELECT id, name, business, email, phone, service, budget, brief, source, created_at
       FROM enquiries ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params,
    ),
  ]);

  res.json({
    ok: true,
    enquiries: dataResult.rows,
    pagination: { page, limit, total: parseInt(countResult.rows[0].total), totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit) },
  });
});

// ---------------------------------------------------------------------------
// Generic CRUD router factory
// ---------------------------------------------------------------------------
function createCrudRouter(table: string, columns: string[]) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const selectCols = columns.join(', ');
      const result = await pool.query(`SELECT ${selectCols} FROM ${table} ORDER BY created_at DESC`);
      res.json({ ok: true, items: result.rows });
    } catch (err) {
      console.error(`GET ${table} failed:`, err);
      res.status(500).json({ ok: false, error: `Could not load ${table}.` });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const selectCols = columns.join(', ');
      const result = await pool.query(`SELECT ${selectCols} FROM ${table} WHERE id = $1`, [req.params.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Not found.' });
      }
      res.json({ ok: true, item: result.rows[0] });
    } catch (err) {
      console.error(`GET ${table}/:id failed:`, err);
      res.status(500).json({ ok: false, error: `Could not load ${table}.` });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const keys = Object.keys(req.body);
      const validKeys = keys.filter(k => columns.includes(k) && k !== 'id' && k !== 'created_at' && k !== 'updated_at');
      if (validKeys.length === 0) {
        return res.status(400).json({ ok: false, error: 'No valid fields.' });
      }
      const vals = validKeys.map(k => req.body[k]);
      const colStr = validKeys.join(', ');
      const paramStr = validKeys.map((_, i) => `$${i + 1}`).join(', ');
      const result = await pool.query(
        `INSERT INTO ${table} (id, ${colStr}) VALUES (uuid_generate_v4(), ${paramStr}) RETURNING ${columns.join(', ')}`,
        vals,
      );
      res.status(201).json({ ok: true, item: result.rows[0] });
    } catch (err) {
      console.error(`POST ${table} failed:`, err);
      res.status(500).json({ ok: false, error: `Could not create ${table}.` });
    }
  });

  router.patch('/:id', async (req, res) => {
    try {
      const keys = Object.keys(req.body);
      const validKeys = keys.filter(k => columns.includes(k) && k !== 'id' && k !== 'created_at' && k !== 'updated_at');
      if (validKeys.length === 0) {
        return res.status(400).json({ ok: false, error: 'No valid fields.' });
      }
      const sets = validKeys.map((k, i) => `${k} = $${i + 1}`).join(', ');
      const vals = validKeys.map(k => req.body[k]);
      vals.push(req.params.id);
      const result = await pool.query(
        `UPDATE ${table} SET ${sets}, updated_at = now() WHERE id = $${vals.length} RETURNING ${columns.join(', ')}`,
        vals,
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Not found.' });
      }
      res.json({ ok: true, item: result.rows[0] });
    } catch (err) {
      console.error(`PATCH ${table}/:id failed:`, err);
      res.status(500).json({ ok: false, error: `Could not update ${table}.` });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const result = await pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [req.params.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Not found.' });
      }
      res.json({ ok: true });
    } catch (err) {
      console.error(`DELETE ${table}/:id failed:`, err);
      res.status(500).json({ ok: false, error: `Could not delete ${table}.` });
    }
  });

  return router;
}

// ---------------------------------------------------------------------------
// Content routes (works, blogs, team, policies)
// ---------------------------------------------------------------------------
const workColumns = ['id','slug','title','client','client_descriptor','category','services','year','summary','image','challenge','objectives','approach','deliverables','results','quote','is_sample','published','sort_order','created_at','updated_at'];
const blogColumns = ['id','slug','title','excerpt','category','published_on','reading_minutes','image','author','author_role','body','related_services','published','created_at','updated_at'];
const teamColumns = ['id','name','role','bio','email','phone','photo','linkedin','twitter','sort_order','is_active','created_at','updated_at'];
const policyColumns = ['id','slug','title','category','summary','content','version','effective_date','status','show_in_footer','sort_order','created_at','updated_at'];

app.use('/api/admin/works', authenticateAdmin, cap('content.edit'), createCrudRouter('works', workColumns));
app.use('/api/admin/blogs', authenticateAdmin, cap('content.edit'), createCrudRouter('blogs', blogColumns));
app.use('/api/admin/team', authenticateAdmin, cap('content.edit'), createCrudRouter('team_members', teamColumns));
app.use('/api/admin/policies', authenticateAdmin, cap('content.edit'), createCrudRouter('policies', policyColumns));

// Public content reads
app.get('/api/content/works', async (_req, res) => {
  try {
    const result = await pool.query(`SELECT ${workColumns.join(', ')} FROM works WHERE published = true ORDER BY sort_order ASC, created_at DESC`);
    res.json({ ok: true, items: result.rows });
  } catch {
    res.json({ ok: true, items: [] });
  }
});

app.get('/api/content/works/:slug', async (req, res) => {
  try {
    const result = await pool.query(`SELECT ${workColumns.join(', ')} FROM works WHERE published = true AND slug = $1`, [req.params.slug]);
    if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Not found.' });
    res.json({ ok: true, item: result.rows[0] });
  } catch {
    res.status(500).json({ ok: false, error: 'Could not load.' });
  }
});

app.get('/api/content/blogs', async (_req, res) => {
  try {
    const result = await pool.query(`SELECT ${blogColumns.join(', ')} FROM blogs WHERE published = true ORDER BY published_on DESC NULLS LAST`);
    res.json({ ok: true, items: result.rows });
  } catch {
    res.json({ ok: true, items: [] });
  }
});

app.get('/api/content/blogs/:slug', async (req, res) => {
  try {
    const result = await pool.query(`SELECT ${blogColumns.join(', ')} FROM blogs WHERE published = true AND slug = $1`, [req.params.slug]);
    if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Not found.' });
    res.json({ ok: true, item: result.rows[0] });
  } catch {
    res.status(500).json({ ok: false, error: 'Could not load.' });
  }
});

app.get('/api/content/team', async (_req, res) => {
  try {
    const result = await pool.query(`SELECT ${teamColumns.join(', ')} FROM team_members WHERE is_active = true ORDER BY sort_order ASC`);
    res.json({ ok: true, items: result.rows });
  } catch {
    res.json({ ok: true, items: [] });
  }
});

app.get('/api/content/policies', async (_req, res) => {
  try {
    const result = await pool.query(`SELECT ${policyColumns.join(', ')} FROM policies WHERE status = 'published' ORDER BY sort_order ASC`);
    res.json({ ok: true, items: result.rows });
  } catch {
    res.json({ ok: true, items: [] });
  }
});

// ---------------------------------------------------------------------------
// Admin users (RBAC)
// ---------------------------------------------------------------------------
app.get('/api/admin/users', authenticateAdmin, cap('users.view'), async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, email, name, role, company, client_of, phone, avatar, notes, is_active, last_login, created_at FROM admin_users ORDER BY created_at DESC');
    res.json({ ok: true, items: result.rows });
  } catch (err) {
    console.error('GET users failed:', err);
    res.status(500).json({ ok: false, error: 'Could not load users.' });
  }
});

app.post('/api/admin/users', authenticateAdmin, cap('users.manage'), async (req, res) => {
  const parsed = z.object({
    email: z.string().trim().email(),
    password: z.string().min(6),
    name: z.string().min(1),
    role: z.enum(['admin','operations_manager','project_manager','sales_executive','team_member','client']),
    company: z.string().optional().default(''),
    phone: z.string().optional().default(''),
    notes: z.string().optional().default(''),
  }).safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid user data.' });
  }

  try {
    const hash = await bcrypt.hash(parsed.data.password, 10);
    const result = await pool.query(
      `INSERT INTO admin_users (id, email, password_hash, name, role, company, phone, notes)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, name, role, company, phone, notes, is_active, created_at`,
      [parsed.data.email, hash, parsed.data.name, parsed.data.role, parsed.data.company, parsed.data.phone, parsed.data.notes],
    );
    res.status(201).json({ ok: true, item: result.rows[0] });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ ok: false, error: 'Email already exists.' });
    }
    console.error('POST users failed:', err);
    res.status(500).json({ ok: false, error: 'Could not create user.' });
  }
});

app.patch('/api/admin/users/:id', authenticateAdmin, cap('users.manage'), async (req, res) => {
  const fields = ['name', 'role', 'company', 'phone', 'notes', 'is_active', 'client_of'];
  const updates: string[] = [];
  const values: any[] = [];
  let idx = 1;

  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = $${idx++}`);
      values.push(req.body[f]);
    }
  }

  if (req.body.password && req.body.password.length >= 6) {
    const hash = await bcrypt.hash(req.body.password, 10);
    updates.push(`password_hash = $${idx++}`);
    values.push(hash);
  }

  if (updates.length === 0) {
    return res.status(400).json({ ok: false, error: 'No valid fields.' });
  }

  values.push(req.params.id);
  try {
    const result = await pool.query(
      `UPDATE admin_users SET ${updates.join(', ')}, updated_at = now() WHERE id = $${idx} RETURNING id, email, name, role, company, phone, notes, is_active, last_login, created_at`,
      values,
    );
    if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Not found.' });
    res.json({ ok: true, item: result.rows[0] });
  } catch (err) {
    console.error('PATCH users failed:', err);
    res.status(500).json({ ok: false, error: 'Could not update user.' });
  }
});

app.delete('/api/admin/users/:id', authenticateAdmin, cap('users.manage'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM admin_users WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Not found.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE users failed:', err);
    res.status(500).json({ ok: false, error: 'Could not delete user.' });
  }
});

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
const projectColumns = ['id','code','name','description','client_id','status','priority','start_date','end_date','budget','progress','created_by','created_at','updated_at'];

app.get('/api/projects', authenticateAdmin, async (req, res) => {
  try {
    let whereClause = '';
    const params: any[] = [];

    if (req.query.status) {
      whereClause = 'WHERE status = $1';
      params.push(req.query.status);
    }

    const result = await pool.query(
      `SELECT p.*, u.name as client_name
       FROM projects p
       LEFT JOIN admin_users u ON p.client_id = u.id
       ${whereClause}
       ORDER BY p.created_at DESC`,
      params,
    );
    res.json({ ok: true, items: result.rows });
  } catch (err) {
    console.error('GET projects failed:', err);
    res.status(500).json({ ok: false, error: 'Could not load projects.' });
  }
});

app.get('/api/projects/:id', authenticateAdmin, async (req, res) => {
  try {
    const projectResult = await pool.query(
      `SELECT p.*, u.name as client_name, u.email as client_email, u.company as client_company
       FROM projects p LEFT JOIN admin_users u ON p.client_id = u.id WHERE p.id = $1`,
      [req.params.id],
    );
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Not found.' });
    }

    const membersResult = await pool.query(
      `SELECT pm.user_id, u.name, u.email, u.role, u.company
       FROM project_members pm JOIN admin_users u ON pm.user_id = u.id
       WHERE pm.project_id = $1`,
      [req.params.id],
    );

    const updatesResult = await pool.query(
      `SELECT * FROM project_updates WHERE project_id = $1 ORDER BY created_at DESC`,
      [req.params.id],
    );

    const filesResult = await pool.query(
      `SELECT * FROM project_files WHERE project_id = $1 ORDER BY created_at DESC`,
      [req.params.id],
    );

    res.json({
      ok: true,
      project: {
        ...projectResult.rows[0],
        members: membersResult.rows,
        updates: updatesResult.rows,
        files: filesResult.rows,
      },
    });
  } catch (err) {
    console.error('GET project/:id failed:', err);
    res.status(500).json({ ok: false, error: 'Could not load project.' });
  }
});

app.post('/api/projects', authenticateAdmin, cap('projects.create'), async (req, res) => {
  const parsed = z.object({
    name: z.string().min(1),
    description: z.string().optional().default(''),
    client_id: z.string().nullable().optional(),
    status: z.enum(['planning','in_progress','review','on_hold','completed']).optional().default('planning'),
    priority: z.enum(['low','normal','high','urgent']).optional().default('normal'),
    start_date: z.string().nullable().optional(),
    end_date: z.string().nullable().optional(),
    budget: z.number().optional().default(0),
    progress: z.number().optional().default(0),
    member_ids: z.array(z.string()).optional().default([]),
  }).safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid project data.' });
  }

  const d = parsed.data;
  const code = `PRJ-${Date.now().toString(36).toUpperCase()}`;
  const admin = (req as any).admin;

  try {
    const result = await pool.query(
      `INSERT INTO projects (id, code, name, description, client_id, status, priority, start_date, end_date, budget, progress, created_by)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [code, d.name, d.description, d.client_id ?? null, d.status, d.priority, d.start_date ?? null, d.end_date ?? null, d.budget, d.progress, admin.id],
    );

    if (d.member_ids.length > 0) {
      const projectId = result.rows[0].id;
      for (const userId of d.member_ids) {
        await pool.query(
          'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [projectId, userId],
        );
      }
    }

    res.status(201).json({ ok: true, project: result.rows[0] });
  } catch (err) {
    console.error('POST projects failed:', err);
    res.status(500).json({ ok: false, error: 'Could not create project.' });
  }
});

app.patch('/api/projects/:id', authenticateAdmin, cap('projects.edit'), async (req, res) => {
  const fields = ['name', 'description', 'client_id', 'status', 'priority', 'start_date', 'end_date', 'budget', 'progress'];
  const updates: string[] = [];
  const values: any[] = [];
  let idx = 1;

  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = $${idx++}`);
      values.push(req.body[f]);
    }
  }

  if (updates.length === 0) return res.status(400).json({ ok: false, error: 'No valid fields.' });

  values.push(req.params.id);
  try {
    const result = await pool.query(
      `UPDATE projects SET ${updates.join(', ')}, updated_at = now() WHERE id = $${idx} RETURNING *`,
      values,
    );
    if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Not found.' });
    res.json({ ok: true, project: result.rows[0] });
  } catch (err) {
    console.error('PATCH projects failed:', err);
    res.status(500).json({ ok: false, error: 'Could not update project.' });
  }
});

app.patch('/api/projects/:id/status', authenticateAdmin, cap('projects.updateStatus'), async (req, res) => {
  const parsed = z.object({
    status: z.enum(['planning','in_progress','review','on_hold','completed']).optional(),
    progress: z.number().min(0).max(100).optional(),
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ ok: false, error: 'Invalid data.' });

  const updates: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (parsed.data.status) { updates.push(`status = $${idx++}`); values.push(parsed.data.status); }
  if (parsed.data.progress !== undefined) { updates.push(`progress = $${idx++}`); values.push(parsed.data.progress); }

  if (updates.length === 0) return res.status(400).json({ ok: false, error: 'No valid fields.' });

  values.push(req.params.id);
  try {
    const result = await pool.query(
      `UPDATE projects SET ${updates.join(', ')}, updated_at = now() WHERE id = $${idx} RETURNING *`,
      values,
    );
    if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Not found.' });
    res.json({ ok: true, project: result.rows[0] });
  } catch (err) {
    console.error('PATCH project status failed:', err);
    res.status(500).json({ ok: false, error: 'Could not update status.' });
  }
});

app.delete('/api/projects/:id', authenticateAdmin, cap('projects.delete'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Not found.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE project failed:', err);
    res.status(500).json({ ok: false, error: 'Could not delete project.' });
  }
});

// Project members
app.post('/api/projects/:id/members', authenticateAdmin, cap('projects.assign'), async (req, res) => {
  const parsed = z.object({ user_id: z.string() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: 'Invalid data.' });

  try {
    await pool.query(
      'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, parsed.data.user_id],
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Assign member failed:', err);
    res.status(500).json({ ok: false, error: 'Could not assign member.' });
  }
});

app.delete('/api/projects/:id/members/:userId', authenticateAdmin, cap('projects.assign'), async (req, res) => {
  try {
    await pool.query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2', [req.params.id, req.params.userId]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Unassign member failed:', err);
    res.status(500).json({ ok: false, error: 'Could not unassign member.' });
  }
});

// Project updates
app.get('/api/projects/:id/updates', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pu.*, u.name as author_name, u.role as author_role
       FROM project_updates pu LEFT JOIN admin_users u ON pu.author_id = u.id
       WHERE pu.project_id = $1 ORDER BY pu.created_at DESC`,
      [req.params.id],
    );
    res.json({ ok: true, items: result.rows });
  } catch (err) {
    console.error('GET project updates failed:', err);
    res.status(500).json({ ok: false, error: 'Could not load updates.' });
  }
});

app.post('/api/projects/:id/updates', authenticateAdmin, cap('projects.reply'), async (req, res) => {
  const parsed = z.object({
    body: z.string().min(1),
    kind: z.enum(['status','message','request','note']).optional().default('message'),
    urgency: z.enum(['normal','high','urgent']).optional().default('normal'),
    visibility: z.enum(['shared','internal']).optional().default('shared'),
    status: z.enum(['planning','in_progress','review','on_hold','completed']).optional(),
    progress: z.number().min(0).max(100).optional(),
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ ok: false, error: 'Invalid data.' });

  const admin = (req as any).admin;
  try {
    const result = await pool.query(
      `INSERT INTO project_updates (id, project_id, author_id, body, kind, urgency, visibility, status, progress)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.params.id, admin.id, parsed.data.body, parsed.data.kind, parsed.data.urgency, parsed.data.visibility, parsed.data.status ?? null, parsed.data.progress ?? null],
    );

    if (parsed.data.status) {
      await pool.query('UPDATE projects SET status = $1, updated_at = now() WHERE id = $2', [parsed.data.status, req.params.id]);
    }

    res.status(201).json({ ok: true, update: result.rows[0] });
  } catch (err) {
    console.error('POST project update failed:', err);
    res.status(500).json({ ok: false, error: 'Could not post update.' });
  }
});

// Project files
app.get('/api/projects/:id/files', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pf.*, u.name as uploader_name FROM project_files pf
       LEFT JOIN admin_users u ON pf.uploaded_by = u.id
       WHERE pf.project_id = $1 ORDER BY pf.created_at DESC`,
      [req.params.id],
    );
    res.json({ ok: true, items: result.rows });
  } catch (err) {
    console.error('GET project files failed:', err);
    res.status(500).json({ ok: false, error: 'Could not load files.' });
  }
});

app.post('/api/projects/:id/files', authenticateAdmin, cap('projects.uploadFiles'), async (req, res) => {
  const parsed = z.object({
    filename: z.string(),
    storage_key: z.string(),
    public_url: z.string().optional().default(''),
    content_type: z.string().optional().default(''),
    size_bytes: z.number().optional().default(0),
    client_finalized: z.boolean().optional().default(false),
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ ok: false, error: 'Invalid data.' });

  const admin = (req as any).admin;
  try {
    const result = await pool.query(
      `INSERT INTO project_files (id, project_id, uploaded_by, filename, storage_key, public_url, content_type, size_bytes, client_finalized)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.params.id, admin.id, parsed.data.filename, parsed.data.storage_key, parsed.data.public_url, parsed.data.content_type, parsed.data.size_bytes, parsed.data.client_finalized],
    );
    res.status(201).json({ ok: true, file: result.rows[0] });
  } catch (err) {
    console.error('POST project file failed:', err);
    res.status(500).json({ ok: false, error: 'Could not record file.' });
  }
});

app.delete('/api/projects/files/:fileId', authenticateAdmin, cap('projects.uploadFiles'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM project_files WHERE id = $1 RETURNING id', [req.params.fileId]);
    if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Not found.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE project file failed:', err);
    res.status(500).json({ ok: false, error: 'Could not delete file.' });
  }
});

// Staff & client directory
app.get('/api/staff', authenticateAdmin, async (_req, res) => {
  try {
    const result = await pool.query(`SELECT id, name, email, role, company, phone, is_active FROM admin_users WHERE role != 'client' AND is_active = true ORDER BY name`);
    res.json({ ok: true, items: result.rows });
  } catch (err) {
    console.error('GET staff failed:', err);
    res.status(500).json({ ok: false, error: 'Could not load staff.' });
  }
});

app.get('/api/clients', authenticateAdmin, async (_req, res) => {
  try {
    const result = await pool.query(`SELECT id, name, email, role, company, phone, is_active FROM admin_users WHERE role = 'client' AND is_active = true ORDER BY name`);
    res.json({ ok: true, items: result.rows });
  } catch (err) {
    console.error('GET clients failed:', err);
    res.status(500).json({ ok: false, error: 'Could not load clients.' });
  }
});

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------
const invoiceColumns = ['id','invoice_number','client_name','client_email','client_company','client_gstin','client_address','enquiry_id','issue_date','due_date','subtotal','tax_rate','tax_amount','discount','total','currency','status','notes','terms','paid_at','created_at','updated_at'];

app.get('/api/admin/invoices', authenticateAdmin, cap('invoices.view'), async (req, res) => {
  try {
    let whereClause = '';
    const params: any[] = [];
    if (req.query.status) {
      whereClause = 'WHERE status = $1';
      params.push(req.query.status);
    }
    const result = await pool.query(
      `SELECT ${invoiceColumns.join(', ')} FROM invoices ${whereClause} ORDER BY created_at DESC`,
      params,
    );
    res.json({ ok: true, items: result.rows });
  } catch (err) {
    console.error('GET invoices failed:', err);
    res.status(500).json({ ok: false, error: 'Could not load invoices.' });
  }
});

app.get('/api/admin/invoices/:id', authenticateAdmin, cap('invoices.view'), async (req, res) => {
  try {
    const invoiceResult = await pool.query(`SELECT ${invoiceColumns.join(', ')} FROM invoices WHERE id = $1`, [req.params.id]);
    if (invoiceResult.rows.length === 0) return res.status(404).json({ ok: false, error: 'Not found.' });

    const itemsResult = await pool.query(
      'SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY sort_order',
      [req.params.id],
    );

    res.json({ ok: true, item: { ...invoiceResult.rows[0], items: itemsResult.rows } });
  } catch (err) {
    console.error('GET invoice/:id failed:', err);
    res.status(500).json({ ok: false, error: 'Could not load invoice.' });
  }
});

app.post('/api/admin/invoices', authenticateAdmin, cap('invoices.edit'), async (req, res) => {
  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
  try {
    const result = await pool.query(
      `INSERT INTO invoices (id, invoice_number, client_name, client_email, client_company, client_gstin, client_address, enquiry_id, issue_date, due_date, subtotal, tax_rate, tax_amount, discount, total, currency, status, notes, terms)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [
        invoiceNumber,
        req.body.client_name ?? '',
        req.body.client_email ?? '',
        req.body.client_company ?? '',
        req.body.client_gstin ?? '',
        req.body.client_address ?? '',
        req.body.enquiry_id ?? null,
        req.body.issue_date ?? new Date().toISOString().split('T')[0],
        req.body.due_date ?? null,
        req.body.subtotal ?? 0,
        req.body.tax_rate ?? 0,
        req.body.tax_amount ?? 0,
        req.body.discount ?? 0,
        req.body.total ?? 0,
        req.body.currency ?? 'USD',
        req.body.status ?? 'draft',
        req.body.notes ?? '',
        req.body.terms ?? '',
      ],
    );
    res.status(201).json({ ok: true, item: result.rows[0] });
  } catch (err) {
    console.error('POST invoices failed:', err);
    res.status(500).json({ ok: false, error: 'Could not create invoice.' });
  }
});

app.patch('/api/admin/invoices/:id', authenticateAdmin, cap('invoices.edit'), async (req, res) => {
  const fields = ['client_name','client_email','client_company','client_gstin','client_address','enquiry_id','issue_date','due_date','subtotal','tax_rate','tax_amount','discount','total','currency','status','notes','terms','paid_at'];
  const updates: string[] = [];
  const values: any[] = [];
  let idx = 1;

  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = $${idx++}`);
      values.push(req.body[f]);
    }
  }

  if (updates.length === 0) return res.status(400).json({ ok: false, error: 'No valid fields.' });

  values.push(req.params.id);
  try {
    const result = await pool.query(
      `UPDATE invoices SET ${updates.join(', ')}, updated_at = now() WHERE id = $${idx} RETURNING *`,
      values,
    );
    if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Not found.' });
    res.json({ ok: true, item: result.rows[0] });
  } catch (err) {
    console.error('PATCH invoices failed:', err);
    res.status(500).json({ ok: false, error: 'Could not update invoice.' });
  }
});

app.delete('/api/admin/invoices/:id', authenticateAdmin, cap('invoices.edit'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM invoices WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Not found.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE invoice failed:', err);
    res.status(500).json({ ok: false, error: 'Could not delete invoice.' });
  }
});

// Invoice line items
app.post('/api/admin/invoices/:id/items', authenticateAdmin, cap('invoices.edit'), async (req, res) => {
  const parsed = z.object({
    description: z.string().min(1),
    quantity: z.number().min(0).default(1),
    unit_price: z.number().min(0).default(0),
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ ok: false, error: 'Invalid data.' });

  const amount = parsed.data.quantity * parsed.data.unit_price;
  try {
    const result = await pool.query(
      `INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, amount)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5) RETURNING *`,
      [req.params.id, parsed.data.description, parsed.data.quantity, parsed.data.unit_price, amount],
    );
    res.status(201).json({ ok: true, item: result.rows[0] });
  } catch (err) {
    console.error('POST invoice item failed:', err);
    res.status(500).json({ ok: false, error: 'Could not add item.' });
  }
});

app.delete('/api/admin/invoices/items/:itemId', authenticateAdmin, cap('invoices.edit'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM invoice_items WHERE id = $1 RETURNING id', [req.params.itemId]);
    if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Not found.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE invoice item failed:', err);
    res.status(500).json({ ok: false, error: 'Could not delete item.' });
  }
});

app.post('/api/admin/invoices/:id/recalculate', authenticateAdmin, cap('invoices.edit'), async (req, res) => {
  try {
    const itemsResult = await pool.query('SELECT COALESCE(SUM(amount), 0) as subtotal FROM invoice_items WHERE invoice_id = $1', [req.params.id]);
    const subtotal = parseFloat(itemsResult.rows[0].subtotal);
    const taxRate = parseFloat(req.body.tax_rate ?? 0);
    const taxAmount = subtotal * (taxRate / 100);
    const discount = parseFloat(req.body.discount ?? 0);
    const total = subtotal + taxAmount - discount;

    await pool.query(
      'UPDATE invoices SET subtotal = $1, tax_rate = $2, tax_amount = $3, discount = $4, total = $5, updated_at = now() WHERE id = $6',
      [subtotal, taxRate, taxAmount, discount, total, req.params.id],
    );

    res.json({ ok: true, subtotal: String(subtotal), tax_rate: String(taxRate), tax_amount: String(taxAmount), discount: String(discount), total: String(total) });
  } catch (err) {
    console.error('Recalc invoice failed:', err);
    res.status(500).json({ ok: false, error: 'Could not recalculate.' });
  }
});

// ---------------------------------------------------------------------------
// Agreements
// ---------------------------------------------------------------------------
const agreementColumns = ['id','title','reference','agreement_type','client_name','client_email','client_phone','client_company','client_address','client_gstin','client_rep_name','client_rep_designation','status','content','effective_date','expiry_date','signed_at','signature_name','document_url','project_name','movox_rep_name','movox_rep_designation','movox_rep_email','law_state','law_city','law_country','client_signature','client_signed_name','client_signed_at','movox_signature','movox_signed_name','movox_signed_at','share_token','share_sent_at','client_viewed_at','schedule_a','created_at','updated_at'];

app.get('/api/admin/agreements', authenticateAdmin, cap('agreements.view'), async (_req, res) => {
  try {
    const result = await pool.query(`SELECT ${agreementColumns.join(', ')} FROM agreements ORDER BY created_at DESC`);
    res.json({ ok: true, items: result.rows });
  } catch (err) {
    console.error('GET agreements failed:', err);
    res.status(500).json({ ok: false, error: 'Could not load agreements.' });
  }
});

app.get('/api/admin/agreements/:id', authenticateAdmin, cap('agreements.view'), async (req, res) => {
  try {
    const result = await pool.query(`SELECT ${agreementColumns.join(', ')} FROM agreements WHERE id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Not found.' });
    res.json({ ok: true, item: result.rows[0] });
  } catch (err) {
    console.error('GET agreement/:id failed:', err);
    res.status(500).json({ ok: false, error: 'Could not load agreement.' });
  }
});

app.post('/api/admin/agreements', authenticateAdmin, cap('agreements.edit'), async (req, res) => {
  try {
    const ref = req.body.reference ?? `AGR-${Date.now().toString(36).toUpperCase()}`;
    const cols = agreementColumns.filter(c => !['id', 'created_at', 'updated_at', 'share_token', 'share_sent_at', 'client_viewed_at', 'signed_at', 'client_signed_at', 'movox_signed_at'].includes(c));
    const values = cols.map(c => req.body[c] ?? null);
    const colStr = cols.join(', ');
    const paramStr = cols.map((_, i) => `$${i + 1}`).join(', ');

    const result = await pool.query(
      `INSERT INTO agreements (id, ${colStr}) VALUES (uuid_generate_v4(), ${paramStr}) RETURNING ${agreementColumns.join(', ')}`,
      values,
    );
    res.status(201).json({ ok: true, item: result.rows[0] });
  } catch (err) {
    console.error('POST agreements failed:', err);
    res.status(500).json({ ok: false, error: 'Could not create agreement.' });
  }
});

app.patch('/api/admin/agreements/:id', authenticateAdmin, cap('agreements.edit'), async (req, res) => {
  const updatable = agreementColumns.filter(c => !['id', 'created_at', 'updated_at'].includes(c));
  const updates: string[] = [];
  const values: any[] = [];
  let idx = 1;

  for (const f of updatable) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = $${idx++}`);
      values.push(req.body[f]);
    }
  }

  if (updates.length === 0) return res.status(400).json({ ok: false, error: 'No valid fields.' });

  values.push(req.params.id);
  try {
    const result = await pool.query(
      `UPDATE agreements SET ${updates.join(', ')}, updated_at = now() WHERE id = $${idx} RETURNING ${agreementColumns.join(', ')}`,
      values,
    );
    if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Not found.' });
    res.json({ ok: true, item: result.rows[0] });
  } catch (err) {
    console.error('PATCH agreements failed:', err);
    res.status(500).json({ ok: false, error: 'Could not update agreement.' });
  }
});

app.delete('/api/admin/agreements/:id', authenticateAdmin, cap('agreements.edit'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM agreements WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Not found.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE agreement failed:', err);
    res.status(500).json({ ok: false, error: 'Could not delete agreement.' });
  }
});

// Share / revoke agreement
app.post('/api/admin/agreements/:id/share', authenticateAdmin, cap('agreements.share'), async (req, res) => {
  try {
    const token = crypto.randomUUID();
    await pool.query(
      'UPDATE agreements SET share_token = $1, share_sent_at = now(), updated_at = now() WHERE id = $2',
      [token, req.params.id],
    );
    res.json({ ok: true, token });
  } catch (err) {
    console.error('Share agreement failed:', err);
    res.status(500).json({ ok: false, error: 'Could not create share link.' });
  }
});

app.delete('/api/admin/agreements/:id/share', authenticateAdmin, cap('agreements.share'), async (req, res) => {
  try {
    await pool.query('UPDATE agreements SET share_token = NULL, updated_at = now() WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Revoke share failed:', err);
    res.status(500).json({ ok: false, error: 'Could not revoke share link.' });
  }
});

// Public agreement read (token-based)
app.get('/api/public/agreement/:token', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, reference, agreement_type, status, client_name, client_company, client_rep_name, client_rep_designation,
              project_name, effective_date, expiry_date, movox_rep_name, movox_rep_designation, law_state, law_city, law_country,
              client_signature, client_signed_name, client_signed_at, movox_signature, movox_signed_name, movox_signed_at, schedule_a
       FROM agreements WHERE share_token = $1`,
      [req.params.token],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'This link is not valid or has been revoked.' });
    }
    await pool.query('UPDATE agreements SET client_viewed_at = COALESCE(client_viewed_at, now()) WHERE share_token = $1', [req.params.token]);
    res.json({ ok: true, agreement: result.rows[0] });
  } catch (err) {
    console.error('GET public agreement failed:', err);
    res.status(500).json({ ok: false, error: 'Could not load agreement.' });
  }
});

app.post('/api/public/agreement/:token/sign', async (req, res) => {
  const parsed = z.object({
    signature: z.string().startsWith('data:image/png;base64,').max(400_000),
    name: z.string().trim().max(120).optional().default(''),
  }).safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({ ok: false, error: 'Invalid signature payload.' });
  }

  try {
    const found = await pool.query(
      'SELECT id, client_rep_name, client_name, client_signature FROM agreements WHERE share_token = $1',
      [req.params.token],
    );
    if (found.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'This link is not valid or has been revoked.' });
    }
    const row = found.rows[0];
    if (row.client_signature) {
      return res.status(409).json({ ok: false, error: 'This agreement has already been signed.' });
    }

    const name = parsed.data.name.trim() || row.client_rep_name || row.client_name;
    const updated = await pool.query(
      `UPDATE agreements
       SET client_signature = $1, client_signed_name = $2, client_signed_at = now(),
           status = CASE WHEN status IN ('cancelled','expired') THEN status ELSE 'signed' END,
           updated_at = now()
       WHERE id = $3
       RETURNING client_signature, client_signed_name, client_signed_at, status`,
      [parsed.data.signature, name, row.id],
    );
    res.json({ ok: true, ...updated.rows[0] });
  } catch (err) {
    console.error('POST public sign failed:', err);
    res.status(500).json({ ok: false, error: 'Could not save signature.' });
  }
});

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
app.get('/api/admin/settings', authenticateAdmin, cap('settings.manage'), async (_req, res) => {
  try {
    const result = await pool.query('SELECT key, value, group_name, label, type FROM settings ORDER BY group_name, key');
    res.json({ ok: true, items: result.rows });
  } catch (err) {
    console.error('GET settings failed:', err);
    res.status(500).json({ ok: false, error: 'Could not load settings.' });
  }
});

app.put('/api/admin/settings', authenticateAdmin, cap('settings.manage'), async (req, res) => {
  const parsed = z.object({
    key: z.string().min(1),
    value: z.any(),
    group_name: z.string().optional().default('general'),
    label: z.string().optional().default(''),
    type: z.enum(['text','number','boolean','json']).optional().default('text'),
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ ok: false, error: 'Invalid data.' });

  try {
    const result = await pool.query(
      `INSERT INTO settings (key, value, group_name, label, type)
       VALUES ($1, $2::jsonb, $3, $4, $5)
       ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, group_name = $3, label = $4, type = $5, updated_at = now()
       RETURNING key, value, group_name, label, type, updated_at`,
      [parsed.data.key, JSON.stringify(parsed.data.value), parsed.data.group_name, parsed.data.label, parsed.data.type],
    );
    res.json({ ok: true, item: result.rows[0] });
  } catch (err) {
    console.error('PUT settings failed:', err);
    res.status(500).json({ ok: false, error: 'Could not save setting.' });
  }
});

app.delete('/api/admin/settings/:key', authenticateAdmin, cap('settings.manage'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM settings WHERE key = $1 RETURNING key', [req.params.key]);
    if (result.rows.length === 0) return res.status(404).json({ ok: false, error: 'Not found.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE setting failed:', err);
    res.status(500).json({ ok: false, error: 'Could not delete setting.' });
  }
});

// ---------------------------------------------------------------------------
// Overview stats
// ---------------------------------------------------------------------------
app.get('/api/admin/overview', authenticateAdmin, async (_req, res) => {
  try {
    const [works, blogs, team, projects, invoices, agreements, policies, users] = await Promise.all([
      pool.query("SELECT COUNT(*) FILTER (WHERE published=true) as published, COUNT(*) as total FROM works"),
      pool.query("SELECT COUNT(*) FILTER (WHERE published=true) as published, COUNT(*) as total FROM blogs"),
      pool.query("SELECT COUNT(*) FILTER (WHERE is_active=true) as published, COUNT(*) as total FROM team_members"),
      pool.query("SELECT COUNT(*) FILTER (WHERE status!='completed') as published, COUNT(*) as total FROM projects"),
      pool.query("SELECT COUNT(*) FILTER (WHERE status='paid') as published, COUNT(*) FILTER (WHERE status='overdue') as overdue, COUNT(*) as total FROM invoices"),
      pool.query("SELECT COUNT(*) FILTER (WHERE status='signed') as published, COUNT(*) as total FROM agreements"),
      pool.query("SELECT COUNT(*) FILTER (WHERE status='published') as published, COUNT(*) as total FROM policies"),
      pool.query("SELECT COUNT(*) FILTER (WHERE is_active=true) as published, COUNT(*) as total FROM admin_users"),
    ]);
    res.json({
      ok: true,
      overview: {
        works: { published: works.rows[0].published, total: works.rows[0].total },
        blogs: { published: blogs.rows[0].published, total: blogs.rows[0].total },
        team: { published: team.rows[0].published, total: team.rows[0].total },
        projects: { published: projects.rows[0].published, total: projects.rows[0].total },
        invoices: { published: invoices.rows[0].published, overdue: invoices.rows[0].overdue, total: invoices.rows[0].total },
        agreements: { published: agreements.rows[0].published, total: agreements.rows[0].total },
        policies: { published: policies.rows[0].published, total: policies.rows[0].total },
        users: { published: users.rows[0].published, total: users.rows[0].total },
      },
    });
  } catch (err) {
    console.error('GET overview failed:', err);
    res.status(500).json({ ok: false, error: 'Could not load overview.' });
  }
});

// ---------------------------------------------------------------------------
// File upload (R2)
// ---------------------------------------------------------------------------
app.post('/api/upload', authenticateAdmin, upload.array('files', 5), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ ok: false, error: 'No files uploaded.' });
    }

    const purpose = ['enquiry-attachment','project-asset','brand-asset','marketing-attetach'].includes(req.body.purpose) ? req.body.purpose : 'brand-asset';

    const results = await Promise.all(files.map(async (file) => {
      const safeName = file.originalname.replace(/[^\w.\- ]+/g, '_').slice(-120);
      const key = `${purpose}/${crypto.randomUUID()}-${safeName}`;
      await r2Upload(key, file.buffer, file.mimetype);
      return {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        key,
        publicUrl: r2PublicUrl(key),
      };
    }));

    res.json({ ok: true, files: results });
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ ok: false, error: 'Upload failed.' });
  }
});

app.delete('/api/upload/*', authenticateAdmin, async (req, res) => {
  try {
    const key = req.params[0];
    if (!key) return res.status(400).json({ ok: false, error: 'Missing file key.' });
    await r2Delete(key);
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete file failed:', err);
    res.status(500).json({ ok: false, error: 'Failed to delete file.' });
  }
});

// ---------------------------------------------------------------------------
// 404
// ---------------------------------------------------------------------------
app.use('/api', (_req, res) => {
  res.status(404).json({ ok: false, error: 'Not found.' });
});

// ---- start ----
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`MovoX API listening on :${PORT}`);
  });
}

export default app;
