/**
 * AdminShell — shared chrome for every admin section.
 *
 * Sidebar features:
 *   - collapsible icon rail (preference persisted)
 *   - live count badges, capability-gated and role-scoped
 *   - keyboard shortcuts (Alt+1..9) and Alt+B to toggle the rail
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Newspaper,
  Users,
  UserCog,
  FolderKanban,
  Receipt,
  FileSignature,
  ScrollText,
  Settings,
  LogOut,
  X,
  User as UserIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Compass,
  PenLine,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { siteUrl } from '../../lib/host';
import { cn } from '../../lib/utils';
import { can, type Capability, type Role } from '../../lib/rbac';
import { ToastProvider } from './ui';
import { DrawerTrigger } from '../MobileDrawer';

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  group: string;
  cap: Capability | null;
  /** Shortcut digit, assigned in visible order. */
  key: string;
};

/**
 * Navigation with the capability each item requires. Entries a role cannot
 * access are filtered out — a first-line guard, not the security boundary
 * (the API re-checks everything).
 *
 * Groups are kept few (5) and the vertical rhythm tight so the full menu fits
 * a 720px-tall window without scrolling.
 */
export const adminNav: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview', cap: null, key: '1' },
  { to: '/admin/enquiries', label: 'Enquiries', icon: FileText, group: 'Overview', cap: 'enquiries.view', key: '2' },
  { to: '/admin/projects', label: 'Projects', icon: FolderKanban, group: 'Delivery', cap: 'projects.viewAssigned', key: '3' },
  { to: '/admin/agreements', label: 'Agreements', icon: FileSignature, group: 'Delivery', cap: 'agreements.view', key: '4' },
  { to: '/admin/invoices', label: 'Invoices', icon: Receipt, group: 'Delivery', cap: 'invoices.view', key: '0' },
  { to: '/admin/works', label: 'Our Works', icon: Briefcase, group: 'Content', cap: 'content.view', key: '5' },
  { to: '/admin/blogs', label: 'Blogs', icon: Newspaper, group: 'Content', cap: 'content.view', key: '6' },
  { to: '/admin/policies', label: 'Policies', icon: ScrollText, group: 'Content', cap: 'content.view', key: '7' },
  { to: '/admin/team', label: 'Team', icon: Users, group: 'People', cap: 'users.view', key: '8' },
  { to: '/admin/users', label: 'Users', icon: UserCog, group: 'People', cap: 'users.manage', key: '9' },
  { to: '/admin/settings', label: 'Settings', icon: Settings, group: 'System', cap: 'settings.manage', key: 'a' },
];

/** Decorative icons per group, shown beside the group heading. */
const GROUP_ICONS: Record<string, typeof Compass> = {
  Overview: Compass,
  Delivery: FolderKanban,
  Content: PenLine,
  People: Users,
  System: Settings,
};

/** The nav entries a role is allowed to see. */
export function navForRole(role: Role | null): NavItem[] {
  if (!role) return [];
  return adminNav.filter(n => n.cap === null || can(role, n.cap));
}

/* ------------------------------------------------------------------ */
/* persisted rail preference                                          */
/* ------------------------------------------------------------------ */

const RAIL_KEY = 'admin_sidebar_rail';

function useRail() {
  const [railed, setRailed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(RAIL_KEY) === '1';
  });

  const toggle = useCallback(() => {
    setRailed(prev => {
      localStorage.setItem(RAIL_KEY, prev ? '0' : '1');
      return !prev;
    });
  }, []);

  return { railed, toggle };
}

/* ------------------------------------------------------------------ */
/* live nav counts                                                    */
/* ------------------------------------------------------------------ */

function useNavCounts(role: Role | null) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const first = useRef(true);

  const load = useCallback(() => {
    fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/admin/nav-counts`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('admin_token') ?? ''}`,
      },
    })
      .then(r => (r.ok ? r.json() : null))
      .then(d => d?.ok && setCounts(d.counts ?? {}))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!role) return;
    load();
    // Refresh when returning to a section, but not immediately on mount twice.
    const t = first.current ? null : setTimeout(load, 250);
    first.current = false;
    return () => {
      if (t) clearTimeout(t);
    };
  }, [role, load]);

  return counts;
}

/* ------------------------------------------------------------------ */

