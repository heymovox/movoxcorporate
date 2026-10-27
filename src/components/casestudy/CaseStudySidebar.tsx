/**
 * Sticky right rail for the case study: a compact engagement CTA plus the
 * project facts someone wants after reading the narrative.
 */
import { ArrowRight, CalendarDays, Layers, MessageCircle, Tag, User2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CaseStudy } from '../../data/portfolio';
import { categoryMeta } from './helpers';

export function CaseStudySidebar({ project }: { project: CaseStudy }) {
  const meta = categoryMeta[project.category] ?? categoryMeta.Branding;
  const Icon = meta.icon;

  const facts = [
    {
      icon: User2,
      label: 'Client',
      value: project.client || 'Confidential',
      note: project.clientDescriptor,
    },
    { icon: Icon, label: 'Discipline', value: project.category },
    { icon: CalendarDays, label: 'Year', value: project.year || '—' },
    {
      icon: Layers,
      label: 'Scope',
      value: `${project.objectives.length} objectives · ${project.deliverables.length} deliverables`,
    },
  ];

  return (
    <aside
      aria-label="Project details"
      className="h-fit space-y-5 lg:sticky lg:top-[132px]"
    >
      {/* CTA */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 p-6 shadow-[0_18px_44px_rgba(0,54,85,0.28)]">
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-500/30 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-emerald-400/15 blur-2xl"
          aria-hidden="true"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 font-heading text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            Free discovery call
          </span>
          <h2 className="mt-4 font-heading text-xl font-extrabold leading-snug text-white">
            Facing a similar challenge?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-brand-100/75">
            Tell us the goal and constraints — we come back with a fixed-price proposal
            within one business day.
          </p>

          <div className="mt-5 space-y-2.5">
            <Link to="/start-a-project" className="group btn btn-sm w-full justify-center bg-white text-brand-900 hover:bg-brand-50">
              <span className="btn-content flex items-center justify-center gap-2">
                Start a project
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </Link>
            <a
              href="https://wa.me/919500621262"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm w-full justify-center border border-white/25 bg-white/10 text-white hover:bg-white/15"
            >
              <span className="btn-content flex items-center justify-center gap-2">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Chat on WhatsApp
              </span>
            </a>
          </div>

          <p className="mt-4 flex items-center gap-2 text-[11px] text-brand-100/75">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
            Typical reply time under 12 hours
          </p>
        </div>
      </div>

      {/* Facts */}
      <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-card">
        <h2 className="font-heading text-base font-bold text-ink">Project facts</h2>

        <dl className="mt-4 space-y-4">
          {facts.map((f) => (
            <div key={f.label} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
              <dt className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <f.icon className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
                {f.label}
              </dt>
              <dd className="mt-1">
                <span className="block font-heading text-sm font-bold text-ink">{f.value}</span>
                {f.note && (
                  <span className="mt-0.5 block text-xs text-slate-500">{f.note}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>

        {project.services.length > 0 && (
          <div className="mt-4">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <Tag className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
              Services
            </p>
            <ul className="mt-2.5 flex flex-wrap gap-2">
              {project.services.map((s) => (
                <li
                  key={s}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.light}`}
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}
