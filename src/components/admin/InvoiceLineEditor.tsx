/**
 * Invoice line-item editor.
 *
 * Pick a service from the public pricing catalogue, then pick any of its
 * packages to add as a priced line. Everything stays editable afterwards, and
 * a custom item can be added by hand for work that isn't in the catalogue.
 *
 * Items are held locally and only persisted once the invoice exists.
 */
import { useState } from 'react';
import { Plus, Trash2, Sparkles, ChevronDown } from 'lucide-react';
import { pricingData, type PricingPackage } from '../../data/pricing';
import { Field, TextInput, TextArea, inputClass } from './ui';

export interface InvoiceLine {
  id: string;
  kind: 'catalog' | 'custom';
  serviceId?: string;
  serviceName: string;
  packageId?: string;
  packageName?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

let seq = 0;
const newId = () => `ln_${Date.now().toString(36)}_${seq++}`;

export const inr = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const lineTotal = (l: InvoiceLine) =>
  (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0);

export const itemsTotal = (items: InvoiceLine[]) =>
  items.reduce((sum, l) => sum + lineTotal(l), 0);

const priceText = (p: PricingPackage) => p.priceLabel ?? inr(p.price);

export default function InvoiceLineEditor({
  items,
  onChange,
  taxRate,
  discount,
}: {
  items: InvoiceLine[];
  onChange: (items: InvoiceLine[]) => void;
  taxRate: number;
  discount: number;
}) {
  const [serviceId, setServiceId] = useState('');
  const [openPackage, setOpenPackage] = useState<string | null>(null);

  const service = pricingData.find(s => s.id === serviceId);
  const subtotal = itemsTotal(items);
  const tax = (subtotal * (Number(taxRate) || 0)) / 100;
  const total = subtotal + tax - (Number(discount) || 0);

  const addPackage = (pkg: PricingPackage) => {
    if (!service) return;
    onChange([
      ...items,
      {
        id: newId(),
        kind: 'catalog',
        serviceId: service.id,
        serviceName: service.name,
        packageId: pkg.id,
        packageName: pkg.name,
        description: pkg.description,
        quantity: 1,
        unitPrice: pkg.price,
      },
    ]);
    setOpenPackage(null);
  };

  const addCustom = () =>
    onChange([
      ...items,
      {
        id: newId(),
        kind: 'custom',
        serviceName: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
      },
    ]);

  const setItem = (id: string, patch: Partial<InvoiceLine>) =>
    onChange(items.map(l => (l.id === id ? { ...l, ...patch } : l)));

  const remove = (id: string) => onChange(items.filter(l => l.id !== id));

  return (
    <div className="space-y-5">
      {/* ---------- catalogue picker ---------- */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Services list
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            aria-label="Select a service"
            value={serviceId}
            onChange={e => {
              setServiceId(e.target.value);
              setOpenPackage(null);
            }}
            className={inputClass}
          >
            <option value="">Select a service…</option>
            {pricingData.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={addCustom}
            className="btn btn-secondary shrink-0 self-stretch"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add custom item
          </button>
        </div>

        {service && (
          <div className="mt-4">
            <p className="text-sm text-slate-600">{service.description}</p>

            <div className="mt-3 space-y-2">
              {service.packages.map(pkg => {
                const expanded = openPackage === pkg.id;
                const already = items.filter(i => i.packageId === pkg.id).length;

                return (
                  <div
                    key={pkg.id}
                    className="rounded-xl border border-slate-200 bg-white"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenPackage(expanded ? null : pkg.id)}
                      aria-expanded={expanded}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                    >
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-ink">{pkg.name}</span>
                          {pkg.popular && (
                            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                              Popular
                            </span>
                          )}
                          {pkg.startingAt && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                              Starting at
                            </span>
                          )}
                          {already > 0 && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              added ×{already}
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-500">
                          {pkg.features.length} deliverable
                          {pkg.features.length === 1 ? '' : 's'}
                          {pkg.period ? ` · billed ${pkg.period}` : ''}
                        </span>
                      </span>

                      <span className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-bold text-brand-700">
                          {priceText(pkg)}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-slate-400 transition-transform ${
                            expanded ? 'rotate-180' : ''
                          }`}
                          aria-hidden="true"
                        />
                      </span>
                    </button>

                    {expanded && (
                      <div className="border-t border-slate-100 px-4 py-3">
                        <p className="text-xs text-slate-600">{pkg.description}</p>
                        <ul className="mt-2 space-y-1">
                          {pkg.features.map((f, i) => (
                            <li
                              key={i}
                              className={`flex items-start gap-2 text-xs ${
                                f.included === false ? 'text-slate-400' : 'text-slate-700'
                              }`}
                            >
                              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-brand-400" />
                              <span className={f.included === false ? 'line-through' : ''}>
                                {f.text}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          onClick={() => addPackage(pkg)}
                          className="btn btn-primary btn-sm mt-3"
                        >
                          <Sparkles className="h-4 w-4" aria-hidden="true" />
                          Add {pkg.name}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ---------- selected items ---------- */}
      <div>
        <p className="mb-2 text-sm font-semibold text-ink">
          Invoice items{' '}
          <span className="font-normal text-slate-500">({items.length})</span>
        </p>

        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
            No items yet. Pick a service above, or add a custom item.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((l, i) => (
              <div key={l.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-start gap-3">
                  <span className="mt-2 w-4 shrink-0 text-xs font-semibold text-slate-400">
                    {i + 1}
                  </span>

                  <div className="flex-1 space-y-2">
                    {l.kind === 'catalog' ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-ink">
                          {l.serviceName} · {l.packageName}
                        </span>
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                          from catalogue
                        </span>
                      </div>
                    ) : (
                      <TextInput
                        placeholder="Custom item name"
                        aria-label="Custom item name"
                        value={l.serviceName}
                        onChange={e => setItem(l.id, { serviceName: e.target.value })}
                      />
                    )}

                    <TextArea
                      rows={2}
                      placeholder="Description / deliverables"
                      aria-label="Item description"
                      value={l.description}
                      onChange={e => setItem(l.id, { description: e.target.value })}
                    />

                    <div className="grid gap-2 sm:grid-cols-3">
                      <Field label="Qty">
                        <TextInput
                          type="number"
                          min="0"
                          step="1"
                          aria-label="Quantity"
                          value={l.quantity}
                          onChange={e =>
                            setItem(l.id, { quantity: Number(e.target.value) || 0 })
                          }
                        />
                      </Field>
                      <Field label="Unit price (₹)">
                        <TextInput
                          type="number"
                          min="0"
                          step="1"
                          aria-label="Unit price"
                          value={l.unitPrice}
                          onChange={e =>
                            setItem(l.id, { unitPrice: Number(e.target.value) || 0 })
                          }
                        />
                      </Field>
                      <Field label="Amount (₹)">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-ink">
                          {lineTotal(l).toLocaleString('en-IN')}
                        </div>
                      </Field>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(l.id)}
                    aria-label="Remove item"
                    className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---------- totals ---------- */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <dl className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-600">Subtotal</dt>
            <dd className="font-semibold text-ink">{inr(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-600">Tax ({Number(taxRate) || 0}%)</dt>
            <dd className="font-semibold text-ink">{inr(tax)}</dd>
          </div>
          {Number(discount) > 0 && (
            <div className="flex justify-between">
              <dt className="text-slate-600">Discount</dt>
              <dd className="font-semibold text-ink">−{inr(Number(discount))}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-200 pt-1.5">
            <dt className="font-heading font-bold text-ink">Total</dt>
            <dd className="font-heading font-bold text-ink">{inr(total)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}