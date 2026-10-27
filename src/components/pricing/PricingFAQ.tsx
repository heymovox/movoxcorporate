import { ChevronDown, ChevronUp, HelpCircle, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { pricingFAQs } from '../../data/pricing';
import { cn } from '../../lib/utils';

export function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-16 sm:py-20 border-t border-slate-200/70" aria-labelledby="pricing-faq-heading">
      <div className="container-site">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white mb-4">
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
            Have questions?
          </div>
          <h2 id="pricing-faq-heading" className="font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Quick answers about our pricing, process, and policies.
          </p>
        </div>

        <dl className="space-y-3 max-w-3xl mx-auto" role="list">
          {pricingFAQs.map((faq, i) => (
            <div
              key={i}
              className={cn(
                'group rounded-xl border transition-all duration-300',
                openIndex === i
                  ? 'border-brand-300 bg-brand-50/40 shadow-[0_8px_24px_rgba(35,130,184,0.08)]'
                  : 'border-slate-200/70 bg-white hover:border-brand-200',
              )}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                aria-expanded={openIndex === i}
                aria-controls={`faq-answer-${i}`}
                className="w-full flex items-center justify-between gap-4 p-5 text-left"
              >
                <dt className="flex-1 font-heading text-base font-semibold text-ink pr-4 group-hover:text-brand-700 transition-colors">
                  {faq.q}
                </dt>
                <div
                  className={cn(
                    'shrink-0 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300',
                    openIndex === i
                      ? 'bg-brand-gradient text-white'
                      : 'bg-slate-100 text-slate-500',
                  )}
                  aria-hidden="true"
                >
                  {openIndex === i ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.dd
                    id={`faq-answer-${i}`}
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <dd className="px-5 pb-5 text-sm leading-relaxed text-slate-600">
                      {faq.a}
                    </dd>
                  </motion.dd>
                )}
              </AnimatePresence>
            </div>
          ))}
        </dl>

        <div className="mt-14 pt-10 border-t border-slate-200/60 text-center">
          <p className="text-lg text-slate-600 mb-4">
            Still not sure which package fits?
          </p>
          <a
            href="/start-a-project"
            className="inline-flex items-center justify-center gap-2 btn btn-primary btn-lg"
          >
            <span className="btn-content flex items-center gap-2">
              Book a discovery call
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
