/**
 * Schedule A editor for the agreement generator.
 *
 * Services are picked from the public pricing catalogue (service → package
 * cascade), which auto-fills name, description, and price, or added as fully
 * custom lines with hand-entered pricing. Every field stays editable so the
 * admin can re-check the whole schedule before it is rendered onto the
 * agreement document.
 */
import { useState } from 'react';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import { pricingData, type PricingPackage } from '../../data/pricing';
import type { ScheduleA, ScheduleLineItem } from '../../lib/adminApi';
import { Field, TextInput, TextArea } from './ui';

let counter = 0;
const nextId = () => `li_${Date.now().toString(36)}_${counter++}`;

export const emptySchedule = (): ScheduleA => ({
  website: 'https://www.heymovox.com',
  technology: 'React, Vite, Tailwind CSS',
  gst: '',
  advancePayment: '40%',
  milestonePayment: '40%',
  finalPayment: '20%',
  estimatedDelivery: '',
  designRevisionRounds: '',
  developmentRevisionRounds: '',
  bugFixDays: '',
  deploymentIncluded: '',
  sourceCodeHandover: '',
  maintenance: '',
  hostingAndDomain: '',
  projectFee: '',
  acceptanceDays: '5',
  lineItems: [],
  notes: '',
});

/** Sum of qty × unit price across all lines. */
export function scheduleTotal(items: ScheduleLineItem[]): number {
  return items.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
    0,
  );
}

