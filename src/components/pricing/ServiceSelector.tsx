import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { pricingData, type ServicePricing } from '../../data/pricing';
import { Tag, Percent } from 'lucide-react';

interface ServiceSelectorProps {
  onServiceChange: (service: ServicePricing) => void;
  initialService: ServicePricing;
  onBillingChange?: (billing: 'monthly' | 'yearly') => void;
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

export function ServiceSelector({ onServiceChange, initialService, onBillingChange }: ServiceSelectorProps) {
  const [activeId, setActiveId] = useState(initialService.id);
  const [isYearly, setIsYearly] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const handleSelect = (service: ServicePricing) => {
    setActiveId(service.id);
    onServiceChange(service);
  };

  return (
    <div className="container-site">
      <div className="relative overflow-hidden rounded-[2rem] border border-brand-200/60 bg-gradient-to-br from-brand-50 via-white to-brand-50/40 shadow-[0_12px_40px_rgba(0,54,85,0.08)]">
        {/* decorative corner blobs */}
        <div
          className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-brand-100/50 blur-[80px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-emerald-100/40 blur-[70px]"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col gap-8 p-8 sm:p-10 lg:flex-row lg:items-center lg:gap-10">
          {/* ---- Service tabs ---- */}
          <div className="flex-1">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-gradient text-white shadow-sm">
                <Tag className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-700">
                Choose a service
              </p>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-brand-200/60 bg-white/80 p-[3px] backdrop-blur-sm">
              {/* animated indicator */}
              <motion.div
                className="absolute top-[3px] left-[3px] h-[calc(100%-6px)] rounded-[14px] bg-brand-gradient shadow-[0_4px_14px_rgba(35,130,184,0.4)]"
                initial={false}
                animate={{ x: `${activeId === pricingData[0]?.id ? 0 : (pricingData.findIndex((s) => s.id === activeId) / pricingData.length) * 100}%` }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                style={{ width: `${100 / pricingData.length}%` }}
              />
              <div className="relative flex justify-between gap-0.5">
                {pricingData.map((service) => {
                  const isActive = activeId === service.id;
                  return (
                    <motion.button
                      key={service.id}
                      whileHover={!prefersReducedMotion && !isActive ? { scale: 1.02 } : {}}
                      whileTap={!prefersReducedMotion ? { scale: 0.97 } : {}}
                      onClick={() => handleSelect(service)}
                      className={cn(
                        'relative z-10 flex flex-1 flex-col items-center gap-1.5 rounded-[14px] px-2 py-3 text-[11px] font-semibold transition-colors duration-200',
                        isActive
                          ? 'text-white'
                          : 'text-slate-600 hover:text-brand-700 hover:bg-brand-50/60',
                      )}
                    >
                      <service.icon
                        className={cn(
                          'h-5 w-5 shrink-0 transition-transform duration-200',
                          isActive ? 'scale-110' : 'opacity-70',
                        )}
                        aria-hidden="true"
                      />
                      <span className="font-heading text-center leading-tight">
                        {service.shortName}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ---- Divider ---- */}
          <div
            className="hidden lg:block h-20 w-px bg-gradient-to-b from-transparent via-brand-300/60 to-transparent"
            aria-hidden="true"
          />

          {/* ---- Billing toggle ---- */}
          <div className="flex flex-col justify-center gap-5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-sm">
                <Percent className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Billing
              </p>
            </div>

            {/* Segmented control */}
            <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-inner" role="group" aria-label="Billing period">
              <motion.button
                whileTap={!prefersReducedMotion ? { scale: 0.96 } : {}}
                onClick={() => { setIsYearly(false); onBillingChange?.('monthly'); }}
                aria-pressed={!isYearly}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-300',
                  !isYearly
                    ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-[0_4px_12px_rgba(35,130,184,0.35)]'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                <span className="text-xs uppercase tracking-wide">Monthly</span>
              </motion.button>
              <motion.button
                whileTap={!prefersReducedMotion ? { scale: 0.96 } : {}}
                onClick={() => { setIsYearly(true); onBillingChange?.('yearly'); }}
                aria-pressed={isYearly}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-300',
                  isYearly
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_4px_12px_rgba(16,185,129,0.35)]'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                <span className="text-xs uppercase tracking-wide">Yearly</span>
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-extrabold transition-colors',
                  isYearly ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-700',
                )}>
                  −20%
                </span>
              </motion.button>
            </div>

            <p className="text-xs text-slate-400 max-w-[200px]">
              Yearly = 10 months for the price of 12. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
