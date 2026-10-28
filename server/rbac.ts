export const ROLES = [
  'admin',
  'operations_manager',
  'project_manager',
  'sales_executive',
  'team_member',
  'client',
] as const;

export type Role = (typeof ROLES)[number];

const ALL = [
  'projects.viewAll', 'projects.viewAssigned', 'projects.viewOwn',
  'projects.create', 'projects.edit', 'projects.assign', 'projects.updateStatus',
  'projects.reply', 'projects.uploadFiles', 'projects.delete',
  'agreements.view', 'agreements.edit', 'agreements.sign', 'agreements.share',
  'invoices.view', 'invoices.edit', 'revenue.view',
  'users.view', 'users.manage',
  'content.view', 'content.edit',
  'settings.manage',
  'enquiries.view', 'enquiries.manage',
] as const;

export type Capability = (typeof ALL)[number];

export const ROLE_CAPABILITIES: Record<Role, readonly Capability[]> = {
  admin: ALL,
  operations_manager: [
    'projects.viewAll', 'projects.viewAssigned', 'projects.create', 'projects.edit',
    'projects.assign', 'projects.updateStatus', 'projects.reply', 'projects.uploadFiles',
    'agreements.view', 'agreements.edit', 'agreements.sign', 'agreements.share',
    'invoices.view', 'invoices.edit', 'revenue.view',
    'users.view', 'content.view', 'enquiries.view',
  ],
  project_manager: [
    'projects.viewAll', 'projects.viewAssigned', 'projects.create', 'projects.edit',
    'projects.assign', 'projects.updateStatus', 'projects.reply', 'projects.uploadFiles',
    'agreements.view', 'agreements.edit', 'agreements.share',
    'invoices.view', 'invoices.edit',
    'users.view', 'content.view', 'enquiries.view',
  ],
  sales_executive: ['enquiries.view', 'enquiries.manage'],
  team_member: [
    'projects.viewAssigned', 'projects.updateStatus', 'projects.reply',
    'projects.uploadFiles', 'content.view',
  ],
  client: ['projects.viewOwn', 'projects.reply'],
};

export function normaliseRole(value: unknown): Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
    ? (value as Role)
    : 'team_member';
}

export function can(role: unknown, capability: Capability): boolean {
  return (ROLE_CAPABILITIES[normaliseRole(role)] as readonly string[]).includes(capability);
}
