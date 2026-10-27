import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Paperclip,
  MessageSquare,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
  Eye,
  Flame,
} from 'lucide-react';
import {
  api,
  type Project,
  type ProjectStatus,
  type ProjectPriority,
  type ProjectUpdate,
  type ProjectFile,
  type ProjectMember,
  type DirectoryUser,
} from '../../lib/adminApi';
import { can } from '../../lib/rbac';
import { useAuth } from '../../hooks/useAuth';
import {
  PageHeader,
  Card,
  EmptyState,
  Spinner,
  ErrorState,
  AddButton,
  StatusBadge,
  SearchInput,
  SelectFilter,
  Modal,
  ConfirmDialog,
  Field,
  TextInput,
  TextArea,
  Select,
  Badge,
  formatDate,
  useToast,
  formatMoney,
} from '../../components/admin/ui';

const STATUSES: ProjectStatus[] = ['planning', 'in_progress', 'review', 'on_hold', 'completed'];
const PRIORITIES: ProjectPriority[] = ['low', 'normal', 'high', 'urgent'];

const statusLabel: Record<ProjectStatus, string> = {
  planning: 'Planning',
  in_progress: 'In progress',
  review: 'In review',
  on_hold: 'On hold',
  completed: 'Completed',
};

export default function AdminProjects() {
  const toast = useToast();
  const { role } = useAuth();

  const [projects, setProjects] = useState<Project[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [mineOnly, setMineOnly] = useState(false);

  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Partial<Project> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Project | null>(null);

  const canCreate = can(role, 'projects.create');
  const canAssign = can(role, 'projects.assign');
  const canStatus = can(role, 'projects.updateStatus');
  const canUpload = can(role, 'projects.uploadFiles');
  const showInternal = can(role, 'projects.viewAll');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.projects({ search, status, mine: mineOnly ? 'true' : '' });
      setProjects(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load projects.');
    } finally {
      setLoading(false);
    }
  }, [search, status, mineOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const openProject = projects?.find(p => p.id === openId) ?? null;

  const saveNew = async () => {
    if (!draft?.name?.trim()) return toast.error('Project name is required.');
    setSaving(true);
    try {
      await api.createProject(draft);
      toast.success('Project created.');
      setCreating(false);
      setDraft(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create the project.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await api.deleteProject(deleting.id);
      toast.success('Project deleted.');
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not delete.');
    }
  };

  return (
    <>
      <PageHeader
        title="Projects"
        description={
          can(role, 'projects.viewAssigned') && !can(role, 'projects.viewAll')
            ? 'Projects assigned to you.'
            : 'All client projects, with staffing and status.'
        }
        action={canCreate ? <AddButton onClick={() => { setDraft({ status: 'planning', priority: 'normal', progress: 0, budget: 0 }); setCreating(true); }} label="New project" /> : undefined}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name or code…" />
        <div className="flex flex-wrap items-center gap-3">
          {can(role, 'projects.viewAll') && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={mineOnly}
                onChange={e => setMineOnly(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Assigned to me
            </label>
          )}
          <SelectFilter
            value={status}
            onChange={setStatus}
            options={STATUSES}
            label="Filter by status"
            allLabel="All statuses"
          />
        </div>
      </div>

      {loading ? (
        <Card><Spinner /></Card>
      ) : error ? (
        <Card><ErrorState message={error} onRetry={load} /></Card>
      ) : !projects || projects.length === 0 ? (
        <Card>
          <EmptyState
            title="No projects yet"
            description={
              canCreate
                ? 'Create a project and assign staff to it.'
                : 'You have not been assigned to any projects yet.'
            }
            action={
              canCreate ? (
                <AddButton onClick={() => { setDraft({ status: 'planning', priority: 'normal', progress: 0, budget: 0 }); setCreating(true); }} label="New project" />
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {projects.map(p => (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">{p.code}</span>
                    {p.priority === 'urgent' && (
                      <Badge tone="red">
                        <Flame className="mr-1 h-3 w-3" aria-hidden="true" />Urgent
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 truncate font-heading text-base font-bold text-ink">
                    {p.name}
                  </p>
                  {p.client_name && (
                    <p className="truncate text-xs text-slate-500">
                      {p.client_company || p.client_name}
                    </p>
                  )}
                </div>
                <StatusBadge status={p.status} />
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{statusLabel[p.status]}</span>
                  <span>{p.progress}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand-gradient transition-all"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  {p.member_count ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                  {p.update_count ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                  {p.file_count ?? 0}
                </span>
                {(p.open_requests ?? 0) > 0 && (
                  <span className="flex items-center gap-1 font-semibold text-amber-600">
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                    {p.open_requests} open
                  </span>
                )}
                {Number(p.budget) > 0 && (
                  <span className="ml-auto font-semibold text-ink">
                    {formatMoney(p.budget)}
                  </span>
                )}
              </div>

              {p.members && p.members.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.members.map(m => (
                    <span
                      key={m.id}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                    >
                      {m.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setOpenId(p.id)}
                  className="btn btn-secondary btn-sm"
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  Open
                </button>
                {can(role, 'projects.delete') && (
                  <button
                    type="button"
                    onClick={() => setDeleting(p)}
                    className="ml-auto text-xs font-semibold text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {openProject && (
        <ProjectDrawer
          project={openProject}
          canStatus={canStatus}
          canAssign={canAssign}
          canUpload={canUpload}
          showInternal={showInternal}
          onClose={() => setOpenId(null)}
          onChanged={load}
        />
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="New project"
        footer={
          <>
            <button type="button" onClick={() => setCreating(false)} className="btn btn-secondary btn-sm">Cancel</button>
            <button type="button" onClick={saveNew} disabled={saving} className="btn btn-primary btn-sm">
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Create project
            </button>
          </>
        }
      >
        {draft && (
          <ProjectForm
            draft={draft}
            onChange={d => setDraft(d)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete project"
        message={`Delete "${deleting?.name}"? Its updates and files will be removed too.`}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* create/edit form                                                    */
/* ------------------------------------------------------------------ */

function ProjectForm({
  draft,
  onChange,
}: {
  draft: Partial<Project>;
  onChange: (d: Partial<Project>) => void;
}) {
  const [clients, setClients] = useState<DirectoryUser[]>([]);
  const patch = (p: Partial<Project>) => onChange({ ...draft, ...p });

  useEffect(() => {
    api.clientDirectory().then(r => setClients(r.items)).catch(() => setClients([]));
  }, []);

  return (
    <div className="space-y-4">
      <Field label="Project name" htmlFor="pj-name">
        <TextInput
          id="pj-name"
          value={draft.name ?? ''}
          onChange={e => patch({ name: e.target.value })}
          placeholder="Website Redesign — Acme"
        />
      </Field>

      <Field label="Client" htmlFor="pj-client" hint="Optional — links the project to a client portal login">
        <Select
          id="pj-client"
          value={draft.client_id ?? ''}
          onChange={e => patch({ client_id: e.target.value || null })}
        >
          <option value="">No client linked</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>
              {c.company || c.name} — {c.email}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Status" htmlFor="pj-status">
          <Select id="pj-status" value={draft.status ?? 'planning'} onChange={e => patch({ status: e.target.value as ProjectStatus })}>
            {STATUSES.map(s => <option key={s} value={s}>{statusLabel[s]}</option>)}
          </Select>
        </Field>
        <Field label="Priority" htmlFor="pj-pri">
          <Select id="pj-pri" value={draft.priority ?? 'normal'} onChange={e => patch({ priority: e.target.value as ProjectPriority })}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
        </Field>
        <Field label="Progress %" htmlFor="pj-prog">
          <TextInput
            id="pj-prog"
            type="number"
            min={0}
            max={100}
            value={draft.progress ?? 0}
            onChange={e => patch({ progress: Number(e.target.value) || 0 })}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Start date" htmlFor="pj-start">
          <TextInput id="pj-start" type="date" value={draft.start_date?.slice(0,10) ?? ''} onChange={e => patch({ start_date: e.target.value || null })} />
        </Field>
        <Field label="End date" htmlFor="pj-end">
          <TextInput id="pj-end" type="date" value={draft.end_date?.slice(0,10) ?? ''} onChange={e => patch({ end_date: e.target.value || null })} />
        </Field>
        <Field label="Budget (₹)" htmlFor="pj-budget">
          <TextInput id="pj-budget" type="number" min={0} value={draft.budget ?? 0} onChange={e => patch({ budget: Number(e.target.value) || 0 })} />
        </Field>
      </div>

      <Field label="Description" htmlFor="pj-desc">
        <TextArea id="pj-desc" rows={4} value={draft.description ?? ''} onChange={e => patch({ description: e.target.value })} />
      </Field>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* project drawer: staff, status, updates, files                       */
/* ------------------------------------------------------------------ */

function ProjectDrawer({
  project,
  canStatus,
  canAssign,
  canUpload,
  showInternal,
  onClose,
  onChanged,
}: {
  project: Project;
  canStatus: boolean;
  canAssign: boolean;
  canUpload: boolean;
  showInternal: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [tab, setTab] = useState<'overview' | 'team' | 'updates' | 'files'>('overview');
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [staff, setStaff] = useState<DirectoryUser[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [internal, setInternal] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [m, u, f] = await Promise.all([
        api.projectMembers(project.id),
        api.projectUpdates(project.id),
        api.projectFiles(project.id),
      ]);
      setMembers(m.items);
      setUpdates(u.items);
      setFiles(f.items);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load project.');
    }
  }, [project.id, toast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!canAssign) return;
    api.staff().then(r => setStaff(r.items)).catch(() => setStaff([]));
  }, [canAssign]);

  const setStatus = async (next: ProjectStatus) => {
    setBusy(true);
    try {
      await api.updateProjectStatus(project.id, { status: next });
      toast.success('Status updated.');
      onChanged();
      loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update status.');
    } finally {
      setBusy(false);
    }
  };

  const assign = async (userId: string) => {
    try {
      await api.assignProjectMember(project.id, userId);
      toast.success('Assigned.');
      loadAll();
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not assign.');
    }
  };

  const unassign = async (userId: string) => {
    try {
      await api.unassignProjectMember(project.id, userId);
      loadAll();
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not remove.');
    }
  };

  const postUpdate = async () => {
    if (!message.trim()) return;
    try {
      await api.postProjectUpdate(project.id, {
        kind: 'message',
        body: message,
        urgency,
        visibility: internal ? 'internal' : 'shared',
      });
      setMessage('');
      setInternal(false);
      setUrgency('normal');
      loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not post.');
    }
  };

  const resolve = async (id: string) => {
    try {
      await api.resolveProjectUpdate(id);
      loadAll();
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not resolve.');
    }
  };

  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'team' as const, label: `Team (${members.length})` },
    { key: 'updates' as const, label: `Updates (${updates.length})` },
    { key: 'files' as const, label: `Files (${files.length})` },
  ];

  return (
    <Modal open onClose={onClose} title={`${project.code} — ${project.name}`} wide
      footer={<button type="button" onClick={onClose} className="btn btn-secondary btn-sm">Close</button>}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          {STATUSES.map(s => (
            <button
              key={s}
              type="button"
              disabled={!canStatus || busy || project.status === s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
                project.status === s
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {statusLabel[s]}
            </button>
          ))}
        </div>

        <div className="flex gap-1 border-b border-slate-200">
          {tabs.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
                tab === t.key
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-4">
            {project.description && (
              <p className="whitespace-pre-wrap text-sm text-slate-600">{project.description}</p>
            )}
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <Info k="Client" v={project.client_company || project.client_name || '—'} />
              <Info k="Budget" v={Number(project.budget) > 0 ? formatMoney(project.budget) : '—'} />
              <Info k="Progress" v={`${project.progress}%`} />
              <Info k="Start" v={formatDate(project.start_date)} />
              <Info k="End" v={formatDate(project.end_date)} />
              <Info k="Updated" v={formatDate(project.updated_at)} />
            </dl>
          </div>
        )}

        {tab === 'team' && (
          <div className="space-y-4">
            <div className="space-y-2">
              {members.length === 0 && (
                <p className="text-sm text-slate-500">No one assigned yet.</p>
              )}
              {members.map(m => (
                <div key={m.user_id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{m.name}</p>
                    <p className="truncate text-xs text-slate-500">{m.email} · {m.role}</p>
                  </div>
                  {canAssign && (
                    <button
                      type="button"
                      onClick={() => unassign(m.user_id)}
                      aria-label={`Remove ${m.name}`}
                      className="rounded-xl p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {canAssign && (
              <Field label="Assign a staff member">
                <Select value="" onChange={e => e.target.value && assign(e.target.value)}>
                  <option value="">Select someone…</option>
                  {staff
                    .filter(s => !members.some(m => m.user_id === s.id))
                    .map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {s.role}
                      </option>
                    ))}
                </Select>
              </Field>
            )}
          </div>
        )}

        {tab === 'updates' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 p-3">
              <TextArea
                rows={3}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Reply to the client, or leave an internal note…"
              />
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Select value={urgency} onChange={e => setUrgency(e.target.value as any)} className="w-auto">
                  <option value="normal">Normal</option>
                  <option value="high">High priority</option>
                  <option value="urgent">Urgent</option>
                </Select>
                {showInternal && (
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={internal}
                      onChange={e => setInternal(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600"
                    />
                    Internal only
                  </label>
                )}
                <button
                  type="button"
                  onClick={postUpdate}
                  disabled={!message.trim()}
                  className="btn btn-primary btn-sm ml-auto"
                >
                  Post
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {updates.length === 0 && (
                <p className="text-sm text-slate-500">No updates yet.</p>
              )}
              {updates.map(u => (
                <div
                  key={u.id}
                  className={`rounded-xl border p-3 ${
                    u.visibility === 'internal' ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-ink">{u.author_name ?? 'System'}</span>
                    <span className="text-xs text-slate-400">{formatDate(u.created_at)}</span>
                    {u.visibility === 'internal' && <Badge tone="amber">Internal</Badge>}
                    {u.urgency !== 'normal' && (
                      <Badge tone={u.urgency === 'urgent' ? 'red' : 'amber'}>{u.urgency}</Badge>
                    )}
                    {u.resolved_at && (
                      <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />Resolved
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">{u.body}</p>
                  {!u.resolved_at && u.kind === 'request' && (
                    <button
                      type="button"
                      onClick={() => resolve(u.id)}
                      className="mt-2 text-xs font-semibold text-brand-700 hover:underline"
                    >
                      Mark handled
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'files' && (
          <div className="space-y-3">
            {canUpload && (
              <p className="rounded-xl border border-dashed border-slate-300 p-3 text-xs text-slate-500">
                Upload finalised files through the file upload endpoint — new uploads appear
                here automatically.
              </p>
            )}
            {files.length === 0 && <p className="text-sm text-slate-500">No files yet.</p>}
            {files.map(f => (
              <div key={f.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{f.filename}</p>
                  <p className="truncate text-xs text-slate-500">
                    {f.uploader_name ?? 'Unknown'} · {formatDate(f.created_at)}
                    {f.client_finalized ? ' · client-finalised' : ''}
                  </p>
                </div>
                {f.public_url && (
                  <a
                    href={f.public_url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-xs font-semibold text-brand-700 hover:underline"
                  >
                    Open
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{k}</dt>
      <dd className="font-semibold text-ink">{v}</dd>
    </div>
  );
}