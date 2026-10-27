import { motion } from 'motion/react';
import { PricingCard } from './PricingCard';
import type { ServicePricing } from '../../data/pricing';

interface PricingGridProps {
  service: ServicePricing;
  billing: 'monthly' | 'yearly';
}

export function PricingGrid({ service, billing }: PricingGridProps) {
  const yearlyDiscount = 0.83;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:gap-8 xl:grid-cols-4">
      {service.packages.map((pkg, i) => {
        const yearlyPrice =
          billing === 'yearly'
            ? new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0,
              }).format(Math.round(pkg.price * yearlyDiscount))
            : undefined;

        return (
          <motion.div
            key={pkg.id}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, delay: i * 0.1 }}
          >
            <PricingCard
              pkg={pkg}
              serviceName={service.name}
              billing={billing}
              index={i}
              yearlyPrice={yearlyPrice}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
