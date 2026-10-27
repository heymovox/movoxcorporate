/**
 * MovoX enquiry backend — Express middleware server with Neon PostgreSQL.
 *
 * Run: npm run server
 *
 * Middleware stack:
 *   1. Security headers (CSP, X-Frame-Options, etc.)
 *   2. JSON body parsing with strict size limit
 *   3. Origin allow-list check
 *   4. Rate limiting (in-memory; swap for Redis in production)
 *   5. Honeypot spam trap + Zod schema validation
 *   6. Enquiry persistence to Neon PostgreSQL
 *   7. File upload to Cloudflare R2 (S3-compatible)
 *
 * Email notifications: implement sendEnquiryNotification() with your
 * transactional provider (Postmark, SES, Resend). Never log form payloads.
 */
import express, { type Request, type Response, type NextFunction } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import crypto from 'node:crypto';
import multer from 'multer';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { createAdminRouter } from './admin.js';
import { createProjectsRouter } from './projects.js';
import { requireCap } from './rbac.js';

interface EnquiryData {
  id: string;
  name: string;
  business: string;
  email: string;
  phone: string;
  service: string;
  budget: string;
  timeline: string;
  brief: string;
  receivedAt: string;
}

dotenv.config({ path: new URL('.env', import.meta.url) });

const PORT = Number(process.env.PORT || 8787) || 8787;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? 'https://heymovox.com';

const ALLOWED_ORIGINS = new Set<string>([
  ALLOWED_ORIGIN,
  // The project's own surfaces, so the www site and the subdomain-hosted
  // admin/portal builds can call the API even when no ALLOWED_ORIGINS env
  // var is configured on the deployment.
  'https://heymovox.com',
  'https://www.heymovox.com',
  'https://admin.heymovox.com',
  'https://portal.heymovox.com',
  'https://secure.heymovox.com',
  ...(process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
]);

if (process.env.NODE_ENV !== 'production') {
  for (let port = 5173; port <= 5180; port += 1) {
    ALLOWED_ORIGINS.add(`http://localhost:${port}`);
    ALLOWED_ORIGINS.add(`http://127.0.0.1:${port}`);
    // Subdomain forms of the dev server, so the admin/portal hosts can be
    // exercised locally exactly as they work in production.
    ALLOWED_ORIGINS.add(`http://admin.localhost:${port}`);
    ALLOWED_ORIGINS.add(`http://portal.localhost:${port}`);
    ALLOWED_ORIGINS.add(`http://secure.localhost:${port}`);
  }
}

const DATABASE_URL = process.env.DATABASE_URL;

// Do not exit when the environment is incomplete. On a serverless platform
// an exit at import time turns every /api request into an opaque
// FUNCTION_INVOCATION_FAILED; staying up lets /api/health report exactly what
// is missing and lets each route answer with a JSON error instead.
if (!DATABASE_URL) {
  console.error(
    'WARNING: DATABASE_URL is not set. The API will boot, but every query will fail until it is configured.',
  );
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

function generateToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token: string): { id: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}

/**
 * Authenticates any signed-in account and attaches the live DB user to the
 * request. Role is read from the database (not the token) so a role change
 * takes effect immediately rather than waiting for the JWT to expire.
 */
async function authenticateAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT id, email, name, role, company, is_active FROM admin_users WHERE id = $1',
      [payload.id],
    );
    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const user = result.rows[0];
    if (!user.is_active) {
      res.status(403).json({ error: 'This account has been deactivated.' });
      return;
    }
    (req as any).admin = user;
    next();
  } finally {
    client.release();
  }
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected pool error', err);
});

// Cloudflare R2 (S3-compatible) client. Built lazily so the server still
// boots — and login keeps working — when R2 is not configured; only the
// upload endpoints need it.
let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!r2Client) {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_S3_API_URL,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return r2Client;
}

const R2_BUCKET = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

const enquirySchema = z.object({
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
});

const newsletterSchema = z.object({
  email: z.string().trim().email().max(120),
  // Honeypot — must stay empty. Bots that fill every field get a fake success.
  website: z.string().max(120).optional().default(''),
});

const uploadPurposeSchema = z.enum(['enquiry-attachment', 'project-asset', 'brand-asset', 'marketing-asset']);

const uploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
  purpose: uploadPurposeSchema.optional().default('enquiry-attachment'),
  maxSize: z.number().int().positive().max(50 * 1024 * 1024).optional().default(10 * 1024 * 1024), // default 10MB
});

const publicSignSchema = z.object({
  signature: z.string().startsWith('data:image/png;base64,').max(400_000),
  name: z.string().trim().max(120).optional().default(''),
});

const app = express();

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      req.headers['access-control-request-headers'] ?? 'Authorization, Content-Type',
    );
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
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'",
  );
  next();
});

app.use(express.json({ limit: '32kb' }));

// Fail fast when the database cannot possibly work. With no DATABASE_URL the
// pool's default connection attempt can stall (or an async throw can escape
// this Express 4 handler) until the platform kills the invocation, leaving
// browser clients spinner-locked on a pending fetch. /api/health stays
// reachable so the deployment remains diagnosable from outside.
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  if (!DATABASE_URL && req.path !== '/health') {
    return res.status(503).json({
      ok: false,
      error: 'The API database is not configured on this deployment.',
    });
  }
  next();
});

const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 60 * 1000;
const MAX_REQUESTS = 10;

/**
 * Rate limiter + origin check for public write endpoints.
 * Buckets are namespaced per mount path so newsletter traffic can't eat into
 * an enquiry sender's allowance.
 */
function publicWriteLimiter(mountPath: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'POST') return next();

    const origin = req.headers.origin;
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return res.status(403).json({ error: 'Origin not allowed.' });
    }

    const now = Date.now();
    const key = `${mountPath}|${req.ip ?? 'unknown'}`;
    const bucket = rateBuckets.get(key);

    if (!bucket || bucket.resetAt < now) {
      rateBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    } else if (bucket.count >= MAX_REQUESTS) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    } else {
      bucket.count += 1;
    }

    next();
  };
}

app.use('/api/enquiries', publicWriteLimiter('/api/enquiries'));
app.use('/api/newsletter', publicWriteLimiter('/api/newsletter'));

// Multer configuration for file uploads (memory storage for small files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 5,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip', 'application/x-zip-compressed',
      'text/plain', 'text/csv',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

async function sendEnquiryNotification(enquiry: EnquiryData): Promise<void> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? 'MovoX <no-reply@heymovox.com>';
  const to = process.env.ENQUIRY_NOTIFY_TO ?? 'info@heymovox.com';

  if (!host || !user || !pass) {
    console.warn('SMTP not configured — skipping enquiry notification');
    return;
  }

  const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });

  const e = enquiry as EnquiryData;
  const subject = `New project enquiry: ${e.name ?? 'Untitled'}`;
  const text = [
    `New project enquiry received at ${e.receivedAt ?? new Date().toISOString()}`,
    '',
    `Name: ${e.name}`,
    `Business: ${e.business}`,
    `Email: ${e.email}`,
    `Phone: ${e.phone ?? '—'}`,
    `Service: ${e.service}`,
    `Budget: ${e.budget}`,
    `Timeline: ${e.timeline}`,
    `Brief: ${e.brief}`,
    '',
    `Enquiry ID: ${e.id}`,
  ].join('\n');

  await transporter.sendMail({ from, to, subject, text });
}

app.post('/api/enquiries', async (req: Request, res: Response) => {
  const parsed = enquirySchema.safeParse(req.body);

  if (!parsed.success || parsed.data.website !== '') {
    return res.status(422).json({ error: 'Invalid enquiry payload.' });
  }

  const data = parsed.data;
  const id = crypto.randomUUID();
  const receivedAt = new Date().toISOString();

  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO enquiries (id, name, business, email, phone, service, budget, timeline, brief, consent, received_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        crypto.randomUUID(),
        data.name,
        data.business,
        data.email,
        data.phone,
        data.service,
        data.budget,
        data.timeline,
        data.brief,
        data.consent,
        receivedAt,
        req.ip,
        req.headers['user-agent'] ?? null,
      ],
    );
    const notificationData: EnquiryData = {
      id,
      receivedAt,
      name: parsed.data.name,
      business: parsed.data.business,
      email: parsed.data.email,
      phone: parsed.data.phone ?? '',
      service: parsed.data.service,
      budget: parsed.data.budget,
      timeline: parsed.data.timeline,
      brief: parsed.data.brief,
    };
    await sendEnquiryNotification(notificationData).catch(() => undefined);
    return res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error('Failed to store enquiry:', err);
    return res.status(500).json({ error: 'Could not store enquiry. Please email info@heymovox.com.' });
  } finally {
    client.release();
  }
});

