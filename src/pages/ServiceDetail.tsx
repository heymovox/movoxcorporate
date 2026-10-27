import { Link, Navigate, useParams } from 'react-router-dom';
import { Check, ArrowRight, Shield, Zap, Target } from 'lucide-react';
import { motion } from 'motion/react';
import { useSEO } from '../lib/seo';
import { getService, services } from '../data/services';
import { ServiceIcon } from '../components/ServiceIcon';
import { PageHero } from '../components/PageHero';
import { Reveal } from '../components/Reveal';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

const serviceFaqs: Record<string, { q: string; a: string }[]> = {
  'graphic-design': [
    { q: 'How many revision rounds are included?', a: 'Each package includes 2–3 revision rounds depending on scope. Additional rounds can be added if needed.' },
    { q: 'Do you provide source files?', a: 'Yes. All final deliverables include source files (AI, PSD, Figma) and export-ready formats (PNG, JPG, WebP, SVG).' },
    { q: 'Can you work with our existing brand guidelines?', a: 'Absolutely. We can extend, refine, or strictly adhere to your existing brand system.' },
    { q: 'What is the typical timeline?', a: 'Starter projects: 2–3 weeks. Brand systems: 4–8 weeks. We provide a detailed timeline during scoping.' },
  ],
  'branding-packaging': [
    { q: 'Do you handle print production?', a: 'We create print-ready artwork and coordinate with your printer for proofs, color matching, and quality checks.' },
    { q: 'How many logo concepts do you present?', a: 'We typically present 3 distinct logo concepts, then refine the chosen direction through 2–3 rounds.' },
    { q: 'Can you design packaging for multiple SKUs?', a: 'Yes. Our packaging systems are built for scalability — from 3 to 50+ SKUs with consistent architecture.' },
    { q: 'Do you offer brand strategy workshops?', a: 'Yes. Our Complete Brand Identity and Branding + Packaging Suite include a 2-hour strategy workshop.' },
  ],
  'website-development': [
    { q: 'What CMS do you recommend?', a: 'We work with headless CMSs (Contentful, Sanity, Strapi) and WordPress. We recommend based on your team\'s needs.' },
    { q: 'Do you provide hosting and maintenance?', a: 'We set up hosting on Vercel, Netlify, AWS, or your preferred provider. Maintenance retainers are available.' },
    { q: 'Will the site be SEO-ready?', a: 'Yes. Every build includes technical SEO setup: schema, sitemaps, robots.txt, Core Web Vitals optimization, and accessibility compliance.' },
    { q: 'Can you integrate with our CRM/ERP?', a: 'Yes. We build custom API integrations for Salesforce, HubSpot, Zoho, SAP, and custom backends.' },
  ],
  'app-development': [
    { q: 'Native or cross-platform?', a: 'We recommend React Native for most projects (single codebase, 80–90% code reuse). Native (Swift/Kotlin) for high-performance or platform-specific needs.' },
    { q: 'Do you handle App Store submission?', a: 'Yes. We handle the full submission process: certificates, screenshots, descriptions, review compliance, and launch monitoring.' },
    { q: 'What about backend/API?', a: 'We build REST or GraphQL APIs (Node.js, Go, Python) or integrate with your existing backend / Firebase / Supabase.' },
    { q: 'Post-launch support?', a: '60–120 days of bug fixes included. Ongoing maintenance retainers available for OS updates, feature iterations, and scaling.' },
  ],
  'digital-marketing': [
    { q: 'How long until I see results?', a: 'Paid media: immediate traffic. SEO: 3–6 months for meaningful organic growth. We set realistic KPIs and report monthly.' },
    { q: 'What ad budget do I need?', a: 'We work with budgets from ₹15k/month. We optimize for ROAS and scale spend based on performance data.' },
    { q: 'Do you write content?', a: 'Yes. Our Full-Funnel Growth package includes 8+ optimized articles/month. Standalone content packages also available.' },
    { q: 'How do you measure success?', a: 'We track leading indicators (traffic, leads, CTR) and lagging indicators (revenue, ROAS, LTV). Custom dashboards included.' },
  ],
};