/** Project fee: the manual override if set, otherwise the computed total. */
export function effectiveFee(schedule: ScheduleA): number {
  const manual = Number(schedule.projectFee);
  return schedule.projectFee !== '' && !Number.isNaN(manual)
    ? manual
    : scheduleTotal(schedule.lineItems);
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

function packageLabel(pkg: PricingPackage): string {
  return `${pkg.name} — ${pkg.priceLabel ?? inr(pkg.price)}`;
}

/** Service + package cascade that appends a priced catalogue line. */
function CataloguePicker({ onAdd }: { onAdd: (item: ScheduleLineItem) => void }) {
  const [serviceId, setServiceId] = useState('');
  const [packageId, setPackageId] = useState('');

  const service = pricingData.find(s => s.id === serviceId);

  const add = () => {
    const pkg = service?.packages.find(p => p.id === packageId);
    if (!service || !pkg) return;
    onAdd({
      id: nextId(),
      kind: 'catalog',
      serviceId: service.id,
      packageId: pkg.id,
      serviceName: service.name,
      packageName: pkg.name,
      description: pkg.description,
      quantity: 1,
      unitPrice: pkg.price,
    });
    setPackageId('');
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Add from the public pricing catalogue
      </p>
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <select
          aria-label="Select a service"
          value={serviceId}
          onChange={e => {
            setServiceId(e.target.value);
            setPackageId('');
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="">Select a service…</option>
          {pricingData.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Select a package"
          value={packageId}
          disabled={!service}
          onChange={e => setPackageId(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">
            {service ? 'Select a package…' : 'Pick a service first'}
          </option>
          {service?.packages.map(p => (
            <option key={p.id} value={p.id}>
              {packageLabel(p)}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={add}
          disabled={!packageId}
          className="btn btn-primary btn-sm self-center"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add
        </button>
      </div>
    </div>
  );
}

export default function ScheduleAEditor({
  value,
  onChange,
}: {
  value: ScheduleA;
  onChange: (v: ScheduleA) => void;
}) {
  const patch = (p: Partial<ScheduleA>) => onChange({ ...value, ...p });

  const setItem = (id: string, next: Partial<ScheduleLineItem>) =>
    patch({ lineItems: value.lineItems.map(i => (i.id === id ? { ...i, ...next } : i)) });

  const remove = (id: string) =>
    patch({ lineItems: value.lineItems.filter(i => i.id !== id) });

  const addCustom = () =>
    patch({
      lineItems: [
        ...value.lineItems,
        {
          id: nextId(),
          kind: 'custom',
          serviceName: '',
          description: '',
          quantity: 1,
          unitPrice: 0,
        },
      ],
    });

  const total = scheduleTotal(value.lineItems);
  const fee = effectiveFee(value);

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink">Services &amp; pricing</p>
          <button type="button" onClick={addCustom} className="btn btn-secondary btn-sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add custom
          </button>
        </div>

        <CataloguePicker onAdd={item => patch({ lineItems: [...value.lineItems, item] })} />

        {value.lineItems.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            No services added yet. Pick from the catalogue or add a custom line.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {value.lineItems.map(item => {
              const lineAmount =
                (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-2">
                      {item.kind === 'catalog' ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                            <Sparkles className="h-3 w-3" aria-hidden="true" />
                            {item.serviceName} · {item.packageName}
                          </span>
                          <span className="text-xs text-slate-400">
                            from catalogue — all fields still editable
                          </span>
                        </div>
                      ) : (
                        <TextInput
                          placeholder="Custom service name"
                          aria-label="Custom service name"
                          value={item.serviceName}
                          onChange={e => setItem(item.id, { serviceName: e.target.value })}
                        />
                      )}

                      <TextInput
                        placeholder="Description / deliverables"
                        aria-label="Line description"
                        value={item.description ?? ''}
                        onChange={e => setItem(item.id, { description: e.target.value })}
                      />

                      <div className="grid gap-2 sm:grid-cols-3">
                        <Field label="Qty">
                          <TextInput
                            type="number"
                            min="0"
                            step="1"
                            aria-label="Quantity"
                            value={item.quantity}
                            onChange={e =>
                              setItem(item.id, { quantity: Number(e.target.value) || 0 })
                            }
                          />
                        </Field>
                        <Field label="Unit price (₹)">
                          <TextInput
                            type="number"
                            min="0"
                            step="1"
                            aria-label="Unit price"
                            value={item.unitPrice}
                            onChange={e =>
                              setItem(item.id, { unitPrice: Number(e.target.value) || 0 })
                            }
                          />
                        </Field>
                        <Field label="Amount (₹)">
                          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-ink">
                            {lineAmount.toLocaleString('en-IN')}
                          </div>
                        </Field>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      aria-label="Remove line"
                      className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-600">Line items total</dt>
            <dd className="font-semibold text-ink">{inr(total)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1.5">
            <dt className="font-heading font-bold text-ink">Project fee</dt>
            <dd className="font-heading font-bold text-ink">{inr(fee)}</dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Website" htmlFor="sa-web">
          <TextInput
            id="sa-web"
            value={value.website}
            onChange={e => patch({ website: e.target.value })}
          />
        </Field>

        <Field label="Technology" htmlFor="sa-tech">
          <TextInput
            id="sa-tech"
            value={value.technology}
            onChange={e => patch({ technology: e.target.value })}
          />
        </Field>

        <Field label="GST / Taxes" htmlFor="sa-gst" hint="e.g. As applicable / Included">
          <TextInput
            id="sa-gst"
            value={value.gst}
            onChange={e => patch({ gst: e.target.value })}
          />
        </Field>

        <Field label="Project fee override (₹)" hint="Leave blank to use the line items total">
          <TextInput
            type="number"
            min="0"
            step="1"
            value={value.projectFee}
            onChange={e => patch({ projectFee: e.target.value })}
            placeholder={String(total)}
          />
        </Field>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-ink">Payment milestones</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Advance payment">
            <TextInput
              value={value.advancePayment}
              onChange={e => patch({ advancePayment: e.target.value })}
              placeholder="40%"
            />
          </Field>
          <Field label="Milestone payment">
            <TextInput
              value={value.milestonePayment}
              onChange={e => patch({ milestonePayment: e.target.value })}
              placeholder="40%"
            />
          </Field>
          <Field label="Final payment">
            <TextInput
              value={value.finalPayment}
              onChange={e => patch({ finalPayment: e.target.value })}
              placeholder="20%"
            />
          </Field>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Estimated delivery"
          htmlFor="sa-delivery"
          hint="e.g. 30–45 business days"
        >
          <TextInput
            id="sa-delivery"
            value={value.estimatedDelivery}
            onChange={e => patch({ estimatedDelivery: e.target.value })}
            placeholder="X–Y business days"
          />
        </Field>

        <Field label="Client acceptance window (days)" htmlFor="sa-accept">
          <TextInput
            id="sa-accept"
            type="number"
            min="0"
            value={value.acceptanceDays}
            onChange={e => patch({ acceptanceDays: e.target.value })}
          />
        </Field>

        <Field
          label="Design revision rounds"
          htmlFor="sa-design-rev"
          hint="Section 10 — design revisions"
        >
          <TextInput
            id="sa-design-rev"
            type="number"
            min="0"
            value={value.designRevisionRounds}
            onChange={e => patch({ designRevisionRounds: e.target.value })}
          />
        </Field>

        <Field
          label="Development revision rounds"
          htmlFor="sa-dev-rev"
          hint="Section 10 — implementation revisions"
        >
          <TextInput
            id="sa-dev-rev"
            type="number"
            min="0"
            value={value.developmentRevisionRounds}
            onChange={e => patch({ developmentRevisionRounds: e.target.value })}
          />
        </Field>

        <Field
          label="Post-launch bug-fix period (days)"
          htmlFor="sa-bugfix"
          hint="Section 17 — e.g. 15 or 30"
        >
          <TextInput
            id="sa-bugfix"
            type="number"
            min="0"
            value={value.bugFixDays}
            onChange={e => patch({ bugFixDays: e.target.value })}
          />
        </Field>

        <Field label="Deployment included" htmlFor="sa-deploy">
          <TextInput
            id="sa-deploy"
            value={value.deploymentIncluded}
            onChange={e => patch({ deploymentIncluded: e.target.value })}
            placeholder="Yes / No"
          />
        </Field>

        <Field label="Source code handover" htmlFor="sa-src">
          <TextInput
            id="sa-src"
            value={value.sourceCodeHandover}
            onChange={e => patch({ sourceCodeHandover: e.target.value })}
            placeholder="Yes / No / Conditions"
          />
        </Field>

        <Field label="Maintenance" htmlFor="sa-maint">
          <TextInput
            id="sa-maint"
            value={value.maintenance}
            onChange={e => patch({ maintenance: e.target.value })}
            placeholder="Included / Excluded / Separate Plan"
          />
        </Field>

        <Field label="Hosting and domain" htmlFor="sa-host">
          <TextInput
            id="sa-host"
            value={value.hostingAndDomain}
            onChange={e => patch({ hostingAndDomain: e.target.value })}
            placeholder="Included / Excluded"
          />
        </Field>
      </div>

      <Field label="Additional notes" htmlFor="sa-notes">
        <TextArea
          id="sa-notes"
          rows={3}
          value={value.notes}
          onChange={e => patch({ notes: e.target.value })}
        />
      </Field>
    </div>
  );
}