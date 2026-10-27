import { Search, Map, PenTool, Rocket, LineChart } from 'lucide-react';
import { SectionHeading } from '../SectionHeading';
import { Reveal } from '../Reveal';

const steps = [
  {
    Icon: Search,
    name: 'Discover',
    text: 'Stakeholder workshops, research, and technical audit. We define what success looks like before we design anything.',
  },
  {
    Icon: Map,
    name: 'Plan',
    text: 'Scope, sitemap, architecture, and roadmap. You see the full plan — budget, timeline, and deliverables — before work begins.',
  },
  {
    Icon: PenTool,
    name: 'Create',
    text: 'Weekly demos in staged sprints. You review real work-in-progress, not a final reveal that surprises everyone.',
  },
  {
    Icon: Rocket,
    name: 'Launch',
    text: 'QA, performance checks, analytics setup, and a controlled rollout. We stay through the launch window, not just the handover.',
  },
  {
    Icon: LineChart,
    name: 'Improve',
    text: 'Post-launch measurement, testing, and iteration. Good launches are starting points — we optimize against real data.',
  },
];

export function ProcessSection() {
  return (
    <section className="bg-brand-50/50 py-20 sm:py-28" aria-labelledby="process-heading">
      <div className="container-site">
        <SectionHeading
          eyebrow="How we work"
          title={<span id="process-heading">Five steps. No surprises.</span>}
          description="A refined process that keeps projects visible, on budget, and on schedule — from first workshop to post-launch optimization."
        />
        <ol className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
          {steps.map(({ Icon, name, text }, i) => (
            <Reveal key={name} delay={i * 0.1}>
              <li className="relative flex flex-col items-center text-center">
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-card ring-1 ring-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                  <Icon className="h-7 w-7 text-brand-600" aria-hidden="true" />
                  <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-gradient font-heading text-xs font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-heading text-lg font-bold text-ink">{name}</h3>
                <p className="mt-2 max-w-[220px] text-sm leading-relaxed text-slate-600">
                  {text}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
