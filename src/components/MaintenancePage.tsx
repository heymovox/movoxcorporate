import {
  Wrench,
  Clock,
  Mail,
  Phone,
  MessageCircle,
  Linkedin,
  Instagram,
  Twitter,
  Dribbble,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSEO } from '../lib/seo';
import { Reveal } from './Reveal';
import { Logo } from './Header';

const WHATSAPP_URL =
  'https://wa.me/919500621262?text=Hi%20MovoX%2C%20I%27d%20like%20to%20talk%20about%20a%20project.';

const socialLinks = [
  { href: 'https://www.linkedin.com/company/movox', label: 'LinkedIn', Icon: Linkedin },
  { href: 'https://www.instagram.com/movox.agency', label: 'Instagram', Icon: Instagram },
  { href: 'https://twitter.com/movox_agency', label: 'Twitter / X', Icon: Twitter },
  { href: 'https://www.behance.net/movox', label: 'Behance', Icon: Dribbble },
];

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2';

const contactClass = `inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:text-brand-700 hover:shadow-md ${focusRing}`;

export default function MaintenancePage() {
  useSEO({
    title: "We'll be right back",
    description: 'MovoX is currently undergoing scheduled maintenance.',
    path: '/maintenance',
  });

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div
        className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-brand-100/60 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-brand-200/40 blur-3xl"
        aria-hidden="true"
      />

      {/* brand */}
      <div className="relative mb-10">
        <Logo />
      </div>

      <Reveal className="relative text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-gradient shadow-[0_12px_36px_rgba(35,130,184,0.35)]">
          <Wrench className="h-10 w-10 text-white" aria-hidden="true" />
        </span>
        <p className="mt-8 font-heading text-sm font-bold uppercase tracking-[0.3em] text-brand-600">
          Under maintenance
        </p>
        <h1 className="mt-4 font-heading text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          We&apos;ll be right back.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-slate-600">
          We&apos;re currently performing scheduled maintenance to improve your
          experience. Thank you for your patience.
        </p>
        <div className="mt-9 flex items-center justify-center gap-2 text-sm text-slate-500">
          <Clock className="h-4 w-4 text-brand-600" aria-hidden="true" />
          <span>We expect to be back shortly.</span>
        </div>
      </Reveal>

      {/* Still need us? Direct channels stay open while the site is down. */}
      <Reveal className="relative mt-12 text-center">
        <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
          Need us right now?
        </p>
        <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="mailto:info@heymovox.com" className={contactClass}>
            <Mail className="h-4 w-4 text-brand-600" aria-hidden="true" />
            info@heymovox.com
          </a>
          <a href="tel:+919500621262" className={contactClass}>
            <Phone className="h-4 w-4 text-brand-600" aria-hidden="true" />
            +91 95006 21262
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={contactClass}
          >
            <MessageCircle className="h-4 w-4 text-brand-600" aria-hidden="true" />
            Chat on WhatsApp
          </a>
        </div>

        <div className="mt-7 flex items-center justify-center gap-3">
          {socialLinks.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`MovoX on ${label}`}
              className={`flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 ${focusRing}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </a>
          ))}
        </div>

        <p className="mt-8 flex items-center justify-center gap-4 text-xs text-slate-400">
          <span>© {new Date().getFullYear()} MovoX — Beyond Digital.</span>
          <Link to="/privacy-policy" className={`transition-colors hover:text-brand-700 ${focusRing}`}>
            Privacy Policy
          </Link>
          <Link to="/terms" className={`transition-colors hover:text-brand-700 ${focusRing}`}>
            Terms &amp; Conditions
          </Link>
        </p>
      </Reveal>
    </section>
  );
}
