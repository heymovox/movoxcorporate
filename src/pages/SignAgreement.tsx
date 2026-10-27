/**
 * Client agreement signing page — /sign/:token
 *
 * Reached from a shared link. Deliberately has NO edit affordance: the client
 * can read the agreement and sign it, nothing else. There is no admin chrome,
 * no field inputs, and no API call that mutates the agreement beyond the
 * client's own signature.
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  PenLine,
  FileText,
  Lock,
} from 'lucide-react';
import { api, type SharedAgreement, type ScheduleA } from '../lib/adminApi';
import { emptySchedule } from '../components/admin/ScheduleAEditor';
import AgreementDocument from '../components/admin/AgreementDocument';
import SignaturePad from '../components/admin/SignaturePad';
import {
  LetterheadHeader,
  LetterheadFooter,
  LetterheadWatermark,
} from '../components/admin/Letterhead';

export default function SignAgreement() {
  const { token } = useParams<{ token: string }>();

  const [agreement, setAgreement] = useState<SharedAgreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [justSigned, setJustSigned] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setError('This link is not valid.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.fetchSharedAgreement(token);
      setAgreement(res.agreement);
      setSignerName(prev => prev || res.agreement.client_rep_name || '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the agreement.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const schedule: ScheduleA = {
    ...emptySchedule(),
    ...(agreement?.schedule_a ?? {}),
  };

  const submitSignature = async (dataUrl: string) => {
    await api.signSharedAgreement(token!, dataUrl, signerName.trim());
    // re-read so the signed name/at come back from the server
    await load();
    setSigning(false);
    setJustSigned(true);
  };

  // Let the user name the agreement before printing it to PDF.
  useEffect(() => {
    if (!agreement) return;
    const prev = document.title;
    document.title = `${agreement.reference} — MovoX Agreement`;
    return () => {
      document.title = prev;
    };
  }, [agreement]);

  const download = () => window.print();

  /* ------------------------------- states ------------------------------- */

  if (loading) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-32 text-slate-500">
          <Loader2 className="mb-3 h-7 w-7 animate-spin" aria-hidden="true" />
          <p className="text-sm">Loading your agreement…</p>
        </div>
      </Shell>
    );
  }

  if (error || !agreement) {
    return (
      <Shell>
        <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" aria-hidden="true" />
          <h1 className="mt-4 font-heading text-xl font-bold text-ink">
            Link unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <p className="mt-4 text-xs text-slate-400">
            Please contact MovoX for a fresh signing link.
          </p>
        </div>
      </Shell>
    );
  }

  const signed = Boolean(agreement.client_signature);

  /* -------------------------------- render ----------------------------- */

  return (
    <Shell>
      {/* action bar */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-heading text-sm font-bold text-ink">
                {agreement.title}
              </p>
              <p className="font-mono text-xs text-slate-500">{agreement.reference}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {signed ? (
              <button type="button" onClick={download} className="btn btn-primary btn-sm">
                <Download className="h-4 w-4" aria-hidden="true" />
                Download PDF
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSigning(true)}
                className="btn btn-primary btn-sm"
              >
                <PenLine className="h-4 w-4" aria-hidden="true" />
                Sign agreement
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* status */}
        {justSigned && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
            <div>
              <p className="font-heading text-sm font-bold text-emerald-800">
                Thank you — you have signed
              </p>
              <p className="mt-0.5 text-sm text-emerald-700">
                Your signature has been placed on the agreement. Use Download PDF above to
                save a copy with the MovoX letterhead.
              </p>
            </div>
          </div>
        )}

        {signed && !justSigned && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
            <div>
              <p className="font-heading text-sm font-bold text-emerald-800">
                This agreement is signed
              </p>
              <p className="mt-0.5 text-sm text-emerald-700">
                Signed by {agreement.client_signed_name}
                {agreement.client_signed_at
                  ? ` on ${new Date(agreement.client_signed_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}`
                  : ''}
                .
              </p>
            </div>
          </div>
        )}

        {!signed && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
            <div>
              <p className="font-heading text-sm font-bold text-brand-900">
                Awaiting your signature
              </p>
              <p className="mt-0.5 text-sm text-brand-800">
                Please read the agreement below. Press <strong>Sign agreement</strong> to add
                your signature to the Client Approval line.
              </p>
            </div>
          </div>
        )}

        {/* signer name (only while unsigned) */}
        {!signed && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
            <label
              htmlFor="signer-name"
              className="mb-1.5 block font-heading text-sm font-semibold text-ink"
            >
              Your full name
            </label>
            <input
              id="signer-name"
              type="text"
              value={signerName}
              onChange={e => setSignerName(e.target.value)}
              placeholder="Type your name as it should appear on the agreement"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        )}

        {/* the document */}
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl print:rounded-none print:shadow-none">
          <LetterheadWatermark />
          <div className="relative px-10 py-9 print:px-0 print:py-0">
            <div className="print:hidden">
              <LetterheadHeader />
            </div>
            <div className="mt-8 print:mt-0">
              <AgreementDocument
                agreement={agreement as never}
                schedule={schedule}
              />
            </div>
            <div className="mt-10 print:hidden">
              <LetterheadFooter />
            </div>
          </div>
        </div>

        {!signed && (
          <div className="mt-6 flex justify-center print:hidden">
            <button
              type="button"
              onClick={() => setSigning(true)}
              className="btn btn-primary btn-lg"
            >
              <PenLine className="h-4 w-4" aria-hidden="true" />
              Sign agreement
            </button>
          </div>
        )}
      </div>

      <SignaturePad
        open={signing}
        onClose={() => setSigning(false)}
        title="Your signature"
        hint="Draw your signature in the box, then press Submit to place it on the Client Approval line."
        onSubmit={submitSignature}
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      {children}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        MovoX — Beyond Digital · www.heymovox.com
      </footer>
      <style>{printStyles}</style>
    </div>
  );
}

/**
 * Shared print rules.
 *
 * The letterhead header/footer are `position: fixed` so the browser repeats
 * them on every printed page; the in-flow copies used for screen preview are
 * hidden at print time. A4 with margins matching the letterhead.
 */
export const printStyles = `
  @media print {
    @page {
      size: A4;
      margin: 26mm 18mm 22mm;
    }
    html, body {
      background: #fff !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    body * { visibility: hidden; }

    /* show the document tree */
    .print-doc, .print-doc * { visibility: visible; }

    /* fixed header/footer repeat on every page */
    .print-lh-header {
      position: fixed !important;
      top: -20mm;
      left: 0;
      right: 0;
      visibility: visible !important;
    }
    .print-lh-footer {
      position: fixed !important;
      bottom: -16mm;
      left: 0;
      right: 0;
      visibility: visible !important;
    }

    /* hide screen-only chrome */
    .print-hide { display: none !important; }
  }
`;