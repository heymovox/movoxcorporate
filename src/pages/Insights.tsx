import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Newspaper } from 'lucide-react';
import { useSEO } from '../lib/seo';
import { insightCategories, type InsightCategory } from '../data/insights';
import { useBlogs } from '../lib/useContent';
import { formatDate } from '../lib/utils';
import { PageHero } from '../components/PageHero';
import { Reveal } from '../components/Reveal';
import { cn } from '../lib/utils';

type Filter = 'All' | InsightCategory;

export default function Insights() {
  useSEO({
    title: 'Insights — Playbooks from the Studio',
    description:
      'Practical thinking on branding, web & app development, digital marketing & SEO, and the process of building digital products.',
    path: '/insights',
  });

  const [filter, setFilter] = useState<Filter>('All');
  const { items: insights } = useBlogs();

  const visible = useMemo(
    () => (filter === 'All' ? insights : insights.filter((i) => i.category === filter)),
    [filter, insights],
  );

  return (
    <>
      <PageHero
        eyebrow="Insights"
        title={
          <>
            Playbooks from{' '}
            <span className="bg-brand-gradient bg-clip-text text-transparent">the studio.</span>
          </>
        }
        description="Practical thinking on branding, engineering, and growth marketing — written by the people who do the work, not about it."
      />

      <section className="container-site pb-20 sm:pb-24" aria-label="Articles">
        <Reveal>
          <div className="flex flex-wrap gap-2.5" role="group" aria-label="Filter articles by category">
            {insightCategories.map((cat) => (
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
              <Newspaper className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
              <p className="mt-4 font-heading text-lg font-bold text-ink">
                {insights.length === 0
                  ? 'No posts published yet'
                  : 'No posts in this category'}
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                {insights.length === 0
                  ? 'Articles are published through the admin dashboard and will appear here.'
                  : 'Try a different category, or view all posts.'}
              </p>
              <Link to="/contact" className="btn btn-secondary btn-sm mt-6">
                <span className="btn-content flex items-center gap-2">
                  Get in touch
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            </div>
          )}

          {visible.map((post, i) => (
            <Reveal key={post.slug} delay={(i % 3) * 0.08}>
              <Link
                to={`/insights/${post.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover"
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
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="chip">{post.category}</span>
                    <span className="text-slate-400">
                      {formatDate(post.date)} · {post.readingMinutes} min read
                    </span>
                  </div>
                  <h2 className="mt-3 font-heading text-lg font-bold leading-snug text-ink transition-colors group-hover:text-brand-700">
                    {post.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">
                    {post.excerpt}
                  </p>
                  <p className="mt-5 text-xs font-semibold text-slate-500">
                    {post.author} — {post.authorRole}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

    </>
  );
}
