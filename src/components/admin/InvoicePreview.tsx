/**
 * Invoice letterhead document — preview + print/Save-as-PDF.
 *
 * Uses the same print rules as the agreement (styles/globals.css), so the
 * MovoX letterhead repeats on every page and the saved PDF filename comes from
 * the invoice number.
 */
import { useEffect } from 'react';
import { Download, X, Printer } from 'lucide-react';
import type { Invoice } from '../../lib/adminApi';
import type { InvoiceLine } from './InvoiceLineEditor';
import { itemsTotal } from './InvoiceLineEditor';
import {
  LetterheadHeader,
  LetterheadFooter,
  LetterheadWatermark,
} from './Letterhead';

const inr = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmt = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const or = (v: string | null | undefined, fallback = '—') =>
  (v ?? '').trim() === '' ? fallback : (v as string);

export default function InvoicePreview({
  open,
  onClose,
  invoice,
  items,
}: {
  open: boolean;
  onClose: () => void;
  invoice: Invoice;
  items: InvoiceLine[];
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.title;
    document.title = `${invoice.invoice_number} — MovoX Invoice`;
    return () => {
      document.removeEventListener('keydown', onKey);
      document.title = prev;
    };
  }, [open, onClose, invoice.invoice_number]);

  if (!open) return null;

  const subtotal = itemsTotal(items);
  const taxRate = Number(invoice.tax_rate) || 0;
  const discount = Number(invoice.discount) || 0;
  const tax = (subtotal * taxRate) / 100;
  const total = subtotal + tax - discount;
  const overdue =
    invoice.status !== 'paid' &&
    invoice.status !== 'cancelled' &&
    !!invoice.due_date &&
    new Date(invoice.due_date) < new Date();

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 print-hide">
        <p className="font-heading text-sm font-semibold text-ink">
          {invoice.invoice_number} — {or(invoice.client_name)}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-primary btn-sm"
            title="Opens the print dialog — choose “Save as PDF”"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download PDF
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            aria-label="Print"
            className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* screen-only letterhead */}
      <div className="mx-auto my-6 w-full max-w-[794px] print-hide">
        <LetterheadHeader />
      </div>

      {/* printable document */}
      <div className="print-doc relative mx-auto my-6 w-full max-w-[794px] bg-white px-12 py-8 shadow-2xl print:m-0 print:max-w-none print:px-0 print:py-0 print:shadow-none">
        <div className="print-hide">
          <LetterheadHeader print />
        </div>

        <LetterheadWatermark />

        <article className="relative text-[11.5px] leading-[1.6] text-slate-800">
          {/* title */}
          <div className="mt-8 flex items-start justify-between print:mt-0">
            <div>
              <h1 className="font-heading text-2xl font-extrabold uppercase tracking-wide text-ink">
                Invoice
              </h1>
              <p className="mt-1 font-mono text-xs text-slate-500">
                {invoice.invoice_number}
              </p>
            </div>
            <dl className="text-right text-[11px]">
              <div className="flex justify-end gap-2">
                <dt className="text-slate-500">Issue date</dt>
                <dd className="w-24 font-semibold text-ink">{fmt(invoice.issue_date)}</dd>
              </div>
              <div className="flex justify-end gap-2">
                <dt className="text-slate-500">Due date</dt>
                <dd className={`w-24 font-semibold ${overdue ? 'text-red-600' : 'text-ink'}`}>
                  {fmt(invoice.due_date)}
                </dd>
              </div>
              <div className="flex justify-end gap-2">
                <dt className="text-slate-500">Status</dt>
                <dd className="w-24 font-semibold uppercase text-ink">
                  {invoice.status}
                </dd>
              </div>
            </dl>
          </div>

          {/* parties */}
          <div className="mt-7 grid grid-cols-2 gap-8">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Billed to
              </p>
              <p className="mt-1.5 font-heading text-sm font-bold text-ink">
                {or(invoice.client_company || invoice.client_name)}
              </p>
              {invoice.client_name && invoice.client_company && (
                <p className="text-[11px] text-slate-600">Attn: {invoice.client_name}</p>
              )}
              {invoice.client_email && (
                <p className="text-[11px] text-slate-600">{invoice.client_email}</p>
              )}
              {invoice.client_gstin && (
                <p className="text-[11px] text-slate-600">GSTIN: {invoice.client_gstin}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                From
              </p>
              <p className="mt-1.5 font-heading text-sm font-bold text-ink">MovoX Digital Growth</p>
              <p className="text-[11px] leading-relaxed text-slate-600">
                8M, TB Link Road,
                <br />
                Near Thirupathi Gounder Mahal,
                <br />
                Oldpet, Krishnagiri – 635001.
              </p>
              <p className="text-[11px] text-slate-600">info@heymovox.com</p>
            </div>
          </div>

          {/* items */}
          <table className="mt-7 w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-y border-slate-300 text-left">
                <th className="w-8 py-2 pr-1 font-semibold">#</th>
                <th className="py-2 pr-2 font-semibold">Item</th>
                <th className="py-2 pr-2 font-semibold">Description</th>
                <th className="py-2 pr-2 text-right font-semibold">Qty</th>
                <th className="py-2 pr-2 text-right font-semibold">Rate</th>
                <th className="py-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-500">
                    No items on this invoice.
                  </td>
                </tr>
              ) : (
                items.map((l, i) => (
                  <tr key={l.id} className="border-b border-slate-200 align-top">
                    <td className="py-2 pr-1 text-slate-500">{i + 1}</td>
                    <td className="py-2 pr-2 font-medium text-ink">
                      {or(l.serviceName, 'Item')}
                      {l.packageName && (
                        <span className="block font-normal text-slate-500">
                          {l.packageName}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-2 text-slate-600">
                      {or(l.description, '—')}
                    </td>
                    <td className="py-2 pr-2 text-right">{l.quantity}</td>
                    <td className="py-2 pr-2 text-right">{inr(l.unitPrice)}</td>
                    <td className="py-2 text-right font-semibold">
                      {inr((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0))}
                    </td>
                  </tr>
                ))
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
                <dt className="text-slate-600">Tax ({taxRate}%)</dt>
                <dd className="font-semibold text-ink">{inr(tax)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-slate-600">Discount</dt>
                  <dd className="font-semibold text-ink">−{inr(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-300 pt-1.5">
                <dt className="font-heading text-sm font-bold text-ink">Total due</dt>
                <dd className="font-heading text-sm font-bold text-ink">{inr(total)}</dd>
              </div>
            </dl>
          </div>

          {overdue && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-2.5 text-[11px] font-semibold text-red-700">
              This invoice is past its due date.
            </p>
          )}

          {/* notes + terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="mt-7 grid grid-cols-2 gap-8 text-[11px]">
              {invoice.notes && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Notes
                  </p>
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed text-slate-700">
                    {invoice.notes}
                  </p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Terms
                  </p>
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed text-slate-700">
                    {invoice.terms}
                  </p>
                </div>
              )}
            </div>
          )}

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

      {/* screen-only footer */}
      <div className="mx-auto mb-8 w-full max-w-[794px] print-hide">
        <LetterheadFooter />
      </div>

      <p className="mx-auto mb-10 max-w-[794px] px-4 text-center text-xs text-white/70 print-hide">
        Press <strong>Download PDF</strong> and choose “Save as PDF”. The MovoX letterhead
        repeats on every page.
      </p>
    </div>
  );
}