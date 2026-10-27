import { Info, ShieldAlert, Minus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { pricingNotes, pricingExclusions } from '../../data/pricing';
import { cn } from '../../lib/utils';

interface PricingDisclaimerProps {
  className?: string;
}

export function PricingDisclaimer({ className }: PricingDisclaimerProps) {
  return (
    <section className={cn('py-12 sm:py-16', className)} aria-labelledby="pricing-disclaimer-heading">
      <div className="container-site">
        <div className="mx-auto max-w-4xl">
          {/* heading */}
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Info className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2
                id="pricing-disclaimer-heading"
                className="font-heading text-xl font-bold text-ink sm:text-2xl"
              >
                Important Pricing Notes
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                Read these before comparing quotes &mdash; they explain what the
                numbers above do and don&rsquo;t cover.
              </p>
            </div>
          </div>

          {/* the terms */}
          <ul
            className="mt-6 grid gap-x-8 gap-y-4 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-6 sm:grid-cols-2 sm:p-7"
            role="note"
          >
            {pricingNotes.map(note => (
              <li key={note} className="flex items-start gap-3">
                <span
                  className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                  aria-hidden="true"
                />
                <span className="text-sm leading-relaxed text-amber-900">{note}</span>
              </li>
            ))}
          </ul>

          {/* exclusions — broken out of the list above into real items */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              </span>
              <h3 className="font-heading text-base font-bold text-ink">
                Not included unless explicitly stated
              </h3>
            </div>

            <ul className="mt-5 flex flex-wrap gap-2">
              {pricingExclusions.map(item => (
                <li
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
                >
                  <Minus className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-5 border-t border-slate-100 pt-5 text-sm leading-relaxed text-slate-500">
              These are billed separately or supplied by you at actual cost. If any
              of them fall inside your project, tell us on the call and we&rsquo;ll
              price them in up front rather than surprise you later.
            </p>

            <Link
              to="/start-a-project"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-600"
            >
              Get a fixed-price quote
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}