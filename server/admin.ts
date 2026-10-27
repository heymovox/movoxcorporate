/**
 * MovoX admin content API — CRUD over Neon PostgreSQL.
 *
 * Mounted at /api/admin by index.ts. Every route here runs behind
 * `authenticateAdmin`; the router refuses to mount if that guard is missing.
 *
 * Conventions
 *   - Column names and snake_case match the database exactly.
 *   - `updated_at` is stamped here (see schema.sql note) rather than by a trigger.
 *   - Every handler returns `{ ok: true, ... }` or `{ ok: false, error }`.
 */
import express, { type Request, type Response, type Router, type NextFunction } from 'express';
import type { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import crypto from 'node:crypto';
import {
  requireCap,
  requireLeadership,
  requireStaff,
  normaliseRole,
  can,
} from './rbac.js';
import { sendMail, credentialsEmail, roleChangedEmail } from './mail.js';

type Guard = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

/** Wrap requireCap so it satisfies the Guard signature. */
const staff: Guard = (req, res, next) => requireStaff()(req, res, next);
const cap = (c: Parameters<typeof requireCap>[0]): Guard => (req, res, next) =>
  requireCap(c)(req, res, next);

/** Columns a client may set, and which are echoed back. */
interface FieldDef {
  /** DB column name. */
  column: string;
  /** zod type used to validate the incoming value. */
  schema: z.ZodTypeAny;
  /** SQL cast applied to the bound parameter, e.g. 'jsonb' or 'text[]'. */
  sqlCast?: string;
}

interface ResourceDef {
  table: string;
  /** z.object of the writable fields. */
  schema: z.ZodTypeAny;
  /** z.object of the fields accepted on PATCH (partial update). */
  patchSchema: z.ZodTypeAny;
  /** Columns to SELECT (defaults to `*`). */
  columns?: string;
  /** ORDER BY clause (without the keyword). */
  orderBy?: string;
  /** Extra filters applied to list queries. */
  searchColumns?: string[];
  /** Enum-ish column used by ?status= filtering. */
  statusColumn?: string;
  /** column -> SQL cast. Required for every jsonb column. */
  casts?: Record<string, string>;
  /** Capability required to read. Defaults to staff-only. */
  read?: Capability;
  /** Capability required to create/update/delete. */
  write?: Capability;
  /**
   * Runs after a successful create. Extra keys are merged into the JSON
   * response so a hook can report side effects (e.g. the login account
   * generated for a team member) without changing the item itself.
   */
  afterCreate?: (
    item: Record<string, any>,
    req: Request,
  ) => Promise<Record<string, unknown> | undefined>;
}

import type { Capability } from './rbac.js';

/**
 * Prepare a value for the wire.
 *
 * node-postgres serialises *any* JS array as a Postgres array literal, which
 * silently corrupts `jsonb` columns (you get {"{\"k\":\"v\"}"}). So jsonb
 * values are JSON-encoded here and cast explicitly in the statement, while
 * real `text[]` columns can use pg's native array serialisation.
 */
const bind = (f: FieldDef, value: any) => {
  if (f.sqlCast === 'jsonb') {
    return value === undefined ? null : JSON.stringify(value);
  }
  return value;
};

const castSuffix = (f: FieldDef) => (f.sqlCast ? `::${f.sqlCast}` : '');

/** Build `SET a = $1::jsonb, b = $2` plus the params array for a validated payload. */
function buildUpdate(
  fieldDefs: FieldDef[],
  payload: Record<string, unknown>,
  startIndex: number,
): { clause: string; params: any[]; next: number } {
  const clauses: string[] = [];
  const params: any[] = [];
  let i = startIndex;

  for (const f of fieldDefs) {
    if (!(f.column in payload)) continue;
    clauses.push(`${f.column} = $${i++}${castSuffix(f)}`);
    params.push(bind(f, payload[f.column]));
  }

  clauses.push(`updated_at = now()`);
  return { clause: clauses.join(', '), params, next: i };
}

export function createAdminRouter(pool: Pool, authenticateAdmin: Guard): Router {
  const router = express.Router();

  if (typeof authenticateAdmin !== 'function') {
    throw new Error('createAdminRouter requires an authenticateAdmin guard');
  }

  router.use(authenticateAdmin);

  // -------------------------------------------------------------------------
  // generic CRUD
  // -------------------------------------------------------------------------
  function register(def: ResourceDef) {
    const base = `/api/admin/${def.table}`;
    const shape = def.schema instanceof z.ZodObject ? def.schema.shape : {};

    const fieldDefs: FieldDef[] = Object.entries(shape).map(([column, schema]) => ({
      column,
      schema: schema as z.ZodTypeAny,
      sqlCast: def.casts?.[column],
    }));

    const selectCols = def.columns ?? '*';
    const readGuard = cap(def.read ?? 'content.view');
    const writeGuard = cap(def.write ?? 'content.edit');

    // list
    router.get(base, readGuard, async (req: Request, res: Response) => {
      const where: string[] = [];
      const params: any[] = [];
      let i = 1;

      if (def.statusColumn && typeof req.query.status === 'string' && req.query.status) {
        where.push(`${def.statusColumn} = $${i++}`);
        params.push(req.query.status);
      }
      if (def.searchColumns?.length && typeof req.query.search === 'string' && req.query.search) {
        const ors = def.searchColumns.map(c => `${c} ILIKE $${i}`);
        where.push(`(${ors.join(' OR ')})`);
        params.push(`%${req.query.search}%`);
        i += 1;
      }

      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const orderSql = def.orderBy ?? 'created_at DESC';

      try {
        const result = await pool.query(
          `SELECT ${selectCols} FROM ${def.table} ${whereSql} ORDER BY ${orderSql} LIMIT 500`,
          params,
        );
        return res.json({ ok: true, items: result.rows });
      } catch (err) {
        console.error(`GET ${base} failed:`, err);
        return res.status(500).json({ ok: false, error: 'Could not load records.' });
      }
    });

    // get one
    router.get(`${base}/:id`, readGuard, async (req: Request, res: Response) => {
      try {
        const result = await pool.query(
          `SELECT ${selectCols} FROM ${def.table} WHERE id = $1`,
          [req.params.id],
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ ok: false, error: 'Not found.' });
        }
        return res.json({ ok: true, item: result.rows[0] });
      } catch (err) {
        console.error(`GET ${base}/:id failed:`, err);
        return res.status(500).json({ ok: false, error: 'Could not load record.' });
      }
    });

    // create
    router.post(base, writeGuard, async (req: Request, res: Response) => {
      const parsed = def.schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(422).json({
          ok: false,
          error: 'Validation failed.',
          details: parsed.error.flatten(),
        });
      }

      const payload = parsed.data as Record<string, any>;
      const cols: string[] = [];
      const vals: any[] = [];
      fieldDefs.forEach(f => {
        if (f.column in payload) {
          cols.push(f.column);
          vals.push(bind(f, payload[f.column]));
        }
      });

      const placeholders = cols.map((c, idx) => {
        const f = fieldDefs.find(fd => fd.column === c)!;
        return `$${idx + 1}${castSuffix(f)}`;
      });

      try {
        const result = await pool.query(
          `INSERT INTO ${def.table} (${cols.join(', ')})
           VALUES (${placeholders.join(', ')})
           RETURNING ${selectCols}`,
          vals,
        );

        // Side effects (login account + credentials email for team members)
        // must never fail the row that has already been written.
        let extra: Record<string, unknown> = {};
        if (def.afterCreate) {
          try {
            extra = (await def.afterCreate(result.rows[0], req)) ?? {};
          } catch (err) {
            console.error(`afterCreate for ${def.table} failed:`, err);
          }
        }

        return res.status(201).json({ ok: true, item: result.rows[0], ...extra });
      } catch (err: any) {
        console.error(`POST ${base} failed:`, err);
        if (err?.code === '23505') {
          return res.status(409).json({ ok: false, error: 'That value must be unique.' });
        }
        return res.status(500).json({ ok: false, error: 'Could not create record.' });
      }
    });

    // update
    router.patch(`${base}/:id`, writeGuard, async (req: Request, res: Response) => {
      const parsed = def.patchSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(422).json({
          ok: false,
          error: 'Validation failed.',
          details: parsed.error.flatten(),
        });
      }

      const { clause, params } = buildUpdate(fieldDefs, parsed.data as Record<string, any>, 1);

      try {
        const result = await pool.query(
          `UPDATE ${def.table} SET ${clause} WHERE id = $${params.length + 1} RETURNING ${selectCols}`,
          [...params, req.params.id],
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ ok: false, error: 'Not found.' });
        }
        return res.json({ ok: true, item: result.rows[0] });
      } catch (err: any) {
        console.error(`PATCH ${base}/:id failed:`, err);
        if (err?.code === '23505') {
          return res.status(409).json({ ok: false, error: 'That value must be unique.' });
        }
        return res.status(500).json({ ok: false, error: 'Could not update record.' });
      }
    });

    // delete
    router.delete(`${base}/:id`, writeGuard, async (req: Request, res: Response) => {
      try {
        const result = await pool.query(
          `DELETE FROM ${def.table} WHERE id = $1 RETURNING id`,
          [req.params.id],
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ ok: false, error: 'Not found.' });
        }
        return res.json({ ok: true });
      } catch (err) {
        console.error(`DELETE ${base}/:id failed:`, err);
        return res.status(500).json({ ok: false, error: 'Could not delete record.' });
      }
    });
  }

  // -------------------------------------------------------------------------
  // resources
  // -------------------------------------------------------------------------
  const optionalString = z.string().trim().optional().default('');
  const dateOrEmpty = z
    .union([z.string(), z.null()])
    .optional()
    .transform(v => (v === '' ? null : (v ?? null)));

  register({
    table: 'works',
    orderBy: 'sort_order ASC, created_at DESC',
    statusColumn: 'published',
    searchColumns: ['title', 'client', 'summary'],
    casts: {
      results: 'jsonb',
      quote: 'jsonb',
      services: 'text[]',
      objectives: 'text[]',
      approach: 'text[]',
      deliverables: 'text[]',
    },
    read: 'content.view',
    write: 'content.edit',
    schema: z.object({
      slug: z.string().trim().min(2).max(140),
      title: z.string().trim().min(2).max(200),
      client: optionalString,
      client_descriptor: optionalString,
      category: z.string().trim().min(1).max(60),
      services: z.array(z.string().trim().min(1)).default([]),
      year: optionalString,
      summary: optionalString,
      image: optionalString,
      challenge: optionalString,
      objectives: z.array(z.string()).default([]),
      approach: z.array(z.string()).default([]),
      deliverables: z.array(z.string()).default([]),
      results: z
        .array(z.object({ label: z.string(), value: z.string(), note: z.string().optional() }))
        .default([]),
      quote: z
        .object({
          text: z.string(),
          author: z.string(),
          role: z.string().optional(),
        })
        .nullable()
        .optional(),
      is_sample: z.boolean().default(false),
      published: z.boolean().default(true),
      sort_order: z.coerce.number().int().default(0),
    }),
    patchSchema: z.object({
      slug: z.string().trim().min(2).max(140).optional(),
      title: z.string().trim().min(2).max(200).optional(),
      client: z.string().optional(),
      client_descriptor: z.string().optional(),
      category: z.string().optional(),
      services: z.array(z.string()).optional(),
      year: z.string().optional(),
      summary: z.string().optional(),
      image: z.string().optional(),
      challenge: z.string().optional(),
      objectives: z.array(z.string()).optional(),
      approach: z.array(z.string()).optional(),
      deliverables: z.array(z.string()).optional(),
      results: z.array(z.object({ label: z.string(), value: z.string(), note: z.string().optional() })).optional(),
      quote: z.object({ text: z.string(), author: z.string(), role: z.string().optional() }).nullable().optional(),
      is_sample: z.boolean().optional(),
      published: z.boolean().optional(),
      sort_order: z.coerce.number().int().optional(),
    }),
  });

  register({
    table: 'blogs',
    orderBy: 'published_on DESC, created_at DESC',
    statusColumn: 'published',
    searchColumns: ['title', 'excerpt', 'author'],
    casts: { body: 'jsonb', related_services: 'text[]' },
    schema: z.object({
      slug: z.string().trim().min(2).max(160),
      title: z.string().trim().min(2).max(220),
      excerpt: optionalString,
      category: z.string().trim().min(1).max(60),
      published_on: z.string().trim().min(1),
      reading_minutes: z.coerce.number().int().min(1).max(180).default(5),
      image: optionalString,
      author: optionalString,
      author_role: optionalString,
      body: z
        .array(z.object({ heading: z.string().optional(), paragraphs: z.array(z.string()).default([]) }))
        .default([]),
      related_services: z.array(z.string()).default([]),
      published: z.boolean().default(true),
    }),
    patchSchema: z.object({
      slug: z.string().trim().min(2).max(160).optional(),
      title: z.string().trim().min(2).max(220).optional(),
      excerpt: z.string().optional(),
      category: z.string().optional(),
      published_on: z.string().optional(),
      reading_minutes: z.coerce.number().int().optional(),
      image: z.string().optional(),
      author: z.string().optional(),
      author_role: z.string().optional(),
      body: z.array(z.object({ heading: z.string().optional(), paragraphs: z.array(z.string()) })).optional(),
      related_services: z.array(z.string()).optional(),
      published: z.boolean().optional(),
    }),
  });

  /**
   * Company login addresses are firstname@heymovox.com (e.g.
   * sweatha@heymovox.com). Collisions get a numeric suffix instead of
   * failing, so two people with the same first name both get an account.
   */
  async function generateWorkEmail(name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .trim()
        .split(/\s+/)[0]
        ?.replace(/[^a-z0-9]/g, '') || 'user';

    for (let n = 1; n <= 50; n += 1) {
      const candidate = n === 1 ? `${base}@heymovox.com` : `${base}${n}@heymovox.com`;
      const exists = await pool.query('SELECT 1 FROM admin_users WHERE email = $1', [candidate]);
      if (exists.rows.length === 0) return candidate;
    }
    return `${base}.${crypto.randomInt(1000, 9999)}@heymovox.com`;
  }

  /** Generated sign-in password: 14 chars, always mixed-case + digit + symbol. */
  function generatePassword(): string {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnpqrstuvwxyz';
    const digits = '23456789';
    const symbols = '!@#$%&*?';
    const all = upper + lower + digits + symbols;
    const pick = (set: string) => set[crypto.randomInt(0, set.length)];
    const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];
    while (chars.length < 14) chars.push(pick(all));
    for (let i = chars.length - 1; i > 0; i -= 1) {
      const j = crypto.randomInt(0, i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
  }

  register({
    table: 'team_members',
    orderBy: 'sort_order ASC, name ASC',
    statusColumn: 'is_active',
    searchColumns: ['name', 'role', 'email'],
    read: 'users.view',
    write: 'users.manage',
    schema: z.object({
      name: z.string().trim().min(2).max(120),
      role: optionalString,
      bio: optionalString,
      email: z.union([z.literal(''), z.string().email()]).optional().default(''),
      phone: optionalString,
      photo: optionalString,
      linkedin: optionalString,
      twitter: optionalString,
      sort_order: z.coerce.number().int().default(0),
      is_active: z.boolean().default(true),
    }),
    patchSchema: z.object({
      name: z.string().trim().min(2).max(120).optional(),
      role: z.string().optional(),
      bio: z.string().optional(),
      email: z.union([z.literal(''), z.string().email()]).optional(),
      phone: z.string().optional(),
      photo: z.string().optional(),
      linkedin: z.string().optional(),
      twitter: z.string().optional(),
      sort_order: z.coerce.number().int().optional(),
      is_active: z.boolean().optional(),
    }),
    /**
     * A team member is also a person who signs in: creating one mints their
     * @heymovox.com login and emails the password to the personal address on
     * the form (the company address cannot receive its own password).
     */
    afterCreate: async (item) => {
      const personalEmail = String(item.email ?? '').trim();
      const workEmail = await generateWorkEmail(item.name);
      const password = generatePassword();
      const hash = await bcrypt.hash(password, 12);

      // Mirror the directory entry onto the login account: same photo and
      // phone, activated/deactivated together, personal address kept for
      // future notices such as role changes.
      try {
        await pool.query(
          `INSERT INTO admin_users
             (email, name, password_hash, role, phone, avatar, personal_email, notes, is_active)
           VALUES ($1, $2, $3, 'team_member', $4, $5, $6, $7, $8)`,
          [
            workEmail,
            item.name,
            hash,
            item.phone ?? '',
            item.photo ?? '',
            personalEmail,
            'Login created automatically when this person was added on the Team page.',
            item.is_active !== false,
          ],
        );
      } catch (err) {
        console.error('Could not create the login account for', workEmail, err);
        return { account: { email: '', error: 'the login account could not be created' } };
      }

      // With a personal address the password is emailed and never returned
      // again; without one (or if the send fails) the admin gets it in the
      // response to hand over, because the account already exists.
      let emailed = false;
      if (personalEmail) {
        const mail = credentialsEmail({
          name: item.name,
          workEmail,
          password,
          role: 'team_member',
        });
        emailed = (await sendMail({ to: personalEmail, ...mail })).sent;
      }

      return {
        account: {
          email: workEmail,
          emailed,
          ...(emailed ? {} : { password }),
        },
      };
    },
  });

  const statusEnum = z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']);

  register({
    table: 'invoices',
    orderBy: 'issue_date DESC, created_at DESC',
    statusColumn: 'status',
    searchColumns: ['invoice_number', 'client_name', 'client_company'],
    read: 'invoices.view',
    write: 'invoices.edit',
    schema: z.object({
      invoice_number: z.string().trim().min(1).max(40),
      client_name: z.string().trim().min(1).max(120),
      client_email: z.union([z.literal(''), z.string().email()]).optional().default(''),
      client_company: optionalString,
      client_gstin: optionalString,
      client_address: optionalString,
      issue_date: z.string().trim().min(1),
      due_date: dateOrEmpty,
      tax_rate: z.coerce.number().min(0).max(100).default(0),
      discount: z.coerce.number().min(0).default(0),
      currency: z.string().trim().min(3).max(4).default('INR'),
      status: statusEnum.default('draft'),
      notes: optionalString,
      terms: optionalString,
    }),
    patchSchema: z.object({
      invoice_number: z.string().trim().min(1).max(40).optional(),
      client_name: z.string().trim().min(1).max(120).optional(),
      client_email: z.union([z.literal(''), z.string().email()]).optional(),
      client_company: z.string().optional(),
      client_gstin: z.string().optional(),
      client_address: z.string().optional(),
      issue_date: z.string().optional(),
      due_date: dateOrEmpty,
      tax_rate: z.coerce.number().min(0).max(100).optional(),
      discount: z.coerce.number().min(0).optional(),
      currency: z.string().optional(),
      status: statusEnum.optional(),
      notes: z.string().optional(),
      terms: z.string().optional(),
      paid_at: dateOrEmpty,
    }),
  });

  const agreementStatus = z.enum(['draft', 'sent', 'signed', 'expired', 'terminated']);

  /**
   * Agreement fields shared by the create and patch schemas. `schedule_a`
   * holds the whole of Schedule A as one jsonb document so the generated
   * agreement and the stored record can never drift apart.
   */
  const agreementExtras = {
    project_name: z.string().optional(),
    client_address: z.string().optional(),
    client_gstin: z.string().optional(),
    client_phone: z.string().optional(),
    movox_rep_name: z.string().optional(),
    movox_rep_designation: z.string().optional(),
    movox_rep_email: z.string().optional(),
    client_rep_name: z.string().optional(),
    client_rep_designation: z.string().optional(),
    law_state: z.string().optional(),
    law_city: z.string().optional(),
    law_country: z.string().optional(),
    schedule_a: z.record(z.string(), z.any()).optional(),
    client_signature: z.string().max(400_000).optional(),
    client_signed_name: z.string().optional(),
    client_signed_at: z.union([z.string(), z.null()]).optional(),
    movox_signature: z.string().max(400_000).optional(),
    movox_signed_name: z.string().optional(),
    movox_signed_at: z.union([z.string(), z.null()]).optional(),
  };

  /**
   * Auto-generate an agreement reference: MBD-YYYYMMDD-XXXX.
   * Retries on the rare collision with an existing unique reference.
   */
  router.get('/api/admin/agreements/next-reference', cap('agreements.edit'), async (_req: Request, res: Response) => {
    const prefix = 'MBD';
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const stamp = `${y}${m}${d}`;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const rand = String(crypto.randomInt(0, 10000)).padStart(4, '0');
      const reference = `${prefix}-${stamp}-${rand}`;
      const exists = await pool.query('SELECT 1 FROM agreements WHERE reference = $1', [reference]);
      if (exists.rows.length === 0) {
        return res.json({ ok: true, reference });
      }
    }
    return res.status(500).json({ ok: false, error: 'Could not generate a unique reference.' });
  });

  register({
    table: 'agreements',
    orderBy: 'effective_date DESC NULLS LAST, created_at DESC',
    statusColumn: 'status',
    searchColumns: ['title', 'reference', 'client_name', 'client_company', 'project_name'],
    casts: { schedule_a: 'jsonb' },
    read: 'agreements.view',
    write: 'agreements.edit',
    schema: z.object({
      title: z.string().trim().min(2).max(200),
      reference: z.string().trim().min(2).max(60),
      agreement_type: z.string().trim().min(1).max(60).default('Service Agreement'),
      client_name: optionalString,
      client_email: z.union([z.literal(''), z.string().email()]).optional().default(''),
      client_company: optionalString,
      status: agreementStatus.default('draft'),
      content: optionalString,
      effective_date: dateOrEmpty,
      expiry_date: dateOrEmpty,
      signature_name: optionalString,
      document_url: optionalString,
      ...agreementExtras,
    }),
    patchSchema: z.object({
      title: z.string().trim().min(2).max(200).optional(),
      reference: z.string().trim().min(2).max(60).optional(),
      agreement_type: z.string().optional(),
      client_name: z.string().optional(),
      client_email: z.union([z.literal(''), z.string().email()]).optional(),
      client_company: z.string().optional(),
      status: agreementStatus.optional(),
      content: z.string().optional(),
      effective_date: dateOrEmpty,
      expiry_date: dateOrEmpty,
      signed_at: dateOrEmpty,
      signature_name: z.string().optional(),
      document_url: z.string().optional(),
      ...agreementExtras,
    }),
  });

  const policyStatus = z.enum(['draft', 'published', 'archived']);

  register({
    table: 'policies',
    orderBy: 'sort_order ASC, title ASC',
    statusColumn: 'status',
    searchColumns: ['title', 'slug', 'summary'],
    schema: z.object({
      slug: z.string().trim().min(2).max(140),
      title: z.string().trim().min(2).max(200),
      category: z.string().trim().min(1).max(60).default('General'),
      summary: optionalString,
      content: optionalString,
      version: z.string().trim().min(1).max(20).default('1.0'),
      effective_date: dateOrEmpty,
      status: policyStatus.default('draft'),
      show_in_footer: z.boolean().default(true),
      sort_order: z.coerce.number().int().default(0),
    }),
    patchSchema: z.object({
      slug: z.string().trim().min(2).max(140).optional(),
      title: z.string().trim().min(2).max(200).optional(),
      category: z.string().optional(),
      summary: z.string().optional(),
      content: z.string().optional(),
      version: z.string().optional(),
      effective_date: dateOrEmpty,
      status: policyStatus.optional(),
      show_in_footer: z.boolean().optional(),
      sort_order: z.coerce.number().int().optional(),
    }),
  });

  /** Cheap UUID guard so a malformed id returns 404 rather than a 500 from Postgres. */
