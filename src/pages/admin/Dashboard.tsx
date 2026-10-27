import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Newspaper,
  Users,
  UserCog,
  FolderKanban,
  Receipt,
  FileSignature,
  ScrollText,
  FileText,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import { api, type Overview, type Project } from '../../lib/adminApi';
import { can } from '../../lib/rbac';
import { useAuth } from '../../hooks/useAuth';
import { Card, PageHeader, StatusBadge, ErrorState, formatMoney } from '../../components/admin/ui';

interface Enquiry {
  id: string;
  name: string;
  business: string;
  email: string;
  service: string;
  budget: string;
  created_at: string;
}

const TILES = [
  { key: 'works', to: '/admin/works', label: 'Our Works', icon: Briefcase, accent: 'bg-pink-100 text-pink-600' },
  { key: 'projects', to: '/admin/projects', label: 'Projects', icon: FolderKanban, accent: 'bg-cyan-100 text-cyan-600' },
  { key: 'blogs', to: '/admin/blogs', label: 'Blogs', icon: Newspaper, accent: 'bg-blue-100 text-blue-600' },
  { key: 'team', to: '/admin/team', label: 'Team', icon: Users, accent: 'bg-purple-100 text-purple-600' },
  { key: 'users', to: '/admin/users', label: 'Users', icon: UserCog, accent: 'bg-slate-100 text-slate-600' },
  { key: 'agreements', to: '/admin/agreements', label: 'Agreements', icon: FileSignature, accent: 'bg-green-100 text-green-600' },
  { key: 'policies', to: '/admin/policies', label: 'Policies', icon: ScrollText, accent: 'bg-amber-100 text-amber-600' },
] as const;

export default function AdminDashboard() {
  const { role } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [stats, setStats] = useState<{ total: number; today: number; thisWeek: number; thisMonth: number } | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .overview()
      .then(ov => setOverview(ov.overview))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));

    const h = { Authorization: `Bearer ${localStorage.getItem('admin_token') ?? ''}` };
    const base = import.meta.env.VITE_API_URL ?? '';
    fetch(`${base}/api/admin/stats`, { headers: h })
      .then(r => r.json())
      .then(d => d.ok && setStats(d.stats))
      .catch(() => undefined);
    fetch(`${base}/api/admin/enquiries?page=1&limit=5`, { headers: h })
      .then(r => r.json())
      .then(d => d.ok && setEnquiries(d.enquiries))
      .catch(() => undefined);

    fetch(`${base}/api/projects`, { headers: h })
      .then(r => r.json())
      .then(d => d.ok && setProjects(d.items.slice(0, 5)))
      .catch(() => undefined);
  };

  useEffect(load, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
        <span className="text-sm">Loading dashboard…</span>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="A snapshot of content, people, and revenue across MovoX."
      />

      {/* enquiry stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Enquiries', value: stats?.total ?? 0, color: 'bg-blue-100 text-blue-600' },
          { label: 'Today', value: stats?.today ?? 0, color: 'bg-green-100 text-green-600' },
          { label: 'This Week', value: stats?.thisWeek ?? 0, color: 'bg-purple-100 text-purple-600' },
          { label: 'This Month', value: stats?.thisMonth ?? 0, color: 'bg-orange-100 text-orange-600' },
        ].map(s => (
          <Card key={s.label} className="h-full p-6">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="mt-3 font-heading text-2xl font-extrabold text-ink sm:text-3xl">
              {s.value}
            </p>
            <p className="mt-1 text-sm text-slate-500">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* section tiles */}
      <h2 className="mb-3 font-heading text-lg font-bold text-ink">Manage</h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map(t => {
          const data = overview?.[t.key];
          const total = Number(data?.total ?? 0);
          const active = Number(data?.published ?? 0);
          return (
            <Link key={t.key} to={t.to} className="group">
              <Card className="h-full p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                <div className="flex items-start justify-between">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.accent}`}>
                    <t.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <ArrowUpRight
                    className="h-4 w-4 text-slate-300 transition-colors group-hover:text-brand-600"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-3 font-heading text-base font-bold text-ink">{t.label}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {total === 0
                    ? 'Nothing yet'
                    : `${total} total · ${active} active`}
                </p>
              </Card>
            </Link>
          );
        })}

        {can(role, 'invoices.view') && (
        <Link to="/admin/invoices" className="group">
          <Card className="h-full p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
            <div className="flex items-start justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <Receipt className="h-5 w-5" aria-hidden="true" />
              </span>
              <ArrowUpRight
                className="h-4 w-4 text-slate-300 transition-colors group-hover:text-brand-600"
                aria-hidden="true"
              />
            </div>
            <p className="mt-3 font-heading text-base font-bold text-ink">Invoices</p>
            <p className="mt-1 text-sm text-slate-500">
              {overview?.invoices
                ? `${overview.invoices.total} total · ${formatMoney(overview.invoices.outstanding)} outstanding`
                : 'Nothing yet'}
            </p>
          </Card>
        </Link>
        )}
      </div>

      {/* recent projects */}
      {(can(role, 'projects.viewAll') || can(role, 'projects.viewAssigned')) && (
        <>
          <h2 className="mb-3 mt-8 font-heading text-lg font-bold text-ink">Recent projects</h2>
          <Card>
            {projects.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-slate-500">No projects yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {projects.map(p => (
                  <Link
                    key={p.id}
                    to="/admin/projects"
                    className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-slate-50"
                  >
                    <span className="font-mono text-xs text-slate-400">{p.code}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                      {p.name}
                    </span>
                    <span className="hidden text-xs text-slate-500 sm:block">
                      {p.client_name ?? '—'}
                    </span>
                    <span className="hidden h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-slate-100 sm:block">
                      <span
                        className="block h-full rounded-full bg-brand-gradient"
                        style={{ width: `${p.progress}%` }}
                      />
                    </span>
                    <StatusBadge status={p.status} />
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* recent enquiries */}
      {can(role, 'enquiries.view') && (
      <>
      <h2 className="mb-3 mt-8 font-heading text-lg font-bold text-ink">Recent enquiries</h2>
      <Card>
        {enquiries.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500">
            No enquiries yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Client', 'Service', 'Budget', 'Date'].map(h => (
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
                {enquiries.map(e => (
                  <tr key={e.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-4 py-4">
                      <p className="font-heading text-sm font-semibold text-ink">{e.name}</p>
                      <p className="text-xs text-slate-500">{e.business}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{e.service}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{e.budget}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {new Date(e.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      </>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {can(role, 'enquiries.view') && (
          <Link to="/admin/enquiries" className="btn btn-secondary btn-sm">
            View all enquiries
          </Link>
        )}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <StatusBadge status="active" />
          System operational
        </div>
      </div>
    </>
  );
}