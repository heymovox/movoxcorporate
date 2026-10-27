/**
 * Results band — the outcome numbers pulled out into their own dark, glowing
 * section with count-up animation (values that are not numeric render as-is).
 */
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Target } from 'lucide-react';
import type { CaseStudy } from '../../data/portfolio';
import { parseNumeric, resultAccents } from './helpers';

function useCountUp(target: number, start: boolean) {
  const [count, setCount] = useState(0);
  const frame = useRef<number>();

  useEffect(() => {
    if (!start) return;
    const duration = 1500;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(eased * target);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current!);
  }, [start, target]);

  return count;
}

function ResultTile({
  label,
  value,
  note,
  index,
}: {
  label: string;
  value: string;
  note: string;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const parsed = parseNumeric(value);
  const count = useCountUp(parsed?.num ?? 0, Boolean(parsed) && inView);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const accent = resultAccents[index % resultAccents.length];
  const decimals = parsed && !Number.isInteger(parsed.num) ? 1 : 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}
      className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.08]"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-white/5 blur-2xl transition-opacity duration-300 group-hover:opacity-0"
        aria-hidden="true"
      />
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/80">
        <Target className="h-4 w-4" aria-hidden="true" />
      </span>
      <p className={`mt-4 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl ${accent}`}>
        {parsed ? (
          <>
            {parsed.prefix}
            {inView
              ? count.toLocaleString('en-IN', {
                  minimumFractionDigits: decimals,
                  maximumFractionDigits: decimals,
                })
              : (0).toFixed(decimals)}
            {parsed.suffix}
          </>
        ) : (
          <span className="text-2xl sm:text-3xl">{value}</span>
        )}
      </p>
      <p className="mt-2 font-heading text-xs font-bold uppercase tracking-wider text-white/90">
        {label}
      </p>
      {note && <p className="mt-1 text-xs leading-relaxed text-brand-100/75">{note}</p>}
    </motion.div>
  );
}

export function ResultsBand({ project }: { project: CaseStudy }) {
  if (project.results.length === 0) return null;

  const cols =
    project.results.length <= 3
      ? 'sm:grid-cols-3'
      : project.results.length === 4
        ? 'sm:grid-cols-2 lg:grid-cols-4'
        : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';

  return (
    <section
      id="results"
      aria-labelledby="results-heading"
      className="relative scroll-mt-32 overflow-hidden bg-brand-950"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(35,130,184,0.30),transparent_60%),radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.14),transparent_60%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,#000,transparent_85%)]"
        aria-hidden="true"
      />

      <div className="container-site relative z-10 py-16 sm:py-20">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3.5 py-1.5 font-heading text-[11px] font-bold uppercase tracking-wider text-emerald-300">
            The outcome
          </span>
          <h2
            id="results-heading"
            className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
          >
            What changed after launch
          </h2>
          <p className="mt-4 text-base leading-relaxed text-brand-100/75">
            Disclosed with client consent. Verified references are available on request
            during a discovery call.
          </p>
        </div>

        <div className={`mt-10 grid gap-4 sm:gap-5 ${cols}`}>
          {project.results.map((r, i) => (
            <ResultTile key={`${r.label}-${i}`} index={i} {...r} />
          ))}
        </div>

        <p className="mt-8 flex items-center gap-2 text-xs text-brand-100/70">
          <span className="h-px w-8 bg-brand-400/50" aria-hidden="true" />
          {project.results.length} reported outcome
          {project.results.length === 1 ? '' : 's'} for this engagement
        </p>
      </div>
    </section>
  );
}
