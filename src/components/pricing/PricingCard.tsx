import { CheckCircle2, ArrowRight, MessageCircle, Star, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { getWhatsAppURL, getPackageWhatsAppMessage } from '../../data/pricing';
import type { PricingPackage } from '../../data/pricing';

interface PricingCardProps {
  pkg: PricingPackage;
  serviceName: string;
  billing: 'monthly' | 'yearly';
  index?: number;
  yearlyPrice?: number;
}

// per-tier accent colors so the deck isn't monochrome
const tierAccent = [
  { ring: 'ring-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Starter' },
  { ring: 'ring-brand-200', bg: 'bg-brand-50', text: 'text-brand-700', dot: 'bg-brand-500', label: 'Growth' },
  { ring: 'ring-violet-200', bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500', label: 'Premium' },
  { ring: 'ring-amber-200', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Enterprise' },
];

export function PricingCard({
  pkg,
  serviceName,
  billing,
  index = 0,
  yearlyPrice,
}: PricingCardProps) {
  const whatsappUrl = getWhatsAppURL(getPackageWhatsAppMessage(serviceName, pkg.name));
  const accent = tierAccent[index % tierAccent.length];
  const isPopular = pkg.popular;

  const displayPrice = billing === 'yearly' && yearlyPrice ? yearlyPrice : pkg.priceLabel;
  const displayPeriod =
    billing === 'yearly'
      ? '/yr'
      : pkg.period === 'per design' || pkg.period === 'per SKU'
        ? pkg.period
        : pkg.period === '/month'
          ? '/mo'
          : pkg.period ?? '';

  const isPrimary = pkg.ctaVariant === 'primary';
  const isSecondary = pkg.ctaVariant === 'secondary';
  const isOutline = pkg.ctaVariant === 'outline';

  const topFeatures = pkg.features.slice(0, 5);

  return (
    <motion.article
      whileHover={{ y: -8 }}
      whileTap={{ y: 0 }}
      layout
      className={cn(
        'group relative flex flex-col rounded-3xl border bg-white shadow-card transition-all duration-300',
        isPopular
          ? 'border-brand-300 ring-2 ring-brand-100 shadow-[0_16px_48px_rgba(35,130,184,0.15)] z-10'
          : 'border-slate-200/70 hover:border-brand-300/50 hover:shadow-card-hover',
      )}
      style={{ animationDelay: `${index * 90}ms` }}
    >
      {/* gradient top bar */}
      <div
        className={cn(
          'h-1.5 rounded-t-3xl',
          isPopular
            ? 'bg-brand-gradient'
            : `bg-gradient-to-r ${accent.dot} to-transparent opacity-60`,
        )}
        aria-hidden="true"
      />

      {/* popular badge */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-gradient px-3.5 py-1.5 font-heading text-[10px] font-bold uppercase tracking-wider text-white shadow-[0_6px_16px_rgba(35,130,184,0.5)]">
            <Star className="h-3 w-3 fill-white" aria-hidden="true" />
            Most Popular
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-7 sm:p-8">
        {/* tier label */}
        <div className="mb-4 flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', accent.dot)} aria-hidden="true" />
          <span className={cn('text-[11px] font-bold uppercase tracking-wider', accent.text)}>
            {accent.label}
          </span>
        </div>

        <h3 className="font-heading text-xl font-bold text-ink">{pkg.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-3">{pkg.description}</p>

        {/* price block */}
        <div className="mt-6 mb-6 rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading text-4xl font-extrabold text-ink tracking-tight sm:text-5xl">
              {displayPrice}
            </span>
            {displayPeriod && (
              <span className="text-sm font-medium text-slate-500">{displayPeriod}</span>
            )}
          </div>
          {pkg.startingAt && (
            <p className="mt-1 text-xs font-medium text-brand-600">starting at</p>
          )}
          {billing === 'yearly' && yearlyPrice && (
            <p className="mt-1 text-xs font-medium text-emerald-600">
              Save 20% vs monthly
            </p>
          )}
        </div>

        {/* feature chips */}
        <div className="mb-6 flex flex-wrap gap-1.5" role="list">
          {topFeatures.map((feature, i) => (
            <span
              key={i}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium',
                accent.bg, accent.text,
              )}
            >
              <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
              {feature.text.length > 28 ? `${feature.text.slice(0, 26)}…` : feature.text}
            </span>
          ))}
        </div>

        <div className="flex-1" />

        {/* full feature list */}
        <div className="mt-2 space-y-2 border-t border-slate-100 pt-5">
          {pkg.features.map((feature, i) => (
            <div key={i} className="flex items-start gap-2.5 text-[13px] leading-snug text-slate-700">
              <span className={cn('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full', accent.bg, accent.text)}>
                <CheckCircle2 className="h-2.5 w-2.5" aria-hidden="true" />
              </span>
              <span>{feature.text}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-7 flex flex-col gap-2.5 border-t border-slate-100 pt-6">
          <Link
            to="/start-a-project"
            state={{ from: 'pricing', service: serviceName, package: pkg.name }}
            className={cn(
              'btn w-full btn-lg justify-center',
              isPrimary && 'btn-primary',
              isSecondary && 'btn-secondary',
              isOutline && 'btn-outline',
            )}
          >
            <span className="btn-content flex items-center justify-center gap-2">
              {pkg.ctaText}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </Link>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'btn w-full justify-center text-sm',
              'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-brand-700 hover:border-brand-300 transition-colors',
            )}
          >
            <span className="btn-content flex items-center justify-center gap-2">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp enquiry
            </span>
          </a>
        </div>
      </div>
    </motion.article>
  );
}
