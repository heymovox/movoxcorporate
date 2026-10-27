import { Reveal } from '../Reveal';
import { ArrowRight, Globe, Layers, ShieldCheck, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PricingHeroProps {
  className?: string;
}

export function PricingHero({ className }: PricingHeroProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden pt-[124px] sm:pt-[148px] pb-20 sm:pb-28',
        className,
      )}
    >
      {/* Gradient background */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950"
        aria-hidden="true"
      />

      {/* Decorative blobs */}
      <div
        className="pointer-events-none absolute -top-20 -left-20 h-96 w-96 rounded-full bg-brand-500/20 blur-[120px] mix-blend-overlay animate-blob"
        aria-hidden="true"
        style={{ animationDuration: '10s' }}
      />
      <div
        className="pointer-events-none absolute top-1/3 -right-16 h-80 w-80 rounded-full bg-brand-300/15 blur-[100px] mix-blend-overlay animate-blob"
        aria-hidden="true"
        style={{ animationDuration: '12s', animationDelay: '2s' }}
      />
      <div
        className="pointer-events-none absolute bottom-10 left-1/3 h-64 w-64 rounded-full bg-emerald-400/10 blur-[80px] animate-blob"
        aria-hidden="true"
        style={{ animationDuration: '9s', animationDelay: '4s' }}
      />

      {/* Grid overlay for texture */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]"
        aria-hidden="true"
      />

      <div className="container-site relative z-10">
        <Reveal>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/20 text-brand-300 ring-1 ring-brand-500/30">
              <Zap className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold uppercase tracking-wider text-brand-300">
              Transparent · No hidden fees · No hourly billing
            </span>
          </div>
          <h1 className="mt-6 max-w-3xl font-heading text-5xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Pricing built for{' '}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-emerald-300 via-brand-300 to-brand-200 bg-clip-text text-transparent">
                real growth.
              </span>
              <span
                className="absolute -bottom-2 left-0 h-1 w-full bg-gradient-to-r from-emerald-400 to-brand-400 rounded-full opacity-60"
                aria-hidden="true"
              />
            </span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-brand-100/90 sm:text-xl">
            Choose the package that matches where you are today — or let us
            scope something custom. Every plan includes clear deliverables,
            fixed timelines, and post-launch support.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-14 flex flex-wrap justify-center gap-3 sm:gap-4">
          <TrustBadge icon={<Globe className="h-4 w-4" />} label="100+ brands served" />
          <TrustBadge icon={<ShieldCheck className="h-4 w-4" />} label="WCAG 2.1 AA compliant" />
          <TrustBadge icon={<Layers className="h-4 w-4" />} label="Source code handover" />
          <TrustBadge icon={<ArrowRight className="h-4 w-4" />} label="Post-launch support" />
        </Reveal>
      </div>

      {/* Bottom wave / fade */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"
        aria-hidden="true"
      />
    </section>
  );
}

interface TrustBadgeProps {
  icon: React.ReactElement;
  label: string;
}

function TrustBadge({ icon, label }: TrustBadgeProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/15 bg-white/10 backdrop-blur-md text-sm font-medium text-white/90 shadow-sm hover:bg-white/15 transition-colors">
      {icon}
      <span>{label}</span>
    </div>
  );
}
