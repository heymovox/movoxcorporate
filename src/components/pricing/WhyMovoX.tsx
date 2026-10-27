import { motion } from 'motion/react';
import { ShieldCheck, Zap, Clock, HeartHandshake, Sparkles, Repeat } from 'lucide-react';
import { cn } from '../../lib/utils';

interface WhyMovoXProps {
  className?: string;
}

const reasons = [
  {
    icon: ShieldCheck,
    color: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    title: 'Fixed-price guarantee',
    desc: 'No hourly surprises. You approve a scope and a number — we deliver within it.',
  },
  {
    icon: Zap,
    color: 'bg-amber-100 text-amber-700 ring-amber-200',
    title: 'Fast delivery',
    desc: 'Typical projects ship in 2–6 weeks with weekly demo builds you can actually click.',
  },
  {
    icon: Clock,
    color: 'bg-brand-100 text-brand-700 ring-brand-200',
    title: 'Post-launch support',
    desc: 'Every package includes 30–90 days of free bug fixes and minor tweaks after launch.',
  },
  {
    icon: HeartHandshake,
    color: 'bg-rose-100 text-rose-700 ring-rose-200',
    title: 'Dedicated team',
    desc: 'A named PM, lead designer, and engineers who know your product — not rotating freelancers.',
  },
  {
    icon: Sparkles,
    color: 'bg-violet-100 text-violet-700 ring-violet-200',
    title: 'Design system included',
    desc: 'We ship a reusable design system so your site or app stays consistent as you grow.',
  },
  {
    icon: Repeat,
    color: 'bg-orange-100 text-orange-700 ring-orange-200',
    title: 'Flexible scaling',
    desc: 'Upgrade, downgrade, or switch scope with 30 days notice. Your package moves with you.',
  },
];

export function WhyMovoX({ className }: WhyMovoXProps) {
  return (
    <section className={cn('relative py-16 sm:py-24 border-t border-slate-200/60', className)}>
      {/* subtle background */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-brand-50/30 to-white"
        aria-hidden="true"
      />

      <div className="container-site relative z-10">
        <div className="max-w-2xl mb-14">
          <span className="chip">Why MovoX</span>
          <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            What you get with every package
          </h2>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
            Transparent pricing is only half the story. Here&rsquo;s what
            separates MovoX from a typical freelance or agency quote.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((reason, i) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              className="group rounded-2xl border border-slate-200/70 bg-white p-7 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
            >
              <span className={cn('flex h-12 w-12 items-center justify-center rounded-xl ring-1', reason.color)}>
                <reason.icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-heading text-lg font-bold text-ink">{reason.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{reason.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
