import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ServicePricing } from '../../data/pricing';

interface ComparisonTableProps {
  service: ServicePricing;
}

export function ComparisonTable({ service }: ComparisonTableProps) {
  const comparisonFeatures = service.comparisonFeatures ?? [];
  const packages = service.packages;

  if (comparisonFeatures.length === 0) return null;

  return (
    <section className="container-site">
      <div className="overflow-x-auto rounded-3xl border border-slate-200/70 bg-white shadow-card">
        <table className="w-full text-left" role="table" aria-label={`${service.name} package feature comparison`}>
          <caption className="sr-only">Feature comparison across {service.name} packages</caption>
          <thead>
            <tr className="border-b border-slate-100 bg-brand-50/40">
              <th
                className="sticky left-0 z-20 px-6 py-5 font-heading font-semibold text-ink"
                scope="col"
              >
                Feature
              </th>
              {packages.map((pkg) => (
                <th
                  key={pkg.id}
                  className={cn(
                    'px-6 py-5 font-heading font-semibold text-center',
                    pkg.popular ? 'text-brand-700' : 'text-ink',
                  )}
                  scope="col"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-base">{pkg.name}</span>
                    {pkg.popular && (
                      <span className="inline-flex h-5 items-center rounded-full bg-brand-gradient px-2 py-0.5 font-heading text-[10px] font-bold uppercase tracking-wider text-white">
                        Popular
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/60">
            {comparisonFeatures.map((feature, rowIndex) => (
              <tr
                key={feature.label}
                className={cn(
                  rowIndex % 2 === 1 && 'bg-slate-50/40',
                  'transition-colors hover:bg-slate-100/40',
                )}
              >
                <th
                  className="sticky left-0 z-10 px-6 py-4 font-medium text-slate-700 bg-white/80 backdrop-blur-sm"
                  scope="row"
                >
                  {feature.label}
                </th>
                {packages.map((pkg) => (
                  <td key={pkg.id} className="px-6 py-4 text-center">
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
        <p className="mx-6 my-4 text-xs text-slate-500">
          Ticks indicate the feature is included in that package. Need a feature
          not listed?{' '}
          <a
            href="/start-a-project"
            className="font-medium text-brand-700 transition-colors hover:text-brand-600"
          >
            Request a custom scope
          </a>
          .
        </p>
      </div>
    </section>
  );
}
