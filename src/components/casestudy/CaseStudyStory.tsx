/**
 * Case study narrative — challenge, objectives, approach and deliverables,
 * each rendered with its own visual treatment rather than a plain list.
 */
import { Check, Compass, ListChecks, Package, Quote, Target } from 'lucide-react';
import type { CaseStudy } from '../../data/portfolio';

function SectionHead({
  step,
  kicker,
  title,
  description,
}: {
  step: string;
  kicker: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="flex items-center gap-3 font-heading text-xs font-bold uppercase tracking-[0.2em] text-brand-700">
        <span className="inline-flex h-6 items-center rounded-full bg-brand-gradient px-2.5 text-[10px] font-bold text-white">
          {step}
        </span>
        {kicker}
      </p>
      <h2 className="mt-3 font-heading text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-sm leading-relaxed text-slate-500">{description}</p>
      )}
    </div>
  );
}

export function CaseStudyStory({ project }: { project: CaseStudy }) {
  const hasObjectives = project.objectives.length > 0;
  const hasApproach = project.approach.length > 0;
  const hasDeliverables = project.deliverables.length > 0;

  return (
    <div className="space-y-14">
      {/* ---------------- challenge ---------------- */}
      {project.challenge.trim() && (
        <section id="challenge" className="scroll-mt-36" aria-labelledby="challenge-heading">
          <SectionHead
            step="01"
            kicker="The challenge"
            title="What we were up against"
          />
          <div className="relative mt-6 overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-r from-brand-50/80 to-white p-7 shadow-card sm:p-9">
            <span
              className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-brand-500 via-brand-400 to-emerald-400"
              aria-hidden="true"
            />
            <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm">
              <Target className="h-5 w-5" aria-hidden="true" />
            </span>
            <p
              id="challenge-heading"
              className="relative text-base leading-relaxed text-slate-700 sm:text-lg sm:leading-[1.75]"
            >
              {project.challenge}
            </p>
            <Quote
              className="pointer-events-none absolute -right-3 -top-3 h-24 w-24 text-brand-100/70"
              aria-hidden="true"
            />
          </div>
        </section>
      )}

      {/* ---------------- objectives ---------------- */}
      {hasObjectives && (
        <section id="objectives" className="scroll-mt-36" aria-labelledby="objectives-heading">
          <div id="objectives-heading">
            <SectionHead
              step="02"
              kicker="Objectives"
              title="What we set out to achieve"
              description="Every engagement starts with agreed targets — these are the ones this project was measured against."
            />
          </div>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {project.objectives.map((o, i) => (
              <li
                key={`${o}-${i}`}
                className="group flex items-start gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 font-heading text-xs font-bold text-brand-700 transition-colors duration-300 group-hover:bg-brand-gradient group-hover:text-white">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="pt-1.5 text-sm leading-relaxed text-slate-700">{o}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---------------- approach ---------------- */}
      {hasApproach && (
        <section id="approach" className="scroll-mt-36" aria-labelledby="approach-heading">
          <div id="approach-heading">
            <SectionHead
              step="03"
              kicker="Our approach"
              title="How we worked"
              description="The decisions and craft that turned the brief into the delivered work."
            />
          </div>
          <ol className="relative mt-7 space-y-5 pl-12">
            <span
              className="absolute left-[15px] top-3 bottom-3 w-px bg-gradient-to-b from-brand-400 via-brand-300 to-transparent"
              aria-hidden="true"
            />
            {project.approach.map((a, i) => (
              <li key={`${a}-${i}`} className="relative">
                <span
                  className="absolute -left-12 top-0 flex h-8 w-8 items-center justify-center rounded-xl bg-brand-gradient font-heading text-xs font-bold text-white shadow-[0_6px_16px_rgba(35,130,184,0.35)] ring-4 ring-white"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover">
                  <p className="font-heading text-sm font-bold text-ink">
                    Phase {i + 1}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{a}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ---------------- deliverables ---------------- */}
      {hasDeliverables && (
        <section
          id="deliverables"
          className="scroll-mt-36"
          aria-labelledby="deliverables-heading"
        >
          <div id="deliverables-heading">
            <SectionHead
              step="04"
              kicker="Deliverables"
              title="What we shipped"
              description={`${project.deliverables.length} item${project.deliverables.length === 1 ? '' : 's'} handed over, source files included.`}
            />
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {project.deliverables.map((d, i) => (
              <li
                key={`${d}-${i}`}
                className="flex items-start gap-3 rounded-xl border border-slate-200/70 bg-slate-50/70 p-4 transition-colors duration-300 hover:border-brand-200 hover:bg-brand-50/50"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                  <Check className="h-3 w-3" aria-hidden="true" />
                </span>
                <span className="text-sm leading-relaxed text-slate-700">{d}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Nothing to show (fresh draft) */}
      {!project.challenge.trim() && !hasObjectives && !hasApproach && !hasDeliverables && (
        <div className="flex items-start gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
          <Compass className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
          <div>
            <p className="font-heading text-sm font-bold text-ink">
              The write-up is still being prepared
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              Challenge, objectives, approach and deliverables for this project have not
              been published yet. In the meantime, you can browse the outcome numbers and
              start a conversation.
            </p>
          </div>
        </div>
      )}

      {/* tiny summary of structure */}
      {(hasObjectives || hasApproach || hasDeliverables) && (
        <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-8">
          {[
            { icon: ListChecks, value: project.objectives.length, label: 'objectives' },
            { icon: Compass, value: project.approach.length, label: 'approach steps' },
            { icon: Package, value: project.deliverables.length, label: 'deliverables' },
          ].map((s) => (
            <span
              key={s.label}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
            >
              <s.icon className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
              <strong className="font-heading font-bold text-ink">{s.value}</strong> {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
