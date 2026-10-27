import { Users, Gauge, RefreshCw, ShieldCheck } from 'lucide-react';
import { SectionHeading } from '../SectionHeading';
import { Reveal } from '../Reveal';

const pillars = [
  {
    Icon: Users,
    title: 'One senior team, zero handoffs',
    text: 'The people you brief are the people who build. Designers, developers, and marketers in one room — no account-manager telephone game.',
  },
  {
    Icon: Gauge,
    title: 'Engineered for performance',
    text: 'Speed budgets in the brief, Core Web Vitals enforced in CI, accessibility tested before launch. Your site should be an asset, not an apology.',
  },
  {
    Icon: RefreshCw,
    title: 'Built to be measured',
    text: 'Every engagement ships with tracking, dashboards, and a measurement plan. If we cannot show you the outcome, we did not do the work.',
  },
  {
    Icon: ShieldCheck,
    title: 'Process you can trust',
    text: 'Weekly demos, staged approvals, transparent budgets. You always know what is happening, what is next, and what it costs.',
  },
];

export function WhyMovox() {
  return (
    <section className="container-site py-20 sm:py-28" aria-labelledby="why-heading">
      <SectionHeading
        eyebrow="Why MovoX"
        title={<span id="why-heading">A different kind of agency.</span>}
        description="Most agencies sell deliverables. We sell outcomes — and we structure the entire company around proving them."
      />
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {pillars.map(({ Icon, title, text }, i) => (
          <Reveal key={title} delay={i * 0.08}>
            <div className="card-surface h-full p-7 hover:-translate-y-1 hover:shadow-card-hover">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-[0_6px_18px_rgba(35,130,184,0.35)]">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-heading text-lg font-bold leading-snug text-ink">
                {title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
