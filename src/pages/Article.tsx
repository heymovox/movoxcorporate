import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useSEO } from '../lib/seo';
import { useBlog, useBlogs } from '../lib/useContent';
import { getService } from '../data/services';
import { formatDate } from '../lib/utils';
import { Reveal } from '../components/Reveal';

export default function Article() {
  const { slug } = useParams<{ slug: string }>();
  const { item: post } = useBlog(slug);
  const { items: insights } = useBlogs();

  useSEO({
    title: post ? post.title : 'Insight',
    description: post?.excerpt ?? 'MovoX insights.',
    path: `/insights/${slug ?? ''}`,
    type: 'article',
  });

  if (!post) return <Navigate to="/insights" replace />;

  const related = insights.filter((i) => i.slug !== post.slug).slice(0, 2);
  const linkedServices = post.relatedServices
    .map((s) => getService(s))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <>
      <section className="bg-white pb-14 pt-[124px] sm:pb-16 sm:pt-[132px]">
        <div className="container-site max-w-3xl">
          <Reveal>
            <Link
              to="/insights"
              className="inline-flex items-center gap-2 font-heading text-sm font-semibold text-slate-500 transition-colors hover:text-brand-700"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              All insights
            </Link>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-xs">
              <span className="chip">{post.category}</span>
              <time dateTime={post.date} className="text-slate-400">
                {formatDate(post.date)}
              </time>
              <span className="text-slate-400">· {post.readingMinutes} min read</span>
            </div>
            <h1 className="mt-5 font-heading text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
              {post.title}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">{post.excerpt}</p>
            <p className="mt-6 text-sm font-semibold text-slate-500">
              {post.author} — {post.authorRole}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="container-site max-w-3xl pb-16 sm:pb-20">
        <Reveal>
          <div className="overflow-hidden rounded-3xl border border-slate-200/70 shadow-card">
            <img
              src={post.image}
              alt=""
              role="presentation"
              className="aspect-[21/9] w-full object-cover"
            />
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <article className="mt-10 space-y-10">
            {post.body.map((section, i) => (
              <div key={i}>
                {section.heading && (
                  <h2 className="font-heading text-2xl font-bold text-ink">{section.heading}</h2>
                )}
                <div className="mt-4 space-y-4">
                  {section.paragraphs.map((p, j) => (
                    <p key={j} className="text-base leading-relaxed text-slate-700">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </article>
        </Reveal>

        {linkedServices.length > 0 && (
          <Reveal delay={0.1}>
            <div className="mt-14 rounded-2xl border border-slate-200/70 bg-brand-50/60 p-7">
              <h2 className="font-heading text-lg font-bold text-ink">
                Related MovoX services
              </h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {linkedServices.map((s) => (
                  <Link
                    key={s.slug}
                    to={`/services/${s.slug}`}
                    className="rounded-full border border-brand-200 bg-white px-4 py-2 font-heading text-sm font-semibold text-brand-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-card"
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>
        )}
      </section>

      <section className="bg-brand-50/50 py-16 sm:py-20" aria-labelledby="more-insights">
        <div className="container-site">
          <Reveal>
            <h2 id="more-insights" className="font-heading text-2xl font-bold text-ink">
              Keep reading
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {related.map((p, i) => (
              <Reveal key={p.slug} delay={i * 0.08}>
                <Link
                  to={`/insights/${p.slug}`}
                  className="group flex items-center gap-5 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
                >
                  <img
                    src={p.image}
                    alt=""
                    role="presentation"
                    loading="lazy"
                    className="h-24 w-32 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                      {p.category}
                    </p>
                    <h3 className="mt-1 line-clamp-2 font-heading text-base font-bold text-ink group-hover:text-brand-700">
                      {p.title}
                    </h3>
                    <span className="mt-2 inline-flex items-center gap-1.5 font-heading text-sm font-semibold text-brand-700">
                      Read article
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
