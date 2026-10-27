import { Reveal } from '../Reveal';
import {
  ShoppingBag,
  Code,
  Plane,
  HeartPulse,
  Store,
  Briefcase,
  Building2,
  Factory,
  GraduationCap,
  Music,
} from 'lucide-react';

const industries = [
  { name: 'Consumer & DTC', icon: ShoppingBag },
  { name: 'SaaS & Fintech', icon: Code },
  { name: 'Travel & Hospitality', icon: Plane },
  { name: 'Health & Wellness', icon: HeartPulse },
  { name: 'Retail & E-commerce', icon: Store },
  { name: 'Professional Services', icon: Briefcase },
  { name: 'Manufacturing', icon: Factory },
  { name: 'Education & EdTech', icon: GraduationCap },
  { name: 'Media & Entertainment', icon: Music },
  { name: 'Real Estate', icon: Building2 },
];

export function ClientTrust() {
  return (
    <section className="border-y border-slate-200/70 bg-brand-50/50 py-16 sm:py-20" aria-labelledby="trust-heading">
      <div className="container-site">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto">
            <p id="trust-heading" className="font-heading text-xs font-bold uppercase tracking-[0.24em] text-brand-700">
              Trusted across industries
            </p>
            <h2 className="mt-2 font-heading text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              We partner with brands across diverse sectors
            </h2>
            <p className="mt-3 text-base text-slate-600">
              From startups to enterprises, our integrated approach adapts to the unique
              challenges and opportunities of every industry.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5">
            {industries.map((item, index) => (
              <Reveal key={item.name} delay={0.05 * index}>
                <div className="h-full">
                  <div
                    className="group relative rounded-2xl border border-slate-200/70 bg-white p-6 sm:p-8 text-center shadow-card transition-all duration-500 hover:-translate-y-1 hover:border-brand-300 hover:shadow-[0_20px_40px_rgba(0,54,85,0.10)] h-full flex flex-col"
                  >
                    {/* Icon with animated background */}
                    <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50 group-hover:bg-brand-gradient group-hover:text-white transition-all duration-500">
                      <item.icon className="h-7 w-7 text-brand-600 group-hover:text-white transition-colors duration-500" aria-hidden="true" />
                      {/* Ripple effect on hover */}
                      <span className="absolute inset-0 rounded-xl bg-brand-gradient/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-ping" aria-hidden="true" />
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="font-heading text-base font-semibold text-ink group-hover:text-brand-700 transition-colors duration-300">
                        {item.name}
                      </h3>

                      {/* Subtle underline animation */}
                      <div className="mt-3 h-0.5 w-0 bg-brand-gradient mx-auto transition-all duration-500 group-hover:w-1/2" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-12 text-center">
            <p className="text-xs text-slate-500">
              Client names shared only with written consent. Verified project outcomes are
              available on request.
            </p>
          </div>
        </Reveal>

        {/* Stats row */}
        <Reveal delay={0.25}>
          <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4 max-w-3xl mx-auto">
            <div className="text-center p-4 rounded-xl bg-white/50 border border-slate-100">
              <p className="font-heading text-3xl font-extrabold text-ink">120+</p>
              <p className="text-xs text-slate-500 mt-1">Projects delivered</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/50 border border-slate-100">
              <p className="font-heading text-3xl font-extrabold text-ink">60+</p>
              <p className="text-xs text-slate-500 mt-1">Clients across sectors</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/50 border border-slate-100">
              <p className="font-heading text-3xl font-extrabold text-ink">12+</p>
              <p className="text-xs text-slate-500 mt-1">Industries served</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/50 border border-slate-100">
              <p className="font-heading text-3xl font-extrabold text-ink">8+</p>
              <p className="text-xs text-slate-500 mt-1">Years of expertise</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
