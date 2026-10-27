import { motion } from 'motion/react';
import { Star, Quote } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TestimonialsSectionProps {
  className?: string;
}

const testimonials = [
  {
    name: 'Priya Raman',
    role: 'Founder, GreenLeaf Organics',
    text: 'MovoX delivered our e-commerce store in 4 weeks — on budget, exactly as scoped. The post-launch support was a lifesaver.',
    rating: 5,
    color: 'from-emerald-500 to-emerald-700',
  },
  {
    name: 'Arjun Mehta',
    role: 'CEO, FinTrack Solutions',
    text: 'The fixed-price proposal gave us complete confidence. No surprises, no scope creep. The app launched ahead of schedule.',
    rating: 5,
    color: 'from-brand-500 to-brand-700',
  },
  {
    name: 'Sneha Kulkarni',
    role: 'Marketing Head, EduSpark',
    text: 'Their design system is top-notch. We can add new pages in minutes because everything is consistent and well-documented.',
    rating: 5,
    color: 'from-violet-500 to-violet-700',
  },
];

export function TestimonialsSection({ className }: TestimonialsSectionProps) {
  return (
    <section className={cn('relative py-16 sm:py-24 border-t border-slate-200/60', className)}>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-brand-50/30 to-white"
        aria-hidden="true"
      />
      <div className="container-site relative z-10">
        <div className="max-w-2xl mb-14">
          <span className="chip">Happy clients</span>
          <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            What our clients say
          </h2>
        </div>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              className="group relative rounded-3xl border border-slate-200/70 bg-white p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
            >
              <Quote className="absolute top-6 right-6 h-10 w-10 text-brand-100 group-hover:text-brand-200 transition-colors" aria-hidden="true" />
              <div className="flex gap-1">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                ))}
              </div>
              <p className="mt-5 text-sm leading-relaxed text-slate-700">{t.text}</p>
              <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                <span className={cn('flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-white font-heading text-sm font-bold', t.color)}>
                  {t.name.charAt(0)}
                </span>
                <div>
                  <p className="font-heading text-sm font-bold text-ink">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
