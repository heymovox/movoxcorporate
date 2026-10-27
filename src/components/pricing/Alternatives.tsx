import { motion } from 'motion/react';
import { ArrowRight, Users, User, Building2, Sparkles, CheckCircle2, Zap, ShieldCheck, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface AlternativesProps {
  className?: string;
}

const alternatives = [
  {
    icon: User,
    name: 'Freelancer',
    price: '₹5K–₹30K',
    speed: '4–8 weeks',
    quality: 'Inconsistent',
    support: 'None post-launch',
    risk: 'High — single point of failure',
    cons: ['One person, limited skills', 'No QA process', 'May disappear mid-project'],
  },
  {
    icon: Building2,
    name: 'In-house team',
    price: '₹80K+/mo',
    speed: 'Ongoing',
    quality: 'Depends on hires',
    support: 'Full-time cost',
    risk: 'Medium — recruitment time',
    cons: ['Hiring takes 2–3 months', 'Salary + benefits ongoing', 'Single skill set'],
  },
  {
    icon: Users,
    name: 'Big agency',
    price: '₹2L–₹10L',
    speed: '3–6 months',
    quality: 'Good — account manager',
    support: 'Retainer only',
    risk: 'Low — but expensive',
    cons: ['Heavy overhead costs', 'Slow approval chains', 'Junior staff on your project'],
  },
];

const movoxHighlights = [
  { icon: Zap, label: 'Fast delivery', desc: '2–6 weeks typical' },
  { icon: ShieldCheck, label: 'Fixed price', desc: 'No hourly surprises' },
  { icon: CheckCircle2, label: 'Design system', desc: 'Consistent & scalable' },
  { icon: Clock, label: 'Free support', desc: '30–90 days post-launch' },
];

export function Alternatives({ className }: AlternativesProps) {
  return (
    <section className={cn('relative py-16 sm:py-24 border-t border-slate-200/60 overflow-hidden', className)}>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-slate-50/40 to-white"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-24 right-1/4 h-64 w-64 rounded-full bg-brand-100/30 blur-[100px]"
        aria-hidden="true"
      />

      <div className="container-site relative z-10">
        <div className="max-w-2xl mb-14">
          <span className="chip">Compare options</span>
          <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            How we stack up
          </h2>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
            See how MovoX compares to freelancers, in-house hires, and
            traditional agencies on the metrics that matter.
          </p>
        </div>

        {/* ---- Alternatives (3 cards) ---- */}
        <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
          {alternatives.map((alt, i) => (
            <motion.div
              key={alt.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              className="rounded-3xl border border-slate-200/70 bg-white p-7 shadow-card"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <alt.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-heading text-lg font-bold text-ink">{alt.name}</h3>
                  <p className="text-xs text-slate-500">{alt.price}</p>
                </div>
              </div>

              <dl className="mt-5 space-y-2.5 text-sm">
                {([
                  ['Speed', alt.speed],
                  ['Quality', alt.quality],
                  ['Support', alt.support],
                  ['Risk', alt.risk],
                ] as const).map(([k, v]) => (
                  <div key={k} className="flex items-start gap-2">
                    <dt className="w-16 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-slate-400 pt-0.5">{k}</dt>
                    <dd className="text-slate-600 leading-snug">{v}</dd>
                  </div>
                ))}
              </dl>

              <ul className="mt-5 space-y-1.5 border-t border-slate-100 pt-4">
                {alt.cons.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-xs text-slate-500">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" aria-hidden="true" />
                    {c}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* ---- MovoX hero card ---- */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative mt-10 sm:mt-14"
        >
          {/* glow behind */}
          <div
            className="pointer-events-none absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-brand-500/20 via-brand-400/10 to-emerald-400/15 blur-2xl"
            aria-hidden="true"
          />

          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 p-8 sm:p-12 shadow-[0_24px_60px_rgba(0,54,85,0.4)]">
            {/* decorative */}
            <div
              className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-500/20 blur-[100px]"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-emerald-400/10 blur-[80px]"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:36px_36px]"
              aria-hidden="true"
            />

            <div className="relative z-10 flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
              {/* left: copy */}
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 backdrop-blur-sm">
                  <Sparkles className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    Best value
                  </span>
                </div>

                <h3 className="mt-5 font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  MovoX
                </h3>
                <p className="mt-3 max-w-lg text-base leading-relaxed text-brand-100/85">
                  Freelancer-level pricing with agency-grade quality. Fixed
                  quotes, weekly demos, a full design system, and source-code
                  handover — no lock-in, no surprises.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    to="/start-a-project"
                    className="btn btn-lg justify-center bg-white text-brand-800 hover:bg-brand-50 transition-colors"
                  >
                    <span className="btn-content flex items-center gap-2">
                      Start a project
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </Link>
                  <a
                    href="https://wa.me/919500621262"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-lg justify-center border border-white/25 bg-white/10 text-white backdrop-blur-sm hover:bg-white/15 transition-colors"
                  >
                    <span className="btn-content flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <span className="text-[9px] font-bold">WA</span>
                      </span>
                      Chat on WhatsApp
                    </span>
                  </a>
                </div>
              </div>

              {/* right: highlights grid */}
              <div className="grid shrink-0 grid-cols-2 gap-4 lg:w-[380px]">
                {movoxHighlights.map((h, i) => (
                  <motion.div
                    key={h.label}
                    initial={{ opacity: 0, scale: 0.92 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-emerald-300">
                      <h.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <p className="mt-3 font-heading text-sm font-bold text-white">{h.label}</p>
                    <p className="text-xs text-brand-100/60">{h.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* price strip */}
            <div className="relative z-10 mt-10 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-200">Starting from</p>
                <p className="font-heading text-3xl font-extrabold text-white">
                  ₹499<span className="text-base font-semibold text-brand-200/80"> — ₹3L+</span>
                </p>
              </div>
              <p className="max-w-sm text-xs leading-relaxed text-brand-100/60">
                Fixed-price proposals after a free 30-minute discovery call. No
                hourly billing, no hidden fees, no scope-creep surprises.
              </p>
            </div>
          </div>
        </motion.div>

        <p className="mt-8 text-center text-xs text-slate-400">
          Prices are approximate market ranges for a comparable scope. MovoX offers the
          flexibility of freelance pricing with agency-grade quality.
        </p>
      </div>
    </section>
  );
}
