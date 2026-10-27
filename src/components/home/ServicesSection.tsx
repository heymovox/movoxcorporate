import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { services } from '../../data/services';
import { ServiceIcon } from '../ServiceIcon';
import { SectionHeading } from '../SectionHeading';
import { Reveal } from '../Reveal';

export function ServicesSection() {
  return (
    <section className="container-site py-20 sm:py-28" aria-labelledby="services-heading">
      <SectionHeading
        eyebrow="What we do"
        title={<span id="services-heading">Five capabilities, one accountable team.</span>}
        description="Every engagement draws on the same senior team — design, development, and marketing working to one brief, one timeline, one standard."
      />
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service, i) => (
          <Reveal key={service.slug} delay={(i % 3) * 0.08} className={i === 4 ? 'sm:col-span-2 lg:col-span-1' : ''}>
            <Link
              to={`/services/${service.slug}`}
              className="card-surface group flex h-full flex-col p-7 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors duration-300 group-hover:bg-brand-gradient group-hover:text-white">
                <ServiceIcon name={service.icon} className="h-6 w-6" />
              </span>
              <h3 className="mt-5 font-heading text-xl font-bold text-ink">
                {service.name}
              </h3>
              <p className="mt-1.5 font-heading text-sm font-semibold text-brand-600">
                {service.tagline}
              </p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
                {service.description}
              </p>
              <span className="mt-6 inline-flex items-center gap-1.5 font-heading text-sm font-semibold text-brand-700">
                Explore service
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </Link>
          </Reveal>
        ))}
        <Reveal delay={0.16}>
          <div className="flex h-full flex-col justify-between rounded-2xl bg-brand-gradient p-7 text-white shadow-[0_16px_48px_rgba(0,54,85,0.22)]">
            <div>
              <p className="font-heading text-xl font-bold leading-snug">
                Not sure which service fits?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-brand-100/85">
                Start with a discovery call. We will map your goals to the right
                combination — no obligation.
              </p>
            </div>
            <Link
              to="/start-a-project"
              className="mt-6 inline-flex items-center gap-2 font-heading text-sm font-semibold text-white"
            >
              Talk to us
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
