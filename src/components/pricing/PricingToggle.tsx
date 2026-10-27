import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface PricingToggleProps {
  className?: string;
}

function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setPrefers(media.matches);
    setPrefers(media.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);
  return prefers;
}

export function PricingToggle({ className }: PricingToggleProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isYearly, setIsYearly] = useState(false);

  const handleToggle = () => {
    setIsYearly((prev) => !prev);
  };

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <span className="text-sm font-medium text-slate-500">Monthly</span>
      <div className="relative inline-flex h-10 w-20 items-center rounded-full border border-slate-200 bg-white transition-colors duration-300 focus-within:ring-2 focus-within:ring-brand-500/30">
        <motion.button
          whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
          whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
          onClick={handleToggle}
          aria-pressed={isYearly}
          aria-label="Switch to yearly billing"
          className="absolute top-1 left-1 h-8 w-8 rounded-full bg-white shadow-card transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ transform: isYearly ? 'translateX(10px)' : 'translateX(0)' }}
        />
        <span
          className={cn(
            'absolute left-1 top-1/2 -translate-y-1/2 z-10 text-[10px] font-bold transition-colors duration-300',
            isYearly ? 'text-slate-400' : 'text-brand-600',
          )}
        >
          Mo
        </span>
        <span
          className={cn(
            'absolute right-1 top-1/2 -translate-y-1/2 z-10 text-[10px] font-bold transition-colors duration-300',
            isYearly ? 'text-brand-600' : 'text-slate-400',
          )}
        >
          Yr
        </span>
      </div>
      <span className="text-sm font-medium text-slate-500">Yearly</span>
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-brand-600 text-[10px] font-bold tracking-tighter">
        -20%
      </span>
    </div>
  );
}
