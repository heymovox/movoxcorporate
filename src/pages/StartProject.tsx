import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useForm,
  Controller,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CheckCircle2,
  Loader2,
  Send,
  ShieldCheck,
  Info,
  MessageSquare,
  Target,
  Shield,
  ArrowRight,
  Users,
  Building2,
  ChevronUp,
  ChevronDown,
  FileText,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';
import { PageHero } from '../components/PageHero';
import { Reveal } from '../components/Reveal';
import { services } from '../data/services';
import { ServiceIcon } from '../components/ServiceIcon';

const budgetRanges = [
  'Under $10k',
  '$10k – $25k',
  '$25k – $50k',
  '$50k – $100k',
  '$100k+',
  'Not sure yet',
];

const timelines = [
  'ASAP (within 4 weeks)',
  '1 – 2 months',
  '3 – 6 months',
  '6+ months',
  'Flexible',
];

const enquirySchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(80),
  business: z.string().trim().min(2, 'Please enter your business name.').max(120),
  email: z.string().trim().email('Please enter a valid work email.').max(120),
  phone: z
    .string()
    .trim()
    .regex(/^[+()\-.\s\d]{7,20}$/, 'Please enter a valid phone number.')
    .optional()
    .or(z.literal('')),
  service: z.string().min(1, 'Please select a service.'),
  budget: z.string().min(1, 'Please select a budget range.'),
  timeline: z.string().min(1, 'Please select a preferred timeline.'),
  brief: z
    .string()
    .trim()
    .min(30, 'Please tell us a little more about the project (min. 30 characters).')
    .max(4000),
  consent: z
    .boolean()
    .refine((v) => v === true, 'Please consent to the privacy policy to continue.'),
});

type EnquiryValues = z.infer<typeof enquirySchema>;

const serviceDescriptions: Record<string, string> = {
  'graphic-design': 'Logos, brand identity, marketing collateral, social media design systems',
  'branding-packaging': 'Brand strategy, naming, visual identity, packaging design & production',
  'website-development': 'Corporate sites, e-commerce, web apps, CMS, performance optimization',
  'app-development': 'iOS, Android, cross-platform (React Native), MVP to scale',
  'digital-marketing': 'SEO, paid media, content, email, CRO, analytics & attribution',
  'multiple': 'Not sure yet — we\'ll help you figure out the right mix',
};

const faqs = [
  {
    q: 'How long until I hear back?',
    a: 'Within one business day. We review every brief and respond with next steps, a discovery call invite, or clarifying questions.',
  },
  {
    q: 'What happens after I submit?',
    a: 'We review your brief → schedule a 30-min discovery call → send a detailed proposal with scope, timeline, and fixed pricing.',
  },
  {
    q: 'What if I\'m not sure which service I need?',
    a: 'Select "Multiple / not sure" and we\'ll help you figure out the right combination during our discovery call.',
  },
  {
    q: 'Do you sign NDAs?',
    a: 'Yes. We\'re happy to sign a mutual NDA before sharing sensitive details. Just let us know in the brief.',
  },
  {
    q: 'What payment terms do you offer?',
    a: 'Standard: 40% on kickoff, 40% at midpoint, 20% on delivery. Retainers are monthly in advance. We accept bank transfer, UPI, and cards.',
  },
];

