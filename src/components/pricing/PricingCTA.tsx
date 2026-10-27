import { ArrowRight, Mail, Phone, MapPin, Send, MessageCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface PricingCTAProps {
  className?: string;
}

const nextSteps = [
  { num: '01', title: 'Tell us your goal', desc: 'Share your project in 60 seconds.', icon: Send },
  { num: '02', title: 'Get a fixed quote', desc: 'Proposal within 1 business day.', icon: Clock },
  { num: '03', title: 'We start building', desc: 'Kickoff within a week.', icon: CheckCircle2 },
];

export function PricingCTA({ className }: PricingCTAProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden py-20 sm:py-28 border-t border-slate-200/60',
        className,
      )}
    >
      {/* Animated gradient field */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(35,130,184,0.10),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.10),transparent_55%),linear-gradient(180deg,#fff_0%,#f8fafc_100%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-brand-300/15 blur-[120px] animate-blob"
        aria-hidden="true"
        style={{ animationDuration: '9s' }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 left-1/5 h-80 w-80 rounded-full bg-emerald-400/10 blur-[110px] animate-blob"
        aria-hidden="true"
        style={{ animationDuration: '11s', animationDelay: '3s' }}
      />
      {/* grid texture */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,54,85,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,54,85,0.03)_1px,transparent_1px)] bg-[size:44px_44px]"
        aria-hidden="true"
      />

      <div className="container-site relative z-10">
        <div className="relative mx-auto max-w-4xl">
          {/* glow behind the card */}
          <div
            className="pointer-events-none absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-brand-500/25 via-brand-400/10 to-emerald-400/15 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 p-8 sm:p-14 shadow-[0_32px_80px_rgba(0,54,85,0.45)]">
            {/* inner decorative */}
            <div
              className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-brand-500/20 blur-[110px]"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-[90px]"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:40px_40px]"
              aria-hidden="true"
            />

            {/* floating availability badge */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative z-10 mb-8 flex justify-center"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-4 py-1.5 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  Accepting new projects — replies within 1 business day
                </span>
              </span>
            </motion.div>

            <div className="relative z-10 text-center">
              <div className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-sm mb-6">
                <Send className="h-4 w-4 text-brand-300" aria-hidden="true" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-200">
                  Ready to grow?
                </span>
              </div>

              <h2 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl leading-[1.06]">
                Let&rsquo;s build your{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-emerald-300 via-brand-300 to-brand-200 bg-clip-text text-transparent">
                    next chapter.
                  </span>
                  <span
                    className="absolute -bottom-2 left-0 h-1.5 w-full rounded-full bg-gradient-to-r from-emerald-400 to-brand-400 opacity-60"
                    aria-hidden="true"
                  />
                </span>
              </h2>

              <p className="mt-6 mx-auto max-w-xl text-lg leading-relaxed text-brand-100/85">
                Pick a package, book a discovery call, or message us on WhatsApp.
                We&rsquo;ll respond within one business day with a clear proposal
                and timeline.
              </p>

              {/* CTA buttons */}
              <div className="mt-9 flex flex-col gap-4 justify-center sm:flex-row">
                <Link
                  to="/start-a-project"
                  className="group flex-1 sm:flex-none btn btn-lg justify-center bg-white text-brand-800 hover:bg-brand-50 transition-colors"
                >
                  <span className="btn-content flex items-center justify-center gap-2">
                    Start a project
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
                <a
                  href="https://wa.me/919500621262"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex-1 sm:flex-none btn btn-lg justify-center border border-white/25 bg-white/10 text-white backdrop-blur-sm hover:bg-white/15 transition-colors"
                >
                  <span className="btn-content flex items-center justify-center gap-2">
                    <MessageCircle className="h-4 w-4 transition-transform group-hover:scale-110" aria-hidden="true" />
                    Chat on WhatsApp
                  </span>
                </a>
              </div>
            </div>

            {/* next steps strip */}
            <div className="relative z-10 mt-12 grid gap-3 sm:grid-cols-3">
              {nextSteps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.15 + i * 0.12 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur-sm hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 font-heading text-[11px] font-bold text-white shadow-sm">
                      {step.num}
                    </span>
                    <span className="font-heading text-sm font-bold text-white">{step.title}</span>
                  </div>
                  <p className="mt-2 pl-10 text-xs leading-relaxed text-brand-100/70">{step.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* contact strip */}
            <div className="relative z-10 mt-10 grid gap-3 border-t border-white/10 pt-8 sm:grid-cols-3">
              <ContactItem icon={<Mail className="h-5 w-5" />} label="Email" value="info@heymovox.com" href="mailto:info@heymovox.com" />
              <ContactItem icon={<Phone className="h-5 w-5" />} label="Call us" value="+91 95006 21262" href="tel:+919500621262" />
              <ContactItem icon={<MapPin className="h-5 w-5" />} label="Office" value="Krishnagiri, Tamil Nadu" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface ContactItemProps {
  icon: React.ReactElement;
  label: string;
  value: string;
  href?: string;
}

function ContactItem({ icon, label, value, href }: ContactItemProps) {
  const Comp = (href ? 'a' : 'div') as 'a' | 'div';
  return (
    <Comp
      href={href}
      className={cn(
        'group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10',
        href && 'cursor-pointer',
      )}
    >
      <span className="flex shrink-0 items-center justify-center h-9 w-9 rounded-lg bg-white/10 text-brand-300 transition-colors group-hover:bg-white/15">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-200/70">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-white">{value}</p>
      </div>
    </Comp>
  );
}
