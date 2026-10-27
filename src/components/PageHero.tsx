import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  children?: ReactNode;
}

export function PageHero({ eyebrow, title, description, children }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-white pb-16 pt-[124px] sm:pb-20 sm:pt-[132px]">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(239,247,251,0.9)_0%,rgba(255,255,255,0)_70%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-32 top-10 h-72 w-72 rounded-full bg-brand-100/60 blur-3xl"
        aria-hidden="true"
      />
      <div className="container-site relative">
        <Reveal>
          <span className="chip">{eyebrow}</span>
          <h1 className="mt-5 max-w-3xl font-heading text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
              {description}
            </p>
          )}
          {children}
        </Reveal>
      </div>
    </section>
  );
}
