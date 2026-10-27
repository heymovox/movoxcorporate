/**
 * Host-based app separation.
 *
 * In production each surface lives on its own subdomain:
 *
 *   heymovox.com            — marketing site
 *   admin.heymovox.com      — staff login + dashboard only
 *   portal.heymovox.com     — client portal login + dashboard only
 *   secure.heymovox.com     — reserved; bounces to the portal
 *
 * On localhost (and any unrecognised host) the normal path-based routes are
 * used, so `localhost:5173/admin/login` and `/portal/login` keep working.
 */

export type HostMode = 'site' | 'admin' | 'portal' | 'secure';

export const ADMIN_HOST = 'admin.heymovox.com';
export const PORTAL_HOST = 'portal.heymovox.com';
export const SECURE_HOST = 'secure.heymovox.com';

function currentHost(): string {
  if (typeof window === 'undefined') return '';
  return window.location.hostname.toLowerCase();
}

/** Which surface this hostname serves. */
export function hostMode(): HostMode {
  const h = currentHost();

  // Exact matches win, so a bare apex host never gets swallowed by a subdomain rule.
  if (h === SECURE_HOST) return 'secure';
  if (h === ADMIN_HOST) return 'admin';
  if (h === PORTAL_HOST) return 'portal';

  // Wildcard subdomain forms (admin.dev.heymovox.com, admin.localhost, …)
  if (h.startsWith('admin.')) return 'admin';
  if (h.startsWith('portal.')) return 'portal';
  if (h.startsWith('secure.')) return 'secure';

  return 'site';
}

export const isAdminHost = () => hostMode() === 'admin';
export const isPortalHost = () => hostMode() === 'portal';
export const isSecureHost = () => hostMode() === 'secure';

/** Public origin of the portal, used for the secure → portal bounce. */
export const portalOrigin = () => `https://${PORTAL_HOST}`;

/**
 * Canonical origin for a surface. Falls back to the current origin in dev so
 * links stay on localhost.
 */
export function originFor(mode: 'site' | 'admin' | 'portal'): string {
  if (typeof window === 'undefined') return '';
  const h = currentHost();

  // Only canonicalise when we are actually on a heymovox.com host.
  const onProduction = h === '' || h.endsWith('heymovox.com');
  if (!onProduction) return window.location.origin;

  switch (mode) {
    case 'admin':
      return `https://${ADMIN_HOST}`;
    case 'portal':
      return `https://${PORTAL_HOST}`;
    default:
      return 'https://heymovox.com';
  }
}

/**
 * Absolute URL for a surface.
 *
 * Use these for links that cross surfaces (the admin header's "View site",
 * the portal's "staff sign-in") so they resolve to the right origin instead of
 * the current host. In development everything stays on localhost.
 */
export const siteUrl = (path = '/') => `${originFor('site')}${path}`;
export const adminUrl = (path = '/admin') => `${originFor('admin')}${path}`;
export const portalUrl = (path = '/portal') => `${originFor('portal')}${path}`;