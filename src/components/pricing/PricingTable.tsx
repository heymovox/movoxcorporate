import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ServicePricing } from '../../data/pricing';

interface PricingTableProps {
  service: ServicePricing;
}

export function PricingTable({ service }: PricingTableProps) {
  const comparisonFeatures = service.comparisonFeatures ?? [];
  const packages = service.packages;

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white" role="region" aria-label={`${service.name} package comparison`}>
      <table className="w-full" role="table">
        <thead>
          <tr className="border-b border-slate-100 bg-brand-50/50">
            <th className="sticky left-0 z-10 px-5 py-4 text-left font-heading font-semibold text-ink" scope="col">
              Feature
            </th>
            {packages.map((pkg) => (
              <th key={pkg.id} className={cn('px-5 py-4 text-center font-heading font-semibold', pkg.popular && 'text-brand-700')} scope="col">
                {pkg.name}
                {pkg.popular && <span className="ml-1.5 inline-flex h-5 items-center rounded-full bg-brand-gradient px-2 py-0.5 font-heading text-[10px] font-bold uppercase tracking-wider text-white">Popular</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparisonFeatures.map((feature, rowIndex) => (
            <tr key={feature.label} className={cn('border-b border-slate-100/50 last:border-0', rowIndex % 2 === 0 && 'bg-slate-50/50')}>
              <th className="sticky left-0 z-10 px-5 py-4 text-left font-medium text-slate-700" scope="row">
                {feature.label}
              </th>
              {packages.map((pkg) => (
                <td key={pkg.id} className="px-5 py-4 text-center">
                  {feature.includes.includes(pkg.id) ? (
                    <CheckCircle2 className="mx-auto h-5 w-5 text-brand-600" aria-hidden="true" />
                  ) : (
                    <XCircle className="mx-auto h-5 w-5 text-slate-300" aria-hidden="true" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}