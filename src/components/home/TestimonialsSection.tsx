import { Quote } from 'lucide-react';
import { testimonials } from '../../data/testimonials';
import { SectionHeading } from '../SectionHeading';
import { Reveal } from '../Reveal';

export function TestimonialsSection() {
  // No quotes published yet. Testimonials still live in code (there is no
  // database table for them) — see src/data/testimonials.ts.
  if (testimonials.length === 0) return null;
  return (
    <section className="container-site py-20 sm:py-28" aria-labelledby="outcomes-heading">
      <SectionHeading
        eyebrow="Client outcomes"
        title={<span id="outcomes-heading">What working with MovoX feels like.</span>}
        description="Quotes below are pending final client consent for named attribution — they reflect real engagements and are published only with written approval."
      />
      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        {testimonials.map((t, i) => (
          <Reveal key={t.author} delay={(i % 2) * 0.1}>
            <figure className="card-surface relative h-full p-8 hover:-translate-y-1 hover:shadow-card-hover">
              <Quote className="h-8 w-8 text-brand-200" aria-hidden="true" />
              <blockquote className="mt-4 text-base leading-relaxed text-slate-700">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 border-t border-slate-100 pt-5">
                <p className="font-heading text-sm font-bold text-ink">{t.author}</p>
                <p className="mt-0.5 text-xs text-slate-500">{t.role}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-brand-600">
                  {t.project}
                </p>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
