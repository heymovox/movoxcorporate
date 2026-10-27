import { useState } from 'react';
import { Pencil, Trash2, ExternalLink, Loader2, Plus } from 'lucide-react';
import { api, type Blog, type BlogBlock } from '../../lib/adminApi';
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

const CATEGORIES = [
  'Branding',
  'Web Development',
  'App Development',
  'Marketing & SEO',
  'Process',
];

type Draft = Omit<Blog, 'id' | 'created_at' | 'updated_at'>;

const emptyBlog = (): Draft => ({
  slug: '',
  title: '',
  excerpt: '',
  category: 'Branding',
  published_on: new Date().toISOString().slice(0, 10),
  reading_minutes: 5,
  image: '',
  author: '',
  author_role: '',
  body: [{ paragraphs: [''] }],
  related_services: [],
  published: false,
});

export default function AdminBlogs() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const { items, loading, error, reload } = useResource<Blog>('blogs', { status, search });

  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Blog | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);

  const patch = (p: Partial<Draft>) => setDraft(d => (d ? { ...d, ...p } : d));

  const setBlock = (i: number, b: Partial<BlogBlock>) => {
    setDraft(d => {
      if (!d) return d;
      const body = [...d.body];
      body[i] = { ...body[i], ...b };
      return { ...d, body };
    });
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.title.trim()) return toast.error('Title is required.');
    if (!draft.slug.trim()) return toast.error('Slug is required.');

    setSaving(true);
    try {
      if (editingId) {
        await api.update<Blog>('blogs', editingId, draft);
        toast.success('Blog post updated.');
      } else {
        await api.create<Blog>('blogs', draft);
        toast.success('Blog post created.');
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
      await api.remove('blogs', deleting.id);
      toast.success('Blog post deleted.');
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
        title="Blogs"
        description="Insights articles published to the resources section."
        action={<AddButton onClick={() => { setDraft(emptyBlog()); setEditingId(null); }} label="Add post" />}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search title or author…" />
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
            title="No blog posts yet"
            description="Publish an article to populate the insights listing."
            action={
              <AddButton
                onClick={() => { setDraft(emptyBlog()); setEditingId(null); }}
                label="Add post"
              />
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Post', 'Category', 'Date', 'Status', ''].map(h => (
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
                {items.map(b => (
                  <tr key={b.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {b.image && (
                          <img
                            src={b.image}
                            alt=""
                            className="h-10 w-14 shrink-0 rounded-lg object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-heading text-sm font-semibold text-ink">
                            {b.title}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {b.author || b.slug} · {b.reading_minutes} min read
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{b.category}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {formatDate(b.published_on)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={b.published ? 'published' : 'draft'} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/insights/${b.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Preview ${b.title}`}
                          title="Preview on site"
                          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-700"
                        >
                          <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        </a>
                        <IconButton
                          icon={Pencil}
                          label="Edit"
                          onClick={() => {
                            const { id: _i, created_at: _c, updated_at: _u, ...rest } = b;
                            setDraft(rest);
                            setEditingId(b.id);
                          }}
                        />
                        <IconButton
                          icon={Trash2}
                          tone="danger"
                          label="Delete"
                          onClick={() => setDeleting(b)}
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
        title={editingId ? 'Edit post' : 'Add post'}
        wide
        footer={
          <>
            <button type="button" onClick={() => setDraft(null)} className="btn btn-secondary btn-sm">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving} className="btn btn-primary btn-sm">
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {editingId ? 'Save changes' : 'Create post'}
            </button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            <Field label="Title" htmlFor="b-title">
              <TextInput
                id="b-title"
                value={draft.title}
                onChange={e => {
                  const title = e.target.value;
                  patch({ title, ...(editingId ? {} : { slug: slugify(title) }) });
                }}
              />
            </Field>

            <Field label="Slug" htmlFor="b-slug" hint="Used in the public URL: /insights/{slug}">
              <TextInput
                id="b-slug"
                value={draft.slug}
                onChange={e => patch({ slug: slugify(e.target.value) })}
              />
            </Field>

            <Field label="Excerpt" htmlFor="b-excerpt">
              <TextArea
                id="b-excerpt"
                rows={3}
                value={draft.excerpt}
                onChange={e => patch({ excerpt: e.target.value })}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Category" htmlFor="b-cat">
                <Select
                  id="b-cat"
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
              <Field label="Publish date" htmlFor="b-date">
                <TextInput
                  id="b-date"
                  type="date"
                  value={draft.published_on?.slice(0, 10) ?? ''}
                  onChange={e => patch({ published_on: e.target.value })}
                />
              </Field>
              <Field label="Reading minutes" htmlFor="b-read">
                <TextInput
                  id="b-read"
                  type="number"
                  min={1}
                  value={draft.reading_minutes}
                  onChange={e => patch({ reading_minutes: Number(e.target.value) || 1 })}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Author" htmlFor="b-author">
                <TextInput
                  id="b-author"
                  value={draft.author}
                  onChange={e => patch({ author: e.target.value })}
                />
              </Field>
              <Field label="Author role" htmlFor="b-authorrole">
                <TextInput
                  id="b-authorrole"
                  value={draft.author_role}
                  onChange={e => patch({ author_role: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Cover image" htmlFor="b-image">
              <TextInput
                id="b-image"
                value={draft.image}
                onChange={e => patch({ image: e.target.value })}
                placeholder="/images/insights/example.svg"
              />
            </Field>

            <Field label="Body" hint="Each block has an optional heading and paragraphs.">
              <div className="space-y-3">
                {draft.body.map((blk, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="space-y-2">
                      <TextInput
                        placeholder="Heading (optional)"
                        value={blk.heading ?? ''}
                        onChange={e => setBlock(i, { heading: e.target.value })}
                      />
                      <TextArea
                        placeholder="Paragraphs — one per line"
                        value={blk.paragraphs.join('\n')}
                        onChange={e =>
                          setBlock(i, {
                            paragraphs: e.target.value.split('\n').filter(l => l.trim() !== ''),
                          })
                        }
                        rows={5}
                      />
                    </div>
                    {draft.body.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          patch({ body: draft.body.filter((_, idx) => idx !== i) })
                        }
                        className="mt-2 text-xs font-semibold text-red-600 hover:underline"
                      >
                        Remove block
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => patch({ body: [...draft.body, { paragraphs: [''] }] })}
                  className="btn btn-secondary btn-sm"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add block
                </button>
              </div>
            </Field>

            <Field label="Related services" hint="Comma separated">
              <TextInput
                value={draft.related_services.join(', ')}
                onChange={e =>
                  patch({
                    related_services: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                  })
                }
              />
            </Field>

            <div className="border-t border-slate-200 pt-4">
              <Toggle
                checked={draft.published}
                onChange={v => patch({ published: v })}
                label="Published"
              />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete post"
        message={`Permanently delete "${deleting?.title}"? This cannot be undone.`}
        busy={busyDelete}
      />
    </>
  );
}