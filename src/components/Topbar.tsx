import { Mail, Phone, LogIn, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { portalUrl } from '../lib/host';
import { announcement } from '../data/site';

/**
 * Slim contact + account bar.
 *
 * Desktop (md+): email and phone on the left, Client Login on the right.
 * Mobile: a tappable promo announcement replaces the contact links, which are
 * both dead weight and redundant with the logo directly below.
 *
 * The account action opens the client portal on its own host
 * (portal.heymovox.com in production, /portal locally) rather than the
 * retired in-page auth modal.
 */
export function Topbar() {
  return (
    <div className="bg-brand-gradient text-white" role="region" aria-label="Contact and account">
      <div className="container-site flex h-9 items-center justify-between gap-2 text-xs">
        {/* desktop contacts */}
        <div className="hidden items-center gap-5 text-brand-100/90 md:flex">
          <a
            href="mailto:info@heymovox.com"
            className="flex items-center gap-1.5 transition-colors hover:text-white"
          >
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            info@heymovox.com
          </a>
          <a
            href="tel:+919500621262"
            className="flex items-center gap-1.5 transition-colors hover:text-white"
          >
            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            +91 95006 21262
          </a>
        </div>

        {/* mobile promo */}
        {announcement && (
          <Link
            to={announcement.to}
            className="flex min-w-0 items-center gap-1.5 rounded-full bg-white/15 py-1 pl-2 pr-2.5 font-medium text-white ring-1 ring-inset ring-white/25 transition-colors hover:bg-white/25 md:hidden"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-brand-200" aria-hidden="true" />
            <span className="truncate">{announcement.text}</span>
            {announcement.note && (
              <span className="hidden shrink-0 text-brand-200 sm:inline">{announcement.note}</span>
            )}
            <ArrowRight className="h-3 w-3 shrink-0" aria-hidden="true" />
          </Link>
        )}

        <a
          href={portalUrl('/login')}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 font-heading font-semibold text-ink text-xs transition-all duration-300 hover:-translate-y-px hover:shadow-md"
        >
          <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
          Client Login
        </a>
      </div>
    </div>
  );
}