/**
 * Footer newsletter signup.
 *
 * Stored in `enquiries` with source='newsletter' so it surfaces in the admin
 * Enquiries screen alongside real leads. budget/timeline are NOT NULL on that
 * table, so they get an explicit placeholder rather than a silent default.
 */
app.post('/api/newsletter', async (req: Request, res: Response) => {
  const parsed = newsletterSchema.safeParse(req.body);

  // Honeypot filled: answer as if it worked so bots learn nothing.
  if (parsed.success && parsed.data.website !== '') {
    return res.status(200).json({ ok: true });
  }

  if (!parsed.success) {
    return res.status(422).json({ error: 'Please provide a valid email address.' });
  }

  const email = parsed.data.email.toLowerCase();
  const client = await pool.connect();

  try {
    // Re-subscribing updates the existing row instead of duplicating it.
    const { rows } = await client.query(
      `INSERT INTO enquiries
         (id, name, business, email, phone, service, budget, timeline, brief, consent, source, received_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, '', 'Newsletter', 'n/a', 'n/a', $5, true, 'newsletter', $6, $7, $8)
       ON CONFLICT (email) WHERE source = 'newsletter'
       DO UPDATE SET created_at = now(), ip_address = EXCLUDED.ip_address, user_agent = EXCLUDED.user_agent
       RETURNING id`,
      [
        crypto.randomUUID(),
        'Newsletter subscriber',
        'Newsletter',
        email,
        'Subscribed via the footer newsletter form.',
        new Date().toISOString(),
        req.ip,
        req.headers['user-agent'] ?? null,
      ],
    );

    return res.status(201).json({ ok: true, id: rows[0]?.id });
  } catch (err) {
    console.error('Failed to store newsletter signup:', err);
    return res
      .status(500)
      .json({ error: 'Could not subscribe right now. Please email info@heymovox.com.' });
  } finally {
    client.release();
  }
});

// Get presigned URL for file upload to R2. Signed-in accounts only — an
// unguarded presigner hands anonymous callers a write URL into the bucket.
app.post('/api/upload/presign', authenticateAdmin, async (req: Request, res: Response) => {
  const parsed = uploadSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({ error: 'Invalid upload request.', details: parsed.error.flatten() });
  }

  const { filename, contentType, purpose, maxSize } = parsed.data;
  const key = `${purpose}/${crypto.randomUUID()}-${filename}`;

  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    // getR2Client() (not the raw `r2Client` binding): the client is built
    // lazily, so on a cold instance the variable is still null here and the
    // presigner throws `Cannot read properties of null (reading 'config')`.
    const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 3600 }); // 1 hour

    return res.json({
      uploadUrl,
      key,
      publicUrl: `${R2_PUBLIC_URL}/${key}`,
      expiresIn: 3600,
      maxSize,
    });
  } catch (err) {
    console.error('Failed to generate presigned URL:', err);
    return res.status(500).json({ error: 'Could not generate upload URL.' });
  }
});

// Upload file directly (for small files via multipart/form-data).
// authenticateAdmin runs before multer, so an anonymous request is refused
// before any bytes are buffered into memory.
app.post('/api/upload', authenticateAdmin, upload.array('files', 5), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];

    // `purpose` arrives in the request body, so it is only used as an
    // object-key prefix once it matches one of the known values.
    const purposeParsed = uploadPurposeSchema.safeParse(req.body.purpose);
    const purpose = purposeParsed.success ? purposeParsed.data : 'enquiry-attachment';

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    const results = await Promise.all(files.map(async (file) => {
      const safeName = file.originalname.replace(/[^\w.\- ]+/g, '_').slice(-120);
      const key = `${purpose}/${crypto.randomUUID()}-${safeName}`;

      await getR2Client().send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));

      return {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        key,
        publicUrl: `${R2_PUBLIC_URL}/${key}`,
      };
    }));

    return res.json({ files: results });
  } catch (err) {
    console.error('File upload failed:', err);
    return res.status(500).json({ error: 'File upload failed.' });
  }
});

