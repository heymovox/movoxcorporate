/**
 * Services mega-menu.
 *
 * Opens on hover (pointer) and on click/Enter (keyboard + touch); outside
 * clicks, hover-out, Escape and navigation dismiss it. The caller may light
 * the trigger up via `active` (route / scroll-spy) without opening the panel,
 * so the panel can never be forced open over the page content.
 */
import { useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { services } from '../../data/services';
import { ServiceIcon } from '../ServiceIcon';
import { cn } from '../../lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Highlight the trigger (active route or scroll-spy section) without opening. */
  active?: boolean;
}

export function ServicesMegaMenu({ open, onOpenChange, active = false }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const location = useLocation();

  // Any navigation closes the menu.
  useEffect(() => {
    onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Outside click closes.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, onOpenChange]);

  // Escape closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const openNow = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    onOpenChange(true);
  };

  /** Small delay so diagonal mouse movement doesn't close it. */
  const closeSoon = () => {
    closeTimer.current = window.setTimeout(() => onOpenChange(false), 140);
  };

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    [],
  );

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
    >
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          'flex items-center gap-1 rounded-full px-4 py-2 font-heading text-sm font-semibold transition-colors',
          open || active
            ? 'bg-brand-50 text-brand-700'
            : 'text-slate-600 hover:bg-slate-100 hover:text-ink',
        )}
      >
        Services
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-200',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          className="absolute left-1/2 top-full z-50 w-[min(52rem,92vw)] -translate-x-1/2 pt-3"
          role="menu"
          aria-label="Services"
        >
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_28px_70px_rgba(0,54,85,0.18)]">
            {/* panel header */}
            <div className="flex items-end justify-between gap-6 border-b border-slate-100 px-7 py-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">
                  What we do
                </p>
                <p className="mt-1 font-heading text-lg font-bold text-ink">
                  Five capabilities, one accountable team.
                </p>
              </div>
              <Link
                to="/services"
                role="menuitem"
                className="shrink-0 text-sm font-semibold text-brand-700 underline-offset-4 transition-colors hover:text-brand-600 hover:underline"
              >
                View all services
              </Link>
            </div>

            {/* service grid */}
            <div className="grid gap-px bg-slate-100 sm:grid-cols-2">
              {services.map((service, i) => (
                <Link
                  key={service.slug}
                  to={`/services/${service.slug}`}
                  role="menuitem"
                  className={cn(
                    'group relative flex gap-4 bg-white px-7 py-5 transition-colors hover:bg-brand-50 focus-visible:bg-brand-50 focus-visible:outline-none',
                    // Odd count leaves a hole; let the last card span the row.
                    i === services.length - 1 && services.length % 2 === 1 && 'sm:col-span-2',
                  )}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors duration-300 group-hover:bg-brand-gradient group-hover:text-white">
                    <ServiceIcon name={service.icon} className="h-5 w-5" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-heading text-[15px] font-bold text-ink">
                        {service.name}
                      </span>
                      <ArrowRight
                        className="h-3.5 w-3.5 shrink-0 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-slate-600">
                      {service.tagline}
                    </span>
                    <span className="mt-2 block text-xs text-slate-400">
                      {service.capabilities.slice(0, 2).join(' · ')}
                    </span>
                  </span>
                </Link>
              ))}
            </div>

            {/* panel footer */}
            <div className="flex items-center justify-between gap-4 border-t border-slate-100 bg-slate-50 px-7 py-4">
              <p className="text-xs text-slate-500">
                Not sure which one you need? We&rsquo;ll scope it on a call.
              </p>
              <Link to="/pricing" role="menuitem" className="btn btn-secondary btn-sm">
                <span className="btn-content">Compare all pricing</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}