import { useRef, useState } from 'react';
import { Pencil, Trash2, Loader2, Upload, User as UserIcon } from 'lucide-react';
import { api, type TeamMember, type ItemResponse } from '../../lib/adminApi';
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
  Modal,
  ConfirmDialog,
  Field,
  TextInput,
  TextArea,
  Toggle,
  useToast,
  useResource,
} from '../../components/admin/ui';

type Draft = Omit<TeamMember, 'id' | 'created_at' | 'updated_at'>;

const emptyMember = (): Draft => ({
  name: '',
  role: '',
  bio: '',
  email: '',
  phone: '',
  photo: '',
  linkedin: '',
  twitter: '',
  sort_order: 0,
  is_active: true,
});

export default function AdminTeam() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const { items, loading, error, reload } = useResource<TeamMember>('team_members', { search });

  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<TeamMember | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);

  const patch = (p: Partial<Draft>) => setDraft(d => (d ? { ...d, ...p } : d));

  /** Upload the chosen portrait to R2 and point `photo` at the stored object. */
  const uploadPhoto = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file (JPG, PNG or WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('That image is over 5 MB. Please choose a smaller one.');
      return;
    }

    setUploading(true);
    try {
      const res = await api.upload(file, 'brand-asset');
      const url = res.files?.[0]?.publicUrl;
      if (!url) throw new Error('The upload did not return a URL.');
      patch({ photo: url });
      toast.success('Photo uploaded.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(false);
      // Let the same file be picked again after a failed attempt.
      if (photoInput.current) photoInput.current.value = '';
    }
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.name.trim()) return toast.error('Name is required.');

    setSaving(true);
    try {
      if (editingId) {
        await api.update<TeamMember>('team_members', editingId, draft);
        toast.success('Team member updated.');
      } else {
        // The API also creates the person's MovoX login and emails the
        // generated password to the personal address on the form.
        const res = (await api.create<TeamMember>('team_members', draft)) as ItemResponse<TeamMember> & {
          account?: { email?: string; emailed?: boolean; password?: string; error?: string };
        };
        const acct = res.account;
        if (acct?.error) {
          toast.error(`Member added, but no login account was created — ${acct.error}.`);
        } else if (acct?.emailed) {
          toast.success(`Member added — login ${acct.email}, password emailed to ${draft.email}.`);
        } else if (acct?.email && acct.password) {
          toast.success(
            `Member added — login ${acct.email}, password ${acct.password}. Copy it now; it is not shown again.`,
          );
        } else {
          toast.success('Team member added.');
        }
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
      await api.remove('team_members', deleting.id);
      toast.success('Team member removed.');
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
        title="Team"
        description="People shown on the about page — each one also gets a MovoX login, with the password emailed to them."
        action={<AddButton onClick={() => { setDraft(emptyMember()); setEditingId(null); }} label="Add member" />}
      />

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name or role…" />
      </div>

      {loading ? (
        <Card>
          <Spinner />
        </Card>
      ) : error ? (
        <Card>
          <ErrorState message={error} onRetry={reload} />
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            title="No team members yet"
            description="Add people to populate the team section of the site."
            action={
              <AddButton
                onClick={() => { setDraft(emptyMember()); setEditingId(null); }}
                label="Add member"
              />
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map(m => (
            <Card key={m.id} className="p-5">
              <div className="flex items-start gap-4">
                {m.photo ? (
                  <img
                    src={m.photo}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <UserIcon className="h-6 w-6" aria-hidden="true" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading text-base font-bold text-ink">{m.name}</p>
                  <p className="truncate text-sm text-brand-600">{m.role || '—'}</p>
                  <div className="mt-2">
                    <StatusBadge status={m.is_active ? 'active' : 'inactive'} />
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <IconButton
                    icon={Pencil}
                    label="Edit"
                    onClick={() => {
                      const { id: _i, created_at: _c, updated_at: _u, ...rest } = m;
                      setDraft(rest);
                      setEditingId(m.id);
                    }}
                  />
                  <IconButton
                    icon={Trash2}
                    tone="danger"
                    label="Remove"
                    onClick={() => setDeleting(m)}
                  />
                </div>
              </div>
              {m.bio && <p className="mt-4 line-clamp-3 text-sm text-slate-600">{m.bio}</p>}
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={editingId ? 'Edit team member' : 'Add team member'}
        footer={
          <>
            <button type="button" onClick={() => setDraft(null)} className="btn btn-secondary btn-sm">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving} className="btn btn-primary btn-sm">
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {editingId ? 'Save changes' : 'Add member'}
            </button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="t-name">
                <TextInput
                  id="t-name"
                  value={draft.name}
                  onChange={e => patch({ name: e.target.value })}
                />
              </Field>
              <Field label="Role" htmlFor="t-role">
                <TextInput
                  id="t-role"
                  value={draft.role}
                  onChange={e => patch({ role: e.target.value })}
                  placeholder="Lead Designer"
                />
              </Field>
            </div>

            <Field label="Bio" htmlFor="t-bio">
              <TextArea
                id="t-bio"
                rows={4}
                value={draft.bio}
                onChange={e => patch({ bio: e.target.value })}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Personal email"
                htmlFor="t-email"
                hint="Their own inbox — the generated MovoX login and password are sent here"
              >
                <TextInput
                  id="t-email"
                  type="email"
                  value={draft.email}
                  onChange={e => patch({ email: e.target.value })}
                />
              </Field>
              <Field label="Phone" htmlFor="t-phone">
                <TextInput
                  id="t-phone"
                  value={draft.phone}
                  onChange={e => patch({ phone: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Photo" htmlFor="t-photo" hint="JPG, PNG or WebP up to 5 MB">
              <div className="flex items-center gap-4">
                {draft.photo ? (
                  <img
                    src={draft.photo}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <UserIcon className="h-7 w-7" aria-hidden="true" />
                  </span>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={photoInput}
                    id="t-photo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="sr-only"
                    onChange={e => uploadPhoto(e.target.files?.[0])}
                  />
                  <label htmlFor="t-photo" className="btn btn-secondary btn-sm cursor-pointer">
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Upload className="h-4 w-4" aria-hidden="true" />
                    )}
                    {uploading ? 'Uploading…' : draft.photo ? 'Replace photo' : 'Upload photo'}
                  </label>

                  {draft.photo && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => patch({ photo: '' })}
                      disabled={uploading}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="LinkedIn URL" htmlFor="t-li">
                <TextInput
                  id="t-li"
                  value={draft.linkedin}
                  onChange={e => patch({ linkedin: e.target.value })}
                />
              </Field>
              <Field label="Twitter URL" htmlFor="t-tw">
                <TextInput
                  id="t-tw"
                  value={draft.twitter}
                  onChange={e => patch({ twitter: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Sort order" htmlFor="t-sort" hint="Lower shows first">
              <TextInput
                id="t-sort"
                type="number"
                value={draft.sort_order}
                onChange={e => patch({ sort_order: Number(e.target.value) || 0 })}
              />
            </Field>

            <div className="border-t border-slate-200 pt-4">
              <Toggle
                checked={draft.is_active}
                onChange={v => patch({ is_active: v })}
                label="Active (visible on the site)"
              />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Remove team member"
        message={`Remove "${deleting?.name}" from the team list? This cannot be undone.`}
        busy={busyDelete}
      />
    </>
  );
}