// Delete file from R2 (signed-in accounts only).
// The wildcard is required: every object key is `purpose/uuid-name`, so a
// single-segment :key param can never match a real key.
app.delete('/api/upload/*', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const key = req.params[0];
    if (!key) return res.status(400).json({ error: 'Missing file key.' });
    await getR2Client().send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return res.json({ ok: true });
  } catch (err) {
    console.error('Failed to delete file:', err);
    return res.status(500).json({ error: 'Failed to delete file.' });
  }
});

// Get presigned URL for file download (signed-in accounts only).
// Wildcard for the same reason as the delete route above.
app.get('/api/upload/*/presign', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const key = req.params[0];
    if (!key) return res.status(400).json({ error: 'Missing file key.' });
    const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: key });
    const downloadUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 3600 });
    return res.json({ downloadUrl, expiresIn: 3600 });
  } catch (err) {
    console.error('Failed to generate download URL:', err);
    return res.status(500).json({ error: 'Could not generate download URL.' });
  }
});

// Admin authentication endpoints
const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

app.post('/api/admin/login', async (req: Request, res: Response) => {
  const parsed = adminLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid credentials.' });
  }

  const { email, password } = parsed.data;
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT id, email, password_hash, name, role FROM admin_users WHERE email = $1', [parsed.data.email]);
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }
      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }
      await client.query('UPDATE admin_users SET last_login = now() WHERE id = $1', [user.id]);
      const token = generateToken({ id: user.id, email: user.email, role: user.role });
      return res.json({
        ok: true,
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      });
    } finally {
      client.release();
    }
  } catch (err) {
    // An async error escaping this Express 4 handler would otherwise hang the
    // request forever — the browser's Sign in button spins indefinitely.
    console.error('POST /api/admin/login failed:', err);
    return res
      .status(500)
      .json({ error: 'Sign in is unavailable right now. Please try again shortly.' });
  }
});

app.post('/api/admin/logout', authenticateAdmin, async (_req: Request, res: Response) => {
  return res.json({ ok: true });
});

app.get('/api/admin/me', authenticateAdmin, async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  return res.json({ ok: true, user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } });
});

// Admin dashboard endpoints
app.get('/api/admin/stats', authenticateAdmin, requireCap('enquiries.view'), async (_req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const [enquiriesCount, enquiriesToday, enquiriesThisWeek, enquiriesThisMonth] = await Promise.all([
      client.query('SELECT COUNT(*) as count FROM enquiries'),
      client.query(`SELECT COUNT(*) as count FROM enquiries WHERE created_at >= CURRENT_DATE`),
      client.query(`SELECT COUNT(*) as count FROM enquiries WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`),
      client.query(`SELECT COUNT(*) as count FROM enquiries WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'`),
    ]);
    return res.json({
      ok: true,
      stats: {
        total: parseInt(enquiriesCount.rows[0].count),
        today: parseInt(enquiriesToday.rows[0].count),
        thisWeek: parseInt(enquiriesThisWeek.rows[0].count),
        thisMonth: parseInt(enquiriesThisMonth.rows[0].count),
      },
    });
  } finally {
    client.release();
  }
});

app.get(
  '/api/admin/enquiries',
  authenticateAdmin,
  requireCap('enquiries.view'),
  async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;
  const service = req.query.service as string | undefined;
  const search = req.query.search as string | undefined;

  const client = await pool.connect();
  try {
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (service) {
      whereClause += `WHERE service = $${paramIndex++}`;
      params.push(service);
    }
    if (search) {
      whereClause += whereClause ? ` AND (name ILIKE $${paramIndex} OR business ILIKE $${paramIndex} OR email ILIKE $${paramIndex})` : `WHERE (name ILIKE $${paramIndex} OR business ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    params.push(limit, offset);
    const [countResult, dataResult] = await Promise.all([
      client.query(`SELECT COUNT(*) as total FROM enquiries ${whereClause}`, params.slice(0, -2)),
      client.query(
        `SELECT id, name, business, email, phone, service, budget, timeline, brief, source, created_at
         FROM enquiries ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        params,
      ),
    ]);

    return res.json({
      ok: true,
      enquiries: dataResult.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
      },
    });
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------------
// Client signing — public, token-scoped, read-only apart from the signature.
//
// The token is the only credential. These routes deliberately expose no
// mutation surface beyond storing the client's own signature, so a shared
// link can never be used to edit the agreement or read admin data.
// ---------------------------------------------------------------------------
const publicAgreementCols = `
  a.id, a.title, a.reference, a.agreement_type, a.status,
  a.client_name, a.client_company, a.client_rep_name, a.client_rep_designation,
  a.project_name, a.effective_date, a.expiry_date,
  a.movox_rep_name, a.movox_rep_designation,
  a.law_state, a.law_city, a.law_country,
  a.client_signature, a.client_signed_name, a.client_signed_at,
  a.movox_signature, a.movox_signed_name, a.movox_signed_at,
  a.schedule_a
`;

