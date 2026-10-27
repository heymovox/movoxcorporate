import { useState } from 'react';
import { Pencil, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { api, type Policy } from '../../lib/adminApi';
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
  Toggle,
  useToast,
  useResource,
  formatDate,
  slugify,
} from '../../components/admin/ui';

const CATEGORIES = ['General', 'Privacy', 'Terms', 'Refund', 'Cookie', 'Security'];
const STATUSES = ['draft', 'published', 'archived'];

type Draft = Omit<Policy, 'id' | 'created_at' | 'updated_at'>;

const emptyPolicy = (): Draft => ({
  slug: '',
  title: '',
  category: 'General',
  summary: '',
  content: '',
  version: '1.0',
  effective_date: null,
  status: 'draft',
  show_in_footer: true,
  sort_order: 0,
});

export default function AdminPolicies() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const { items, loading, error, reload } = useResource<Policy>('policies', { status, search });

  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Policy | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);

  const patch = (p: Partial<Draft>) => setDraft(d => (d ? { ...d, ...p } : d));

  const save = async () => {
    if (!draft) return;
    if (!draft.title.trim()) return toast.error('Title is required.');
    if (!draft.slug.trim()) return toast.error('Slug is required.');

    setSaving(true);
    try {
      if (editingId) {
        await api.update<Policy>('policies', editingId, draft);
        toast.success('Policy updated.');
      } else {
        await api.create<Policy>('policies', draft);
        toast.success('Policy created.');
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
      await api.remove('policies', deleting.id);
      toast.success('Policy deleted.');
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
        title="Policies"
        description="Privacy, terms, and other legal documents published to the site."
        action={
          <AddButton
            onClick={() => { setDraft(emptyPolicy()); setEditingId(null); }}
            label="Add policy"
          />
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search title…" />
        <div className="flex gap-3">
          <SelectFilter
            value={status}
            onChange={setStatus}
            options={STATUSES}
            label="Filter by status"
            allLabel="All statuses"
          />
        </div>
      </div>

      <Card>
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : items.length === 0 ? (
          <EmptyState
            title="No policies yet"
            description="Add your privacy policy, terms of service, and refund policy."
            action={
              <AddButton
                onClick={() => { setDraft(emptyPolicy()); setEditingId(null); }}
                label="Add policy"
              />
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Policy', 'Category', 'Version', 'Effective', 'Status', ''].map(h => (
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
                {items.map(p => (
                  <tr key={p.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-4 py-4">
                      <p className="font-heading text-sm font-semibold text-ink">{p.title}</p>
                      <p className="text-xs text-slate-500">{p.slug}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{p.category}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">v{p.version}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {formatDate(p.effective_date)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/policies/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Preview ${p.title}`}
                          title="Preview on site"
                          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-700"
                        >
                          <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        </a>
                        <IconButton
                          icon={Pencil}
                          label="Edit"
                          onClick={() => {
                            const { id: _i, created_at: _c, updated_at: _u, ...rest } = p;
                            setDraft(rest);
                            setEditingId(p.id);
                          }}
                        />
                        <IconButton
                          icon={Trash2}
                          tone="danger"
                          label="Delete"
                          onClick={() => setDeleting(p)}
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
        title={editingId ? 'Edit policy' : 'Add policy'}
        wide
        footer={
          <>
            <button type="button" onClick={() => setDraft(null)} className="btn btn-secondary btn-sm">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving} className="btn btn-primary btn-sm">
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {editingId ? 'Save changes' : 'Create policy'}
            </button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" htmlFor="p-title">
                <TextInput
                  id="p-title"
                  value={draft.title}
                  onChange={e => {
                    const title = e.target.value;
                    patch({ title, ...(editingId ? {} : { slug: slugify(title) }) });
                  }}
                />
              </Field>
              <Field label="Slug" htmlFor="p-slug" hint="Used in the public URL: /policies/{slug}">
                <TextInput
                  id="p-slug"
                  value={draft.slug}
                  onChange={e => patch({ slug: slugify(e.target.value) })}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Category" htmlFor="p-cat">
                <Select
                  id="p-cat"
                  value={draft.category}
                  onChange={e => patch({ category: e.target.value })}
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Version" htmlFor="p-ver">
                <TextInput
                  id="p-ver"
                  value={draft.version}
                  onChange={e => patch({ version: e.target.value })}
                />
              </Field>
              <Field label="Status" htmlFor="p-status">
                <Select
                  id="p-status"
                  value={draft.status}
                  onChange={e => patch({ status: e.target.value as Draft['status'] })}
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Effective date" htmlFor="p-eff">
              <TextInput
                id="p-eff"
                type="date"
                value={draft.effective_date?.slice(0, 10) ?? ''}
                onChange={e => patch({ effective_date: e.target.value || null })}
              />
            </Field>

            <Field label="Summary" htmlFor="p-summary">
              <TextArea
                id="p-summary"
                rows={2}
                value={draft.summary}
                onChange={e => patch({ summary: e.target.value })}
              />
            </Field>

            <Field label="Content" htmlFor="p-content">
              <TextArea
                id="p-content"
                rows={14}
                value={draft.content}
                onChange={e => patch({ content: e.target.value })}
                className="font-mono text-xs"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Sort order" htmlFor="p-sort">
                <TextInput
                  id="p-sort"
                  type="number"
                  value={draft.sort_order}
                  onChange={e => patch({ sort_order: Number(e.target.value) || 0 })}
                />
              </Field>
              <div className="flex items-end pb-2">
                <Toggle
                  checked={draft.show_in_footer}
                  onChange={v => patch({ show_in_footer: v })}
                  label="Show in footer"
                />
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete policy"
        message={`Permanently delete "${deleting?.title}"? This cannot be undone.`}
        busy={busyDelete}
      />
    </>
  );
}