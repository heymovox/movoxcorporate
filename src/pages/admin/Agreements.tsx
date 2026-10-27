import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, ExternalLink, Loader2, Printer, RefreshCw, PenLine, Share2, Copy, Check, Link2Off } from 'lucide-react';
import {
  api,
  type Agreement,
  type AgreementStatus,
  type Client,
  type TeamMember,
} from '../../lib/adminApi';
import {
  PageHeader,
  Card,
  EmptyState,
  Spinner,
  ErrorState,
  AddButton,
  IconButton,
  StatusBadge,
  SearchInput,
  SelectFilter,
  Modal,
  ConfirmDialog,
  Field,
  TextInput,
  TextArea,
  Select,
  useToast,
  useResource,
  formatDate,
  formatMoney,
} from '../../components/admin/ui';
import ScheduleAEditor, {
  emptySchedule,
  effectiveFee,
} from '../../components/admin/ScheduleAEditor';
import SignaturePad from '../../components/admin/SignaturePad';
import AgreementPreview from '../../components/admin/AgreementPreview';
import { useAuth } from '../../hooks/useAuth';

const STATUSES: AgreementStatus[] = ['draft', 'sent', 'signed', 'expired', 'terminated'];

type Draft = Omit<Agreement, 'id' | 'created_at' | 'updated_at' | 'share_token' | 'share_sent_at' | 'client_viewed_at'>;

const emptyAgreement = (reference: string): Draft => ({
  title: '',
  reference,
  agreement_type: 'Service Agreement',
  client_name: '',
  client_email: '',
  client_phone: '',
  client_company: '',
  client_address: '',
  client_gstin: '',
  client_rep_name: '',
  client_rep_designation: '',
  status: 'draft',
  content: '',
  effective_date: new Date().toISOString().slice(0, 10),
  expiry_date: null,
  signed_at: null,
  signature_name: '',
  document_url: '',
  project_name: '',
  movox_rep_name: '',
  movox_rep_designation: '',
  movox_rep_email: '',
  law_state: '',
  law_city: '',
  law_country: 'India',
  client_signature: '',
  client_signed_name: '',
  client_signed_at: null,
  movox_signature: '',
  movox_signed_name: '',
  movox_signed_at: null,
  schedule_a: emptySchedule(),
});

