import { useState } from 'react';
import { useSEO } from '@/lib/seo';
import { pricingData, type ServicePricing } from '@/data/pricing';
import { PricingHero } from '@/components/pricing/PricingHero';
import { StatsBand } from '@/components/pricing/StatsBand';
import { ServiceSelector } from '@/components/pricing/ServiceSelector';
import { PricingGrid } from '@/components/pricing/PricingGrid';
import { ComparisonTable } from '@/components/pricing/ComparisonTable';
import { WhyMovoX } from '@/components/pricing/WhyMovoX';
import { TestimonialsSection } from '@/components/pricing/TestimonialsSection';
import { PricingProcess } from '@/components/pricing/PricingProcess';
import { Alternatives } from '@/components/pricing/Alternatives';
import { ROICalculator } from '@/components/pricing/ROICalculator';
import { PricingFAQ } from '@/components/pricing/PricingFAQ';
import { PricingCTA } from '@/components/pricing/PricingCTA';
import { Reveal } from '@/components/Reveal';

export default function Pricing() {
  useSEO({
    title: 'Service Pricing — Transparent Packages for Web, App, Design, Branding & Marketing',
    description:
      'Transparent pricing for MovoX services: Website Development, App Development, Graphic Design, Branding & Packaging, and Digital Marketing. Starting from ₹499. No hidden fees.',
    path: '/pricing',
  });

  const [activeService, setActiveService] = useState<ServicePricing>(pricingData[0]);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <>
      <PricingHero />

      <StatsBand className="-mt-16" />

      <Reveal className="py-12 sm:py-16">
        <ServiceSelector
          initialService={activeService}
          onServiceChange={(service) => {
            setActiveService(service);
          }}
          onBillingChange={(b) => setBilling(b)}
        />
      </Reveal>

      <Reveal delay={0.05} className="py-8 sm:py-12">
        <div className="container-site">
          <div className="flex items-end justify-between mb-10 sm:mb-14">
            <div>
              <span className="chip">{activeService.shortName} Packages</span>
              <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                {activeService.name}
              </h2>
              <p className="mt-2 text-slate-600">{activeService.description}</p>
            </div>
          </div>

          <PricingGrid service={activeService} billing={billing} />
        </div>
      </Reveal>

      <Reveal delay={0.1} className="py-12 sm:py-16 border-t border-slate-200/60">
        <ComparisonTable service={activeService} />
      </Reveal>

      <WhyMovoX />

      <TestimonialsSection />

      <PricingProcess />

      <Alternatives />

      <ROICalculator />

      <PricingFAQ />
      <PricingCTA />
    </>
  );
}
