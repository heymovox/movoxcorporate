import { Link } from 'react-router-dom';
import { ArrowRight, Users, Target, Shield, Zap, Heart, Globe, Award, Building2, Lightbulb, MessageSquare, CheckCircle2, ChevronDown, Palette, Code, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { useSEO } from '../lib/seo';
import { PageHero } from '../components/PageHero';
import { SectionHeading } from '../components/SectionHeading';
import { Reveal } from '../components/Reveal';

const values = [
  {
    title: 'Craft over volume',
    text: 'We take fewer projects and go deeper on each one. Senior people only — the person who pitches the work is the person who does it.',
    icon: Target,
  },
  {
    title: 'Evidence over opinion',
    text: 'Every recommendation ships with its reasoning and its measure. Taste starts the conversation; data finishes it.',
    icon: Shield,
  },
  {
    title: 'Long-term over transactional',
    text: 'Most of our clients stay for years. We earn that by treating their budget like our own and their outcomes like our reputation.',
    icon: Heart,
  },
  {
    title: 'Honest over agreeable',
    text: 'If your idea will not work, we say so — in the room, with an alternative. Clients hire us for the truth, not for comfort.',
    icon: Lightbulb,
  },
];

const timeline = [
  { year: '2018', event: 'Founded as a two-person design studio in San Francisco.', milestone: 'Founded' },
  { year: '2019', event: 'Added web development; first integrated brand-to-web engagements.', milestone: 'Web Dev Added' },
  { year: '2021', event: 'Launched the marketing & SEO practice; 20th client milestone.', milestone: 'Marketing Launched' },
  { year: '2023', event: 'Mobile app team formed; first cross-platform product launches.', milestone: 'App Team Formed' },
  { year: '2025', event: '120+ projects delivered across 12 industries and 3 continents.', milestone: 'Global Scale' },
];

const teamMembers = [
  { name: 'Design & Brand', role: 'Identity, packaging, and visual systems', icon: Palette, color: 'from-pink-500 to-rose-500' },
  { name: 'Engineering', role: 'Web and mobile development', icon: Code, color: 'from-blue-500 to-indigo-500' },
  { name: 'Growth', role: 'SEO, paid media, and analytics', icon: TrendingUp, color: 'from-emerald-500 to-teal-500' },
];

const philosophy = [
  {
    title: 'One team, one brief',
    text: 'No handoffs between design, dev, and marketing. The people who strategy are the people who execute.',
    icon: Users,
  },
  {
    title: 'Senior-only execution',
    text: 'No junior handoffs. The person who sells the project is the person who leads it.',
    icon: Award,
  },
  {
    title: 'Outcome-obsessed',
    text: 'Every engagement has a measurement plan. If we can\'t measure it, we don\'t do it.',
    icon: Target,
  },
  {
    title: 'Transparent by default',
    text: 'Weekly demos, shared Notion, open Slack. You always know where things stand.',
    icon: MessageSquare,
  },
  {
    title: 'Built to last',
    text: 'Clean code, design systems, documented handoffs. Work that survives team changes.',
    icon: Shield,
  },
  {
    title: 'Continuous improvement',
    text: 'Post-launch measurement, iteration, and optimization are part of every engagement.',
    icon: Zap,
  },
];

const stats = [
  { label: 'Projects delivered', value: '120+', icon: CheckCircle2 },
  { label: 'Clients across sectors', value: '60+', icon: Building2 },
  { label: 'Industries served', value: '12+', icon: Globe },
  { label: 'Years of expertise', value: '8+', icon: Award },
  { label: 'Team retention', value: '95%', icon: Heart },
  { label: 'Client retention', value: '90%+', icon: Users },
];

export default function About() {
  useSEO({
    title: 'About MovoX — Integrated Digital Growth Company',
    description:
      'MovoX is an integrated digital growth company combining design, engineering, and marketing under one roof since 2018. 120+ projects, 60+ clients, 12+ industries.',
    path: '/about',
  });

  return (
    <>
      {/* Hero */}
      <PageHero
        eyebrow="About MovoX"
        title={
          <>
            Built to execute.{' '}
            <span className="bg-brand-gradient bg-clip-text text-transparent">
              Measured by results.
            </span>
          </>
        }
        description="Founded in 2018, MovoX is an integrated digital growth company. We combine graphic design, branding & packaging, website & app development, and digital marketing & SEO into one accountable team."
      />

      {/* Key Stats */}
      <section className="bg-brand-50/50 py-12 sm:py-16" aria-labelledby="stats-heading">
        <div className="container-site">
          <Reveal>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 max-w-5xl mx-auto text-center">
              {stats.map((stat, i) => (
                <Reveal key={stat.label} delay={i * 0.08}>
                  <div className="h-full rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 flex flex-col">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-white mx-auto mb-3 shadow-[0_4px_14px_rgba(35,130,184,0.35)]">
                      <stat.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="font-heading text-3xl sm:text-4xl font-extrabold text-ink">{stat.value}</p>
                      <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Story & Timeline */}
      <section className="container-site grid gap-14 pb-20 sm:pb-24 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-ink">Our story</h2>
            <div className="mt-5 space-y-5 text-base leading-relaxed text-slate-700">
              <p>
                MovoX started with a simple observation: the best work happens when
                design, engineering, and marketing stop being vendors and start being
                one team. Too many companies stitch together an agency, a dev shop,
                and an SEO consultant — then spend more energy managing the seams
                than doing the work.
              </p>
              <p>
                We built the opposite. One studio, one brief, one standard. Designers
                who understand developers, developers who respect designers, and
                marketers who speak both languages — all accountable to the same
                outcome.
              </p>
              <p>
                Eight years and 120+ projects later, that model has taken us from
                two-person design studio to an integrated growth partner for clients
                across 12 industries — without a single handoff-based account layer
                added.
              </p>
            </div>
            
            {/* Mission/Vision */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="rounded-2xl border border-slate-200/70 bg-brand-50/60 p-6 hover:border-brand-200 hover:shadow-card-hover transition-all duration-300"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-white mb-4">
                  <Target className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="font-heading text-lg font-bold text-ink">Mission</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Help ambitious brands grow through integrated design, engineering, and marketing — delivered by one senior team.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="rounded-2xl border border-slate-200/70 bg-brand-50/60 p-6 hover:border-brand-200 hover:shadow-card-hover transition-all duration-300"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-white mb-4">
                  <Globe className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="font-heading text-lg font-bold text-ink">Vision</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Become the most trusted integrated growth partner for brands that value craft, evidence, and long-term partnerships.
                </p>
              </motion.div>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-slate-200/70 bg-brand-50/60 p-8 h-full">
            <h2 className="font-heading text-2xl font-bold text-ink">Milestones</h2>
            <ol className="mt-6 space-y-0">
              {timeline.map((t, index) => (
                <motion.li
                  key={t.year}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className="relative flex gap-5 pb-7 last:pb-0"
                >
                  <span className="absolute left-[7px] top-5 h-full w-px bg-brand-200 last:hidden" aria-hidden="true" />
                  <span className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-brand-500 bg-white" aria-hidden="true" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-heading text-sm font-bold text-brand-700">{t.year}</p>
                      <span className="chip text-[10px] py-0.5 px-2">{t.milestone}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-slate-700">{t.event}</p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </Reveal>
      </section>

      {/* Philosophy / Approach */}
      <section className="bg-brand-50/50 py-20 sm:py-24" aria-labelledby="philosophy-heading">
        <div className="container-site">
          <SectionHeading
            eyebrow="How we work"
            title={<span id="philosophy-heading">Our philosophy.</span>}
            description="Six principles that guide every decision — from who we hire to how we deliver."
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {philosophy.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="card-surface h-full p-7 hover:shadow-card-hover transition-all duration-300"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-[0_8px_24px_rgba(35,130,184,0.35)] mb-5">
                    <p.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-ink">{p.title}</h3>
                  <p className="mt-2.5 text-base leading-relaxed text-slate-600">{p.text}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-20 sm:py-24" aria-labelledby="values-heading">
        <div className="container-site">
          <SectionHeading
            eyebrow="How we work"
            title={<span id="values-heading">Studio values.</span>}
            description="Four principles that decide every question we cannot answer with a process."
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="card-surface h-full p-8 hover:shadow-card-hover transition-all duration-300"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-[0_8px_24px_rgba(35,130,184,0.35)] mb-5">
                    <v.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-ink">{v.title}</h3>
                  <p className="mt-2.5 text-base leading-relaxed text-slate-600">{v.text}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-brand-50/50 py-20 sm:py-24" aria-labelledby="team-heading">
        <div className="container-site">
          <SectionHeading
            eyebrow="The team"
            title={<span id="team-heading">Small by senior by design.</span>}
            description="A compact team of designers, engineers, and marketers — no juniors carrying work, no layers between you and the people doing it."
          />
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {teamMembers.map((team, i) => (
              <Reveal key={team.name} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className={`rounded-2xl p-8 text-white shadow-[0_16px_48px_rgba(0,54,85,0.20)] bg-gradient-to-br ${team.color}`}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm mb-5">
                    <team.icon className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <h3 className="font-heading text-lg font-bold">{team.name}</h3>
                  <p className="mt-2 text-sm text-white/85">{team.role}</p>
                  <Link
                    to="/start-a-project"
                    className="mt-6 inline-flex items-center gap-1.5 font-heading text-sm font-semibold text-white hover:text-brand-100 transition-colors"
                  >
                    Meet us on a call
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </motion.div>
              </Reveal>
            ))}
          </div>
          
          {/* Team Philosophy */}
          <Reveal delay={0.3} className="mt-16">
            <div className="rounded-2xl border border-slate-200/70 bg-brand-50/60 p-8 sm:p-12 text-center max-w-3xl mx-auto">
              <h3 className="font-heading text-2xl font-bold text-ink">How we work together</h3>
              <p className="mt-4 text-base leading-relaxed text-slate-600 max-w-xl mx-auto">
                Every project is led by a senior partner who owns the outcome. No account managers, no junior handoffs, no surprises. 
                You work directly with the people doing the work — from day one to delivery and beyond.
              </p>
              <Link
                to="/start-a-project"
                className="mt-8 inline-flex items-center gap-2 btn btn-primary btn-lg"
              >
                <span className="btn-content flex items-center justify-center gap-2">
                  Start a conversation
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

{/* Culture & Approach */}
      <section className="bg-white py-20 sm:py-24" aria-labelledby="culture-heading">
        <div className="container-site">
          <SectionHeading
            eyebrow="Inside MovoX"
            title={<span id="culture-heading">How we operate day to day.</span>}
            description="The rituals, tools, and habits that keep our work sharp and our clients informed."
          />
          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {[
              { title: 'Weekly demos', text: 'Every Friday, the team shows real work-in-progress. Clients invited. No surprises.', icon: Zap },
              { title: 'Shared Notion workspace', text: 'Project plans, assets, feedback, decisions — all in one place. You always have access.', icon: MessageSquare },
              { title: 'Slack connect', text: 'Direct line to your project lead. Questions answered in minutes, not days.', icon: MessageSquare },
              { title: 'Design system first', text: 'Every project builds on a shared component library. Consistency compounds.', icon: Shield },
              { title: 'Retros every sprint', text: 'What worked, what didn\'t, what we\'ll improve. Continuous improvement is non-negotiable.', icon: ArrowRight },
              { title: 'Knowledge sharing', text: 'Monthly lunch & learns: new tools, techniques, case studies. We grow together.', icon: Lightbulb },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="card-surface h-full p-7 hover:shadow-card-hover transition-all duration-300"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-[0_8px_24px_rgba(35,130,184,0.35)] mb-5">
                    <item.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-ink">{item.title}</h3>
                  <p className="mt-2.5 text-base leading-relaxed text-slate-600">{item.text}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Client Trust / Social Proof */}
      <section className="bg-brand-50/50 py-20 sm:py-24" aria-labelledby="trust-heading">
        <div className="container-site">
          <SectionHeading
            eyebrow="Client trust"
            title={<span id="trust-heading">Why clients stay.</span>}
            description="Our longest client relationship is 6+ years. Here's why they keep coming back."
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { stat: '90%+', label: 'Client retention rate', desc: 'Clients return for multiple engagements' },
              { stat: '6+ years', label: 'Longest relationship', desc: 'Continuous partnership since 2018' },
              { stat: '100%', label: 'Senior-led projects', desc: 'No junior handoffs, ever' },
              { stat: '48 hrs', label: 'Avg. response time', desc: 'Business hours, direct to project lead' },
              { stat: '3', label: 'Revision rounds included', desc: 'Per design milestone, no surprise fees' },
              { stat: '100%', label: 'Source files delivered', desc: 'AI, Figma, PSD — you own everything' },
            ].map((item, i) => (
              <Reveal key={item.label} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="card-surface h-full p-7 text-center hover:shadow-card-hover transition-all duration-300"
                >
                  <p className="font-heading text-4xl font-extrabold text-ink">{item.stat}</p>
                  <p className="mt-1 font-heading text-lg font-semibold text-brand-700">{item.label}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-20 sm:py-24" aria-labelledby="faq-heading">
        <div className="container-site">
          <SectionHeading
            eyebrow="Questions"
            title={<span id="faq-heading">Frequently asked.</span>}
            description="Common questions about how we work, what to expect, and how to get started."
          />
          <div className="mt-12 max-w-3xl mx-auto space-y-3" role="list">
            {[
              { q: 'How does an engagement start?', a: 'With a 30-minute discovery call. We learn your goals, constraints, and timeline. Then we send a detailed proposal with scope, timeline, and fixed pricing — no obligation.' },
              { q: 'Do you work with in-house teams?', a: 'Yes. We embed directly with your designers, developers, and marketers. Many clients use us to extend capacity or add specialized expertise.' },
              { q: 'What is your typical project timeline?', a: 'Brand identity: 6–10 weeks. Website: 8–16 weeks. App MVP: 12–20 weeks. Marketing programs: ongoing monthly. We provide detailed timelines in every proposal.' },
              { q: 'What if we need changes after launch?', a: 'Every engagement includes a support period (30–120 days). After that, you can engage us on a retainer or purchase support packs for ongoing work.' },
              { q: 'Do you require long-term contracts?', a: 'Project work is fixed-scope, fixed-price. Retainers are month-to-month with 30-day notice. No annual lock-ins unless you want one.' },
            ].map((faq, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 * i }}
                  className="rounded-xl border border-slate-200/70 bg-white overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => {}}
                    aria-expanded={false}
                    className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-slate-50/50 transition-colors"
                  >
                    <span className="flex-1 font-heading text-base font-semibold text-ink pr-4">{faq.q}</span>
                    <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" aria-hidden="true" />
                  </button>
                  <div className="px-5 pb-5 border-t border-slate-100 text-base leading-relaxed text-slate-600">{faq.a}</div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
