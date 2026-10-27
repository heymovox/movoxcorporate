import { useState } from 'react';
import { Pencil, Trash2, ExternalLink, Loader2, Upload, X } from 'lucide-react';
import { api, type Work, type WorkResult } from '../../lib/adminApi';
import {
  PageHeader,
  Card,
  EmptyState,
  Spinner,
  ErrorState,
  AddButton,
  IconButton,
  Badge,
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
  ListInput,
  Repeater,
  useToast,
  useResource,
  slugify,
} from '../../components/admin/ui';

const CATEGORIES = ['Branding', 'Web', 'App', 'Marketing'];

const emptyWork = (): Omit<Work, 'id' | 'created_at' | 'updated_at'> => ({
  slug: '',
  title: '',
  client: '',
  client_descriptor: '',
  category: 'Branding',
  services: [],
  year: String(new Date().getFullYear()),
  summary: '',
  image: '',
  challenge: '',
  objectives: [],
  approach: [],
  deliverables: [],
  results: [],
  quote: null,
  is_sample: false,
  published: false,
  sort_order: 0,
});

type Draft = Omit<Work, 'id' | 'created_at' | 'updated_at'>;

export default function AdminWorks() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const { items, loading, error, reload } = useResource<Work>('works', { status, search });

  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Work | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const patch = (p: Partial<Draft>) => setDraft(d => (d ? { ...d, ...p } : d));

  const uploadWithProgress = async (
    file: File,
    purpose: 'enquiry-attachment' | 'project-asset' | 'brand-asset' | 'marketing-asset',
    onProgress: (p: number) => void
  ) => {
    return new Promise<{ files: { key: string; publicUrl: string; filename: string; size: number }[] }>((resolve, reject) => {
      const form = new FormData();
      form.append('purpose', purpose);
      form.append('files', file);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${import.meta.env.VITE_API_URL ?? 'https://api.heymovox.com'}/api/upload`);
      const token = localStorage.getItem('admin_token');
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error('Invalid response'));
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.error ?? `Upload failed (${xhr.status})`));
          } catch {
            reject(new Error(`Upload failed (${xhr.status})`));
          }
        }
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(form);
    });
  };

  const openCreate = () => {
    setDraft(emptyWork());
    setEditingId(null);
  };

  const openEdit = (w: Work) => {
    const { id: _id, created_at: _c, updated_at: _u, ...rest } = w;
    setDraft(rest);
    setEditingId(w.id);
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.title.trim()) return toast.error('Title is required.');
    if (!draft.slug.trim()) return toast.error('Slug is required.');

    setSaving(true);
    try {
      if (editingId) {
        await api.update<Work>('works', editingId, draft);
        toast.success('Work updated.');
      } else {
        await api.create<Work>('works', draft);
        toast.success('Work created.');
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
      await api.remove('works', deleting.id);
      toast.success('Work deleted.');
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
        title="Our Works"
        description="Case studies shown on the public portfolio page."
        action={<AddButton onClick={openCreate} label="Add work" />}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search title or client…" />
        <SelectFilter
          value={status}
          onChange={setStatus}
          options={['true', 'false']}
          label="Filter by published"
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
            title="No work yet"
            description="Add your first case study to populate the portfolio page."
            action={<AddButton onClick={openCreate} label="Add work" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Work', 'Category', 'Year', 'Status', ''].map(h => (
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
                {items.map(w => (
                  <tr key={w.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {w.image && (
                          <img
                            src={w.image}
                            alt=""
                            className="h-10 w-14 shrink-0 rounded-lg object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-heading text-sm font-semibold text-ink">
                            {w.title}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {w.client || w.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge>{w.category}</Badge>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{w.year || '—'}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={w.published ? 'published' : 'draft'} />
                        {w.is_sample && <Badge tone="amber">Sample</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/work/${w.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Preview ${w.title}`}
                          title="Preview on site"
                          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-700"
                        >
                          <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        </a>
                        <IconButton icon={Pencil} onClick={() => openEdit(w)} label="Edit" />
                        <IconButton
                          icon={Trash2}
                          tone="danger"
                          onClick={() => setDeleting(w)}
                          label="Delete"
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
        title={editingId ? 'Edit work' : 'Add work'}
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
              onClick={save}
              disabled={saving}
              className="btn btn-primary btn-sm"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {editingId ? 'Save changes' : 'Create work'}
            </button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" htmlFor="w-title">
                <TextInput
                  id="w-title"
                  value={draft.title}
                  onChange={e => {
                    const title = e.target.value;
                    patch({ title, ...(editingId ? {} : { slug: slugify(title) }) });
                  }}
                  placeholder="Northwind Coffee — Brand Identity"
                />
              </Field>
              <Field label="Slug" htmlFor="w-slug" hint="Used in the public URL: /work/{slug}">
                <TextInput
                  id="w-slug"
                  value={draft.slug}
                  onChange={e => patch({ slug: slugify(e.target.value) })}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Client" htmlFor="w-client">
                <TextInput
                  id="w-client"
                  value={draft.client}
                  onChange={e => patch({ client: e.target.value })}
                />
              </Field>
              <Field label="Client descriptor" htmlFor="w-desc">
                <TextInput
                  id="w-desc"
                  value={draft.client_descriptor}
                  onChange={e => patch({ client_descriptor: e.target.value })}
                  placeholder="Specialty coffee roaster"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Category" htmlFor="w-cat">
                <Select
                  id="w-cat"
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
              <Field label="Year" htmlFor="w-year">
                <TextInput
                  id="w-year"
                  value={draft.year}
                  onChange={e => patch({ year: e.target.value })}
                />
              </Field>
              <Field label="Sort order" htmlFor="w-sort" hint="Lower shows first">
                <TextInput
                  id="w-sort"
                  type="number"
                  value={draft.sort_order}
                  onChange={e => patch({ sort_order: Number(e.target.value) || 0 })}
                />
              </Field>
            </div>

            <Field label="Services" hint="One per line">
              <ListInput
                value={draft.services}
                onChange={v => patch({ services: v })}
                placeholder={'Brand Strategy\nVisual Identity'}
              />
            </Field>

            <Field label="Summary" htmlFor="w-summary">
              <TextArea
                id="w-summary"
                value={draft.summary}
                onChange={e => patch({ summary: e.target.value })}
                rows={3}
              />
            </Field>

            <Field label="Cover image" hint="Upload or enter a URL">
              <div className="space-y-3">
                {draft.image && (
                  <div className="relative flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                    <img
                      src={draft.image}
                      alt="Current cover"
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-heading text-sm font-semibold text-ink truncate">
                        Current cover
                      </p>
                      <p className="text-xs text-slate-500 truncate">{draft.image}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => patch({ image: '' })}
                      className="shrink-0 rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100"
                      aria-label="Remove current image"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <label className="btn btn-secondary flex items-center gap-2">
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    {uploading ? 'Uploading...' : 'Upload image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={uploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploading(true);
                        setProgress(0);
                        try {
                          const res = await uploadWithProgress(file, 'brand-asset', (p) => setProgress(p));
                          patch({ image: res.files[0].publicUrl });
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Upload failed');
                        } finally {
                          setUploading(false);
                          setProgress(0);
                        }
                      }}
                    />
                  </label>
                  <span className="text-xs text-slate-500">
                    or paste a URL below
                  </span>
                </div>
                {uploading && (
                  <div className="w-full">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>Uploading...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-600 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
                <TextInput
                  id="w-image"
                  value={draft.image}
                  onChange={e => patch({ image: e.target.value })}
                  placeholder="/images/work/northwind-coffee.svg"
                />
              </div>
            </Field>

            <Field label="Challenge" htmlFor="w-challenge">
              <TextArea
                id="w-challenge"
                value={draft.challenge}
                onChange={e => patch({ challenge: e.target.value })}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Objectives">
                <ListInput
                  value={draft.objectives}
                  onChange={v => patch({ objectives: v })}
                  rows={4}
                />
              </Field>
              <Field label="Approach">
                <ListInput
                  value={draft.approach}
                  onChange={v => patch({ approach: v })}
                  rows={4}
                />
              </Field>
              <Field label="Deliverables">
                <ListInput
                  value={draft.deliverables}
                  onChange={v => patch({ deliverables: v })}
                  rows={4}
                />
              </Field>
            </div>

            <Field label="Results" hint="Headline metrics shown on the case study">
              <Repeater<WorkResult>
                items={draft.results}
                onChange={v => patch({ results: v })}
                createItem={() => ({ label: '', value: '', note: '' })}
                render={(r, update) => (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <TextInput
                      placeholder="Label"
                      value={r.label}
                      onChange={e => update({ label: e.target.value })}
                    />
                    <TextInput
                      placeholder="Value"
                      value={r.value}
                      onChange={e => update({ value: e.target.value })}
                    />
                    <TextInput
                      placeholder="Note"
                      value={r.note ?? ''}
                      onChange={e => update({ note: e.target.value })}
                    />
                  </div>
                )}
              />
            </Field>

            <Field label="Client quote">
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <TextArea
                  placeholder="Quote text"
                  value={draft.quote?.text ?? ''}
                  onChange={e =>
                    patch({
                      quote: e.target.value
                        ? {
                            text: e.target.value,
                            author: draft.quote?.author ?? '',
                            role: draft.quote?.role ?? '',
                          }
                        : null,
                    })
                  }
                  rows={2}
                />
                {draft.quote && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <TextInput
                      placeholder="Author"
                      value={draft.quote.author}
                      onChange={e => patch({ quote: { ...draft.quote!, author: e.target.value } })}
                    />
                    <TextInput
                      placeholder="Role"
                      value={draft.quote.role ?? ''}
                      onChange={e => patch({ quote: { ...draft.quote!, role: e.target.value } })}
                    />
                  </div>
                )}
              </div>
            </Field>

            <div className="flex flex-wrap gap-6 border-t border-slate-200 pt-4">
              <Toggle
                checked={draft.published}
                onChange={v => patch({ published: v })}
                label="Published"
              />
              <Toggle
                checked={draft.is_sample}
                onChange={v => patch({ is_sample: v })}
                label="Sample data (shows disclosure)"
              />
            </div>

            {editingId && (
              <p className="text-xs text-slate-400">
                Editing an existing record — changes go live when you save.
              </p>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete work"
        message={`Permanently delete "${deleting?.title}"? This cannot be undone.`}
        busy={busyDelete}
      />
    </>
  );
}