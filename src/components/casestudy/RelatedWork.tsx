/**
 * "More work" — related case studies as full image cards, with a friendly
 * fallback when this is the only published project.
 */
import { ArrowRight, Briefcase, Images } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Reveal } from '../Reveal';
import type { CaseStudy } from '../../data/portfolio';
import { categoryMeta } from './helpers';

export function RelatedWork({
  project,
  caseStudies,
}: {
  project: CaseStudy;
  caseStudies: CaseStudy[];
}) {
  const related = caseStudies.filter((c) => c.slug !== project.slug).slice(0, 3);

  return (
    <section
      id="more-work"
      aria-labelledby="more-work-heading"
      className="scroll-mt-32 border-t border-slate-200/60 bg-slate-50/70 py-16 sm:py-20"
    >
      <div className="container-site">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-brand-700">
                Keep exploring
              </p>
              <h2
                id="more-work-heading"
                className="mt-2 font-heading text-3xl font-extrabold tracking-tight text-ink"
              >
                More work
              </h2>
            </div>
            <Link
              to="/portfolio"
              className="group inline-flex items-center gap-2 font-heading text-sm font-bold text-brand-700 hover:text-brand-800"
            >
              View the full portfolio
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>
        </Reveal>

        {related.length > 0 ? (
          <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p, i) => {
              const meta = categoryMeta[p.category] ?? categoryMeta.Branding;
              const Icon = meta.icon;
              return (
                <Reveal key={p.slug} delay={i * 0.08}>
                  <Link
                    to={`/portfolio/${p.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                      <img
                        src={p.image}
                        alt={`${p.title} — project visual`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <span
                        className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-heading text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${meta.dark}`}
                      >
                        <Icon className="h-3 w-3" aria-hidden="true" />
                        {p.category}
                      </span>
                      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-950/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      <span className="absolute bottom-4 left-4 inline-flex translate-y-2 items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 font-heading text-[11px] font-bold text-brand-900 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        Open case study
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600">
                        {p.clientDescriptor || p.client || p.category}
                        {p.year ? ` · ${p.year}` : ''}
                      </p>
                      <h3 className="mt-2 font-heading text-lg font-bold leading-snug text-ink transition-colors group-hover:text-brand-700">
                        {p.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">
                        {p.summary}
                      </p>
                      <span className="mt-5 inline-flex items-center gap-1.5 font-heading text-sm font-bold text-brand-700">
                        Read case study
                        <ArrowRight
                          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        ) : (
          <Reveal delay={0.08}>
            <div className="mt-9 grid gap-6 rounded-3xl border border-dashed border-brand-200 bg-white p-8 shadow-card sm:grid-cols-[auto_1fr] sm:items-center sm:p-10">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-[0_10px_28px_rgba(35,130,184,0.35)]">
                <Images className="h-7 w-7" aria-hidden="true" />
              </span>
              <div>
                <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-brand-700">
                  You have reached the end
                </p>
                <h3 className="mt-2 font-heading text-xl font-extrabold text-ink sm:text-2xl">
                  More case studies are on the way
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
                  This is currently our only published project. New work is added through
                  the MovoX admin as clients sign off on disclosures — or tell us about
                  your own brief and we will show you relevant work on the call.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link to="/portfolio" className="btn btn-outline btn-sm">
                    <span className="btn-content flex items-center gap-2">
                      <Briefcase className="h-4 w-4" aria-hidden="true" />
                      Back to all work
                    </span>
                  </Link>
                  <Link to="/start-a-project" className="btn btn-primary btn-sm">
                    <span className="btn-content flex items-center gap-2">
                      Start a project
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