const serviceBenefits: Record<string, { icon: any; title: string; description: string }[]> = {
  'graphic-design': [
    { icon: Target, title: 'Brand Consistency', description: 'Unified visual language across every touchpoint — from social to print to digital.' },
    { icon: Zap, title: 'Faster Turnaround', description: 'Design systems and templates enable rapid asset creation without sacrificing quality.' },
    { icon: Shield, title: 'Scalable Assets', description: 'Vector-based, resolution-independent files that work at any size — from favicon to billboard.' },
  ],
  'branding-packaging': [
    { icon: Shield, title: 'Shelf Impact', description: 'Packaging designed for the 3-second shelf decision — tested for recognition and differentiation.' },
    { icon: Target, title: 'Strategic Foundation', description: 'Every visual decision backed by research, positioning, and competitive analysis.' },
    { icon: Zap, title: 'Production Ready', description: 'Print-ready files with vendor coordination — no surprises at the press.' },
  ],
  'website-development': [
    { icon: Zap, title: 'Performance First', description: 'Core Web Vitals optimized out of the box — LCP < 2.5s, INP < 200ms, CLS < 0.1.' },
    { icon: Shield, title: 'Accessible by Default', description: 'WCAG 2.1 AA compliance built in — keyboard navigation, screen readers, color contrast.' },
    { icon: Target, title: 'Conversion Focused', description: 'Landing pages and funnels designed around your business goals, not just aesthetics.' },
  ],
  'app-development': [
    { icon: Zap, title: 'Native Performance', description: 'React Native with native modules — 60fps animations, smooth gestures, offline-first architecture.' },
    { icon: Shield, title: 'Secure by Design', description: 'End-to-end encryption, biometric auth, secure storage, OWASP MASVS compliance.' },
    { icon: Target, title: 'Store Optimized', description: 'ASO-ready metadata, screenshots, preview videos, and launch strategy included.' },
  ],
  'digital-marketing': [
    { icon: Target, title: 'ROI-Driven', description: 'Every dollar tracked to revenue. We optimize for ROAS, CAC, and LTV — not vanity metrics.' },
    { icon: Zap, title: 'Full-Funnel Coverage', description: 'SEO, paid, content, email, CRO — integrated campaigns that compound over time.' },
    { icon: Shield, title: 'Transparent Reporting', description: 'Custom dashboards, weekly updates, monthly strategy reviews — no black boxes.' },
  ],
};

const serviceStats: Record<string, { label: string; value: string }[]> = {
  'graphic-design': [
    { label: 'Avg. turnaround', value: '10 days' },
    { label: 'Revision rounds', value: '2–3 included' },
    { label: 'File formats', value: '8+ formats' },
    { label: 'Client satisfaction', value: '98%' },
  ],
  'branding-packaging': [
    { label: 'Brand systems delivered', value: '40+' },
    { label: 'Packaging SKUs launched', value: '200+' },
    { label: 'Retail shelf placements', value: '500+' },
    { label: 'Strategy workshops', value: '30+' },
  ],
  'website-development': [
    { label: 'Websites launched', value: '120+' },
    { label: 'Avg. LCP', value: '1.8s' },
    { label: 'Accessibility score', value: '100/100' },
    { label: 'CMS migrations', value: '40+' },
  ],
  'app-development': [
    { label: 'Apps launched', value: '25+' },
    { label: 'App Store rating', value: '4.7★ avg' },
    { label: 'Crash-free rate', value: '99.9%' },
    { label: 'Platforms', value: 'iOS + Android' },
  ],
  'digital-marketing': [
    { label: 'Avg. ROAS', value: '4.2x' },
    { label: 'Organic traffic growth', value: '3.2x avg' },
    { label: 'Leads generated', value: '50k+' },
    { label: 'Ad spend managed', value: '₹2Cr+' },
  ],
};