export default function AdminAgreements() {
  const toast = useToast();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const { items, loading, error, reload } = useResource<Agreement>('agreements', {
    status,
    search,
  });

  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Agreement | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [fetchingRef, setFetchingRef] = useState(false);
  const [signing, setSigning] = useState<'client' | 'movox' | null>(null);
  const [signingBusy, setSigningBusy] = useState(false);
  const [sharing, setSharing] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const patch = (p: Partial<Draft>) => setDraft(d => (d ? { ...d, ...p } : d));

  const fetchReference = useCallback(async () => {
    setFetchingRef(true);
    try {
      const res = await api.nextAgreementReference();
      setDraft(d => (d ? { ...d, reference: res.reference } : d));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not generate reference.');
    } finally {
      setFetchingRef(false);
    }
  }, [toast]);

  const openCreate = async () => {
    let reference = '';
    try {
      reference = (await api.nextAgreementReference()).reference;
    } catch {
      reference = `MBD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-0000`;
    }
    setDraft(emptyAgreement(reference));
    setEditingId(null);
  };

  const openEdit = (a: Agreement) => {
    const { id: _i, created_at: _c, updated_at: _u, ...rest } = a;
    setDraft({
      ...rest,
      schedule_a: { ...emptySchedule(), ...(a.schedule_a ?? {}) },
    });
    setEditingId(a.id);
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.title.trim()) return toast.error('Title is required.');
    if (!draft.reference.trim()) return toast.error('Reference ID is required.');
    if (!draft.client_name.trim()) return toast.error('Client name is required.');

    setSaving(true);
    try {
      if (editingId) {
        await api.update<Agreement>('agreements', editingId, draft);
        toast.success('Agreement updated.');
      } else {
        await api.create<Agreement>('agreements', draft);
        toast.success('Agreement created.');
      }
      setDraft(null);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusyDelete(true);
    try {
      await api.remove('agreements', deleting.id);
      toast.success('Agreement deleted.');
      setDeleting(null);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed.');
    } finally {
      setBusyDelete(false);
    }
  };

  const shareUrlFor = (token: string) =>
    `${window.location.origin}/sign/${token}`;

  const share = async (id: string) => {
    setSharing(id);
    try {
      const res = await api.shareAgreement(id);
      const url = shareUrlFor(res.token);
      setShareLink(url);
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        /* clipboard blocked — the link is shown on screen instead */
      }
      toast.success('Share link ready and copied.');
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create a share link.');
    } finally {
      setSharing(null);
    }
  };

  const revoke = async (id: string) => {
    try {
      await api.revokeAgreementShare(id);
      setShareLink(null);
      toast.success('Share link revoked.');
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not revoke the link.');
    }
  };

  const schedule = draft?.schedule_a ? { ...emptySchedule(), ...draft.schedule_a } : null;

  return (
    <>
      <PageHeader
        title="Agreements"
        description="Generate MovoX agreements on the official letterhead with Schedule A."
        action={<AddButton onClick={openCreate} label="New agreement" />}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search title, reference, client…" />
        <SelectFilter
          value={status}
          onChange={setStatus}
          options={STATUSES}
          label="Filter by status"
          allLabel="All statuses"
        />
      </div>

      <Card>
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : items.length === 0 ? (
          <EmptyState
            title="No agreements yet"
            description="Create an agreement — reference ID is generated automatically."
            action={<AddButton onClick={openCreate} label="New agreement" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Agreement', 'Client', 'Reference', 'Effective', 'Status', ''].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(a => (
                  <tr key={a.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-4 py-4">
                      <p className="font-heading text-sm font-semibold text-ink">{a.title}</p>
                      {a.project_name && (
                        <p className="text-xs text-slate-500">{a.project_name}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-ink">{a.client_name || '—'}</p>
                      {a.client_company && (
                        <p className="text-xs text-slate-500">{a.client_company}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-600">{a.reference}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {formatDate(a.effective_date)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1.5">
                        <StatusBadge status={a.status} />
                        {a.client_signature ? (
                          <SignatureState
                            name={a.client_signed_name}
                            at={a.client_signed_at}
                          />
                        ) : a.share_token ? (
                          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            <Share2 className="h-3 w-3" aria-hidden="true" />
                            Shared — awaiting client
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => share(a.id)}
                          disabled={sharing === a.id}
                          aria-label={`Share agreement ${a.reference} with the client`}
                          title="Share with client for signing"
                          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50"
                        >
                          {sharing === a.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <Share2 className="h-4 w-4" aria-hidden="true" />
                          )}
                        </button>
                        {a.share_token && (
                          <button
                            type="button"
                            onClick={() => revoke(a.id)}
                            aria-label={`Revoke share link for ${a.reference}`}
                            title="Revoke client link"
                            className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Link2Off className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                        <IconButton icon={Pencil} label="Edit" onClick={() => openEdit(a)} />
                        <IconButton
                          icon={Trash2}
                          tone="danger"
                          label="Delete"
                          onClick={() => setDeleting(a)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={editingId ? 'Edit agreement' : 'New agreement'}
        wide
        footer={
          <>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setPreviewing(true)}
              disabled={!draft?.client_name}
              className="btn btn-secondary btn-sm"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              Preview
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="btn btn-primary btn-sm"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {editingId ? 'Save changes' : 'Create agreement'}
            </button>
          </>
        }
      >
        {draft && schedule && (
          <div className="space-y-6">
            {/* ---------- header ---------- */}
            <Section title="Agreement details">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Title" htmlFor="a-title">
                  <TextInput
                    id="a-title"
                    value={draft.title}
                    onChange={e => patch({ title: e.target.value })}
                    placeholder="Brand Identity — Service Agreement"
                  />
                </Field>
                <Field label="Type" htmlFor="a-type">
                  <Select
                    id="a-type"
                    value={draft.agreement_type}
                    onChange={e => patch({ agreement_type: e.target.value })}
                  >
                    {[
                      'Service Agreement',
                      'NDA',
                      'Retainer',
                      'Master Services Agreement',
                      'Contract',
                      'MoU',
                    ].map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  label="Reference ID"
                  htmlFor="a-ref"
                  hint="Auto-generated — regenerate any time"
                >
                  <div className="flex gap-2">
                    <TextInput
                      id="a-ref"
                      value={draft.reference}
                      onChange={e => patch({ reference: e.target.value })}
                      className="font-mono"
                    />
                    <button
                      type="button"
                      onClick={fetchReference}
                      disabled={fetchingRef}
                      aria-label="Regenerate reference"
                      title="Regenerate"
                      className="shrink-0 rounded-xl border border-slate-200 px-3 text-slate-500 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${fetchingRef ? 'animate-spin' : ''}`}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </Field>

                <Field label="Effective date" htmlFor="a-eff">
                  <TextInput
                    id="a-eff"
                    type="date"
                    value={draft.effective_date?.slice(0, 10) ?? ''}
                    onChange={e => patch({ effective_date: e.target.value || null })}
                  />
                </Field>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Status" htmlFor="a-status">
                  <Select
                    id="a-status"
                    value={draft.status}
                    onChange={e => patch({ status: e.target.value as AgreementStatus })}
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Project name" htmlFor="a-project">
                  <TextInput
                    id="a-project"
                    value={draft.project_name}
                    onChange={e => patch({ project_name: e.target.value })}
                    placeholder="Website Redesign & Brand Refresh"
                  />
                </Field>
              </div>
            </Section>

            {/* ---------- client ---------- */}
            <Section title="Client details">
              <ClientPicker
                onPick={c =>
                  patch({
                    client_name: c.name,
                    client_email: c.email,
                    client_phone: c.phone,
                    client_company: c.business,
                    client_rep_name: c.name,
                  })
                }
              />

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Client name" htmlFor="a-cname">
                  <TextInput
                    id="a-cname"
                    value={draft.client_name}
                    onChange={e => patch({ client_name: e.target.value })}
                  />
                </Field>
                <Field label="Company" htmlFor="a-ccompany">
                  <TextInput
                    id="a-ccompany"
                    value={draft.client_company}
                    onChange={e => patch({ client_company: e.target.value })}
                  />
                </Field>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Email" htmlFor="a-cemail">
                  <TextInput
                    id="a-cemail"
                    type="email"
                    value={draft.client_email}
                    onChange={e => patch({ client_email: e.target.value })}
                  />
                </Field>
                <Field label="Contact number" htmlFor="a-cphone">
                  <TextInput
                    id="a-cphone"
                    value={draft.client_phone}
                    onChange={e => patch({ client_phone: e.target.value })}
                  />
                </Field>
              </div>

              <div className="mt-4">
                <Field label="GSTIN" htmlFor="a-gstin">
                  <TextInput
                    id="a-gstin"
                    value={draft.client_gstin}
                    onChange={e => patch({ client_gstin: e.target.value })}
                  />
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Address" htmlFor="a-caddr">
                  <TextArea
                    id="a-caddr"
                    rows={2}
                    value={draft.client_address}
                    onChange={e => patch({ client_address: e.target.value })}
                  />
                </Field>
              </div>
            </Section>

            {/* ---------- representatives ---------- */}
            <Section title="Representatives">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Client representative" htmlFor="a-crep">
                  <TextInput
                    id="a-crep"
                    value={draft.client_rep_name}
                    onChange={e => patch({ client_rep_name: e.target.value })}
                  />
                </Field>
                <Field label="Client designation" htmlFor="a-crepdesig">
                  <TextInput
                    id="a-crepdesig"
                    value={draft.client_rep_designation}
                    onChange={e => patch({ client_rep_designation: e.target.value })}
                  />
                </Field>
              </div>

              <div className="mt-4">
                <TeamRepPicker
                  selected={draft.movox_rep_name}
                  onPick={m =>
                    patch({
                      movox_rep_name: m.name,
                      movox_rep_designation: m.role,
                      movox_rep_email: m.email,
                    })
                  }
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Field label="MovoX representative" htmlFor="a-mrep">
                  <TextInput
                    id="a-mrep"
                    value={draft.movox_rep_name}
                    onChange={e => patch({ movox_rep_name: e.target.value })}
                  />
                </Field>
                <Field label="Designation" htmlFor="a-mrepdesig">
                  <TextInput
                    id="a-mrepdesig"
                    value={draft.movox_rep_designation}
                    onChange={e => patch({ movox_rep_designation: e.target.value })}
                  />
                </Field>
                <Field label="Email" htmlFor="a-mrepemail">
                  <TextInput
                    id="a-mrepemail"
                    type="email"
                    value={draft.movox_rep_email}
                    onChange={e => patch({ movox_rep_email: e.target.value })}
                  />
                </Field>
              </div>
            </Section>

            {/* ---------- schedule A ---------- */}
            <Section title="Schedule A — scope of work">
              <ScheduleAEditor value={schedule} onChange={s => patch({ schedule_a: s })} />
            </Section>

            {/* ---------- governing law ---------- */}
            <Section title="Governing law">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="State" htmlFor="a-state">
                  <TextInput
                    id="a-state"
                    value={draft.law_state}
                    onChange={e => patch({ law_state: e.target.value })}
                    placeholder="Tamil Nadu"
                  />
                </Field>
                <Field label="City" htmlFor="a-city">
                  <TextInput
                    id="a-city"
                    value={draft.law_city}
                    onChange={e => patch({ law_city: e.target.value })}
                    placeholder="Coimbatore"
                  />
                </Field>
                <Field label="Country" htmlFor="a-country">
                  <TextInput
                    id="a-country"
                    value={draft.law_country}
                    onChange={e => patch({ law_country: e.target.value })}
                  />
                </Field>
              </div>
            </Section>

            {/* ---------- extras ---------- */}
            <Section title="Additional terms">
              <Field
                label="Clause text"
                htmlFor="a-content"
                hint="Optional extra clauses appended after the standard terms"
              >
                <TextArea
                  id="a-content"
                  rows={5}
                  value={draft.content}
                  onChange={e => patch({ content: e.target.value })}
                  className="font-mono text-xs"
                />
              </Field>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Expiry date" htmlFor="a-exp">
                  <TextInput
                    id="a-exp"
                    type="date"
                    value={draft.expiry_date?.slice(0, 10) ?? ''}
                    onChange={e => patch({ expiry_date: e.target.value || null })}
                  />
                </Field>
                <Field label="Signed PDF URL" htmlFor="a-doc">
                  <TextInput
                    id="a-doc"
                    value={draft.document_url}
                    onChange={e => patch({ document_url: e.target.value })}
                  />
                </Field>
              </div>
            </Section>

            {/* ---------- approvals ---------- */}
            <Section title="Approvals">
              <p className="mb-4 text-sm text-slate-600">
                Press a signature box to draw it. The captured signature is placed on the
                Client / MovoX approval lines in Schedule A.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <SignatureSlot
                  party="Client Approval"
                  owner="Signed and filled by the client"
                  signature={draft.client_signature}
                  name={draft.client_signed_name}
                  signedAt={draft.client_signed_at}
                  fallbackName={draft.client_rep_name || draft.client_name}
                  onDraw={() => setSigning('client')}
                  onClear={() =>
                    patch({
                      client_signature: '',
                      client_signed_name: '',
                      client_signed_at: null,
                    })
                  }
                />

                <SignatureSlot
                  party="MovoX Approval"
                  owner="Signed by the admin or an approved role"
                  signature={draft.movox_signature}
                  name={draft.movox_signed_name}
                  signedAt={draft.movox_signed_at}
                  fallbackName={draft.movox_rep_name}
                  onDraw={() => setSigning('movox')}
                  onClear={() =>
                    patch({
                      movox_signature: '',
                      movox_signed_name: '',
                      movox_signed_at: null,
                    })
                  }
                />
              </div>
            </Section>

            {/* ---------- share ---------- */}
            <Section title="Share with client">
              <p className="mb-3 text-sm text-slate-600">
                Save the agreement first, then share the link. The client sees the agreement
                on your letterhead and can sign it — they cannot edit anything.
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => editingId && share(editingId)}
                  disabled={!editingId || sharing === editingId}
                  className="btn btn-primary btn-sm"
                >
                  {sharing === editingId ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Share2 className="h-4 w-4" aria-hidden="true" />
                  )}
                  {editingId ? 'Create share link' : 'Save first to share'}
                </button>

                {draft?.client_signature && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <Check className="h-3 w-3" aria-hidden="true" />
                    Client has signed
                  </span>
                )}
              </div>

              {shareLink && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                  <input
                    readOnly
                    value={shareLink}
                    aria-label="Share link"
                    onFocus={e => e.currentTarget.select()}
                    className="min-w-0 flex-1 bg-transparent px-2 font-mono text-xs text-slate-700 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText(shareLink);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="btn btn-secondary btn-sm shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    )}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <a
                    href={shareLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm shrink-0"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    Open
                  </a>
                </div>
              )}
            </Section>

            <p className="rounded-xl border border-brand-100 bg-brand-50 p-3 text-xs text-brand-800">
              Project fee on the document:{' '}
              <strong>{formatMoney(effectiveFee(schedule))}</strong>. Use Preview to
              render the letterhead, then print to PDF.
            </p>
          </div>
        )}
      </Modal>

      {draft && schedule && (
        <AgreementPreview
          open={previewing}
          onClose={() => setPreviewing(false)}
          agreement={draft as Agreement}
          schedule={schedule}
          onSignClient={() => setSigning('client')}
          onSignMovox={() => setSigning('movox')}
        />
      )}

      {draft && schedule && (
        <SignaturePad
          open={signing !== null}
          busy={signingBusy}
          onClose={() => setSigning(null)}
          title={
            signing === 'client' ? 'Client signature' : 'MovoX approval signature'
          }
          hint={
            signing === 'client'
              ? 'The client signs here. Draw the signature, then press Submit to place it on the Client Approval line.'
              : 'Admin or approved role signs here. Draw the signature, then press Submit to place it on the MovoX Approval line.'
          }
          onSubmit={async (dataUrl, signedAtIso) => {
            if (signing === 'client') {
              patch({
                client_signature: dataUrl,
                client_signed_name:
                  draft.client_rep_name || draft.client_name || 'Client',
                client_signed_at: signedAtIso,
              });
            } else if (signing === 'movox') {
              patch({
                movox_signature: dataUrl,
                movox_signed_name:
                  draft.movox_rep_name || currentUser?.name || 'MovoX',
                movox_signed_at: signedAtIso,
              });
            }
            setSigningBusy(true);
            setSigning(null);
            toast.success(
              signing === 'client' ? 'Client signature placed.' : 'MovoX signature placed.',
            );
          }}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete agreement"
        message={`Permanently delete "${deleting?.title}"? This cannot be undone.`}
        busy={busyDelete}
      />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-200 pt-5 first:border-0 first:pt-0">
      <h3 className="mb-4 font-heading text-sm font-bold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Green pill shown once the client has signed. */
function SignatureState({
  name,
  at,
}: {
  name?: string;
  at?: string | null;
}) {
  const date = at
    ? new Date(at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <span
      className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"
      title={`${name ?? 'Client'}${date ? ` · ${date}` : ''}`}
    >
      <Check className="h-3 w-3" aria-hidden="true" />
      Client signed{date ? ` · ${date}` : ''}
    </span>
  );
}

/**
 * A clickable signature box. Shows the captured signature once submitted,
 * otherwise a dashed placeholder that opens the drawing pad.
 */
function SignatureSlot({
  party,
  owner,
  signature,
  name,
  signedAt,
  fallbackName,
  onDraw,
  onClear,
}: {
  party: string;
  owner: string;
  signature?: string;
  name?: string;
  signedAt?: string | null;
  fallbackName?: string;
  onDraw: () => void;
  onClear: () => void;
}) {
  const signed = Boolean(signature);
  const date = signedAt
    ? new Date(signedAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="font-heading text-sm font-semibold text-ink">{party}</p>
      <p className="mt-0.5 text-xs text-slate-500">{owner}</p>

      <button
        type="button"
        onClick={onDraw}
        aria-label={signed ? `Redraw ${party} signature` : `Sign ${party}`}
        className={`mt-3 flex h-24 w-full items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
          signed
            ? 'border-brand-200 bg-brand-50/40 hover:border-brand-400'
            : 'border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-brand-50/40'
        }`}
      >
        {signature ? (
          <img
            src={signature}
            alt={`${party} signature`}
            className="max-h-20 w-auto object-contain"
          />
        ) : (
          <span className="flex flex-col items-center gap-1 text-xs font-semibold text-slate-500">
            <PenLine className="h-5 w-5" aria-hidden="true" />
            Press to sign
          </span>
        )}
      </button>

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="truncate text-xs text-slate-600">
          {signed ? (
            <>
              <span className="font-medium text-ink">{name || '—'}</span>
              {date ? ` · ${date}` : ''}
            </>
          ) : (
            <span className="text-slate-400">
              Not signed{fallbackName ? ` · ${fallbackName}` : ''}
            </span>
          )}
        </p>
        {signed && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 text-xs font-semibold text-red-600 hover:underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

/** Pull a client from previous enquiries instead of retyping. */
function ClientPicker({ onPick }: { onPick: (c: Client) => void }) {
  const [clients, setClients] = useState<Client[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .clients()
      .then(r => !cancelled && setClients(r.items))
      .catch(() => !cancelled && setClients([]));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!clients) return <p className="text-sm text-slate-400">Loading clients…</p>;

  return (
    <Field label="Fetch client from enquiries" hint="Optional — fills the fields below">
      <select
        aria-label="Select a client"
        defaultValue=""
        onChange={e => {
          const c = clients.find(x => x.email === e.target.value);
          if (c) onPick(c);
          e.target.value = '';
        }}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      >
        <option value="">
          {clients.length === 0
            ? 'No enquiries yet — type the details below'
            : 'Select a client…'}
        </option>
        {clients.map(c => (
          <option key={c.email} value={c.email}>
            {c.name} — {c.business || c.email} ({c.enquiry_count})
          </option>
        ))}
      </select>
    </Field>
  );
}

/** Pull the authorised MovoX signatory from the team list. */
function TeamRepPicker({
  selected,
  onPick,
}: {
  selected: string;
  onPick: (m: TeamMember) => void;
}) {
  const [members, setMembers] = useState<TeamMember[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .list<TeamMember>('team_members')
      .then(r => !cancelled && setMembers(r.items))
      .catch(() => !cancelled && setMembers([]));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!members) return <p className="text-sm text-slate-400">Loading team…</p>;

  return (
    <Field label="Fetch authorised representative from team" hint="Optional">
      <select
        aria-label="Select a team member"
        value=""
        onChange={e => {
          const m = members.find(x => x.id === e.target.value);
          if (m) onPick(m);
        }}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      >
        <option value="">
          {members.length === 0
            ? 'No team members yet — type below'
            : selected
              ? `Selected: ${selected} — change…`
              : 'Select a representative…'}
        </option>
        {members.map(m => (
          <option key={m.id} value={m.id}>
            {m.name} {m.role ? `— ${m.role}` : ''}
          </option>
        ))}
      </select>
    </Field>
  );
}