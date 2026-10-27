import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useSEO } from '../lib/seo';
import { services } from '../data/services';
import { ServiceIcon } from '../components/ServiceIcon';
import { PageHero } from '../components/PageHero';
import { Reveal } from '../components/Reveal';

export default function Services() {
  useSEO({
    title: 'Services',
    description:
      'Five integrated services: graphic design, branding & packaging, website development, app development, and digital marketing & SEO.',
    path: '/services',
  });

  return (
    <>
      <PageHero
        eyebrow="Our services"
        title={
          <>
            Three disciplines. Five services.{' '}
            <span className="bg-brand-gradient bg-clip-text text-transparent">
              One growth engine.
            </span>
          </>
        }
        description="Graphic design, branding & packaging, website & app development, and digital marketing & SEO — delivered by one senior, accountable team."
      />

      <section className="container-site pb-20 sm:pb-24" aria-label="Service list">
        <div className="grid gap-6 md:grid-cols-2">
          {services.map((service, i) => (
            <Reveal key={service.slug} delay={(i % 2) * 0.08}>
              <Link
                to={`/services/${service.slug}`}
                className="card-surface group flex h-full flex-col p-8 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover lg:flex-row lg:items-center lg:gap-8"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition-colors duration-300 group-hover:bg-brand-gradient group-hover:text-white">
                  <ServiceIcon name={service.icon} className="h-7 w-7" />
                </span>
                <div className="mt-5 flex-1 lg:mt-0">
                  <h2 className="font-heading text-xl font-bold text-ink">
                    {service.name}
                  </h2>
                  <p className="mt-1 font-heading text-sm font-semibold text-brand-600">
                    {service.tagline}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {service.description}
                  </p>
                </div>
                <span className="mt-6 inline-flex items-center gap-1.5 font-heading text-sm font-semibold text-brand-700 lg:mt-0">
                  Explore
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </Reveal>
          ))}

          <Reveal delay={0.16}>
            <div className="flex h-full flex-col justify-between rounded-2xl bg-brand-gradient p-8 text-white shadow-[0_16px_48px_rgba(0,54,85,0.22)]">
              <div>
                <h2 className="font-heading text-xl font-bold">Integrated growth programs</h2>
                <p className="mt-2 text-sm leading-relaxed text-brand-100/85">
                  Most clients engage two or more services. We design the program as a
                  whole — shared strategy, shared timelines, one team accountable for
                  the outcome.
                </p>
              </div>
              <Link
                to="/start-a-project"
                className="mt-6 inline-flex items-center gap-2 font-heading text-sm font-semibold text-white"
              >
                Propose a program
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

    </>
  );
}
