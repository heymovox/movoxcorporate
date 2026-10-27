import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { X, ArrowRight, Linkedin, Instagram, Twitter, Mail, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Topbar } from './Topbar';
import { ServicesMegaMenu } from './header/ServicesMegaMenu';
import { MenuToggle } from './header/MenuToggle';
import {
  useScrolled,
  useScrollProgress,
  useScrollSpy,
  useFocusTrap,
} from './header/useHeaderBehaviour';

const navLinks = [
  { to: '/services', label: 'Services' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/portfolio', label: 'Our Work' },
  { to: '/insights', label: 'Insights' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

/** Paths the scroll-spy watches. */
const spyPaths = ['/services', '/pricing', '/portfolio', '/insights', '/about', '/contact'];

const mobileContactItems = [
  { icon: Mail, label: 'info@heymovox.com', href: 'mailto:info@heymovox.com' },
  { icon: Phone, label: '+91 95006 21262', href: 'tel:+919500621262' },
];

const mobileSocialLinks = [
  { icon: Linkedin, href: 'https://www.linkedin.com/company/movox', label: 'LinkedIn' },
  { icon: Instagram, href: 'https://www.instagram.com/movox.agency', label: 'Instagram' },
  { icon: Twitter, href: 'https://twitter.com/movox_agency', label: 'Twitter' },
];

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link to="/" className="flex items-center" aria-label="MovoX — Digital Growth, home">
      <span className={cn('relative inline-block logo-shimmer', dark && 'logo-shimmer-dark')}>
        <img
          src={dark ? '/images/brand/logo-white.png' : '/images/brand/logo-dark.png'}
          alt="MovoX — Beyond Digital"
          className={cn('h-11 w-auto object-contain', dark ? 'h-10' : 'h-11')}
          width="220"
          height="57"
        />
      </span>
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [headerH, setHeaderH] = useState(126);

  const scrolled = useScrolled(40);
  const progress = useScrollProgress();
  const spyActive = useScrollSpy(spyPaths, location.pathname);

  // Close everything on navigation.
  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  // Lock the page behind the mobile panel.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Escape closes either overlay; focus is trapped and restored while open.
  useEffect(() => {
    if (!open && !menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, menuOpen]);

  useFocusTrap(panelRef, open);

  // Track the real header height so the panel always sits flush beneath it.
  // Hard-coding this broke as soon as the bar changed height on scroll.
  useEffect(() => {
    const node = headerRef.current;
    if (!node) return;

    const measure = () => setHeaderH(Math.round(node.getBoundingClientRect().height));
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const isActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <header ref={headerRef} className="fixed inset-x-0 top-0 z-50">
      <Topbar />

      <div
        className={cn(
          'transition-all duration-300 ease-out',
          scrolled || open
            ? 'border-b border-slate-200/70 bg-white/90 shadow-[0_4px_24px_rgba(0,54,85,0.06)] backdrop-blur-md'
            : 'bg-white',
        )}
      >
        {/* shrink the bar from 88px to 64px once past the hero */}
        <div
          className={cn(
            'container-site flex items-center justify-between transition-all duration-300 ease-out',
            scrolled && !open ? 'h-16' : 'h-[88px]',
          )}
        >
          <div
            className={cn(
              'shrink-0 transition-transform duration-300 ease-out origin-left',
              scrolled && !open && 'scale-90',
            )}
          >
            <Logo />
          </div>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {navLinks.map((link) =>
              link.to === '/services' ? (
                <ServicesMegaMenu
                  key={link.to}
                  open={menuOpen}
                  onOpenChange={setMenuOpen}
                  /** Scroll-spy / route highlight only — the panel itself is
                   *  never forced open, so it can't cover the section. */
                  active={isActive(link.to) || spyActive === link.to}
                />
              ) : (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'rounded-full px-4 py-2 font-heading text-sm font-semibold transition-colors',
                    isActive(link.to) || spyActive === link.to
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-ink',
                  )}
                  aria-current={
                    isActive(link.to) || spyActive === link.to ? 'page' : undefined
                  }
                >
                  {link.label}
                </NavLink>
              ),
            )}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              to="/start-a-project"
              className={cn(
                'btn btn-primary btn-sm transition-all duration-300',
                scrolled && 'scale-95',
              )}
            >
              <span className="btn-content flex items-center gap-2">
                Start a Project
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          </div>

          {/* Mobile toggle */}
<MenuToggle
            open={open}
            onToggle={() => setOpen(v => !v)}
            buttonRef={hamburgerRef}
          />
        </div>

        {/* read-progress line */}
        <div
          className="h-0.5 origin-left bg-brand-gradient transition-opacity duration-300"
          style={{
            transform: `scaleX(${progress / 100})`,
            opacity: progress > 0 ? 1 : 0,
          }}
          role="progressbar"
          aria-label="Page read progress"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* ---------------- mobile panel ---------------- */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            ref={panelRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 z-40 overflow-y-auto border-b border-slate-200/70 bg-white/95 shadow-[0_20px_40px_rgba(0,54,85,0.12)] backdrop-blur-xl lg:hidden"
            style={{
              top: headerH,
              maxHeight: `calc(100dvh - ${headerH}px)`,
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-menu-title"
          >
            <div className="container-site py-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 id="mobile-menu-title" className="font-heading text-lg font-bold text-ink">
                  Menu
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <nav aria-label="Mobile navigation" className="space-y-1">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, delay: 0.05 * index, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <NavLink
                      to={link.to}
                      onClick={() => setOpen(false)}
                      className={({ isActive: active }) =>
                        cn(
                          'flex items-center px-4 py-3.5 font-heading text-base font-semibold rounded-xl transition-colors',
                          active || spyActive === link.to
                            ? 'bg-brand-50 text-brand-700'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-ink',
                        )
                      }
                    >
                      {link.label}
                    </NavLink>
                  </motion.div>
                ))}
              </nav>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Link
                  to="/start-a-project"
                  onClick={() => setOpen(false)}
                  className="btn btn-primary btn-lg mt-4 w-full"
                >
                  <span className="btn-content flex items-center justify-center gap-2">
                    Start a Project
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.35 }}
                className="mt-6 border-t border-slate-100 pt-6"
              >
                <h3 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Contact
                </h3>
                <div className="space-y-3">
                  {mobileContactItems.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-3 text-sm text-slate-600 transition-colors hover:text-brand-700"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <item.icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span>{item.label}</span>
                    </a>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="mt-6 border-t border-slate-100 pt-6"
              >
                <h3 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Follow Us
                </h3>
                <div className="flex items-center gap-3">
                  {mobileSocialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-all duration-300 hover:bg-brand-gradient hover:text-white"
                    >
                      <social.icon className="h-5 w-5" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}