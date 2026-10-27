import { Link } from 'react-router-dom';
import {
  Linkedin,
  Instagram,
  Twitter,
  Dribbble,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
} from 'lucide-react';
import { Logo } from './Header';
import { NewsletterForm } from './footer/NewsletterForm';
import { FooterCtaBand } from './footer/FooterCtaBand';
import { BackToTop } from './footer/BackToTop';

const WHATSAPP_URL = 'https://wa.me/919500621262?text=Hi%20MovoX%2C%20I%27d%20like%20to%20talk%20about%20a%20project.';
const MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=Krishnagiri%2C%20Tamil%20Nadu%2C%20India';

/** Shared focus treatment — the footer sits on a dark gradient, so the
 *  default outline has poor contrast against it. */
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700';

const serviceLinks = [
  { to: '/services/graphic-design', label: 'Graphic Design' },
  { to: '/services/branding-packaging', label: 'Branding & Packaging' },
  { to: '/services/website-development', label: 'Website Development' },
  { to: '/services/app-development', label: 'App Development' },
  { to: '/services/digital-marketing', label: 'Digital Marketing & SEO' },
];

const companyLinks = [
  { to: '/portfolio', label: 'Our Work' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About MovoX' },
  { to: '/insights', label: 'Insights' },
  { to: '/contact', label: 'Contact' },
  { to: '/start-a-project', label: 'Start a Project' },
];

const legalLinks = [
  { to: '/privacy-policy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms & Conditions' },
];

const socialLinks = [
  { href: 'https://www.linkedin.com/company/movox', label: 'LinkedIn', Icon: Linkedin },
  { href: 'https://www.instagram.com/movox.agency', label: 'Instagram', Icon: Instagram },
  { href: 'https://twitter.com/movox_agency', label: 'Twitter / X', Icon: Twitter },
  { href: 'https://www.behance.net/movox', label: 'Behance', Icon: Dribbble },
];

const headingClass =
  'font-heading text-sm font-bold uppercase tracking-[0.18em] text-brand-200';
const linkClass = `text-sm text-brand-100/85 transition-colors hover:text-white ${focusRing}`;

export function Footer() {
  return (
    <>
      <FooterCtaBand />

      <footer className="bg-brand-gradient text-white">
        <div className="container-site grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4 lg:py-20">
          {/* Brand + newsletter */}
          <div>
            <Logo dark />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-brand-100/80">
              An integrated digital growth company. Distinctive brands, powerful
              digital experiences, and marketing that reaches the right audience.
            </p>

            <h3 className={`${headingClass} mt-8`}>Stay in the loop</h3>
            <NewsletterForm />

            <div className="mt-6 flex gap-3">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`MovoX on ${label}`}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/25 transition-all duration-300 hover:-translate-y-0.5 hover:border-white hover:bg-white/10 ${focusRing}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <nav aria-label="Services">
            <h3 className={headingClass}>Services</h3>
            <ul className="mt-5 space-y-3">
              {serviceLinks.map(link => (
                <li key={link.to}>
                  <Link to={link.to} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company">
            <h3 className={headingClass}>Company</h3>
            <ul className="mt-5 space-y-3">
              {companyLinks.map(link => (
                <li key={link.to}>
                  <Link to={link.to} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className={headingClass}>Contact</h3>
            <ul className="mt-5 space-y-4 text-sm text-brand-100/85">
              <li>
                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-start gap-3 transition-colors hover:text-white ${focusRing}`}
                >
                  <MapPin
                    className="mt-0.5 h-4 w-4 shrink-0 text-brand-300"
                    aria-hidden="true"
                  />
                  <span className="underline decoration-white/30 underline-offset-4 group-hover:decoration-white">
                    Krishnagiri, Tamil Nadu
                    <br />
                    India
                  </span>
                </a>
              </li>
              <li>
                <a href="mailto:info@heymovox.com" className={`flex items-center gap-3 transition-colors hover:text-white ${focusRing}`}>
                  <Mail className="h-4 w-4 shrink-0 text-brand-300" aria-hidden="true" />
                  info@heymovox.com
                </a>
              </li>
              <li>
                <a href="tel:+919500621262" className={`flex items-center gap-3 transition-colors hover:text-white ${focusRing}`}>
                  <Phone className="h-4 w-4 shrink-0 text-brand-300" aria-hidden="true" />
                  +91 95006 21262
                </a>
              </li>
            </ul>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Link
                to="/start-a-project"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-heading text-sm font-semibold text-ink transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                Start a Project
              </Link>

              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with MovoX on WhatsApp"
                className={`inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3 font-heading text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 ${focusRing}`}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/15">
          <div className="container-site flex flex-col items-center justify-between gap-4 py-6 text-xs text-brand-200/70 sm:flex-row">
            <p>© {new Date().getFullYear()} MovoX — Digital Growth. All rights reserved.</p>
            <nav aria-label="Legal" className="flex items-center gap-6">
              {legalLinks.map(link => (
                <Link key={link.to} to={link.to} className={`transition-colors hover:text-white ${focusRing}`}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </footer>

      <BackToTop />
    </>
  );
}