app.get('/api/public/agreement/:token', async (req: Request, res: Response) => {
  try {
    const found = await pool.query('SELECT id FROM agreements WHERE share_token = $1', [
      req.params.token,
    ]);
    if (found.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'This link is not valid or has been revoked.' });
    }
    const id = found.rows[0].id;

    // first open marks it viewed (best-effort, never blocks the read)
    void pool.query(
      `UPDATE agreements SET client_viewed_at = COALESCE(client_viewed_at, now()) WHERE id = $1`,
      [id],
    ).catch(() => undefined);

    const result = await pool.query(
      `SELECT ${publicAgreementCols} FROM agreements a WHERE a.id = $1`,
      [id],
    );
    return res.json({ ok: true, agreement: result.rows[0] });
  } catch (err) {
    console.error('GET public agreement failed:', err);
    return res.status(500).json({ ok: false, error: 'Could not load the agreement.' });
  }
});

app.post('/api/public/agreement/:token/sign', async (req: Request, res: Response) => {
  const parsed = publicSignSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ ok: false, error: 'Invalid signature payload.' });
  }

  try {
    const found = await pool.query(
      `SELECT id, client_rep_name, client_name, client_signature FROM agreements WHERE share_token = $1`,
      [req.params.token],
    );
    if (found.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'This link is not valid or has been revoked.' });
    }

    const row = found.rows[0];
    if (row.client_signature) {
      return res.status(409).json({
        ok: false,
        error: 'This agreement has already been signed. Please contact MovoX if you need to amend it.',
      });
    }

    const name = parsed.data.name.trim() || row.client_rep_name || row.client_name;

    const updated = await pool.query(
      `UPDATE agreements
       SET client_signature = $1,
           client_signed_name = $2,
           client_signed_at  = now(),
           status = CASE WHEN status IN ('cancelled', 'expired') THEN status ELSE 'signed' END,
           updated_at = now()
       WHERE id = $3
       RETURNING client_signature, client_signed_name, client_signed_at, status`,
      [parsed.data.signature, name, row.id],
    );

    return res.json({ ok: true, ...updated.rows[0] });
  } catch (err) {
    console.error('POST public sign failed:', err);
    return res.status(500).json({ ok: false, error: 'Could not save the signature.' });
  }
});

// Public content reads (no auth). These are the source of truth for the
// marketing pages; the client falls back to the bundled static data files
// when a table is empty so the site never renders blank.
app.get('/api/content/works', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, slug, title, client, client_descriptor, category, services, year,
              summary, image, challenge, objectives, approach, deliverables, results,
              quote, is_sample, sort_order
       FROM works WHERE published = true
       ORDER BY sort_order ASC, created_at DESC`,
    );
    return res.json({ ok: true, items: result.rows });
  } catch (err) {
    console.error('GET /api/content/works failed:', err);
    return res.status(500).json({ ok: false, error: 'Could not load work.' });
  }
});

app.get('/api/content/works/:slug', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, slug, title, client, client_descriptor, category, services, year,
              summary, image, challenge, objectives, approach, deliverables, results,
              quote, is_sample, sort_order
       FROM works WHERE published = true AND slug = $1`,
      [req.params.slug],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Not found.' });
    }
    return res.json({ ok: true, item: result.rows[0] });
  } catch (err) {
    console.error('GET /api/content/works/:slug failed:', err);
    return res.status(500).json({ ok: false, error: 'Could not load work.' });
  }
});

