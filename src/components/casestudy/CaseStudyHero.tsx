/**
 * Case study hero — dark, immersive masthead.
 *
 * Deliberately image-free: the cover artwork lives in the media block below and
 * overlaps this section, so the headline stays readable on every project.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, CalendarDays, Layers, Sparkles, User2 } from 'lucide-react';
import type { CaseStudy } from '../../data/portfolio';
import { categoryMeta, splitTitle } from './helpers';

const MAX_HERO_TAGS = 3;

export function CaseStudyHero({ project }: { project: CaseStudy }) {
  const [showAllTags, setShowAllTags] = useState(false);
  const meta = categoryMeta[project.category] ?? categoryMeta.Branding;
  const Icon = meta.icon;
  const { headline, sub } = splitTitle(project.title);

  const hiddenTags = Math.max(project.services.length - MAX_HERO_TAGS, 0);
  const visibleTags = showAllTags
    ? project.services
    : project.services.slice(0, MAX_HERO_TAGS);

  const facts = [
    {
      icon: User2,
      label: 'Client',
      value: project.client || project.clientDescriptor || 'Confidential',
      note: project.client && project.clientDescriptor ? project.clientDescriptor : undefined,
    },
    {
      icon: Icon,
      label: 'Discipline',
      value: project.category,
      note: `${project.services.length} service${project.services.length === 1 ? '' : 's'}`,
    },
    {
      icon: CalendarDays,
      label: 'Year',
      value: project.year || '—',
      note: 'Engagement',
    },
    {
      icon: Layers,
      label: 'Deliverables',
      value: String(project.deliverables.length),
      note: 'Shipped items',
    },
  ];

  return (
    <header className="relative isolate overflow-hidden bg-brand-950 pb-40 pt-[156px] sm:pb-48 sm:pt-[164px]">
      {/* layered backdrop */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(35,130,184,0.35),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.16),transparent_55%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-brand-500/25 blur-[120px] animate-blob"
        aria-hidden="true"
        style={{ animationDuration: '12s' }}
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-500/10 blur-[110px] animate-blob"
        aria-hidden="true"
        style={{ animationDuration: '15s', animationDelay: '2s' }}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(180deg,#000_0%,transparent_85%)]"
        aria-hidden="true"
      />

      <div className="container-site relative z-10">
        {/* breadcrumb */}
        <motion.nav
          aria-label="Breadcrumb"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center gap-2 font-heading text-xs font-semibold text-brand-200/70"
        >
          <Link
            to="/"
            className="transition-colors hover:text-white"
          >
            Home
          </Link>
          <span aria-hidden="true" className="text-white/25">/</span>
          <Link to="/portfolio" className="transition-colors hover:text-white">
            Our work
          </Link>
          <span aria-hidden="true" className="text-white/25">/</span>
          <span aria-current="page" className="text-white/90">
            {project.client || project.title}
          </span>
        </motion.nav>

        {/* category + year */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="mt-7 flex flex-wrap items-center gap-3"
        >
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-heading text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm ${meta.dark}`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {project.category}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 font-heading text-[11px] font-bold uppercase tracking-wider text-white/70 backdrop-blur-sm">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {project.year || 'Year n/a'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3.5 py-1.5 font-heading text-[11px] font-bold uppercase tracking-wider text-emerald-300 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Client case study
          </span>
        </motion.div>

        {/* headline */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
        >
          <h1 className="mt-6 max-w-4xl font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            {headline}
            {sub && (
              <>
                <span className="mx-2 font-light text-white/30" aria-hidden="true">
                  —
                </span>
                <span className="bg-gradient-to-r from-emerald-300 via-brand-300 to-brand-200 bg-clip-text text-transparent">
                  {sub}
                </span>
              </>
            )}
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-brand-100/80 sm:text-lg">
            {project.summary}
          </p>
        </motion.div>

        {/* service tags */}
        {project.services.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-7 flex flex-wrap items-center gap-2"
            aria-label="Services provided"
          >
            {visibleTags.map((s) => (
              <span
                key={s}
                className="rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-1.5 font-heading text-xs font-semibold text-brand-100/85 backdrop-blur-sm transition-colors hover:border-white/25 hover:text-white"
              >
                {s}
              </span>
            ))}
            {!showAllTags && hiddenTags > 0 && (
              <button
                type="button"
                onClick={() => setShowAllTags(true)}
                className="rounded-full border border-dashed border-white/25 bg-white/5 px-3.5 py-1.5 font-heading text-xs font-bold text-white/70 transition-colors hover:border-white/45 hover:text-white"
              >
                +{hiddenTags} more
              </button>
            )}
          </motion.div>
        )}

        {/* fact strip */}
        <motion.dl
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28 }}
          className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {facts.map((f) => (
            <div
              key={f.label}
              className="group rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-sm transition-colors duration-300 hover:border-white/25 hover:bg-white/[0.08]"
            >
              <dt className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-brand-200/70">
                <f.icon
                  className="h-3.5 w-3.5 transition-colors group-hover:text-emerald-300"
                  aria-hidden="true"
                />
                {f.label}
              </dt>
              <dd className="mt-2">
                <span
                  className="block truncate font-heading text-sm font-bold text-white"
                  title={f.value}
                >
                  {f.value}
                </span>
                {f.note && (
                  <span className="mt-0.5 block truncate text-xs text-brand-100/75">
                    {f.note}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </motion.dl>

        {/* actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.36 }}
          className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <Link
            to="/start-a-project"
            className="group btn btn-lg justify-center bg-white text-brand-900 hover:bg-brand-50"
          >
            <span className="btn-content flex items-center justify-center gap-2">
              Start a project
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
          </Link>
          <Link
            to="/portfolio"
            className="btn btn-lg justify-center border border-white/25 bg-white/10 text-white backdrop-blur-sm hover:bg-white/15"
          >
            <span className="btn-content flex items-center justify-center gap-2">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to all work
            </span>
          </Link>
        </motion.div>
      </div>
    </header>
  );
}
