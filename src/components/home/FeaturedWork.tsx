import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useWorks } from '../../lib/useContent';
import { SectionHeading } from '../SectionHeading';
import { Reveal } from '../Reveal';

export function FeaturedWork() {
  const { items, loading } = useWorks();
  const featured = items.slice(0, 3);

  // Nothing published yet — omit the block rather than show a bare heading.
  if (loading || featured.length === 0) return null;

  return (
    <section className="bg-brand-50/50 py-20 sm:py-28" aria-labelledby="work-heading">
      <div className="container-site">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            align="left"
            eyebrow="Selected work"
            title={<span id="work-heading">Featured projects.</span>}
            description="A snapshot of recent engagements. Full case studies include challenge, approach, and verified outcomes."
          />
          <Reveal delay={0.1} className="shrink-0">
            <Link to="/portfolio" className="btn btn-secondary btn-sm">
              <span className="btn-content flex items-center gap-2">
                View all work
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {featured.map((project, i) => (
            <Reveal key={project.slug} delay={i * 0.1}>
              <Link
                to="/portfolio"
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
                  <h3 className="mt-2 font-heading text-lg font-bold leading-snug text-ink transition-colors group-hover:text-brand-700">
                    {project.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
                    {project.summary}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