export default function StartProject() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EnquiryValues>({
    resolver: zodResolver(enquirySchema),
    mode: 'onBlur',
    defaultValues: { name: '', business: '', email: '', phone: '', service: '', budget: '', timeline: '', brief: '', consent: false },
  });

  const selectedService = watch('service');

  const onSubmit = async (values: EnquiryValues) => {
    setStatus('submitting');
    const apiUrl = import.meta.env.VITE_API_URL ?? 'https://api.heymovox.com';
    try {
      const res = await fetch(`${apiUrl}/api/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  };

  const inputError = (field: keyof typeof errors) =>
    errors[field]?.message as string | undefined;

  const fieldClass = (hasError?: string) =>
    `w-full rounded-xl border bg-white px-4 py-3 text-sm text-ink placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${
      hasError ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:border-brand-300'
    }`;

  return (
    <>
      <PageHero
        eyebrow="Start a project"
        title={
          <>
            Tell us where you{' '}
            <span className="bg-brand-gradient bg-clip-text text-transparent">want to go.</span>
          </>
        }
        description="Share your goals, budget, and timeline. We will respond within one business day with next steps and a scoped proposal."
      />

      {/* Why Start with MovoX */}
      <section className="bg-brand-50/50 py-16 sm:py-20" aria-labelledby="why-start-heading">
        <div className="container-site">
          <Reveal>
            <div className="max-w-4xl mx-auto text-center mb-14">
              <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-brand-700" id="why-start-heading">
                Why start with MovoX
              </p>
              <h2 className="mt-3 font-heading text-3xl sm:text-4xl font-bold tracking-tight text-ink">
                One brief. One team. Measurable outcomes.
              </h2>
              <p className="mt-5 max-w-2xl mx-auto text-lg leading-relaxed text-slate-600">
                We don\'t just execute — we partner. From first call to post-launch optimization, you work with senior practitioners who own the outcome.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-5xl mx-auto">
              {[
                { icon: Target, title: 'Outcome-focused', text: 'Every engagement has a measurement plan. If we can\'t measure it, we don\'t do it.' },
                { icon: Users, title: 'Senior-only team', text: 'No juniors carrying work. The person who sells the project is the person who leads it.' },
                { icon: Shield, title: 'Transparent by default', text: 'Weekly demos, shared Notion, open Slack. You always know where things stand.' },
              ].map((item, i) => (
                <Reveal key={item.title} delay={0.08 * i}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="group rounded-2xl border border-slate-200/70 bg-white p-7 sm:p-8 text-center shadow-card hover:shadow-card-hover transition-all duration-300"
                  >
                    <div className="group relative flex h-14 w-14 items-center justify-center rounded-xl bg-brand-gradient text-white mx-auto mb-5 shadow-[0_8px_24px_rgba(35,130,184,0.35)]">
                      <item.icon className="h-7 w-7" aria-hidden="true" />
                      <span className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />
                    </div>
                    <h3 className="font-heading text-lg font-bold text-ink">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.text}</p>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-site grid gap-10 pb-20 sm:pb-24 lg:grid-cols-5 lg:gap-12">
        <Reveal className="lg:col-span-3">
          {status === 'success' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-slate-200/70 bg-brand-50/60 p-10 sm:p-12 text-center"
              role="status"
            >
              <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 mb-6">
                <CheckCircle2 className="h-9 w-9 text-brand-600" aria-hidden="true" />
              </div>
              <h2 className="mt-6 font-heading text-2xl font-bold text-ink">
                Thank you — received.
              </h2>
              <p className="mt-4 max-w-md mx-auto text-sm leading-relaxed text-slate-600">
                Your project brief has been submitted. Our team will review it
                within one business day and reach out via email.
              </p>
              <Link to="/portfolio" className="btn btn-primary btn-lg mt-10">
                <span className="btn-content flex items-center justify-center gap-2">
                  Browse our work
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
              {/* Contact Details */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                    <Users className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-ink">Contact details</h3>
                    <p className="text-sm text-slate-500">We\'ll use this to reach out within one business day</p>
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="sp-name" className="mb-1.5 block font-heading text-sm font-semibold text-ink">
                      Name <span className="text-brand-600" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="sp-name"
                      type="text"
                      autoComplete="name"
                      placeholder="Jane Cooper"
                      aria-invalid={Boolean(inputError('name'))}
                      aria-describedby={inputError('name') ? 'sp-name-error' : undefined}
                      className={fieldClass(inputError('name'))}
                      {...register('name')}
                    />
                    {inputError('name') && (
                      <p id="sp-name-error" role="alert" className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <Info className="h-3.5 w-3.5" aria-hidden="true" />
                        {inputError('name')}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="sp-business" className="mb-1.5 block font-heading text-sm font-semibold text-ink">
                      Business name <span className="text-brand-600" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="sp-business"
                      type="text"
                      autoComplete="organization"
                      placeholder="Company, Inc."
                      aria-invalid={Boolean(inputError('business'))}
                      aria-describedby={inputError('business') ? 'sp-business-error' : undefined}
                      className={fieldClass(inputError('business'))}
                      {...register('business')}
                    />
                    {inputError('business') && (
                      <p id="sp-business-error" role="alert" className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <Info className="h-3.5 w-3.5" aria-hidden="true" />
                        {inputError('business')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 mt-5">
                  <div>
                    <label htmlFor="sp-email" className="mb-1.5 block font-heading text-sm font-semibold text-ink">
                      Work email <span className="text-brand-600" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="sp-email"
                      type="email"
                      autoComplete="email"
                      placeholder="jane@company.com"
                      aria-invalid={Boolean(inputError('email'))}
                      aria-describedby={inputError('email') ? 'sp-email-error' : undefined}
                      className={fieldClass(inputError('email'))}
                      {...register('email')}
                    />
                    {inputError('email') && (
                      <p id="sp-email-error" role="alert" className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <Info className="h-3.5 w-3.5" aria-hidden="true" />
                        {inputError('email')}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="sp-phone" className="mb-1.5 block font-heading text-sm font-semibold text-ink">
                      Phone number
                    </label>
                    <input
                      id="sp-phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+91 95006 21262"
                      aria-invalid={Boolean(inputError('phone'))}
                      aria-describedby={inputError('phone') ? 'sp-phone-error' : undefined}
                      className={fieldClass(inputError('phone'))}
                      {...register('phone')}
                    />
                    {inputError('phone') && (
                      <p id="sp-phone-error" role="alert" className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <Info className="h-3.5 w-3.5" aria-hidden="true" />
                        {inputError('phone')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Service Selection */}
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                    <Target className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-ink">What do you need?</h3>
                    <p className="text-sm text-slate-500">Select the service that best matches your needs</p>
                  </div>
                </div>
                {selectedService && (
                  <div className="mb-5 p-4 rounded-xl bg-brand-50 border border-brand-200 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600 flex-shrink-0">
                      <ServiceIcon name={services.find(s => s.slug === selectedService)?.icon ?? ''} className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-heading text-sm font-semibold text-brand-700">
                        {services.find(s => s.slug === selectedService)?.name}
                      </p>
                      <p className="text-sm text-brand-600">{serviceDescriptions[selectedService] ?? ''}</p>
                    </div>
                  </div>
                )}
                <Controller
                  control={control}
                  name="service"
                  render={({ field }) => (
                    <fieldset>
                      <legend className="sr-only">What do you need?</legend>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {services.map((s) => (
                          <label
                            key={s.slug}
                            className={`relative cursor-pointer rounded-xl border p-4 font-heading text-sm font-semibold transition-all duration-200 group ${
                              field.value === s.slug
                                ? 'border-brand-500 bg-brand-gradient text-white shadow-[0_8px_24px_rgba(35,130,184,0.30)]'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:border-brand-200'
                            }`}
                          >
                            <input
                              type="radio"
                              className="sr-only"
                              value={s.slug}
                              checked={field.value === s.slug}
                              onChange={() => field.onChange(s.slug)}
                            />
                            <div className="flex items-start gap-3">
                              <span className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-gradient group-hover:text-white transition-colors">
                                <ServiceIcon name={s.icon} className="h-5 w-5" />
                                <span className="absolute inset-0 rounded-lg bg-brand-gradient/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-heading font-semibold">{s.shortName}</p>
                                <p className="text-xs text-slate-500 truncate">{serviceDescriptions[s.slug]}</p>
                              </div>
                            </div>
                          </label>
                        ))}
                        <label
                          className={`relative cursor-pointer rounded-xl p-4 font-heading text-sm font-semibold transition-all duration-200 ${
                            field.value === 'multiple'
                              ? 'border-brand-500 bg-brand-gradient text-white shadow-[0_8px_24px_rgba(35,130,184,0.30)]'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50'
                          }`}
                        >
                          <input
                            type="radio"
                            className="sr-only"
                            value="multiple"
                            checked={field.value === 'multiple'}
                            onChange={() => field.onChange('multiple')}
                          />
                          <div className="flex items-start gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                              <Target className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <div>
                              <p className="font-heading font-semibold">Multiple / not sure</p>
                              <p className="text-xs text-slate-500">We\'ll help you figure out the right mix</p>
                            </div>
                          </div>
                        </label>
                      </div>
                      {inputError('service') && (
                        <p role="alert" className="mt-3 text-xs text-red-600 flex items-center gap-1">
                          <Info className="h-3.5 w-3.5" aria-hidden="true" />
                          {inputError('service')}
                        </p>
                      )}
                    </fieldset>
                  )}
                />
              </div>

              {/* Budget & Timeline */}
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                    <Shield className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-ink">Budget & timeline</h3>
                    <p className="text-sm text-slate-500">Help us scope the right solution for your investment</p>
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Controller
                    control={control}
                    name="budget"
                    render={({ field }) => (
                      <div>
                        <label htmlFor="sp-budget" className="mb-1.5 block font-heading text-sm font-semibold text-ink">
                          Budget range <span className="text-brand-600" aria-hidden="true">*</span>
                        </label>
                        <select
                          id="sp-budget"
                          aria-invalid={Boolean(inputError('budget'))}
                          className={fieldClass(inputError('budget'))}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                        >
                          <option value="">Select a range…</option>
                          {budgetRanges.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                        {inputError('budget') && (
                          <p role="alert" className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                            <Info className="h-3.5 w-3.5" aria-hidden="true" />
                            {inputError('budget')}
                          </p>
                        )}
                      </div>
                    )}
                  />
                  <Controller
                    control={control}
                    name="timeline"
                    render={({ field }) => (
                      <div>
                        <label htmlFor="sp-timeline" className="mb-1.5 block font-heading text-sm font-semibold text-ink">
                          Preferred timeline <span className="text-brand-600" aria-hidden="true">*</span>
                        </label>
                        <select
                          id="sp-timeline"
                          aria-invalid={Boolean(inputError('timeline'))}
                          className={fieldClass(inputError('timeline'))}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                        >
                          <option value="">Select a timeline…</option>
                          {timelines.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        {inputError('timeline') && (
                          <p role="alert" className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                            <Info className="h-3.5 w-3.5" aria-hidden="true" />
                            {inputError('timeline')}
                          </p>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Project Brief */}
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                    <FileText className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-ink">Project brief</h3>
                    <p className="text-sm text-slate-500">Help us understand your vision</p>
                  </div>
                </div>
                <textarea
                  id="sp-brief"
                  rows={7}
                  placeholder="What are you building, who is it for, and what does success look like? Links to existing material welcome."
                  aria-invalid={Boolean(inputError('brief'))}
                  aria-describedby={inputError('brief') ? 'sp-brief-error' : undefined}
                  className={`${fieldClass(inputError('brief'))} resize-y`}
                  {...register('brief')}
                />
                <div className="mt-2 flex items-center justify-between">
                  {inputError('brief') ? (
                    <p id="sp-brief-error" role="alert" className="text-xs text-red-600 flex items-center gap-1">
                      <Info className="h-3.5 w-3.5" aria-hidden="true" />
                      {inputError('brief')}
                    </p>
                  ) : (
                    <span className="text-xs text-slate-400">Min. 30 characters</span>
                  )}
                </div>
              </div>

              {/* Consent */}
              <div className="mt-6 rounded-2xl border border-slate-200 bg-brand-50/50 p-6 sm:p-8">
                <legend className="mb-3 font-heading text-sm font-semibold text-ink">
                  Consent <span className="text-brand-600" aria-hidden="true">*</span>
                </legend>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                    aria-invalid={Boolean(inputError('consent'))}
                    aria-describedby={inputError('consent') ? 'sp-consent-error' : undefined}
                    {...register('consent')}
                  />
                  <span className="text-sm leading-relaxed text-slate-700">
                    I agree to the processing of my data as described in the{' '}
                    <Link to="/privacy-policy" className="font-semibold text-brand-700 underline underline-offset-2">
                      Privacy Policy
                    </Link>
                    . <span className="text-brand-600" aria-hidden="true">*</span>
                  </span>
                </label>
                {inputError('consent') && (
                  <p id="sp-consent-error" role="alert" className="mt-2 text-xs text-red-600 flex items-center gap-1">
                    <Info className="h-3.5 w-3.5" aria-hidden="true" />
                    {inputError('consent')}
                  </p>
                )}
              </div>

              {status === 'error' && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-3"
                >
                  <Info className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>Something went wrong while submitting. Please try again, or contact us directly at info@heymovox.com.</span>
                </motion.p>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="btn btn-primary btn-lg w-full sm:w-auto"
                >
                  <span className="btn-content flex items-center justify-center gap-2">
                    {status === 'submitting' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" aria-hidden="true" />
                        Submit enquiry
                      </>
                    )}
                  </span>
                </button>
                <a
                  href="https://wa.me/919500621262"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-lg w-full sm:w-auto"
                >
                  <span className="btn-content flex items-center justify-center gap-2">
                    <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    Chat on WhatsApp
                  </span>
                </a>
              </div>

              
            </form>
          )}
        </Reveal>

        <Reveal delay={0.1} className="lg:col-span-2">
          <aside className="space-y-6 lg:sticky lg:top-[132px]">
            {/* What happens next */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                  <Zap className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="font-heading text-lg font-bold text-ink">What happens next</h2>
              </div>
              <ol className="space-y-4">
                {[
                  'We review your brief within one business day.',
                  'A discovery call to align on goals and scope.',
                  'A scoped proposal: timeline, deliverables, fixed quote.',
                ].map((step, i) => (
                  <li key={step} className="flex items-start gap-3.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-gradient font-heading text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <p className="pt-0.5 text-sm leading-relaxed text-slate-700">{step}</p>
                  </li>
                ))}
              </ol>
            </div>

            {/* Data protection */}
            <div className="rounded-2xl bg-brand-gradient p-6 sm:p-7 text-white shadow-[0_16px_48px_rgba(0,54,85,0.20)]">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <ShieldCheck className="h-6 w-6 text-brand-100" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-bold">Your data, protected</h2>
                  <p className="mt-2 text-sm leading-relaxed text-brand-100/85">
                    Enquiries are stored securely, never sold, and used only to respond to
                    your project. See our Privacy Policy for details and your rights.
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-7">
              <h2 className="font-heading text-lg font-bold text-ink mb-4">Quick answers</h2>
              <div className="space-y-2" role="list">
                {faqs.map((faq, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="rounded-xl border border-slate-200 bg-white overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      aria-expanded={openFaq === i}
                      className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-slate-50/50 transition-colors"
                    >
                      <span className="flex-1 font-heading text-sm font-semibold text-ink pr-4">{faq.q}</span>
                      {openFaq === i ? (
                        <ChevronUp className="h-5 w-5 text-slate-400 shrink-0" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" aria-hidden="true" />
                      )}
                    </button>
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: openFaq === i ? 'auto' : 0, opacity: openFaq === i ? 1 : 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-slate-100 text-sm leading-relaxed text-slate-600">{faq.a}</div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-2xl bg-brand-gradient p-6 sm:p-7 text-white shadow-[0_16px_48px_rgba(0,54,85,0.20)] text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 mx-auto mb-4">
                <Building2 className="h-6 w-6 text-brand-100" aria-hidden="true" />
              </div>
              <h2 className="font-heading text-lg font-bold">Prefer to talk first?</h2>
              <p className="mt-2 text-sm leading-relaxed text-brand-100/85">
                Book a 30-minute discovery call — no obligation, just a conversation.
              </p>
              <Link
                to="/start-a-project"
                className="mt-5 inline-flex items-center justify-center gap-2 btn btn-primary btn-sm"
              >
                <span className="btn-content flex items-center gap-2">
                  Book a call
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            </div>
          </aside>
        </Reveal>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-24" aria-labelledby="faq-heading">
        <div className="container-site">
          <Reveal>
            <div className="max-w-3xl mx-auto text-center mb-12">
              <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-brand-700" id="faq-heading">
                Still have questions?
              </p>
              <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Common questions about starting a project
              </h2>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="max-w-3xl mx-auto space-y-3" role="list">
              {faqs.map((faq, i) => (
                <Reveal key={i} delay={i * 0.05}>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="rounded-xl border border-slate-200 bg-white overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      aria-expanded={openFaq === i}
                      className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-slate-50/50 transition-colors"
                    >
                      <span className="flex-1 font-heading text-base font-semibold text-ink pr-4">{faq.q}</span>
                      {openFaq === i ? (
                        <ChevronUp className="h-5 w-5 text-slate-400 shrink-0" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" aria-hidden="true" />
                      )}
                    </button>
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: openFaq === i ? 'auto' : 0, opacity: openFaq === i ? 1 : 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-slate-100 text-sm leading-relaxed text-slate-600">{faq.a}</div>
                    </motion.div>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

    </>
  );
}