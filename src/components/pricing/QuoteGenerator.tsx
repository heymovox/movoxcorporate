/**
 * Auto-quotation generator.
 *
 * Opens a form, collects the prospect's details, and renders a print-ready
 * quotation on the MovoX letterhead with a unique quotation number. The
 * "Download PDF" button calls window.print() so the browser's Save-as-PDF
 * produces the file — the same pattern used by InvoicePreview / Agreements.
 */
import { useEffect, useMemo, useState } from 'react';
import { Download, X, FileText, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  LetterheadHeader,
  LetterheadFooter,
  LetterheadWatermark,
} from '../admin/Letterhead';
import { pricingData } from '../../data/pricing';

const inr = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: Date = new Date()) =>
  d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

function makeQuotationNumber(): string {
  const y = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `MX-Q-${y}-${rand}`;
}

interface FormData {
  name: string;
  email: string;
  company: string;
  phone: string;
  service: string;
  budget: string;
  timeline: string;
  details: string;
}

const budgets = [
  '₹10,000 – ₹25,000',
  '₹25,000 – ₹50,000',
  '₹50,000 – ₹1,00,000',
  '₹1,00,000 – ₹2,50,000',
  '₹2,50,000+',
];

const timelines = ['ASAP', '2–4 weeks', '1–2 months', '3+ months', 'Flexible'];

