/**
 * Site-wide pre-footer CTA band.
 *
 * Gives visitors finishing any page (article, pricing, case study) somewhere
 * to go instead of a dead end.
 */
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Phone } from 'lucide-react';

const points = [
  'Free discovery call',
  'Fixed-price proposals',
  'Kickoff within a week',
];

export function FooterCtaBand() {
  const { pathname } = useLocation();

  // The pricing page has its own closing CTA (PricingCTA), so the site-wide
  // band is redundant there.
  if (pathname === '/pricing') return null;

  return (
    <section
      className="relative overflow-hidden bg-ink"
      aria-labelledby="footer-cta-heading"
    >
      {/* soft brand glow */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-brand-600/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="container-site relative py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="footer-cta-heading"
            className="font-heading text-3xl font-bold leading-tight text-white md:text-4xl"
          >
            Ready to build something that{' '}
            <span className="text-brand-300">actually performs?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-brand-100/85">
            Tell us where you want to go. We&rsquo;ll come back with scope,
            timeline, and a fixed price — no obligation.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/start-a-project" className="btn btn-primary btn-lg w-full sm:w-auto">
              <span className="btn-content flex items-center justify-center gap-2">
                Start a Project
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>

            <a
              href="tel:+919500621262"
              className="btn btn-ghost btn-lg w-full border-white/25 text-white hover:bg-white/10 sm:w-auto"
            >
              <span className="btn-content flex items-center justify-center gap-2">
                <Phone className="h-4 w-4" aria-hidden="true" />
                +91 95006 21262
              </span>
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-brand-100/70">
            {points.map(point => (
              <li key={point} className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-brand-300"
                  aria-hidden="true"
                />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}