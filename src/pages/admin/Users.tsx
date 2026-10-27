import { useState } from 'react';
import { Pencil, Trash2, Loader2, ShieldAlert } from 'lucide-react';
import { api, type AdminUser, type Role } from '../../lib/adminApi';
import { ROLES, ROLE_LABELS } from '../../lib/rbac';
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
  Select,
  Toggle,
  useToast,
  useResource,
  formatDate,
} from '../../components/admin/ui';
import { useAuth } from '../../hooks/useAuth';

type Draft = {
  email: string;
  name: string;
  role: Role;
  company: string;
  client_of: string;
  phone: string;
  avatar: string;
  notes: string;
  is_active: boolean;
  password: string;
};

const emptyUser = (): Draft => ({
  email: '',
  name: '',
  role: 'team_member',
  company: '',
  client_of: '',
  phone: '',
  avatar: '',
  notes: '',
  is_active: true,
  password: '',
});

const ROLE_HELP: Record<Role, string> = {
  admin: 'Full access to everything, including users and settings.',
  operations_manager:
    'Agreements (can sign as MovoX authorised person), all projects, revenue and invoices.',
  project_manager: 'Agreements, all projects, and invoices. Cannot sign agreements.',
  sales_executive: 'Enquiries and leads. No project or invoice access.',
  team_member:
    'Only projects they are assigned to: reply, update status, upload client-finalised files.',
  client: 'Portal login. Sees only their own projects, status, and files.',
};

export default function AdminUsers() {
  const toast = useToast();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const { items, loading, error, reload } = useResource<AdminUser>('users');

  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);

  const patch = (p: Partial<Draft>) => setDraft(d => (d ? { ...d, ...p } : d));

  const filtered = items.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const save = async () => {
    if (!draft) return;
    if (!draft.name.trim()) return toast.error('Name is required.');
    if (!editingId && !draft.email.trim()) return toast.error('Email is required.');
    if (!editingId && draft.password.length < 8) {
      return toast.error('Password must be at least 8 characters.');
    }
    if (editingId && draft.password && draft.password.length < 8) {
      return toast.error('Password must be at least 8 characters.');
    }

    setSaving(true);
    try {
      if (editingId) {
        const body: Record<string, unknown> = {
          name: draft.name,
          role: draft.role,
          company: draft.company,
          client_of: draft.client_of,
          phone: draft.phone,
          avatar: draft.avatar,
          notes: draft.notes,
          is_active: draft.is_active,
        };
        if (draft.email.trim()) body.email = draft.email.trim();
        if (draft.password) body.password = draft.password;

        await api.update<AdminUser>('users', editingId, body);
        toast.success('User updated.');
      } else {
        await api.create<AdminUser>('users', {
          email: draft.email.trim(),
          name: draft.name,
          password: draft.password,
          role: draft.role,
          company: draft.company,
          client_of: draft.client_of,
          phone: draft.phone,
          avatar: draft.avatar,
          notes: draft.notes,
          is_active: draft.is_active,
        });
        toast.success('User created.');
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
      await api.remove('users', deleting.id);
      toast.success('User deleted.');
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
        title="Users"
        description="Admin accounts that can sign in to this dashboard."
        action={
          <AddButton
            onClick={() => { setDraft(emptyUser()); setEditingId(null); }}
            label="Add user"
          />
        }
      />

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name or email…" />
      </div>

      <Card>
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No users found"
            description="Invite a teammate by creating an admin account."
            action={
              <AddButton
                onClick={() => { setDraft(emptyUser()); setEditingId(null); }}
                label="Add user"
              />
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['User', 'Role', 'Status', 'Last login', ''].map(h => (
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
                {filtered.map(u => (
                  <tr key={u.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt=""
                            className="h-9 w-9 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                            {u.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-heading text-sm font-semibold text-ink">
                            {u.name}
                            {u.id === currentUser?.id && (
                              <span className="ml-2 text-xs font-normal text-slate-400">(you)</span>
                            )}
                          </p>
                          <p className="truncate text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={u.role} />
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={u.is_active ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {u.last_login ? formatDate(u.last_login) : 'Never'}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          icon={Pencil}
                          label="Edit"
                          onClick={() => {
                            setDraft({
                              email: u.email,
                              name: u.name,
                              role: u.role,
                              company: u.company ?? '',
                              client_of: u.client_of ?? '',
                              phone: u.phone,
                              avatar: u.avatar,
                              notes: u.notes,
                              is_active: u.is_active,
                              password: '',
                            });
                            setEditingId(u.id);
                          }}
                        />
                        <IconButton
                          icon={Trash2}
                          tone="danger"
                          label="Delete"
                          disabled={u.id === currentUser?.id}
                          onClick={() => setDeleting(u)}
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
        title={editingId ? 'Edit user' : 'Add user'}
        footer={
          <>
            <button type="button" onClick={() => setDraft(null)} className="btn btn-secondary btn-sm">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving} className="btn btn-primary btn-sm">
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {editingId ? 'Save changes' : 'Create user'}
            </button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="u-name">
                <TextInput
                  id="u-name"
                  value={draft.name}
                  onChange={e => patch({ name: e.target.value })}
                />
              </Field>
              <Field label="Email" htmlFor="u-email">
                <TextInput
                  id="u-email"
                  type="email"
                  value={draft.email}
                  onChange={e => patch({ email: e.target.value })}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Role"
                htmlFor="u-role"
                hint={ROLE_HELP[draft.role]}
              >
                <Select
                  id="u-role"
                  value={draft.role}
                  onChange={e => patch({ role: e.target.value as Role })}
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Phone" htmlFor="u-phone">
                <TextInput
                  id="u-phone"
                  value={draft.phone}
                  onChange={e => patch({ phone: e.target.value })}
                />
              </Field>
            </div>

            {draft.role === 'client' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company" htmlFor="u-company">
                  <TextInput
                    id="u-company"
                    value={draft.company}
                    onChange={e => patch({ company: e.target.value })}
                  />
                </Field>
                <Field label="Referred by / account manager" htmlFor="u-clientof">
                  <TextInput
                    id="u-clientof"
                    value={draft.client_of}
                    onChange={e => patch({ client_of: e.target.value })}
                  />
                </Field>
              </div>
            )}

            <Field
              label={editingId ? 'New password' : 'Password'}
              htmlFor="u-pass"
              hint={editingId ? 'Leave blank to keep the current password' : 'Minimum 8 characters'}
            >
              <TextInput
                id="u-pass"
                type="password"
                autoComplete="new-password"
                value={draft.password}
                onChange={e => patch({ password: e.target.value })}
              />
            </Field>

            <Field label="Avatar" htmlFor="u-avatar" hint="Path or full URL">
              <TextInput
                id="u-avatar"
                value={draft.avatar}
                onChange={e => patch({ avatar: e.target.value })}
              />
            </Field>

            <Field label="Notes" htmlFor="u-notes">
              <TextArea
                id="u-notes"
                rows={3}
                value={draft.notes}
                onChange={e => patch({ notes: e.target.value })}
              />
            </Field>

            <div className="border-t border-slate-200 pt-4">
              <Toggle
                checked={draft.is_active}
                onChange={v => patch({ is_active: v })}
                label="Active (can sign in)"
              />
            </div>

            {editingId === currentUser?.id && (
              <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                You are editing your own account. Removing your admin role or deactivating will
                lock you out.
              </p>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete user"
        message={`Delete "${deleting?.name}"? They will no longer be able to sign in.`}
        busy={busyDelete}
      />
    </>
  );
}