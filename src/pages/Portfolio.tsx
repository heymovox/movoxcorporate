import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase } from 'lucide-react';
import { useSEO } from '../lib/seo';
import { portfolioCategories, type PortfolioCategory } from '../data/portfolio';
import { useWorks } from '../lib/useContent';
import { PageHero } from '../components/PageHero';
import { Reveal } from '../components/Reveal';
import { cn } from '../lib/utils';

type Filter = 'All' | PortfolioCategory;

export default function Portfolio() {
  useSEO({
    title: 'Our Work — Portfolio & Case Studies',
    description:
      'Selected client projects across branding, web, app, and marketing — with challenge, approach, and outcomes for each engagement.',
    path: '/portfolio',
  });

  const [filter, setFilter] = useState<Filter>('All');
  const { items: caseStudies } = useWorks();

  const visible = useMemo(
    () => (filter === 'All' ? caseStudies : caseStudies.filter((c) => c.category === filter)),
    [filter, caseStudies],
  );

  return (
    <>
      <PageHero
        eyebrow="Our work"
        title={
          <>
            Work that{' '}
            <span className="bg-brand-gradient bg-clip-text text-transparent">earns its keep.</span>
          </>
        }
        description="Every project below is a real client engagement. Case studies detail the challenge, our approach, and the outcomes — disclosed honestly, with client consent."
      />

      <section className="container-site pb-20 sm:pb-24" aria-label="Portfolio projects">
        <Reveal>
          <div className="flex flex-wrap gap-2.5" role="group" aria-label="Filter projects by category">
            {portfolioCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                aria-pressed={filter === cat}
                className={cn(
                  'rounded-full border px-5 py-2.5 font-heading text-sm font-semibold transition-all duration-300',
                  filter === cat
                    ? 'border-brand-600 bg-brand-gradient text-white shadow-[0_6px_18px_rgba(35,130,184,0.35)]'
                    : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400 hover:text-brand-700',
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3" aria-live="polite">
          {visible.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
              <Briefcase className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
              <p className="mt-4 font-heading text-lg font-bold text-ink">
                {caseStudies.length === 0
                  ? 'No case studies published yet'
                  : 'No projects in this category'}
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                {caseStudies.length === 0
                  ? 'Work is published through the admin dashboard and will appear here. In the meantime, tell us about your project.'
                  : 'Try a different category, or view all work.'}
              </p>
              <Link to="/start-a-project" className="btn btn-primary btn-sm mt-6">
                <span className="btn-content flex items-center gap-2">
                  Start a Project
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            </div>
          )}

          {visible.map((project, i) => (
            <Reveal key={project.slug} delay={(i % 3) * 0.08}>
              <Link
                to={`/portfolio/${project.slug}`}
                className="group block overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={project.image}
                    alt={`${project.title} — project visual`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 font-heading text-[11px] font-bold uppercase tracking-wider text-ink backdrop-blur-sm">
                    {project.category}
                  </span>
                </div>
                <div className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                    {project.clientDescriptor}
                  </p>
                  <h2 className="mt-2 font-heading text-lg font-bold leading-snug text-ink transition-colors group-hover:text-brand-700">
                    {project.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
                    {project.summary}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 font-heading text-sm font-semibold text-brand-700">
                    Read case study
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

    </>
  );
}
