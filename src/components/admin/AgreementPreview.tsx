/**
 * Admin agreement preview + print/download.
 *
 * Uses the browser's print engine (Save as PDF): no PDF dependency, and the
 * browser handles pagination and font embedding. Print rules live in
 * styles/globals.css so the admin preview and the client signing page produce
 * identical output.
 */
import { useEffect } from 'react';
import { Printer, Download, X, PenLine, ExternalLink } from 'lucide-react';
import type { Agreement, ScheduleA } from '../../lib/adminApi';
import AgreementDocument from './AgreementDocument';
import SignaturePad from './SignaturePad';
import {
  LetterheadHeader,
  LetterheadFooter,
  LetterheadWatermark,
} from './Letterhead';

export default function AgreementPreview({
  open,
  onClose,
  agreement,
  schedule,
  onSignClient,
  onSignMovox,
}: {
  open: boolean;
  onClose: () => void;
  agreement: Agreement;
  schedule: ScheduleA;
  /** Open the pad to capture the client signature. */
  onSignClient?: () => void;
  /** Open the pad to capture the MovoX signature. */
  onSignMovox?: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Give the printed file a meaningful default name.
  useEffect(() => {
    if (!open) return;
    const prev = document.title;
    document.title = `${agreement.reference} — MovoX Agreement`;
    return () => {
      document.title = prev;
    };
  }, [open, agreement.reference]);

  if (!open) return null;

  const download = () => window.print();
  const clientSigned = Boolean(agreement.client_signature);
  const movoxSigned = Boolean(agreement.movox_signature);

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
      {/* toolbar */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 print-hide">
        <p className="font-heading text-sm font-semibold text-ink">
          {clientSigned
            ? 'Client has signed — ready to download'
            : 'Draft preview — client has not signed yet'}
        </p>
        <div className="flex items-center gap-2">
          {!clientSigned && onSignClient && (
            <button
              type="button"
              onClick={onSignClient}
              className="btn btn-secondary btn-sm"
            >
              <PenLine className="h-4 w-4" aria-hidden="true" />
              Client sign
            </button>
          )}
          {!movoxSigned && onSignMovox && (
            <button
              type="button"
              onClick={onSignMovox}
              className="btn btn-secondary btn-sm"
            >
              <PenLine className="h-4 w-4" aria-hidden="true" />
              MovoX sign
            </button>
          )}
          <button
            type="button"
            onClick={download}
            className="btn btn-primary btn-sm"
            title="Opens the browser print dialog — choose “Save as PDF”"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download PDF
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            aria-label="Print"
            title="Print"
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

      {/* screen-only letterhead preview */}
      <div className="mx-auto my-6 w-full max-w-[794px] print-hide">
        <LetterheadHeader />
      </div>

      {/* printable document */}
      <div className="print-doc relative mx-auto my-6 w-full max-w-[794px] bg-white px-10 py-8 shadow-2xl print:m-0 print:max-w-none print:px-0 print:py-0 print:shadow-none">
        {/* page-repeating letterhead (print only) */}
        <div className="print-hide">
          <LetterheadHeader print />
        </div>

        <LetterheadWatermark />

        <div className="relative">
          <AgreementDocument agreement={agreement} schedule={schedule} />
        </div>

        <div className="print-hide">
          <LetterheadFooter print />
        </div>
      </div>

      {/* screen-only footer */}
      <div className="mx-auto mb-8 w-full max-w-[794px] print-hide">
        <LetterheadFooter />
      </div>

      <p className="mx-auto mb-10 max-w-[794px] px-4 text-center text-xs text-white/70 print-hide">
        <ExternalLink className="mr-1 inline h-3 w-3" aria-hidden="true" />
        Press <strong>Download PDF</strong> and choose “Save as PDF” as the destination. The
        MovoX letterhead repeats on every page.
      </p>
    </div>
  );
}

/** Re-exported so callers can drop the pad next to the preview if needed. */
export { SignaturePad };