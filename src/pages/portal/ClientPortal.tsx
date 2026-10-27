/**
 * Client portal — /portal
 *
 * A separate, deliberately small surface for client accounts. Clients can:
 *   - see their own projects and current status
 *   - read and post updates (messages)
 *   - raise a file request, flag it urgent ("need this completed soon")
 *
 * They cannot see internal notes, other clients' projects, staff-only data,
 * or anything under /admin. The API enforces all of that independently —
 * this UI simply never offers the options.
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  MessageSquare,
  Paperclip,
  LogOut,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Flame,
  Send,
  Lock,
  X,
} from 'lucide-react';
import {
  api,
  type Project,
  type ProjectStatus,
  type ProjectUpdate,
  type ProjectFile,
} from '../../lib/adminApi';
import { useAuth } from '../../hooks/useAuth';
import { Logo } from '../../components/Header';
import { MobileDrawer, DrawerTrigger } from '../../components/MobileDrawer';

const STATUS_LABEL: Record<ProjectStatus, string> = {
  planning: 'Planning',
  in_progress: 'In progress',
  review: 'In review',
  on_hold: 'On hold',
  completed: 'Completed',
};

function statusTone(s: ProjectStatus) {
  switch (s) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-700';
    case 'in_progress':
      return 'bg-blue-100 text-blue-700';
    case 'review':
      return 'bg-amber-100 text-amber-700';
    case 'on_hold':
      return 'bg-slate-200 text-slate-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export default function ClientPortal() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.projects();
      setProjects(res.items);
      setSelected(prev => prev ?? res.items[0]?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your projects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const project = projects?.find(p => p.id === selected) ?? null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="container-site flex h-16 items-center gap-3">
          <DrawerTrigger
            onClick={() => setDrawerOpen(true)}
            controls="portal-drawer"
            label="Open projects menu"
          />

          <Link to="/" aria-label="MovoX home" className="min-w-0">
            <Logo />
          </Link>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:block">{user?.name}</span>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        label="Projects"
      >
        <div id="portal-drawer" className="flex min-h-full flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4">
            <p className="font-heading text-base font-bold text-ink">Your projects</p>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                <span className="text-sm">Loading…</span>
              </div>
            ) : (
              <ProjectList
                projects={projects ?? []}
                selected={selected}
                onSelect={id => {
                  setSelected(id);
                  setDrawerOpen(false);
                }}
              />
            )}
          </div>

          <div className="shrink-0 border-t border-slate-200 p-4">
            <p className="truncate font-heading text-sm font-semibold text-ink">{user?.name}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>
      </MobileDrawer>

      <main className="container-site py-8">
        <h1 className="font-heading text-2xl font-bold text-ink">Your projects</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track progress, send messages, and request files.
        </p>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : error ? (
          <div className="mt-8 flex flex-col items-center rounded-2xl border border-red-200 bg-white p-10 text-center">
            <AlertCircle className="h-10 w-10 text-red-500" aria-hidden="true" />
            <p className="mt-3 text-sm text-red-700">{error}</p>
          </div>
        ) : !projects || projects.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <FolderKanban className="h-10 w-10 text-slate-300" aria-hidden="true" />
            <p className="mt-3 font-heading text-base font-semibold text-ink">
              No projects yet
            </p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Once MovoX sets up a project for you it will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
            {/* list — desktop column; on mobile it lives in the drawer */}
            <div className="hidden lg:block">
              <ProjectList
                projects={projects}
                selected={selected}
                onSelect={setSelected}
              />
            </div>

            {/* detail */}
            {project && (
              <ProjectDetail project={project} onChanged={load} />
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        MovoX — Beyond Digital · www.heymovox.com
      </footer>
    </div>
  );
}

