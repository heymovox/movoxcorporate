import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import { motion } from 'motion/react';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-[124px] sm:pt-[132px]" aria-labelledby="hero-heading">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(239,247,251,0.9)_0%,rgba(255,255,255,0)_60%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-brand-100/50 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-32 top-40 h-80 w-80 rounded-full bg-brand-200/30 blur-3xl"
        aria-hidden="true"
      />

      <div className="container-site relative grid items-center gap-14 py-20 sm:py-24 lg:grid-cols-2 lg:gap-10 lg:py-28">
        <div className="animate-fade-up">
          <span className="chip mb-6">Integrated Digital Growth Agency</span>
          <h1
            id="hero-heading"
            className="font-heading text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.6rem]"
          >
            Good ideas deserve{' '}
            <span className="bg-brand-gradient bg-clip-text text-transparent">
              great execution.
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600">
            We help businesses build distinctive brands, create powerful
            digital experiences and reach the right audience through strategic
            marketing.
          </p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link to="/start-a-project" className="btn btn-primary btn-lg">
              <span className="btn-content flex items-center justify-center gap-2">
                Start a Project
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
            <Link to="/portfolio" className="btn btn-secondary btn-lg">
              <span className="btn-content flex items-center justify-center gap-2">
                <Play className="h-4 w-4" aria-hidden="true" />
                View Our Work
              </span>
            </Link>
          </div>
          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-slate-200 pt-8">
            <div>
              <dt className="sr-only">Projects delivered</dt>
              <dd className="font-heading text-2xl font-extrabold text-ink">120+</dd>
              <dd className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                Projects delivered
              </dd>
            </div>
            <div>
              <dt className="sr-only">Years in practice</dt>
              <dd className="font-heading text-2xl font-extrabold text-ink">8</dd>
              <dd className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                Years in practice
              </dd>
            </div>
            <div>
              <dt className="sr-only">Clients across industries</dt>
              <dd className="font-heading text-2xl font-extrabold text-ink">60+</dd>
              <dd className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                Clients across industries
              </dd>
            </div>
          </dl>
        </div>

        <div className="relative hidden lg:block" aria-hidden="true">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-8 shadow-[0_32px_80px_rgba(0,54,85,0.28)]">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
              <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-brand-300/25" />
              <div className="relative space-y-6">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-24 rounded-full bg-white/40" />
                  <div className="h-3 w-12 rounded-full bg-white/25" />
                </div>
                <div className="rounded-2xl bg-white/95 p-5 shadow-lg">
                  <div className="flex items-center gap-3">
                    <img
                      src="/images/brand/icon.png"
                      alt=""
                      role="presentation"
                      className="h-11 w-11 rounded-xl object-cover"
                    />
                    <div>
                      <p className="font-heading text-sm font-bold text-ink">MovoX — Digital Growth</p>
                      <p className="text-xs text-slate-500">Brand · Web · Marketing</p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    <div className="h-3 w-full rounded-full bg-slate-200" />
                    <div className="h-3 w-4/5 rounded-full bg-slate-200" />
                    <div className="h-3 w-3/5 rounded-full bg-brand-200" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {['Branding', 'Web', 'Marketing'].map((label) => (
                    <div key={label} className="rounded-xl bg-white/15 p-3 text-center backdrop-blur-sm">
                      <p className="font-heading text-[11px] font-bold uppercase tracking-wider text-white">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -left-10 top-10 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card-hover"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Discovery workshop
              </p>
              <p className="mt-1 font-heading text-sm font-bold text-ink">Week 01</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -right-6 bottom-12 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card-hover"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Launch
              </p>
              <p className="mt-1 font-heading text-sm font-bold text-ink">On time, on budget</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