export default function ServiceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const service = getService(slug ?? '');

  useSEO({
    title: service ? service.name : 'Service',
    description: service?.tagline ?? 'MovoX services.',
    path: `/services/${slug ?? ''}`,
  });

  if (!service) return <Navigate to="/services" replace />;

  const others = services.filter((s) => s.slug !== service.slug);
  const faqs = serviceFaqs[service.slug] ?? [];
  const benefits = serviceBenefits[service.slug] ?? [];
  const stats = serviceStats[service.slug] ?? [];
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <PageHero
        eyebrow="Our services"
        title={
          <span className="flex flex-wrap items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-[0_8px_24px_rgba(35,130,184,0.35)]">
              <ServiceIcon name={service.icon} className="h-7 w-7" />
            </span>
            {service.name}
          </span>
        }
        description={service.description}
      />

      {/* Key Stats */}
      <section className="bg-brand-50/50 py-12 sm:py-16" aria-labelledby="stats-heading">
        <div className="container-site">
          <Reveal>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-4xl mx-auto text-center">
              {stats.map((stat, i) => (
                <Reveal key={stat.label} delay={i * 0.08}>
                  <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card hover:shadow-card-hover transition-shadow">
                    <p className="font-heading text-3xl sm:text-4xl font-extrabold text-ink">{stat.value}</p>
                    <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-site grid gap-12 pb-20 sm:pb-24 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <div>
            <h2 className="font-heading text-2xl font-bold text-ink">Capabilities</h2>
            <ul className="mt-6 space-y-3.5">
              {service.capabilities.map((cap) => (
                <li key={cap} className="flex items-start gap-3 text-sm leading-relaxed text-slate-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                  {cap}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-slate-200/70 bg-brand-50/60 p-8">
            <h2 className="font-heading text-2xl font-bold text-ink">What you receive</h2>
            <ul className="mt-6 space-y-3.5">
              {service.deliverables.map((d) => (
                <li key={d} className="flex items-start gap-3 text-sm leading-relaxed text-slate-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                  {d}
                </li>
              ))}
            </ul>
            <Link to="/start-a-project" className="btn btn-primary btn-lg mt-8 w-full sm:w-auto">
              <span className="btn-content flex items-center justify-center gap-2">
                Discuss this service
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Why Choose This Service / Benefits */}
      <section className="bg-white py-20 sm:py-24" aria-labelledby="benefits-heading">
        <div className="container-site">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-brand-700">Why MovoX for {service.name}</p>
              <h2 id="benefits-heading" className="mt-2 font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Built for results, not just deliverables
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">
                Every engagement is structured around measurable outcomes — not just checking boxes.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-8 md:grid-cols-3">
            {benefits.map((benefit, i) => (
              <Reveal key={benefit.title} delay={i * 0.08}>
                <div className="card-surface h-full p-8 hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-[0_8px_24px_rgba(35,130,184,0.35)]">
                    <benefit.icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 font-heading text-lg font-bold text-ink">{benefit.title}</h3>
                  <p className="mt-2.5 text-base leading-relaxed text-slate-600">{benefit.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-50/50 py-16 sm:py-20" aria-labelledby="service-process">
        <div className="container-site">
          <Reveal>
            <h2 id="service-process" className="font-heading text-2xl font-bold text-ink">
              How we run it
            </h2>
          </Reveal>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {service.process.map((step, i) => (
              <Reveal key={step.step} delay={i * 0.08}>
                <li className="card-surface h-full p-6 hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient font-heading text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-heading text-base font-bold text-ink">{step.step}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.detail}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <section className="py-20 sm:py-24" aria-labelledby="faq-heading">
          <div className="container-site">
            <Reveal>
              <div className="text-center max-w-2xl mx-auto mb-12">
                <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-brand-700">Frequently Asked Questions</p>
                <h2 id="faq-heading" className="mt-2 font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                  Common questions about {service.name}
                </h2>
              </div>
            </Reveal>

            <dl className="max-w-3xl mx-auto space-y-3" role="list">
              {faqs.map((faq, i) => (
                <Reveal key={i} delay={i * 0.05}>
                  <div className="rounded-xl border border-slate-200/70 bg-white overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      aria-expanded={openFaq === i}
                      aria-controls={`faq-answer-${i}`}
                      className={cn(
                        'w-full flex items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-slate-50/50',
                        openFaq === i && 'bg-brand-50/50 border-brand-200',
                      )}
                    >
                      <dt className="flex-1 font-heading text-base font-semibold text-ink pr-4">{faq.q}</dt>
                      <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors" aria-hidden="true">
                        {openFaq === i ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </span>
                    </button>
                    <motion.dd
                      id={`faq-answer-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <dd className="px-5 pb-5 text-base leading-relaxed text-slate-600">{faq.a}</dd>
                    </motion.dd>
                  </div>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>
      )}

      <section className="container-site py-16 sm:py-20" aria-labelledby="other-services">
        <Reveal>
          <h2 id="other-services" className="font-heading text-2xl font-bold text-ink">
            Related services
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {others.map((s, i) => (
            <Reveal key={s.slug} delay={(i % 2) * 0.06}>
              <Link
                to={`/services/${s.slug}`}
                className="card-surface group flex items-center gap-4 p-5 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors duration-300 group-hover:bg-brand-gradient group-hover:text-white">
                  <ServiceIcon name={s.icon} className="h-5 w-5" />
                </span>
                <span className="flex-1 font-heading text-base font-bold text-ink">
                  {s.name}
                </span>
                <ArrowRight
                  className="h-4 w-4 text-slate-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-600"
                  aria-hidden="true"
                />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

    </>
  );
}
