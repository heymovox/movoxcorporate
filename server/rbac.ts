/**
 * Server-side role enforcement.
 *
 * Mirrors src/lib/rbac.ts. The API is authoritative: every guarded route
 * re-checks the caller's capability here, so a role cannot reach data it
 * should not see by calling the endpoint directly.
 */
import type { Request, Response, NextFunction } from 'express';

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

function currentUser(req: Request) {
  return (req as any).admin as { id: string; role: string } | undefined;
}

/** 403 unless the signed-in user holds the capability. */
export function requireCap(capability: Capability) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = currentUser(req);
    if (!user) {
      res.status(401).json({ ok: false, error: 'Unauthorized' });
      return;
    }
    if (!can(user.role, capability)) {
      res.status(403).json({
        ok: false,
        error: `Your role (${user.role}) is not permitted to do this.`,
      });
      return;
    }
    next();
  };
}

/** Passes when the user holds ANY of the listed capabilities. */
export function requireAnyCap(capabilities: Capability[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = currentUser(req);
    if (!user) {
      res.status(401).json({ ok: false, error: 'Unauthorized' });
      return;
    }
    if (!capabilities.some(c => can(user.role, c))) {
      res.status(403).json({
        ok: false,
        error: `Your role (${user.role}) is not permitted to do this.`,
      });
      return;
    }
    next();
  };
}

/**
 * Restricts a route to staff, i.e. anything that is not a client account.
 * Clients must use the portal endpoints instead.
 */
export function requireStaff() {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = currentUser(req);
    if (!user) {
      res.status(401).json({ ok: false, error: 'Unauthorized' });
      return;
    }
    if (normaliseRole(user.role) === 'client') {
      res.status(403).json({ ok: false, error: 'Clients cannot access the admin API.' });
      return;
    }
    next();
  };
}

/**
 * Cross-module summary (overview/revenue). Restricted to roles that can see
 * the business as a whole, so a team member does not get company-wide counts.
 */
export function requireLeadership() {
  return requireAnyCap(['revenue.view', 'projects.viewAll', 'invoices.view']);
}