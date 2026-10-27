/**
 * Portfolio detail (case study).
 *
 * Composes the pieces in `components/casestudy/`:
 *
 *   Hero → Media (overlaps hero) → sticky JumpNav → Results band →
 *   Story + sticky facts rail → Testimonial → Related work
 *
 * Plus page-level extras: reading progress bar, branded loading skeleton and
 * Article/CreativeWork JSON-LD for search engines.
 */
import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Quote } from 'lucide-react';
import { useSEO } from '../lib/seo';
import { useWork, useWorks } from '../lib/useContent';
import { CaseStudyHero } from '../components/casestudy/CaseStudyHero';
import { CaseStudyMedia } from '../components/casestudy/CaseStudyMedia';
import { ResultsBand } from '../components/casestudy/ResultsBand';
import { JumpNav, type JumpItem } from '../components/casestudy/JumpNav';
import { CaseStudyStory } from '../components/casestudy/CaseStudyStory';
import { CaseStudySidebar } from '../components/casestudy/CaseStudySidebar';
import { RelatedWork } from '../components/casestudy/RelatedWork';
import { Reveal } from '../components/Reveal';

function LoadingSkeleton() {
  return (
    <div className="relative min-h-[70vh] overflow-hidden bg-brand-950 pb-24 pt-[156px] sm:pt-[164px]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(35,130,184,0.30),transparent_55%)]"
        aria-hidden="true"
      />
      <div className="container-site relative space-y-6" role="status" aria-live="polite">
        <span className="sr-only">Loading case study…</span>
        <div className="h-3 w-40 animate-pulse rounded-full bg-white/10" />
        <div className="h-3 w-56 animate-pulse rounded-full bg-white/10" />
        <div className="h-10 w-2/3 animate-pulse rounded-xl bg-white/10 sm:h-14" />
        <div className="h-10 w-1/3 animate-pulse rounded-xl bg-white/10 sm:h-14" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded-lg bg-white/10" />
        <div className="h-4 w-3/4 max-w-lg animate-pulse rounded-lg bg-white/10" />
        <div className="grid gap-3 pt-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/[0.06]" />
          ))}
        </div>
        <div className="h-10 w-56 animate-pulse rounded-full bg-white/10" />
      </div>
      <div
        className="absolute inset-x-0 bottom-0 h-20 animate-pulse bg-white/[0.04]"
        aria-hidden="true"
      />
    </div>
  );
}

