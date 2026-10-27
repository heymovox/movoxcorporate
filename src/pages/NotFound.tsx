import { Link } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';
import { useSEO } from '../lib/seo';
import { Reveal } from '../components/Reveal';

export default function NotFound() {
  useSEO({
    title: 'Page Not Found',
    description: 'The page you are looking for does not exist.',
    path: '/404',
  });

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <div
        className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-brand-100/60 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-brand-200/40 blur-3xl"
        aria-hidden="true"
      />
      <Reveal className="relative text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-gradient shadow-[0_12px_36px_rgba(35,130,184,0.35)]">
          <Compass className="h-10 w-10 text-white" aria-hidden="true" />
        </span>
        <p className="mt-8 font-heading text-sm font-bold uppercase tracking-[0.3em] text-brand-600">
          404
        </p>
        <h1 className="mt-4 font-heading text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          This page wandered off.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-slate-600">
          The page you are looking for has moved or never existed. Let us get you
          back on track.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to="/" className="btn-primary">
            Back to home
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link to="/start-a-project" className="btn-secondary">
            Start a project
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
