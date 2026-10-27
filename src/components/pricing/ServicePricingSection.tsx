import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PricingCard } from './PricingCard';
import { PricingTable } from './PricingTable';
import { Reveal } from '../Reveal';
import type { ServicePricing } from '../../data/pricing';

interface ServicePricingSectionProps {
  service: ServicePricing;
}

export function ServicePricingSection({ service }: ServicePricingSectionProps) {
  return (
    <section
      id={`pricing-${service.id}`}
      className="py-20 sm:py-24"
      aria-labelledby={`${service.id}-heading`}
    >
      <div className="container-site">
        <Reveal className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-[0_8px_24px_rgba(35,130,184,0.35)]">
              <service.icon className="h-7 w-7" aria-hidden="true" />
            </span>
            <div>
              <p className="chip">{service.shortName} Pricing</p>
              <h2 id={`${service.id}-heading`} className="mt-3 font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                {service.name} Packages
              </h2>
            </div>
          </div>
          <p className="max-w-2xl text-lg leading-relaxed text-slate-600">
            {service.description}
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mb-16">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {service.packages.map((pkg, i) => (
              <PricingCard key={pkg.id} pkg={pkg} serviceName={service.name} index={i} />
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <PricingTable service={service} />
        </Reveal>

        <Reveal delay={0.2} className="mt-12 text-center">
          <Link
            to="/start-a-project"
            className="inline-flex items-center justify-center gap-2 btn btn-primary btn-lg"
          >
            <span className="btn-content flex items-center gap-2">
              Discuss a Custom Scope
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </Link>
          <p className="mt-4 text-sm text-slate-500">
            Need something different? We'll scope a custom engagement tailored to your goals and budget.
          </p>
        </Reveal>
      </div>
    </section>
  );
}