app.get('/api/content/blogs', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, slug, title, excerpt, category, published_on, reading_minutes,
              image, author, author_role, body, related_services
       FROM blogs WHERE published = true
       ORDER BY published_on DESC`,
    );
    return res.json({ ok: true, items: result.rows });
  } catch (err) {
    console.error('GET /api/content/blogs failed:', err);
    return res.status(500).json({ ok: false, error: 'Could not load blogs.' });
  }
});

app.get('/api/content/blogs/:slug', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, slug, title, excerpt, category, published_on, reading_minutes,
              image, author, author_role, body, related_services
       FROM blogs WHERE published = true AND slug = $1`,
      [req.params.slug],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Not found.' });
    }
    return res.json({ ok: true, item: result.rows[0] });
  } catch (err) {
    console.error('GET /api/content/blogs/:slug failed:', err);
    return res.status(500).json({ ok: false, error: 'Could not load blog.' });
  }
});

app.get('/api/content/team', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, role, bio, email, photo, linkedin, twitter, sort_order
       FROM team_members WHERE is_active = true
       ORDER BY sort_order ASC, name ASC`,
    );
    return res.json({ ok: true, items: result.rows });
  } catch (err) {
    console.error('GET /api/content/team failed:', err);
    return res.status(500).json({ ok: false, error: 'Could not load team.' });
  }
});

app.get('/api/content/policies', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, slug, title, category, summary, content, version, effective_date, sort_order
       FROM policies WHERE status = 'published'
       ORDER BY sort_order ASC, title ASC`,
    );
    return res.json({ ok: true, items: result.rows });
  } catch (err) {
    console.error('GET /api/content/policies failed:', err);
    return res.status(500).json({ ok: false, error: 'Could not load policies.' });
  }
});

app.get('/api/content/policies/:slug', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, slug, title, category, summary, content, version, effective_date, sort_order
       FROM policies WHERE status = 'published' AND slug = $1`,
      [req.params.slug],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Not found.' });
    }
    return res.json({ ok: true, item: result.rows[0] });
  } catch (err) {
    console.error('GET /api/content/policies/:slug failed:', err);
    return res.status(500).json({ ok: false, error: 'Could not load policy.' });
  }
});

// Liveness + configuration probe. Returns presence/health booleans only —
// never values — so it is safe to expose and a misconfigured deployment can
// be diagnosed with a single curl instead of guessing from 500s.
app.get('/api/health', async (_req: Request, res: Response) => {
  let database: 'ok' | 'unconfigured' | 'unreachable' = 'unconfigured';
  if (DATABASE_URL) {
    try {
      await pool.query('SELECT 1');
      database = 'ok';
    } catch {
      database = 'unreachable';
    }
  }
  return res.json({
    ok: database === 'ok',
    env: {
      database,
      jwt_secret: Boolean(process.env.JWT_SECRET),
      r2: Boolean(
        process.env.R2_ACCESS_KEY_ID &&
          process.env.R2_SECRET_ACCESS_KEY &&
          process.env.R2_S3_API_URL &&
          process.env.R2_BUCKET_NAME,
      ),
    },
    uptime_s: Math.round(process.uptime()),
  });
});

// Public maintenance-mode flag. Read by the site shell before it renders so
// visitors see the maintenance page instead of the normal site.
app.get('/api/content/maintenance', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT value FROM settings WHERE key = 'maintenance_mode'`,
    );
    const maintenance = result.rows.length > 0 && result.rows[0].value === true;
    return res.json({ ok: true, maintenance });
  } catch (err) {
    console.error('GET /api/content/maintenance failed:', err);
    return res.status(500).json({ ok: false, error: 'Could not load maintenance flag.' });
  }
});

// Admin CRUD for content & operations (works, blogs, team, invoices,
// agreements, policies, settings, users). Mounted last so the explicit
// /api/admin/login and /api/admin/me handlers above still take precedence.
app.use(createAdminRouter(pool, authenticateAdmin));

// Projects: staff + client access with row-level scoping.
app.use(createProjectsRouter(pool, authenticateAdmin));

app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found.' });
});

// On Vercel this file runs as a serverless function and is invoked through the
// default export below, so only bind a port when running standalone.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`MovoX enquiry API listening on :${PORT}`);
  });
}

export default app;

process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});