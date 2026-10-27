import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useBlogs } from '../../lib/useContent';
import { formatDate } from '../../lib/utils';
import { SectionHeading } from '../SectionHeading';
import { Reveal } from '../Reveal';

export function InsightsSection() {
  const { items, loading } = useBlogs();
  const latest = items.slice(0, 3);

  // Nothing published yet — omit the block rather than show a bare heading.
  if (loading || latest.length === 0) return null;

  return (
    <section className="bg-brand-50/50 py-20 sm:py-28" aria-labelledby="insights-heading">
      <div className="container-site">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            align="left"
            eyebrow="Insights"
            title={<span id="insights-heading">Latest thinking.</span>}
            description="Practical playbooks from the studio — design systems, engineering discipline, and growth marketing."
          />
          <Reveal delay={0.1} className="shrink-0">
            <Link to="/insights" className="btn btn-secondary btn-sm">
              <span className="btn-content flex items-center gap-2">
                All articles
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {latest.map((post, i) => (
            <Reveal key={post.slug} delay={i * 0.1}>
              <Link
                to={`/insights/${post.slug}`}
                className="group block overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover"
              >
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src={post.image}
                    alt=""
                    role="presentation"
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="chip">{post.category}</span>
                    <span className="text-slate-400">
                      {formatDate(post.date)} · {post.readingMinutes} min read
                    </span>
                  </div>
                  <h3 className="mt-3 font-heading text-lg font-bold leading-snug text-ink transition-colors group-hover:text-brand-700">
                    {post.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
                    {post.excerpt}
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