/** Thin reading-progress line pinned above the fixed header. */
function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setProgress(max > 0 ? Math.min((doc.scrollTop / max) * 100, 100) : 0);
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] bg-transparent"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-brand-500 via-brand-400 to-emerald-400 shadow-[0_0_10px_rgba(35,130,184,0.7)] transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export default function CaseStudy() {
  const { slug } = useParams<{ slug: string }>();
  const { item: project, loading } = useWork(slug);
  const { items: caseStudies } = useWorks();

  useSEO({
    title: project ? `${project.title} — Case Study` : 'Case Study',
    description: project?.summary ?? 'MovoX case study.',
    path: `/portfolio/${slug ?? ''}`,
    type: 'article',
  });

  // Structured data so the listing can carry rich results (title, image,
  // description, publisher). Removed again on unmount.
  useEffect(() => {
    if (!project) return;
    const data = {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: project.title,
      headline: project.title,
      description: project.summary,
      image: project.image,
      url: `https://heymovox.com/portfolio/${project.slug}`,
      genre: project.category,
      keywords: project.services.join(', '),
      dateCreated: project.year || undefined,
      about: project.client || project.clientDescriptor || undefined,
      publisher: {
        '@type': 'Organization',
        name: 'MovoX — Digital Growth',
        url: 'https://heymovox.com',
        email: 'info@heymovox.com',
        telephone: '+91-9500621262',
      },
    };
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.textContent = JSON.stringify(data);
    document.head.appendChild(el);
    return () => {
      el.remove();
    };
  }, [project]);

  // Wait for the fetch before deciding the slug does not exist; redirecting
  // while `project` is still null would bounce every visit back to the list.
  if (loading) return <LoadingSkeleton />;

  if (!project) return <Navigate to="/portfolio" replace />;

  const hasQuote = Boolean(project.quote?.text?.trim());
  const authorName =
    project.quote?.author?.trim() ||
    (project.client || project.clientDescriptor ? 'Client' : '');
  const initials = (project.quote?.author?.trim() || project.client || 'MX')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const jumpItems: JumpItem[] = [
    ...(project.results.length > 0 ? [{ id: 'results', label: 'Results' }] : []),
    ...(project.challenge.trim() ? [{ id: 'challenge', label: 'Challenge' }] : []),
    ...(project.objectives.length > 0 ? [{ id: 'objectives', label: 'Objectives' }] : []),
    ...(project.approach.length > 0 ? [{ id: 'approach', label: 'Approach' }] : []),
    ...(project.deliverables.length > 0
      ? [{ id: 'deliverables', label: 'Deliverables' }]
      : []),
    ...(hasQuote ? [{ id: 'testimonial', label: 'Testimonial' }] : []),
    { id: 'more-work', label: 'More work' },
  ];

  return (
    <>
      <ReadingProgress />

      <CaseStudyHero project={project} />
      <CaseStudyMedia project={project} />

      <JumpNav items={jumpItems} />

      <ResultsBand project={project} />

      <section className="container-site grid gap-10 py-16 sm:py-20 lg:grid-cols-3 lg:gap-14">
        <div className="lg:col-span-2">
          <CaseStudyStory project={project} />
        </div>
        <CaseStudySidebar project={project} />
      </section>

      {hasQuote && (
        <section
          id="testimonial"
          aria-labelledby="testimonial-heading"
          className="scroll-mt-32 border-t border-slate-200/60 py-16 sm:py-20"
        >
          <div className="container-site">
            <Reveal>
              <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 p-8 shadow-[0_24px_60px_rgba(0,54,85,0.32)] sm:p-12">
                <div
                  className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/25 blur-3xl"
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute -bottom-20 -left-12 h-52 w-52 rounded-full bg-emerald-400/10 blur-3xl"
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:40px_40px]"
                  aria-hidden="true"
                />

                <div className="relative">
                  <p
                    id="testimonial-heading"
                    className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-emerald-300"
                  >
                    In their words
                  </p>

                  <Quote
                    className="mt-4 h-9 w-9 text-brand-400/70"
                    aria-hidden="true"
                  />

                  <blockquote className="mt-3 font-heading text-xl font-medium leading-relaxed text-white sm:text-2xl sm:leading-[1.6]">
                    “{project.quote?.text?.trim()}”
                  </blockquote>

                  <figcaption className="mt-7 flex items-center gap-4 border-t border-white/10 pt-6">
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-emerald-500 font-heading text-sm font-extrabold text-white ring-2 ring-white/20"
                      aria-hidden="true"
                    >
                      {initials}
                    </span>
                    <span>
                      <span className="block font-heading text-sm font-bold text-white">
                        {authorName || 'MovoX client'}
                      </span>
                      <span className="block text-xs text-brand-100/80">
                        {project.quote?.role?.trim() ||
                          [project.client, project.clientDescriptor].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                  </figcaption>

                  <p className="mt-5 flex items-center gap-2 text-[11px] text-brand-100/70">
                    <span className="h-px w-6 bg-brand-400/60" aria-hidden="true" />
                    Shared with client consent
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      <RelatedWork project={project} caseStudies={caseStudies} />

      {/* escape hatch if someone landed deep and wants the index */}
      <div className="border-t border-slate-200/60 bg-white">
        <div className="container-site py-6">
          <Link
            to="/portfolio"
            className="group inline-flex items-center gap-2 font-heading text-sm font-semibold text-slate-500 transition-colors hover:text-brand-700"
          >
            <ArrowLeft
              className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
              aria-hidden="true"
            />
            Back to all work
          </Link>
        </div>
      </div>
    </>
  );
}
