/**
 * Role-based access control — the single source of truth.
 *
 * The matrix below is exported to the browser as well as used by the API, so a
 * role's capabilities are defined once. The SERVER is authoritative: it
 * re-checks every capability before returning data, so hiding a nav item is
 * never the only thing standing between a role and someone else's data.
 */

export const ROLES = [
  'admin',
  'operations_manager',
  'project_manager',
  'sales_executive',
  'team_member',
  'client',
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  operations_manager: 'Operation Manager',
  project_manager: 'Project Manager',
  sales_executive: 'Sale Executive',
  team_member: 'Team Member',
  client: 'Client',
};

/** What a role is allowed to do. */
export const CAPABILITIES = [
  // projects
  'projects.viewAll',
  'projects.viewAssigned',
  'projects.viewOwn',
  'projects.create',
  'projects.edit',
  'projects.assign',
  'projects.updateStatus',
  'projects.reply',
  'projects.uploadFiles',
  'projects.delete',
  // agreements
  'agreements.view',
  'agreements.edit',
  'agreements.sign',
  'agreements.share',
  // billing
  'invoices.view',
  'invoices.edit',
  'revenue.view',
  // directory
  'users.view',
  'users.manage',
  'content.view',
  'content.edit',
  'settings.manage',
  'enquiries.view',
  'enquiries.manage',
] as const;

export type Capability = (typeof CAPABILITIES)[number];

type Grants = readonly Capability[];

const ALL: Grants = CAPABILITIES;

/**
 * Capability grants per role.
 *
 *  admin               — everything
 *  operations_manager  — agreements (view + sign as authorised person),
 *                        projects, revenue, invoices
 *  project_manager     — agreements (view), projects, invoices
 *  sales_executive     — leads and tasks (deferred); enquiry pipeline
 *  team_member         — assigned projects only: view, reply, update
 *                        status, upload client-finalised files
 *  client              — own projects only: view, reply, request files
 */
export const ROLE_CAPABILITIES: Record<Role, Grants> = {
  admin: ALL,

  operations_manager: [
    'projects.viewAll',
    'projects.viewAssigned',
    'projects.create',
    'projects.edit',
    'projects.assign',
    'projects.updateStatus',
    'projects.reply',
    'projects.uploadFiles',
    'agreements.view',
    'agreements.edit',
    'agreements.sign',
    'agreements.share',
    'invoices.view',
    'invoices.edit',
    'revenue.view',
    'users.view',
    'content.view',
    'enquiries.view',
  ],

  project_manager: [
    'projects.viewAll',
    'projects.viewAssigned',
    'projects.create',
    'projects.edit',
    'projects.assign',
    'projects.updateStatus',
    'projects.reply',
    'projects.uploadFiles',
    'agreements.view',
    'agreements.edit',
    'agreements.share',
    'invoices.view',
    'invoices.edit',
    'users.view',
    'content.view',
    'enquiries.view',
  ],

  sales_executive: ['enquiries.view', 'enquiries.manage'],

  team_member: [
    'projects.viewAssigned',
    'projects.updateStatus',
    'projects.reply',
    'projects.uploadFiles',
    'content.view',
  ],

  client: ['projects.viewOwn', 'projects.reply'],
};

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

/** Safe for untrusted JWT claims / DB values. */
export function normaliseRole(value: unknown): Role {
  return isRole(value) ? value : 'team_member';
}

export function can(value: unknown, capability: Capability): boolean {
  const r = normaliseRole(value);
  return (ROLE_CAPABILITIES[r] as readonly string[]).includes(capability);
}

export function canAny(value: unknown, capabilities: Capability[]): boolean {
  return capabilities.some(c => can(value, c));
}

export function canAll(value: unknown, capabilities: Capability[]): boolean {
  return capabilities.every(c => can(value, c));
}

/** Which of the given capabilities the role has — handy for partial UIs. */
export function grantsOf(value: unknown): Capability[] {
  const r = normaliseRole(value);
  return [...(ROLE_CAPABILITIES[r] as readonly Capability[])];
}

/** Roles that can be assigned as project staff (i.e. not clients). */
export const STAFF_ROLES: Role[] = [
  'admin',
  'operations_manager',
  'project_manager',
  'sales_executive',
  'team_member',
];