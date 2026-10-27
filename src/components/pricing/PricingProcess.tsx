import { motion } from 'motion/react';
import { MessageSquare, FileText, Hammer, Rocket } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PricingProcessProps {
  className?: string;
}

const steps = [
  {
    num: '01',
    icon: MessageSquare,
    title: 'Discovery call',
    desc: 'A 30-minute call to understand your goals, audience, timeline, and budget. No cost, no commitment.',
    color: 'from-brand-500 to-brand-700',
    iconColor: 'text-brand-600',
    bg: 'bg-brand-50',
  },
  {
    num: '02',
    icon: FileText,
    title: 'Fixed proposal',
    desc: 'Within 1–2 business days you get a detailed scope, timeline, and a fixed price. Approve it to lock the rate.',
    color: 'from-emerald-500 to-emerald-700',
    iconColor: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    num: '03',
    icon: Hammer,
    title: 'Weekly builds',
    desc: 'We ship working increments every week. You review, give feedback, and watch the product take shape.',
    color: 'from-amber-500 to-amber-700',
    iconColor: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    num: '04',
    icon: Rocket,
    title: 'Launch & support',
    desc: 'We deploy, hand over source code, and stay on-call for 30–90 days of post-launch bug fixes.',
    color: 'from-violet-500 to-violet-700',
    iconColor: 'text-violet-600',
    bg: 'bg-violet-50',
  },
];

export function PricingProcess({ className }: PricingProcessProps) {
  return (
    <section className={cn('relative py-16 sm:py-24 border-t border-slate-200/60', className)}>
      <div className="container-site relative z-10">
        <div className="max-w-2xl mb-14">
          <span className="chip">How it works</span>
          <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Simple, transparent pricing process
          </h2>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
            No hidden fees. No hourly billing surprises. Here&rsquo;s exactly
            how we scope, quote, and deliver every project.
          </p>
        </div>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              className="relative flex flex-col rounded-3xl border border-slate-200/70 bg-white p-7 shadow-card hover:shadow-card-hover transition-shadow duration-300"
            >
              {/* step number */}
              <div className={cn('absolute -top-4 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-white font-heading text-sm font-bold shadow-lg', step.color)}>
                {step.num}
              </div>

              <span className={cn('flex h-12 w-12 items-center justify-center rounded-xl', step.bg)}>
                <step.icon className={cn('h-6 w-6', step.iconColor)} aria-hidden="true" />
              </span>

              <h3 className="mt-5 font-heading text-lg font-bold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-slate-500">
          Typical turnaround: <span className="font-semibold text-brand-700">2–6 weeks</span> for
          websites, <span className="font-semibold text-brand-700">4–12 weeks</span> for apps and full
          branding systems.
        </p>
      </div>
    </section>
  );
}