export function QuoteGenerator({
  open,
  onClose,
  defaultService,
}: {
  open: boolean;
  onClose: () => void;
  defaultService?: string;
}) {
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [qNumber] = useState(() => makeQuotationNumber());
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    company: '',
    phone: '',
    service: defaultService ?? pricingData[0]?.name ?? '',
    budget: budgets[2],
    timeline: timelines[1],
    details: '',
  });

  useEffect(() => {
    if (!open) return;
    setStep('form');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // pick the package tier based on budget midpoint for the line item
  const serviceObj = useMemo(
    () => pricingData.find((s) => s.name === formData.service) ?? pricingData[0],
    [formData.service],
  );

  const estimatedPackage = useMemo(() => {
    if (!serviceObj) return null;
    const pkgs = serviceObj.packages;
    const budgetNum = (() => {
      const m = formData.budget.match(/([\d,]+)\s*[–-]\s*([\d,]+)/);
      if (m) return (parseInt(m[1].replace(/,/g, ''), 10) + parseInt(m[2].replace(/,/g, ''), 10)) / 2;
      if (formData.budget.includes('+')) return 250000;
      return pkgs[0]?.price ?? 0;
    })();
    return pkgs.reduce((best, p) =>
      Math.abs(p.price - budgetNum) < Math.abs(best.price - budgetNum) ? p : best,
      pkgs[0],
    );
  }, [serviceObj, formData.budget]);

  const subtotal = estimatedPackage?.price ?? 0;
  const gstRate = 18;
  const gst = (subtotal * gstRate) / 100;
  const total = subtotal + gst;

  const valid = formData.name.trim() && formData.email.trim();

  if (!open) return null;

  const field = (label: string, key: keyof FormData, type = 'text', placeholder = '') => (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
      <input
        type={type}
        value={formData[key]}
        onChange={(e) => setFormData((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />
    </label>
  );

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <p className="font-heading text-sm font-semibold text-ink">
          {step === 'form' ? 'Request a custom quotation' : `${qNumber} — Quotation preview`}
        </p>
        <div className="flex items-center gap-2">
          {step === 'preview' && (
            <>
              <button
                type="button"
                onClick={() => setStep('form')}
                className="btn btn-outline btn-sm"
              >
                Back to edit
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-primary btn-sm"
                title="Opens the print dialog — choose “Save as PDF”"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download PDF
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ============ FORM STEP ============ */}
      {step === 'form' && (
        <div className="mx-auto my-8 w-full max-w-xl px-4 pb-16">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-[0_4px_14px_rgba(35,130,184,0.35)]">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-heading text-lg font-bold text-ink">Get your custom quote</h3>
                <p className="text-xs text-slate-500">Fill this in and we&rsquo;ll generate a personalised quotation on MovoX letterhead.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {field('Full name *', 'name', 'text', 'Jane Doe')}
              {field('Work email *', 'email', 'email', 'jane@company.com')}
              {field('Company', 'company', 'text', 'Acme Inc.')}
              {field('Phone', 'phone', 'tel', '+91 98765 43210')}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Service</span>
                <select
                  value={formData.service}
                  onChange={(e) => setFormData((f) => ({ ...f, service: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  {pricingData.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Budget range</span>
                <select
                  value={formData.budget}
                  onChange={(e) => setFormData((f) => ({ ...f, budget: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  {budgets.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </label>
            </div>

            <div className="mt-4">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Timeline</span>
                <select
                  value={formData.timeline}
                  onChange={(e) => setFormData((f) => ({ ...f, timeline: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  {timelines.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            </div>

            <label className="mt-4 block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">Project details</span>
              <textarea
                value={formData.details}
                onChange={(e) => setFormData((f) => ({ ...f, details: e.target.value }))}
                placeholder="Briefly describe what you need…"
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </label>

            <button
              type="button"
              disabled={!valid}
              onClick={() => setStep('preview')}
              className={cn(
                'btn btn-lg w-full justify-center mt-6',
                valid ? 'btn-primary' : 'opacity-50 cursor-not-allowed',
              )}
            >
              <span className="btn-content flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Generate quotation
              </span>
            </button>
            <p className="mt-3 text-center text-[11px] text-slate-400">
              An indicative quotation — final scope &amp; pricing confirmed on a discovery call.
            </p>
          </div>
        </div>
      )}

      {/* ============ PREVIEW STEP (printable) ============ */}
      {step === 'preview' && (
        <>
          <div className="mx-auto my-6 w-full max-w-[794px] px-4 print-hide">
            <LetterheadHeader />
          </div>

          <div className="print-doc relative mx-auto my-6 w-full max-w-[794px] bg-white px-12 py-8 shadow-2xl print:m-0 print:max-w-none print:px-0 print:py-0 print:shadow-none">
            <div className="print-hide">
              <LetterheadHeader print />
            </div>

            <LetterheadWatermark />

            <article className="relative text-[11.5px] leading-[1.6] text-slate-800">
              <div className="mt-8 flex items-start justify-between print:mt-0">
                <div>
                  <h1 className="font-heading text-2xl font-extrabold uppercase tracking-wide text-ink">
                    Quotation
                  </h1>
                  <p className="mt-1 font-mono text-xs text-slate-500">{qNumber}</p>
                </div>
                <dl className="text-right text-[11px]">
                  <div className="flex justify-end gap-2">
                    <dt className="text-slate-500">Date</dt>
                    <dd className="w-24 font-semibold text-ink">{fmtDate()}</dd>
                  </div>
                  <div className="flex justify-end gap-2">
                    <dt className="text-slate-500">Valid until</dt>
                    <dd className="w-24 font-semibold text-ink">
                      {fmtDate(new Date(Date.now() + 30 * 86400000))}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* parties */}
              <div className="mt-7 grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Prepared for</p>
                  <p className="mt-1.5 font-heading text-sm font-bold text-ink">
                    {formData.company || formData.name}
                  </p>
                  {formData.company && formData.name && (
                    <p className="text-[11px] text-slate-600">Attn: {formData.name}</p>
                  )}
                  {formData.email && <p className="text-[11px] text-slate-600">{formData.email}</p>}
                  {formData.phone && <p className="text-[11px] text-slate-600">{formData.phone}</p>}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">From</p>
                  <p className="mt-1.5 font-heading text-sm font-bold text-ink">MovoX Digital Growth</p>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    8M, TB Link Road,<br />
                    Near Thirupathi Gounder Mahal,<br />
                    Oldpet, Krishnagiri – 635001.
                  </p>
                  <p className="text-[11px] text-slate-600">info@heymovox.com</p>
                </div>
              </div>

              {/* summary strip */}
              <div className="mt-6 grid grid-cols-3 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-[11px]">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Service</p>
                  <p className="mt-0.5 font-semibold text-ink">{formData.service}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Budget range</p>
                  <p className="mt-0.5 font-semibold text-ink">{formData.budget}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Timeline</p>
                  <p className="mt-0.5 font-semibold text-ink">{formData.timeline}</p>
                </div>
              </div>

              {/* line items */}
              <table className="mt-7 w-full border-collapse text-[11px]">
                <thead>
                  <tr className="border-y border-slate-300 text-left">
                    <th className="w-8 py-2 pr-1 font-semibold">#</th>
                    <th className="py-2 pr-2 font-semibold">Item</th>
                    <th className="py-2 pr-2 font-semibold">Description</th>
                    <th className="py-2 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {estimatedPackage && (
                    <tr className="border-b border-slate-200 align-top">
                      <td className="py-2 pr-1 text-slate-500">1</td>
                      <td className="py-2 pr-2 font-medium text-ink">
                        {estimatedPackage.name}
                        <span className="block font-normal text-slate-500">{serviceObj?.name}</span>
                      </td>
                      <td className="py-2 pr-2 text-slate-600">
                        {estimatedPackage.description}
                      </td>
                      <td className="py-2 text-right font-semibold">{inr(subtotal)}</td>
                    </tr>
                  )}
                  {formData.details.trim() && (
                    <tr className="border-b border-slate-200 align-top">
                      <td className="py-2 pr-1 text-slate-500">2</td>
                      <td className="py-2 pr-2 font-medium text-ink">Custom scope</td>
                      <td className="py-2 pr-2 text-slate-600 whitespace-pre-wrap">{formData.details}</td>
                      <td className="py-2 text-right text-slate-500">TBD</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* totals */}
              <div className="mt-4 flex justify-end">
                <dl className="w-full max-w-xs space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <dt className="text-slate-600">Subtotal</dt>
                    <dd className="font-semibold text-ink">{inr(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-600">GST ({gstRate}%)</dt>
                    <dd className="font-semibold text-ink">{inr(gst)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-1.5">
                    <dt className="font-heading text-sm font-bold text-ink">Total (incl. GST)</dt>
                    <dd className="font-heading text-sm font-bold text-ink">{inr(total)}</dd>
                  </div>
                </dl>
              </div>

              {/* notes */}
              <div className="mt-7 text-[11px]">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Notes</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 leading-relaxed text-slate-700">
                  <li>This is an indicative quotation based on the information provided. Final scope and pricing are confirmed after a discovery call.</li>
                  <li>Prices exclude 18% GST unless stated otherwise.</li>
                  <li>Standard payment terms: 40% on kickoff, 40% at mid-point, 20% on delivery.</li>
                  <li>Quotation valid for 30 days from the date of issue.</li>
                  <li>Third-party costs (hosting, domains, SaaS, ad spend) are billed separately at actuals.</li>
                </ul>
              </div>

              {/* signature */}
              <div className="mt-10 flex justify-end">
                <div className="w-56">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    For MovoX Digital Growth
                  </p>
                  <div className="mt-10 border-b border-slate-400" />
                  <p className="mt-0.5 text-[10px] text-slate-500">Authorised signatory</p>
                </div>
              </div>
            </article>

            <div className="print-hide">
              <LetterheadFooter print />
            </div>
          </div>

          <div className="mx-auto mb-8 w-full max-w-[794px] px-4 print-hide">
            <LetterheadFooter />
          </div>

          <p className="mx-auto mb-10 max-w-[794px] px-4 text-center text-xs text-white/70 print-hide">
            Press <strong>Download PDF</strong> and choose &ldquo;Save as PDF&rdquo;. The MovoX
            letterhead repeats on every page.
          </p>
        </>
      )}
    </div>
  );
}
