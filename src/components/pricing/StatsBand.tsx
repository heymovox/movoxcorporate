import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface StatsBandProps {
  className?: string;
}

const stats = [
  { value: 120, suffix: '+', label: 'Projects Delivered', color: 'text-brand-300' },
  { value: 38, suffix: '+', label: '5-Star Reviews', color: 'text-emerald-300' },
  { value: 14, suffix: ' days', label: 'Avg. Turnaround', color: 'text-amber-300' },
  { value: 96, suffix: '%', label: 'Client Retention', color: 'text-violet-300' },
];

function useCountUp(target: number, start: boolean) {
  const [count, setCount] = useState(0);
  const frame = useRef<number>();

  useEffect(() => {
    if (!start) return;
    const duration = 1600;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(eased * target));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current!);
  }, [start, target]);

  return count;
}

function Stat({ value, suffix, label, color, index }: { value: number; suffix: string; label: string; color: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const count = useCountUp(value, inView);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: index * 0.12 }}
      className="text-center"
    >
      <div className={cn('font-heading text-4xl font-extrabold tracking-tight sm:text-5xl', color)}>
        {count}{suffix}
      </div>
      <p className="mt-2 text-sm font-medium text-brand-100/80">{label}</p>
    </motion.div>
  );
}

export function StatsBand({ className }: StatsBandProps) {
  return (
    <section className={cn('relative overflow-hidden', className)}>
      {/* gradient mesh background */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-40 -left-40 h-80 w-80 rounded-full bg-brand-600/20 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-brand-500/20 blur-[120px]"
        aria-hidden="true"
      />

      <div className="container-site relative z-10 py-16 sm:py-20">
        <div className="grid grid-cols-2 gap-10 sm:gap-16 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Stat key={s.label} {...s} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