function ProjectList({
  projects,
  selected,
  onSelect,
}: {
  projects: Project[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {projects.map(p => (
        <button
          key={p.id}
          type="button"
          onClick={() => onSelect(p.id)}
          aria-current={selected === p.id ? 'true' : undefined}
          className={`w-full rounded-2xl border bg-white p-4 text-left transition-all ${
            selected === p.id
              ? 'border-brand-400 shadow-card'
              : 'border-slate-200 hover:border-brand-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-slate-400">{p.code}</span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(p.status)}`}
            >
              {STATUS_LABEL[p.status]}
            </span>
          </div>
          <p className="mt-1.5 font-heading text-sm font-bold text-ink">{p.name}</p>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-gradient"
              style={{ width: `${p.progress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">{p.progress}% complete</p>
        </button>
      ))}
    </div>
  );
}

function ProjectDetail({
  project,
  onChanged,
}: {
  project: Project;
  onChanged: () => void;
}) {
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [kind, setKind] = useState<'message' | 'request'>('message');
  const [urgency, setUrgency] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, f] = await Promise.all([
        api.projectUpdates(project.id),
        api.projectFiles(project.id),
      ]);
      setUpdates(u.items);
      setFiles(f.items);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load.');
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!message.trim()) return;
    setSending(true);
    setErr(null);
    try {
      await api.postProjectUpdate(project.id, {
        kind,
        body: message,
        urgency: kind === 'request' ? urgency : 'normal',
      });
      setMessage('');
      setSent(true);
      setTimeout(() => setSent(false), 3000);
      await load();
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not send.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-heading text-lg font-bold text-ink">{project.name}</h2>
        <span className="font-mono text-xs text-slate-400">{project.code}</span>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Current status</span>
            <span className="font-semibold">{STATUS_LABEL[project.status]}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-gradient transition-all"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {project.description && (
          <p className="mt-4 whitespace-pre-wrap text-sm text-slate-600">
            {project.description}
          </p>
        )}

        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-slate-500">Started</dt>
            <dd className="font-semibold text-ink">
              {project.start_date
                ? new Date(project.start_date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Target</dt>
            <dd className="font-semibold text-ink">
              {project.end_date
                ? new Date(project.end_date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Progress</dt>
            <dd className="font-semibold text-ink">{project.progress}%</dd>
          </div>
        </dl>
      </div>

      {/* files */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="flex items-center gap-2 font-heading text-base font-bold text-ink">
          <Paperclip className="h-4 w-4" aria-hidden="true" />
          Files shared with you
        </h3>
        {loading ? (
          <p className="mt-3 text-sm text-slate-500">Loading…</p>
        ) : files.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No files yet. Use the message box below to request one.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {files.map(f => (
              <li
                key={f.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{f.filename}</p>
                  <p className="truncate text-xs text-slate-500">
                    {new Date(f.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                {f.public_url && (
                  <a
                    href={f.public_url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-xs font-semibold text-brand-700 hover:underline"
                  >
                    Download
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* composer */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="flex items-center gap-2 font-heading text-base font-bold text-ink">
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
          {kind === 'request' ? 'Request a file or update' : 'Ask a question'}
        </h3>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setKind('message')}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              kind === 'message'
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Message
          </button>
          <button
            type="button"
            onClick={() => setKind('request')}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              kind === 'request'
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            File / update request
          </button>
        </div>

        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={4}
          placeholder={
            kind === 'request'
              ? 'e.g. Please share the final logo files — needed urgently for print.'
              : 'Type your message to the MovoX team…'
          }
          className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />

        {kind === 'request' && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Priority:</span>
            {(['normal', 'high', 'urgent'] as const).map(u => (
              <button
                key={u}
                type="button"
                onClick={() => setUrgency(u)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  urgency === u
                    ? u === 'urgent'
                      ? 'bg-red-600 text-white'
                      : u === 'high'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {u === 'urgent' && <Flame className="mr-1 inline h-3 w-3" aria-hidden="true" />}
                {u}
              </button>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={!message.trim() || sending}
            className="btn btn-primary btn-sm"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            Send
          </button>
          {sent && (
            <span className="flex items-center gap-1 text-sm text-emerald-600">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Sent
            </span>
          )}
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>
      </div>

      {/* thread */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-heading text-base font-bold text-ink">Updates</h3>
        {loading ? (
          <p className="mt-3 text-sm text-slate-500">Loading…</p>
        ) : updates.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No updates yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {updates.map(u => (
                <li
                  key={u.id}
                  className={`rounded-xl border p-3 ${
                    u.urgency === 'urgent'
                      ? 'border-red-200 bg-red-50/50'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-ink">
                      {u.author_name ?? 'MovoX'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(u.created_at).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {u.kind === 'request' && (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                        Request
                      </span>
                    )}
                    {u.urgency !== 'normal' && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        <Flame className="h-3 w-3" aria-hidden="true" />
                        {u.urgency}
                      </span>
                    )}
                    {u.resolved_at && (
                      <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        Handled
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">
                    {u.body}
                  </p>
                </li>
            ))}
          </ul>
        )}
      </div>

      <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
        <Lock className="h-3 w-3" aria-hidden="true" />
        You can see only your own projects.
      </p>
    </div>
  );
}