const isUuid = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

/**
   * Mint (or reuse) a client sign-in link.
   *
   * Idempotent: calling it twice returns the same token so a re-share does not
   * invalidate a link the client may already have open.
   */
  router.post('/api/admin/agreements/:id/share', cap('agreements.share'), async (req: Request, res: Response) => {
    try {
    if (!isUuid(req.params.id)) {
      return res.status(404).json({ ok: false, error: 'Not found.' });
    }
      const existing = await pool.query(
        'SELECT id, share_token FROM agreements WHERE id = $1',
        [req.params.id],
      );
      if (existing.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Not found.' });
      }

      if (existing.rows[0].share_token) {
        const sent = await pool.query(
          'UPDATE agreements SET share_sent_at = COALESCE(share_sent_at, now()) WHERE id = $1 RETURNING share_token',
          [req.params.id],
        );
        return res.json({ ok: true, token: sent.rows[0].share_token });
      }

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const token = crypto.randomBytes(24).toString('hex');
        try {
          const result = await pool.query(
            `UPDATE agreements
             SET share_token = $1, share_sent_at = now(), updated_at = now()
             WHERE id = $2 AND share_token IS NULL
             RETURNING share_token`,
            [token, req.params.id],
          );
          if (result.rows.length > 0) {
            return res.json({ ok: true, token: result.rows[0].share_token });
          }
          // Someone else won the race — fall through and re-read.
          const again = await pool.query('SELECT share_token FROM agreements WHERE id = $1', [
            req.params.id,
          ]);
          return res.json({ ok: true, token: again.rows[0].share_token });
        } catch (err: any) {
          if (err?.code !== '23505') throw err;
          // Token collision, try again.
        }
      }

      return res.status(500).json({ ok: false, error: 'Could not create a share link.' });
    } catch (err) {
      console.error('POST share failed:', err);
      return res.status(500).json({ ok: false, error: 'Could not create a share link.' });
    }
  });

  /** Revoke a share link, disabling client access. */
  router.delete('/api/admin/agreements/:id/share', cap('agreements.share'), async (req: Request, res: Response) => {
    try {
    if (!isUuid(req.params.id)) {
      return res.status(404).json({ ok: false, error: 'Not found.' });
    }
      const result = await pool.query(
        'UPDATE agreements SET share_token = NULL, updated_at = now() WHERE id = $1 RETURNING id',
        [req.params.id],
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Not found.' });
      }
      return res.json({ ok: true });
    } catch (err) {
      console.error('DELETE share failed:', err);
      return res.status(500).json({ ok: false, error: 'Could not revoke the share link.' });
    }
  });

  // -------------------------------------------------------------------------
  // invoice line items
  // -------------------------------------------------------------------------
  router.get('/api/admin/invoices/:id/items', cap('invoices.view'), async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT id, invoice_id, description, quantity, unit_price, amount, sort_order
         FROM invoice_items WHERE invoice_id = $1 ORDER BY sort_order ASC, id ASC`,
        [req.params.id],
      );
      return res.json({ ok: true, items: result.rows });
    } catch (err) {
      console.error('GET invoice items failed:', err);
      return res.status(500).json({ ok: false, error: 'Could not load invoice items.' });
    }
  });

  const itemSchema = z.object({
    description: z.string().trim().min(1).max(300),
    quantity: z.coerce.number().min(0.01).default(1),
    unit_price: z.coerce.number().min(0).default(0),
  });

  router.post('/api/admin/invoices/:id/items', cap('invoices.edit'), async (req: Request, res: Response) => {
    const parsed = itemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ ok: false, error: 'Validation failed.', details: parsed.error.flatten() });
    }
    const { description, quantity, unit_price } = parsed.data;
    const amount = Number((quantity * unit_price).toFixed(2));
    try {
      const result = await pool.query(
        `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount, sort_order)
         VALUES ($1, $2, $3, $4, $5, COALESCE((SELECT MAX(sort_order) + 1 FROM invoice_items WHERE invoice_id = $1), 0))
         RETURNING id, invoice_id, description, quantity, unit_price, amount, sort_order`,
        [req.params.id, description, quantity, unit_price, amount],
      );
      return res.status(201).json({ ok: true, item: result.rows[0] });
    } catch (err) {
      console.error('POST invoice item failed:', err);
      return res.status(500).json({ ok: false, error: 'Could not add item.' });
    }
  });

  router.delete('/api/admin/invoices/items/:itemId', cap('invoices.edit'), async (req: Request, res: Response) => {
    try {
      const result = await pool.query('DELETE FROM invoice_items WHERE id = $1 RETURNING id', [
        req.params.itemId,
      ]);
      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Not found.' });
      }
      return res.json({ ok: true });
    } catch (err) {
      console.error('DELETE invoice item failed:', err);
      return res.status(500).json({ ok: false, error: 'Could not delete item.' });
    }
  });

  /**
   * Recompute subtotal/tax/total from the stored line items.
   * Called after any item mutation so the invoice header never drifts.
   */
  router.post('/api/admin/invoices/:id/recalculate', cap('invoices.edit'), async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `UPDATE invoices inv
         SET subtotal = COALESCE(agg.total, 0),
             tax_amount = ROUND(COALESCE(agg.total, 0) * inv.tax_rate / 100, 2),
             total = ROUND(COALESCE(agg.total, 0) * (1 + inv.tax_rate / 100) - inv.discount, 2),
             updated_at = now()
         FROM (
           SELECT invoice_id, SUM(amount) AS total
           FROM invoice_items WHERE invoice_id = $1 GROUP BY invoice_id
         ) agg
         WHERE inv.id = $1
         RETURNING inv.id, inv.subtotal, inv.tax_rate, inv.tax_amount, inv.discount, inv.total`,
        [req.params.id],
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Not found.' });
      }
      return res.json({ ok: true, item: result.rows[0] });
    } catch (err) {
      console.error('POST invoice recalculate failed:', err);
      return res.status(500).json({ ok: false, error: 'Could not recalculate invoice.' });
    }
  });

  // -------------------------------------------------------------------------
  // settings (key/value, upsert)
  // -------------------------------------------------------------------------
  router.get('/api/admin/settings', cap('settings.manage'), async (_req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT key, value, group_name, label, type, updated_at
         FROM settings ORDER BY group_name ASC, key ASC`,
      );
      return res.json({ ok: true, items: result.rows });
    } catch (err) {
      console.error('GET settings failed:', err);
      return res.status(500).json({ ok: false, error: 'Could not load settings.' });
    }
  });

  const settingsUpsert = z.object({
    key: z.string().trim().min(1).max(120),
    value: z.any(),
  });

  router.put('/api/admin/settings', cap('settings.manage'), async (req: Request, res: Response) => {
    const parsed = settingsUpsert.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ ok: false, error: 'Validation failed.', details: parsed.error.flatten() });
    }
    const { key, value } = parsed.data;
    try {
      const result = await pool.query(
        `INSERT INTO settings (key, value, group_name, label, type)
         VALUES ($1, $2::jsonb, COALESCE((SELECT group_name FROM settings WHERE key = $1), 'General'),
                 COALESCE((SELECT label FROM settings WHERE key = $1), $1),
                 COALESCE((SELECT type FROM settings WHERE key = $1), 'text'))
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
         RETURNING key, value, group_name, label, type, updated_at`,
        [key, JSON.stringify(value ?? null)],
      );
      return res.json({ ok: true, item: result.rows[0] });
    } catch (err) {
      console.error('PUT settings failed:', err);
      return res.status(500).json({ ok: false, error: 'Could not save setting.' });
    }
  });

  router.delete('/api/admin/settings/:key', cap('settings.manage'), async (req: Request, res: Response) => {
    try {
      const result = await pool.query('DELETE FROM settings WHERE key = $1 RETURNING key', [req.params.key]);
      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Not found.' });
      }
      return res.json({ ok: true });
    } catch (err) {
      console.error('DELETE setting failed:', err);
      return res.status(500).json({ ok: false, error: 'Could not delete setting.' });
    }
  });

  // -------------------------------------------------------------------------
  // users (admin_users) — password-aware, never returns the hash
  // -------------------------------------------------------------------------
  const userCols =
    'id, email, personal_email, name, role, company, client_of, phone, avatar, is_active, notes, created_at, last_login';

  router.get('/api/admin/users', cap('users.view'), async (_req: Request, res: Response) => {
    try {
      const result = await pool.query(`SELECT ${userCols} FROM admin_users ORDER BY created_at DESC`);
      return res.json({ ok: true, items: result.rows });
    } catch (err) {
      console.error('GET users failed:', err);
      return res.status(500).json({ ok: false, error: 'Could not load users.' });
    }
  });

  const roleEnum = z.enum([
    'admin',
    'operations_manager',
    'project_manager',
    'sales_executive',
    'team_member',
    'client',
  ]);

  const userCreate = z.object({
    email: z.string().trim().email(),
    personal_email: z.union([z.literal(''), z.string().email()]).optional().default(''),
    name: z.string().trim().min(1).max(120),
    password: z.string().min(8).max(200),
    role: roleEnum.default('team_member'),
    company: z.string().optional().default(''),
    client_of: z.string().optional().default(''),
    phone: z.string().optional().default(''),
    avatar: z.string().optional().default(''),
    notes: z.string().optional().default(''),
    is_active: z.boolean().default(true),
  });

  router.post('/api/admin/users', cap('users.manage'), async (req: Request, res: Response) => {
    const parsed = userCreate.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ ok: false, error: 'Validation failed.', details: parsed.error.flatten() });
    }
    const { email, name, password, role, company, client_of, phone, avatar, notes, is_active } =
      parsed.data;
    const personalEmail = parsed.data.personal_email;

    // Only a full admin may create accounts or hand out roles.
    const caller = (req as any).admin as { id: string; role: string };
    if (normaliseRole(caller.role) !== 'admin') {
      return res.status(403).json({
        ok: false,
        error: 'Only an administrator can create users or assign roles.',
      });
    }

    try {
      const hash = await bcrypt.hash(password, 12);
      const result = await pool.query(
        `INSERT INTO admin_users
           (email, personal_email, name, password_hash, role, company, client_of, phone, avatar, notes, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING ${userCols}`,
        [email, personalEmail, name, hash, role, company, client_of, phone, avatar, notes, is_active],
      );
      return res.status(201).json({ ok: true, item: result.rows[0] });
    } catch (err: any) {
      console.error('POST users failed:', err);
      if (err?.code === '23505') {
        return res.status(409).json({ ok: false, error: 'That email is already registered.' });
      }
      return res.status(500).json({ ok: false, error: 'Could not create user.' });
    }
  });

  const userPatch = z.object({
    email: z.string().trim().email().optional(),
    personal_email: z.union([z.literal(''), z.string().email()]).optional(),
    name: z.string().trim().min(1).max(120).optional(),
    password: z.union([z.literal(''), z.string().min(8).max(200)]).optional(),
    role: roleEnum.optional(),
    company: z.string().optional(),
    client_of: z.string().optional(),
    phone: z.string().optional(),
    avatar: z.string().optional(),
    notes: z.string().optional(),
    is_active: z.boolean().optional(),
  });

  router.patch('/api/admin/users/:id', cap('users.manage'), async (req: Request, res: Response) => {
    const parsed = userPatch.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ ok: false, error: 'Validation failed.', details: parsed.error.flatten() });
    }

    // Only a full admin may change roles.
    const caller = (req as any).admin as { id: string; role: string; name?: string; email?: string };
    if (parsed.data.role !== undefined && normaliseRole(caller.role) !== 'admin') {
      return res.status(403).json({
        ok: false,
        error: 'Only an administrator can change roles.',
      });
    }

    // Read the current row up front so a role change can be reported to the
    // person it affects after the update lands.
    const before = await pool.query(
      'SELECT name, email, personal_email, role FROM admin_users WHERE id = $1',
      [req.params.id],
    );
    const previous = before.rows[0];

    // Guard against the last admin locking everyone out.
    if (
      (parsed.data.role !== undefined && parsed.data.role !== 'admin') ||
      parsed.data.is_active === false
    ) {
      const target = await pool.query('SELECT role, is_active FROM admin_users WHERE id = $1', [
        req.params.id,
      ]);
      if (
        target.rows.length > 0 &&
        target.rows[0].role === 'admin' &&
        target.rows[0].is_active
      ) {
        const admins = await pool.query(
          `SELECT count(*)::int AS n FROM admin_users WHERE role = 'admin' AND is_active`,
        );
        if (admins.rows[0].n <= 1) {
          return res.status(400).json({
            ok: false,
            error: 'This is the only active administrator — you cannot remove that access.',
          });
        }
      }
    }

    const { password, ...rest } = parsed.data;
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;

    for (const [key, value] of Object.entries(rest)) {
      if (value === undefined) continue;
      sets.push(`${key} = $${i++}`);
      params.push(value);
    }

    if (password) {
      sets.push(`password_hash = $${i++}`);
      params.push(await bcrypt.hash(password, 12));
    }

    if (!sets.length) {
      return res.json({ ok: true, item: null });
    }

    try {
      const result = await pool.query(
        `UPDATE admin_users SET ${sets.join(', ')} WHERE id = $${i} RETURNING ${userCols}`,
        [...params, req.params.id],
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Not found.' });
      }

      // Tell the person their role changed — but only for staff positions;
      // a move to the client role is a portal matter, not a dashboard one.
      if (
        previous &&
        parsed.data.role !== undefined &&
        parsed.data.role !== previous.role &&
        normaliseRole(parsed.data.role) !== 'client'
      ) {
        const to = String(previous.personal_email ?? '').trim() || previous.email;
        const mail = roleChangedEmail({
          name: result.rows[0].name,
          oldRole: previous.role,
          newRole: parsed.data.role,
          changedBy: caller.name || caller.email || 'An administrator',
          at: new Date(),
        });
        void sendMail({ to, ...mail }).catch(() => undefined);
      }

      return res.json({ ok: true, item: result.rows[0] });
    } catch (err: any) {
      console.error('PATCH users/:id failed:', err);
      if (err?.code === '23505') {
        return res.status(409).json({ ok: false, error: 'That email is already registered.' });
      }
      return res.status(500).json({ ok: false, error: 'Could not update user.' });
    }
  });

  router.delete('/api/admin/users/:id', cap('users.manage'), async (req: Request, res: Response) => {
    const admin = (req as any).admin;
    if (admin?.id === req.params.id) {
      return res.status(400).json({ ok: false, error: 'You cannot delete your own account.' });
    }
    try {
      const result = await pool.query('DELETE FROM admin_users WHERE id = $1 RETURNING id', [
        req.params.id,
      ]);
      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Not found.' });
      }
      return res.json({ ok: true });
    } catch (err) {
      console.error('DELETE users/:id failed:', err);
      return res.status(500).json({ ok: false, error: 'Could not delete user.' });
    }
  });

  // -------------------------------------------------------------------------
  // clients — derived from enquiries, for the agreement client picker
  // -------------------------------------------------------------------------
  router.get('/api/admin/clients', cap('enquiries.view'), async (_req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT e.name, e.business, e.email, e.phone,
                MAX(e.created_at) AS last_enquiry_at,
                COUNT(*)         AS enquiry_count
         FROM enquiries e
         GROUP BY e.name, e.business, e.email, e.phone
         ORDER BY last_enquiry_at DESC
         LIMIT 200`,
      );
      return res.json({ ok: true, items: result.rows });
    } catch (err) {
      console.error('GET clients failed:', err);
      return res.status(500).json({ ok: false, error: 'Could not load clients.' });
    }
  });

  // -------------------------------------------------------------------------
  // Sidebar badges — one round-trip, capability-gated and role-scoped
  // -------------------------------------------------------------------------
  router.get('/api/admin/nav-counts', staff, async (req: Request, res: Response) => {
    const admin = (req as any).admin as { id: string; role: string };
    const role = normaliseRole(admin.role);
    const counts: Record<string, number> = {};

    const wants = (c: Parameters<typeof can>[1]) => can(role, c);

    const tasks: Promise<void>[] = [];

    if (wants('enquiries.view')) {
      tasks.push(
        pool
          .query('SELECT COUNT(*)::int AS n FROM enquiries')
          .then(r => { counts.enquiries = r.rows[0].n; })
          .catch(() => undefined),
      );
    }

    // Projects: open (unresolved) client requests, scoped to what the role sees.
    if (wants('projects.viewAll') || wants('projects.viewAssigned') || wants('projects.viewOwn')) {
      const scope = wants('projects.viewAll')
        ? { sql: '', params: [] as any[] }
        : wants('projects.viewAssigned')
          ? {
              sql: 'AND p.id IN (SELECT project_id FROM project_members WHERE user_id = $1)',
              params: [admin.id],
            }
          : { sql: 'AND p.client_id = $1', params: [admin.id] };

      tasks.push(
        pool
          .query(
            `SELECT COUNT(*)::int AS n
             FROM projects p
             WHERE EXISTS (
               SELECT 1 FROM project_updates u
               WHERE u.project_id = p.id
                 AND u.resolved_at IS NULL
                 AND u.kind IN ('request','status')
             ) ${scope.sql}`,
            scope.params,
          )
          .then(r => { counts.projects = r.rows[0].n; })
          .catch(() => undefined),
      );
    }

    if (wants('invoices.view')) {
      tasks.push(
        pool
          .query(`SELECT COUNT(*)::int AS n FROM invoices WHERE status = 'overdue'`)
          .then(r => { counts.invoices = r.rows[0].n; })
          .catch(() => undefined),
      );
    }

    if (wants('agreements.view')) {
      // Shared with the client but not yet signed back.
      tasks.push(
        pool
          .query(
            `SELECT COUNT(*)::int AS n FROM agreements
             WHERE share_token IS NOT NULL AND client_signature = ''`,
          )
          .then(r => { counts.agreements = r.rows[0].n; })
          .catch(() => undefined),
      );
    }

    if (wants('users.manage')) {
      tasks.push(
        pool
          .query(`SELECT COUNT(*)::int AS n FROM admin_users WHERE is_active`)
          .then(r => { counts.users = r.rows[0].n; })
          .catch(() => undefined),
      );
    }

    if (wants('content.view')) {
      tasks.push(
        pool
          .query(`SELECT COUNT(*)::int AS n FROM works WHERE published = false`)
          .then(r => { counts.works = r.rows[0].n; })
          .catch(() => undefined),
        pool
          .query(`SELECT COUNT(*)::int AS n FROM blogs WHERE published = false`)
          .then(r => { counts.blogs = r.rows[0].n; })
          .catch(() => undefined),
        pool
          .query(`SELECT COUNT(*)::int AS n FROM policies WHERE status = 'draft'`)
          .then(r => { counts.policies = r.rows[0].n; })
          .catch(() => undefined),
      );
    }

    await Promise.all(tasks);
    return res.json({ ok: true, counts });
  });

  // -------------------------------------------------------------------------
  // dashboard summary across every table
  // -------------------------------------------------------------------------
  router.get('/api/admin/overview', requireLeadership(), async (_req: Request, res: Response) => {
    try {
      const [works, blogs, team, projects, invoices, agreements, policies, users] = await Promise.all([
        pool.query(`SELECT COUNT(*) FILTER (WHERE published) AS published, COUNT(*) AS total FROM works`),
        pool.query(`SELECT COUNT(*) FILTER (WHERE published) AS published, COUNT(*) AS total FROM blogs`),
        pool.query(`SELECT COUNT(*) FILTER (WHERE is_active) AS published, COUNT(*) AS total FROM team_members`),
        pool.query(
          `SELECT COUNT(*) FILTER (WHERE status = 'completed') AS published,
                  COUNT(*) AS total,
                  COALESCE(SUM(budget), 0) AS value
           FROM projects`,
        ),
        pool.query(
          `SELECT COUNT(*) FILTER (WHERE status = 'paid') AS published,
                  COUNT(*) FILTER (WHERE status = 'overdue') AS overdue,
                  COUNT(*) AS total,
                  COALESCE(SUM(total) FILTER (WHERE status = 'paid'), 0) AS collected,
                  COALESCE(SUM(total) FILTER (WHERE status <> 'cancelled'), 0) AS outstanding
           FROM invoices`,
        ),
        pool.query(`SELECT COUNT(*) FILTER (WHERE status = 'signed') AS published, COUNT(*) AS total FROM agreements`),
        pool.query(`SELECT COUNT(*) FILTER (WHERE status = 'published') AS published, COUNT(*) AS total FROM policies`),
        pool.query(`SELECT COUNT(*) FILTER (WHERE is_active) AS published, COUNT(*) AS total FROM admin_users`),
      ]);

      return res.json({
        ok: true,
        overview: {
          works: works.rows[0],
          blogs: blogs.rows[0],
          team: team.rows[0],
          projects: projects.rows[0],
          invoices: invoices.rows[0],
          agreements: agreements.rows[0],
          policies: policies.rows[0],
          users: users.rows[0],
        },
      });
    } catch (err) {
      console.error('GET overview failed:', err);
      return res.status(500).json({ ok: false, error: 'Could not load overview.' });
    }
  });

  return router;
}