export default function AdminShell() {
  const { user, logout, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { railed, toggle } = useRail();
  const counts = useNavCounts(role);

  const nav = navForRole(role);
  const groups = [...new Set(nav.map(n => n.group))];
  const isActive = (to: string) =>
    to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(to);

  /* keyboard: Alt+1..9 to jump, Alt+B to toggle the rail */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey) return;

      const el = e.target as HTMLElement | null;
      const typing =
        el &&
        (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (typing) return;

      if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggle();
        return;
      }

      const hit = nav.find(n => n.key === e.key.toLowerCase());
      if (hit) {
        e.preventDefault();
        navigate(hit.to);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nav, navigate, toggle]);

  const width = railed ? 'lg:pl-[68px]' : 'lg:pl-64';

  /* mobile drawer: Escape closes, page behind must not scroll */
  useEffect(() => {
    if (!sidebarOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };

    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50">
        {/* overlay */}
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            aria-hidden="true"
          />
        )}

        {/* ---------------- sidebar ---------------- */}
        <aside
          id="admin-sidebar"
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-[width,transform] duration-300 ease-in-out lg:translate-x-0',
            railed ? 'w-[68px]' : 'w-64',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          )}
          aria-label="Admin sidebar"
        >
          {/* brand + rail toggle (toggle lives here to give the nav its height) */}
          <div
            className={cn(
              'flex h-14 shrink-0 items-center gap-1 border-b border-slate-200',
              railed ? 'justify-center px-2' : 'justify-between px-4',
            )}
          >
            {railed ? (
              <>
                <Link to="/" aria-label="MovoX — Digital Growth, home" title="MovoX" className="shrink-0">
                  <img
                    src="/images/brand/icon.png"
                    alt="MovoX"
                    className="h-8 w-8 rounded-lg object-contain"
                    width="64"
                    height="64"
                  />
                </Link>
                <button
                  type="button"
                  onClick={toggle}
                  aria-label="Expand sidebar (Alt+B)"
                  title="Expand sidebar (Alt+B)"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-700"
                >
                  <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
                </button>
              </>
            ) : (
              <>
                <a href={siteUrl('/')} className="block min-w-0" aria-label="MovoX — Digital Growth, home">
                  <img
                    src="/images/brand/logo-dark.png"
                    alt="MovoX — Beyond Digital"
                    className="h-8 w-auto max-w-[150px] object-contain"
                    width="220"
                    height="57"
                  />
                </a>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={toggle}
                    aria-label="Collapse sidebar (Alt+B)"
                    title="Collapse sidebar (Alt+B)"
                    className="hidden rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-700 lg:block"
                  >
                    <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-ink transition-colors lg:hidden"
                    aria-label="Close sidebar"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* nav — sized so the full menu fits a 720px window */}
          <nav
            className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-3 py-3"
            aria-label="Admin navigation"
          >
            {groups.map(group => {
              const GroupIcon = GROUP_ICONS[group] ?? Compass;
              return (
                <div key={group}>
                  {railed ? (
                    <div className="mb-1 flex justify-center" title={group}>
                      <GroupIcon className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />
                    </div>
                  ) : (
                    <p className="flex items-center gap-1.5 px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      <GroupIcon className="h-3 w-3" aria-hidden="true" />
                      {group}
                    </p>
                  )}

                  <div className="space-y-0.5">
                    {nav
                      .filter(n => n.group === group)
                      .map(item => {
                        const active = isActive(item.to);
                        const badge = counts[item.to.replace('/admin', '').replace(/^\//, '') || 'dashboard'];

                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setSidebarOpen(false)}
                            title={railed ? `${item.label} (Alt+${item.key.toUpperCase()})` : undefined}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                              'group relative flex items-center rounded-lg text-sm font-semibold transition-all duration-200',
                              railed
                                ? 'justify-center px-2 py-2'
                                : 'gap-3 px-3 py-2',
                              active
                                ? 'bg-brand-50 text-brand-700'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-ink',
                            )}
                          >
                            {/* active accent bar */}
                            <span
                              aria-hidden="true"
                              className={cn(
                                'absolute left-0 top-1/2 w-1 -translate-y-1/2 rounded-r-full bg-brand-600 transition-all duration-200',
                                active ? 'h-6 opacity-100' : 'h-0 opacity-0',
                              )}
                            />

                            <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />

                            {!railed && <span className="flex-1 truncate">{item.label}</span>}

                            {/* count badge */}
                            {badge > 0 &&
                              (railed ? (
                                <span
                                  className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white"
                                  aria-hidden="true"
                                />
                              ) : (
                                <span
                                  className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold tabular-nums text-slate-600 group-hover:bg-brand-100 group-hover:text-brand-700"
                                  aria-label={`${badge} needing attention`}
                                >
                                  {badge > 99 ? '99+' : badge}
                                </span>
                              ))}
                          </Link>
                        );
                      })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* user + sign out */}
          <div className="shrink-0 border-t border-slate-200 p-2.5">
            <div
              className={cn(
                'flex items-center rounded-lg',
                railed ? 'justify-center' : 'gap-2.5 px-1 pb-1.5',
              )}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-gradient text-white">
                <UserIcon className="h-4 w-4" aria-hidden="true" />
              </span>
              {!railed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading text-[13px] font-semibold text-ink">
                    {user?.name}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">{user?.email}</p>
                </div>
              )}
            </div>

            {railed ? (
              <button
                type="button"
                onClick={logout}
                aria-label="Sign out"
                title="Sign out"
                className="flex w-full items-center justify-center rounded-lg px-2 py-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-[13px] font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:bg-slate-50 hover:text-brand-700"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sign out
              </button>
            )}
          </div>
        </aside>

        {/* ---------------- main ---------------- */}
        <main className={cn('min-h-screen transition-[padding] duration-300', width)}>
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
            <div className="container-site flex h-16 items-center gap-3">
              <DrawerTrigger
                onClick={() => setSidebarOpen(true)}
                controls="admin-sidebar"
                label="Open navigation"
              />

              <h1 className="font-heading text-lg font-bold text-ink sm:text-xl">
                {nav.find(n => isActive(n.to))?.label ?? 'Admin'}
              </h1>

              <div className="ml-auto flex items-center gap-2">
                {!railed && (
                  <span className="hidden text-xs text-slate-400 xl:block">
                    <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans">
                      Alt+1–9
                    </kbd>{' '}
                    to jump ·{' '}
                    <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans">
                      Alt+B
                    </kbd>{' '}
                    to collapse
                  </span>
                )}
                <a
                  href={siteUrl('/')}
                  className="hidden rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700 lg:inline-block"
                >
                  View site
                </a>
              </div>
            </div>
          </header>

          <div className="container-site py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}