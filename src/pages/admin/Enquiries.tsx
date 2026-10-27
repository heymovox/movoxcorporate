import { useState } from 'react';
import { Eye, Inbox } from 'lucide-react';
import {
  PageHeader,
  Card,
  Spinner,
  ErrorState,
  StatusBadge,
  SearchInput,
  SelectFilter,
  Modal,
  Field,
  formatDate,
  useResource,
} from '../../components/admin/ui';
import { services } from '../../data/services';

interface Enquiry {
  id: string;
  name: string;
  business: string;
  email: string;
  phone: string;
  service: string;
  budget: string;
  timeline: string;
  brief: string;
  created_at: string;
}

const serviceColors: Record<string, string> = {
  'graphic-design': 'bg-pink-100 text-pink-700',
  'branding-packaging': 'bg-purple-100 text-purple-700',
  'website-development': 'bg-blue-100 text-blue-700',
  'app-development': 'bg-indigo-100 text-indigo-700',
  'digital-marketing': 'bg-green-100 text-green-700',
  multiple: 'bg-slate-100 text-slate-700',
};

const getServiceLabel = (slug: string) =>
  services.find(s => s.slug === slug)?.name ?? slug;

export default function AdminEnquiries() {
  const [search, setSearch] = useState('');
  const [service, setService] = useState('');
  const [viewing, setViewing] = useState<Enquiry | null>(null);

  const { items, loading, error, reload } = useResource<Enquiry>('enquiries', { search, service });

  return (
    <>
      <PageHeader
        title="Enquiries"
        description="Project requests submitted through the Start a Project form."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, business, email…" />
        <SelectFilter
          value={service}
          onChange={setService}
          options={services.map(s => s.slug)}
          label="Filter by service"
          allLabel="All services"
        />
      </div>

      <Card>
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Inbox className="h-12 w-12 text-slate-300" aria-hidden="true" />
            <p className="mt-4 font-heading text-base font-semibold text-ink">No enquiries found</p>
            <p className="mt-1 text-sm text-slate-500">
              New project requests will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Client', 'Service', 'Budget', 'Timeline', 'Date', ''].map(h => (
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
                {items.map(e => (
                  <tr key={e.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-4 py-4">
                      <p className="font-heading text-sm font-semibold text-ink">{e.name}</p>
                      <p className="text-xs text-slate-500">{e.business}</p>
                      <p className="text-xs text-slate-400">{e.email}</p>
                    </td>
                    <td className="hidden px-4 py-4 md:table-cell">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          serviceColors[e.service] ?? 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {getServiceLabel(e.service)}
                      </span>
                    </td>
                    <td className="hidden px-4 py-4 text-sm text-slate-600 lg:table-cell">
                      {e.budget}
                    </td>
                    <td className="hidden px-4 py-4 text-sm text-slate-600 lg:table-cell">
                      {e.timeline}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {formatDate(e.created_at)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setViewing(e)}
                        aria-label={`View enquiry from ${e.name}`}
                        className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-700"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title={viewing ? `Enquiry from ${viewing.name}` : ''}
        wide
        footer={
          <button type="button" onClick={() => setViewing(null)} className="btn btn-secondary btn-sm">
            Close
          </button>
        }
      >
        {viewing && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Client">
                <p className="text-sm font-semibold text-ink">{viewing.name}</p>
                <p className="text-sm text-slate-600">{viewing.business}</p>
              </Field>
              <Field label="Service">
                <StatusBadge status="active" />
                <p className="mt-1 text-sm text-slate-600">
                  {getServiceLabel(viewing.service)}
                </p>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email">
                <a
                  href={`mailto:${viewing.email}`}
                  className="text-sm text-brand-600 hover:underline"
                >
                  {viewing.email}
                </a>
              </Field>
              <Field label="Phone">
                <p className="text-sm text-slate-600">{viewing.phone || '—'}</p>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Budget">
                <p className="text-sm text-slate-600">{viewing.budget}</p>
              </Field>
              <Field label="Timeline">
                <p className="text-sm text-slate-600">{viewing.timeline}</p>
              </Field>
            </div>

            <Field label="Brief">
              <p className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                {viewing.brief}
              </p>
            </Field>

            <p className="text-xs text-slate-400">
              Received {formatDate(viewing.created_at)}
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}