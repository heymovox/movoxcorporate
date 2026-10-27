import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useSEO } from '../lib/seo';
import { Reveal } from '../components/Reveal';

export default function ThankYou() {
  useSEO({
    title: 'Thank You',
    description: 'Thank you for your enquiry — MovoX will respond within one business day.',
    path: '/thank-you',
  });

  return (
    <section className="container-site flex min-h-[70vh] flex-col items-center justify-center py-28 text-center">
      <Reveal>
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50">
          <CheckCircle2 className="h-11 w-11 text-brand-600" aria-hidden="true" />
        </span>
        <h1 className="mt-8 font-heading text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Thank you.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-slate-600">
          Your enquiry has been noted. The MovoX team responds to every project
          brief within one business day.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to="/portfolio" className="btn-secondary">
            Explore our work
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link to="/insights" className="btn-primary">
            Read our insights
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
