/**
 * Typed fetch wrapper for the admin + projects API.
 *
 * Every call attaches the JWT from localStorage and normalises the
 * `{ ok: boolean, error?: string }` envelope the Express server returns.
 */

import type { Role } from './rbac';
export type { Role } from './rbac';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const BASE = import.meta.env.VITE_API_URL ?? 'https://api.heymovox.com';

function token(): string | null {
  return localStorage.getItem('admin_token');
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  const jwt = token();
  if (jwt) headers.set('Authorization', `Bearer ${jwt}`);

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError('Network error. Is the API server running?', 0);
  }

  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    throw new ApiError('Your session has expired. Please sign in again.', 401);
  }

  if (!res.ok || payload?.ok === false) {
    throw new ApiError(payload?.error ?? `Request failed (${res.status})`, res.status);
  }

  return payload as T;
}

function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export interface ListResponse<T> {
  ok: true;
  items: T[];
}

export interface ItemResponse<T> {
  ok: true;
  item: T;
}

export const api = {
  /**
   * List a collection. Normalises the two response shapes in play:
   * the generic CRUD router returns `{ items }`, while the pre-existing
   * enquiries endpoint returns `{ enquiries }`.
   */
  list: async <T>(resource: string, params: Record<string, any> = {}) => {
    const res = await request<{ items?: T[]; enquiries?: T[]; pagination?: unknown }>(
      `/api/admin/${resource}${qs(params)}`,
    );
    const items = res.items ?? res.enquiries ?? [];
    return { ...res, items } as ListResponse<T>;
  },

  get: <T>(resource: string, id: string) =>
    request<ItemResponse<T>>(`/api/admin/${resource}/${id}`),

  create: <T>(resource: string, body: unknown) =>
    request<ItemResponse<T>>(`/api/admin/${resource}`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: <T>(resource: string, id: string, body: unknown) =>
    request<ItemResponse<T>>(`/api/admin/${resource}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  remove: (resource: string, id: string) =>
    request<{ ok: true }>(`/api/admin/${resource}/${id}`, { method: 'DELETE' }),

  // ---- special-cased endpoints (not covered by the generic CRUD shape) ----

  overview: () =>
    request<{ ok: true; overview: Overview }>('/api/admin/overview'),

  clients: () => request<ListResponse<Client>>('/api/admin/clients'),

  /** Auto-generates MBD-YYYYMMDD-XXXX, retrying on collision. */
  nextAgreementReference: () =>
    request<{ ok: true; reference: string }>('/api/admin/agreements/next-reference'),

  /** Mint (or reuse) the client sign-in link for an agreement. */
  shareAgreement: (id: string) =>
    request<{ ok: true; token: string }>(`/api/admin/agreements/${id}/share`, {
      method: 'POST',
    }),

  /** Revoke client access by clearing the share token. */
  revokeAgreementShare: (id: string) =>
    request<{ ok: true }>(`/api/admin/agreements/${id}/share`, { method: 'DELETE' }),

  /** Public: read the agreement behind a share token. Read-only. */
  fetchSharedAgreement: (token: string) =>
    request<{ ok: true; agreement: SharedAgreement }>(`/api/public/agreement/${token}`),

  /** Public: submit the client's signature. */
  signSharedAgreement: (token: string, signature: string, name: string) =>
    request<{
      ok: true;
      client_signature: string;
      client_signed_name: string;
      client_signed_at: string;
      status: string;
    }>(`/api/public/agreement/${token}/sign`, {
      method: 'POST',
      body: JSON.stringify({ signature, name }),
    }),

  invoiceItems: (invoiceId: string) =>
    request<ListResponse<InvoiceItem>>(`/api/admin/invoices/${invoiceId}/items`),

  addInvoiceItem: (invoiceId: string, body: { description: string; quantity: number; unit_price: number }) =>
    request<ItemResponse<InvoiceItem>>(`/api/admin/invoices/${invoiceId}/items`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  removeInvoiceItem: (itemId: string) =>
    request<{ ok: true }>(`/api/admin/invoices/items/${itemId}`, { method: 'DELETE' }),

  recalcInvoice: (invoiceId: string) =>
    request<ItemResponse<Pick<Invoice, 'subtotal' | 'tax_rate' | 'tax_amount' | 'discount' | 'total'>>>(
      `/api/admin/invoices/${invoiceId}/recalculate`,
      { method: 'POST' },
    ),

  putSetting: (key: string, value: unknown) =>
    request<ItemResponse<Setting>>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ key, value }),
    }),

  deleteSetting: (key: string) =>
    request<{ ok: true }>(`/api/admin/settings/${encodeURIComponent(key)}`, { method: 'DELETE' }),

  /**
   * Multipart upload to R2 via the API.
   *
   * Content-Type is deliberately left off: the browser has to append its own
   * multipart boundary, and setting it by hand would break the parse.
   */
  upload: async (
    file: File,
    purpose: 'enquiry-attachment' | 'project-asset' | 'brand-asset' | 'marketing-asset' = 'brand-asset',
  ): Promise<{ files: { key: string; publicUrl: string; filename: string; size: number }[] }> => {
    const form = new FormData();
    form.append('purpose', purpose);
    form.append('files', file);

    const headers = new Headers();
    const jwt = token();
    if (jwt) headers.set('Authorization', `Bearer ${jwt}`);

    let res: Response;
    try {
      res = await fetch(`${BASE}/api/upload`, { method: 'POST', body: form, headers });
    } catch {
      throw new ApiError('Network error. Is the API server running?', 0);
    }

    let payload: any = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }

    if (res.status === 401) {
      localStorage.removeItem('admin_token');
      throw new ApiError('Your session has expired. Please sign in again.', 401);
    }
    if (!res.ok || payload?.ok === false) {
      throw new ApiError(payload?.error ?? `Upload failed (${res.status})`, res.status);
    }

    return payload as { files: { key: string; publicUrl: string; filename: string; size: number }[] };
  },

  // ---- projects -------------------------------------------------------

  projects: (params: Record<string, any> = {}) =>
    request<ListResponse<Project>>(`/api/projects${qs(params)}`),

  project: (id: string) =>
    request<{ ok: true; project: Project }>(`/api/projects/${id}`),

  createProject: (body: Partial<Project>) =>
    request<{ ok: true; project: Project }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateProject: (id: string, body: Partial<Project>) =>
    request<{ ok: true; project: Project }>(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  /** Status/progress only — the endpoint assigned team members may call. */
  updateProjectStatus: (
    id: string,
    body: { status?: ProjectStatus; progress?: number },
  ) =>
    request<{ ok: true; project: Project }>(`/api/projects/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  deleteProject: (id: string) =>
    request<{ ok: true }>(`/api/projects/${id}`, { method: 'DELETE' }),

  projectMembers: (id: string) =>
    request<ListResponse<ProjectMember>>(`/api/projects/${id}/members`),

  assignProjectMember: (id: string, userId: string) =>
    request<{ ok: true }>(`/api/projects/${id}/members`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }),

  unassignProjectMember: (id: string, userId: string) =>
    request<{ ok: true }>(`/api/projects/${id}/members/${userId}`, {
      method: 'DELETE',
    }),

  projectUpdates: (id: string) =>
    request<ListResponse<ProjectUpdate>>(`/api/projects/${id}/updates`),

  postProjectUpdate: (
    id: string,
    body: {
      kind?: ProjectUpdate['kind'];
      body: string;
      urgency?: ProjectUpdate['urgency'];
      visibility?: ProjectUpdate['visibility'];
      status?: ProjectStatus;
      progress?: number;
    },
  ) =>
    request<{ ok: true; update: ProjectUpdate }>(`/api/projects/${id}/updates`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  resolveProjectUpdate: (updateId: string) =>
    request<{ ok: true }>(`/api/projects/updates/${updateId}/resolve`, {
      method: 'PATCH',
    }),

  projectFiles: (id: string) =>
    request<ListResponse<ProjectFile>>(`/api/projects/${id}/files`),

  recordProjectFile: (
    id: string,
    body: {
      filename: string;
      storage_key: string;
      public_url?: string;
      content_type?: string;
      size_bytes?: number;
      client_finalized?: boolean;
    },
  ) =>
    request<{ ok: true; file: ProjectFile }>(`/api/projects/${id}/files`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  deleteProjectFile: (fileId: string) =>
    request<{ ok: true }>(`/api/projects/files/${fileId}`, { method: 'DELETE' }),

  staff: () => request<ListResponse<DirectoryUser>>('/api/staff'),

  clientDirectory: () => request<ListResponse<DirectoryUser>>('/api/clients'),
};


// ---------------------------------------------------------------------------
// row shapes (mirror the tables created in server/schema.sql)
// ---------------------------------------------------------------------------

export interface WorkResult {
  label: string;
  value: string;
  note?: string;
}

export interface Work {
  id: string;
  slug: string;
  title: string;
  client: string;
  client_descriptor: string;
  category: string;
  services: string[];
  year: string;
  summary: string;
  image: string;
  challenge: string;
  objectives: string[];
  approach: string[];
  deliverables: string[];
  results: WorkResult[];
  quote: { text: string; author: string; role?: string } | null;
  is_sample: boolean;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BlogBlock {
  heading?: string;
  paragraphs: string[];
}

export interface Blog {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  published_on: string;
  reading_minutes: number;
  image: string;
  author: string;
  author_role: string;
  body: BlogBlock[];
  related_services: string[];
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  email: string;
  phone: string;
  photo: string;
  linkedin: string;
  twitter: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  company: string;
  client_of: string;
  phone: string;
  avatar: string;
  notes: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: string;
  unit_price: string;
  amount: string;
  sort_order: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  client_company: string;
  /** Present on the form; stored alongside the invoice header. */
  client_gstin: string;
  client_address: string;
  enquiry_id: string | null;
  issue_date: string;
  due_date: string | null;
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  discount: string;
  total: string;
  currency: string;
  status: InvoiceStatus;
  notes: string;
  terms: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export type AgreementStatus = 'draft' | 'sent' | 'signed' | 'expired' | 'terminated';

/** One priced line in Schedule A — either from the pricing catalog or custom. */
export interface ScheduleLineItem {
  id: string;
  kind: 'catalog' | 'custom';
  /** Pricing catalog ids, present when kind === 'catalog'. */
  serviceId?: string;
  packageId?: string;
  serviceName: string;
  packageName?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
}

/** Everything that lands in Schedule A of the generated agreement. */
export interface ScheduleA {
  // commercial summary rows (field-for-field with the source PDF)
  website: string;
  technology: string;
  gst: string;
  advancePayment: string;
  milestonePayment: string;
  finalPayment: string;
  estimatedDelivery: string;
  designRevisionRounds: string;
  developmentRevisionRounds: string;
  bugFixDays: string;
  deploymentIncluded: string;
  sourceCodeHandover: string;
  maintenance: string;
  hostingAndDomain: string;
  /** Manual override; falls back to the sum of line items when blank. */
  projectFee: string;
  acceptanceDays: string;
  /** Priced service lines — catalogue or custom. */
  lineItems: ScheduleLineItem[];
  notes: string;
}

export interface Agreement {
  id: string;
  title: string;
  reference: string;
  agreement_type: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_company: string;
  client_address: string;
  client_gstin: string;
  client_rep_name: string;
  client_rep_designation: string;
  status: AgreementStatus;
  content: string;
  effective_date: string | null;
  expiry_date: string | null;
  signed_at: string | null;
  signature_name: string;
  document_url: string;
  project_name: string;
  movox_rep_name: string;
  movox_rep_designation: string;
  movox_rep_email: string;
  law_state: string;
  law_city: string;
  law_country: string;
  /** PNG data URL of the captured client signature. */
  client_signature: string;
  client_signed_name: string;
  client_signed_at: string | null;
  /** PNG data URL of the captured MovoX signature. */
  movox_signature: string;
  movox_signed_name: string;
  movox_signed_at: string | null;
  /** Present once a sign link has been minted; null when revoked/none. */
  share_token: string | null;
  share_sent_at: string | null;
  client_viewed_at: string | null;
  schedule_a: Partial<ScheduleA> | null;
  created_at: string;
  updated_at: string;
}

/** Distinct client derived from enquiries, for the agreement client picker. */
export interface Client {
  name: string;
  business: string;
  email: string;
  phone: string;
  last_enquiry_at: string;
  enquiry_count: number;
}

/**
 * The agreement shape exposed to a client holding a share token.
 * Deliberately excludes client address, GSTIN, email and phone — the client
 * already knows those, and there is no reason to publish them on a shared URL.
 */
export type SharedAgreement = Pick<
  Agreement,
  | 'id'
  | 'title'
  | 'reference'
  | 'agreement_type'
  | 'status'
  | 'client_name'
  | 'client_company'
  | 'client_rep_name'
  | 'client_rep_designation'
  | 'project_name'
  | 'effective_date'
  | 'expiry_date'
  | 'movox_rep_name'
  | 'movox_rep_designation'
  | 'law_state'
  | 'law_city'
  | 'law_country'
  | 'client_signature'
  | 'client_signed_name'
  | 'client_signed_at'
  | 'movox_signature'
  | 'movox_signed_name'
  | 'movox_signed_at'
  | 'schedule_a'
>;

export type PolicyStatus = 'draft' | 'published' | 'archived';

export interface Policy {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  version: string;
  effective_date: string | null;
  status: PolicyStatus;
  show_in_footer: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  key: string;
  value: unknown;
  group_name: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'json';
  updated_at: string;
}

/* ---------------------------------------------------------------------------
   Projects
   ------------------------------------------------------------------------- */

export type ProjectStatus =
  | 'planning'
  | 'in_progress'
  | 'review'
  | 'on_hold'
  | 'completed';

export type ProjectPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface ProjectMember {
  id?: string;
  user_id: string;
  name: string;
  email: string;
  role: Role;
  company?: string;
  assigned_at?: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  client_id: string | null;
  client_name?: string;
  client_company?: string;
  client_email?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: string | null;
  end_date: string | null;
  /** Postgres numeric arrives as a string; accept a number for form inputs. */
  budget: number | string;
  progress: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  member_count?: number;
  update_count?: number;
  file_count?: number;
  open_requests?: number;
  members?: ProjectMember[] | null;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  author_id: string | null;
  author_name?: string;
  author_role?: string;
  kind: 'status' | 'message' | 'request' | 'note';
  body: string;
  progress: number | null;
  urgency: 'normal' | 'high' | 'urgent';
  visibility: 'shared' | 'internal';
  resolved_at: string | null;
  created_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  uploaded_by: string | null;
  uploader_name?: string;
  filename: string;
  storage_key: string;
  public_url: string;
  content_type: string;
  size_bytes: string;
  client_finalized: boolean;
  created_at: string;
}

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  company: string;
  phone?: string;
  is_active?: boolean;
}

export interface Overview {
  works: { published: string; total: string };
  blogs: { published: string; total: string };
  team: { published: string; total: string };
  projects: { published: string; total: string };
  invoices: { published: string; overdue: string; total: string; collected: string; outstanding: string };
  agreements: { published: string; total: string };
  policies: { published: string; total: string };
  users: { published: string; total: string };
}