import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Loader2, Download } from 'lucide-react';
import {
  api,
  type Invoice,
  type InvoiceItem,
  type InvoiceStatus,
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
import InvoiceLineEditor, {
  type InvoiceLine,
  itemsTotal,
} from '../../components/admin/InvoiceLineEditor';
import InvoicePreview from '../../components/admin/InvoicePreview';

const STATUSES: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

type Draft = Omit<Invoice, 'id' | 'created_at' | 'updated_at'>;

const emptyInvoice = (nextNumber = 'INV-0001'): Draft => ({
  invoice_number: nextNumber,
  client_name: '',
  client_email: '',
  client_company: '',
  client_gstin: '',
  client_address: '',
  enquiry_id: null,
  issue_date: new Date().toISOString().slice(0, 10),
  due_date: null,
  subtotal: '0',
  tax_rate: '18',
  tax_amount: '0',
  discount: '0',
  total: '0',
  currency: 'INR',
  status: 'draft',
  notes: '',
  terms: 'Payment due within 14 days of invoice date.',
  paid_at: null,
});

/** Map a stored invoice_item row onto the editor's line shape. */
const toLine = (r: InvoiceItem): InvoiceLine => ({
  id: r.id,
  kind: 'custom',
  serviceName: r.description,
  description: '',
  quantity: parseFloat(r.quantity) || 0,
  unitPrice: parseFloat(r.unit_price) || 0,
});

export default function AdminInvoices() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const { items, loading, error, reload } = useResource<Invoice>('invoices', {
    status,
    search,
  });

  const [settings, setSettings] = useState<{
    nextNumber: string;
    taxRate: string;
    terms: string;
  }>({ nextNumber: 'INV-0001', taxRate: '18', terms: '' });

  const [draft, setDraft] = useState<Draft | null>(null);
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Invoice | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    api
      .list<{ key: string; value: unknown }>('settings')
      .then(r => {
        const get = (k: string) =>
          r.items.find(x => x.key === k)?.value as string | undefined;
        setSettings({
          nextNumber: get('invoice.next_number') ?? 'INV-0001',
          taxRate: String(get('invoice.default_tax_rate') ?? '18'),
          terms: get('invoice.default_terms') ?? '',
        });
      })
      .catch(() => undefined);
  }, []);

  const patch = (p: Partial<Draft>) => setDraft(d => (d ? { ...d, ...p } : d));

  /** Preview model: totals always derive from the live line list. */
  const previewInvoice: Invoice | null = draft
    ? ({
        ...draft,
        subtotal: String(itemsTotal(lines)),
        total: String(
          itemsTotal(lines) * (1 + (Number(draft.tax_rate) || 0) / 100) -
            (Number(draft.discount) || 0),
        ),
      } as unknown as Invoice)
    : null;

  const openCreate = () => {
    setDraft(
      emptyInvoice(settings.nextNumber),
    );
    setLines([]);
    setEditingId(null);
  };

  const openEdit = async (inv: Invoice) => {
    setDraft(inv);
    setEditingId(inv.id);
    setLines([]);
    try {
      const res = await api.invoiceItems(inv.id);
      setLines(res.items.map(toLine));
    } catch {
      setLines([]);
    }
  };

  /**
   * Saves the invoice, then reconciles its line items: existing rows are
   * matched by id and patched/removed, new ones are created. Then the server
   * recalculates subtotal/tax/total from the stored items.
   */
  const save = async () => {
    if (!draft) return;
    if (!draft.invoice_number.trim()) return toast.error('Invoice number is required.');
    if (!draft.client_name.trim()) return toast.error('Client name is required.');

    setSaving(true);
    try {
      let invoiceId = editingId;

      if (invoiceId) {
        await api.update<Invoice>('invoices', invoiceId, draft);
      } else {
        const created = await api.create<Invoice>('invoices', draft);
        invoiceId = created.item.id;
      }

      // Reconcile items.
      const existing = await api.invoiceItems(invoiceId);
      const existingIds = new Set(existing.items.map(i => i.id));

      for (const line of lines) {
        if (line.id.startsWith('ln_')) {
          if (!line.serviceName.trim()) continue;
          await api.addInvoiceItem(invoiceId, {
            description: line.serviceName,
            quantity: Number(line.quantity) || 0,
            unit_price: Number(line.unitPrice) || 0,
          });
        } else if (existingIds.has(line.id)) {
          // Editing an existing stored line: remove + re-add with new values.
          await api.removeInvoiceItem(line.id);
          if (line.serviceName.trim()) {
            await api.addInvoiceItem(invoiceId, {
              description: line.serviceName,
              quantity: Number(line.quantity) || 0,
              unit_price: Number(line.unitPrice) || 0,
            });
          }
        }
      }

      // Drop stored items the user removed.
      for (const stored of existing.items) {
        if (!lines.some(l => l.id === stored.id)) {
          await api.removeInvoiceItem(stored.id);
        }
      }

      await api.recalcInvoice(invoiceId);

      // Bump the next invoice number once an invoice is actually created.
      if (!editingId) {
        const n = parseInt(settings.nextNumber.replace(/\D/g, ''), 10);
        if (!Number.isNaN(n)) {
          const bumped = `INV-${String(n + 1).padStart(4, '0')}`;
          await api
            .putSetting('invoice.next_number', bumped)
            .then(() => setSettings(s => ({ ...s, nextNumber: bumped })))
            .catch(() => undefined);
        }
      }

      toast.success(editingId ? 'Invoice updated.' : 'Invoice created.');
      setDraft(null);
      setLines([]);
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
      await api.remove('invoices', deleting.id);
      toast.success('Invoice deleted.');
      setDeleting(null);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed.');
    } finally {
      setBusyDelete(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Pick services from the pricing catalogue, or add custom items."
        action={<AddButton onClick={openCreate} label="New invoice" />}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search number or client…" />
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
            title="No invoices yet"
            description="Create an invoice — choose services from the pricing list and download it on the letterhead."
            action={<AddButton onClick={openCreate} label="New invoice" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Invoice', 'Client', 'Issued', 'Due', 'Total', 'Status', ''].map(h => (
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
                {items.map(inv => (
                  <tr key={inv.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-4 py-4 font-heading text-sm font-semibold text-ink">
                      {inv.invoice_number}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-ink">{inv.client_name}</p>
                      {inv.client_company && (
                        <p className="text-xs text-slate-500">{inv.client_company}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {formatDate(inv.issue_date)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {formatDate(inv.due_date)}
                    </td>
                    <td className="px-4 py-4 font-heading text-sm font-semibold text-ink">
                      {formatMoney(inv.total, inv.currency)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <InvoiceDownloadButton invoice={inv} />
                        <IconButton
                          icon={Pencil}
                          label="Edit"
                          onClick={() => openEdit(inv)}
                        />
                        <IconButton
                          icon={Trash2}
                          tone="danger"
                          label="Delete"
                          onClick={() => setDeleting(inv)}
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

      {/* ---------- create / edit ---------- */}
      <Modal
        open={draft !== null}
        onClose={() => {
          setDraft(null);
          setLines([]);
        }}
        title={editingId ? 'Edit invoice' : 'New invoice'}
        wide
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setDraft(null);
                setLines([]);
              }}
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
              Preview
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="btn btn-primary btn-sm"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {editingId ? 'Save changes' : 'Create invoice'}
            </button>
          </>
        }
      >
        {draft && (
          <div className="space-y-5">
            <section>
              <h3 className="mb-3 font-heading text-sm font-bold uppercase tracking-wider text-slate-500">
                Invoice details
              </h3>

              <div className="grid gap-4 sm:grid-cols-4">
                <Field label="Invoice number" htmlFor="i-num" className="sm:col-span-2">
                  <TextInput
                    id="i-num"
                    value={draft.invoice_number}
                    onChange={e => patch({ invoice_number: e.target.value })}
                  />
                </Field>
                <Field label="Status" htmlFor="i-status">
                  <Select
                    id="i-status"
                    value={draft.status}
                    onChange={e => patch({ status: e.target.value as InvoiceStatus })}
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Currency" htmlFor="i-cur">
                  <Select
                    id="i-cur"
                    value={draft.currency}
                    onChange={e => patch({ currency: e.target.value })}
                  >
                    {['INR', 'USD', 'EUR', 'GBP'].map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Client name" htmlFor="i-client">
                  <TextInput
                    id="i-client"
                    value={draft.client_name}
                    onChange={e => patch({ client_name: e.target.value })}
                  />
                </Field>
                <Field label="Company" htmlFor="i-company">
                  <TextInput
                    id="i-company"
                    value={draft.client_company}
                    onChange={e => patch({ client_company: e.target.value })}
                  />
                </Field>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Email" htmlFor="i-email">
                  <TextInput
                    id="i-email"
                    type="email"
                    value={draft.client_email}
                    onChange={e => patch({ client_email: e.target.value })}
                  />
                </Field>
                <Field label="GSTIN" htmlFor="i-gstin">
                  <TextInput
                    id="i-gstin"
                    value={draft.client_gstin}
                    onChange={e => patch({ client_gstin: e.target.value })}
                  />
                </Field>
              </div>
            </section>

            {/* ---------- items ---------- */}
            <section className="border-t border-slate-200 pt-5">
              <h3 className="mb-3 font-heading text-sm font-bold uppercase tracking-wider text-slate-500">
                Items
              </h3>

              <InvoiceLineEditor
                items={lines}
                onChange={setLines}
                taxRate={Number(draft.tax_rate) || 0}
                discount={Number(draft.discount) || 0}
              />

              <div className="mt-4 grid gap-4 sm:grid-cols-4">
                <Field label="Issue date" htmlFor="i-issue">
                  <TextInput
                    id="i-issue"
                    type="date"
                    value={draft.issue_date?.slice(0, 10) ?? ''}
                    onChange={e => patch({ issue_date: e.target.value })}
                  />
                </Field>
                <Field label="Due date" htmlFor="i-due">
                  <TextInput
                    id="i-due"
                    type="date"
                    value={draft.due_date?.slice(0, 10) ?? ''}
                    onChange={e => patch({ due_date: e.target.value || null })}
                  />
                </Field>
                <Field label="Tax rate %" htmlFor="i-tax">
                  <TextInput
                    id="i-tax"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={draft.tax_rate}
                    onChange={e => patch({ tax_rate: e.target.value })}
                  />
                </Field>
                <Field label="Discount (₹)" htmlFor="i-disc">
                  <TextInput
                    id="i-disc"
                    type="number"
                    min="0"
                    step="1"
                    value={draft.discount}
                    onChange={e => patch({ discount: e.target.value })}
                  />
                </Field>
              </div>
            </section>

            <section className="border-t border-slate-200 pt-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Notes" htmlFor="i-notes">
                  <TextArea
                    id="i-notes"
                    rows={3}
                    value={draft.notes}
                    onChange={e => patch({ notes: e.target.value })}
                  />
                </Field>
                <Field label="Terms" htmlFor="i-terms">
                  <TextArea
                    id="i-terms"
                    rows={3}
                    value={draft.terms}
                    onChange={e => patch({ terms: e.target.value })}
                  />
                </Field>
              </div>
            </section>
          </div>
        )}
      </Modal>

      {/* ---------- preview ---------- */}
      {previewInvoice && (
        <InvoicePreview
          open={previewing}
          onClose={() => setPreviewing(false)}
          invoice={previewInvoice}
          items={lines}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete invoice"
        message={`Delete invoice ${deleting?.invoice_number}? Its line items will be removed too.`}
        busy={busyDelete}
      />
    </>
  );
}

/** Loads an invoice's items, then opens the letterhead preview. */
function InvoiceDownloadButton({ invoice }: { invoice: Invoice }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<InvoiceLine[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const res = await api.invoiceItems(invoice.id);
      setItems(res.items.map(toLine));
      setOpen(true);
    } catch {
      setItems([]);
      setOpen(true);
    } finally {
      setBusy(false);
    }
  }, [invoice.id]);

  return (
    <>
      <button
        type="button"
        onClick={load}
        disabled={busy}
        aria-label={`Download PDF of ${invoice.invoice_number}`}
        title="Preview and download PDF"
        className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
      <InvoicePreview
        open={open}
        onClose={() => setOpen(false)}
        invoice={invoice}
        items={items}
      />
    </>
  );
}