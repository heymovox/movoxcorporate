import { useState } from 'react';
import { Mail, Phone, MapPin, MessageCircle, Send, CheckCircle2, Navigation, ExternalLink, Star } from 'lucide-react';
import { useSEO } from '../lib/seo';
import { PageHero } from '../components/PageHero';
import { Reveal } from '../components/Reveal';

const contactChannels = [
  {
    Icon: Mail,
    label: 'Email',
    value: 'info@heymovox.com',
    href: 'mailto:info@heymovox.com',
    note: 'For general enquiries and proposals',
  },
  {
    Icon: Phone,
    label: 'Phone',
    value: '+91 95006 21262',
    href: 'tel:+919500621262',
    note: 'Mon–Fri, 9:30–18:30 IST',
  },
  {
    Icon: MessageCircle,
    label: 'WhatsApp',
    value: '+91 95006 21262',
    href: 'https://wa.me/919500621262',
    target: '_blank' as const,
    note: 'Fastest response for urgent enquiries',
  },
  {
    Icon: MapPin,
    label: 'Studio',
    value: 'TB Link Rd, Old Pet, Krishnagiri – 635001',
    href: undefined,
    note: 'By appointment',
  },
];

/**
 * Live Google Business Profile data for the studio, verified against the
 * Google Maps place "MovoX - Digital Growth Agency" (place ID
 * ChIJYQTi-kc1rDsRNVZAUsyPHFo).
 */
const MOVOX_PLACE = {
  name: 'MovoX - Digital Growth Agency',
  category: 'Design agency',
  address: 'TB Link Rd, near Thirupathi Gounder Mahal, Old Pet, Krishnagiri, Tamil Nadu 635001',
  lat: 12.5288572,
  lng: 78.2137412,
  rating: 4.9,
  reviews: 40,
  placeId: 'ChIJYQTi-kc1rDsRNVZAUsyPHFo',
  /** Embed pinned to the exact listing (z=17 street-level). */
  embedUrl:
    'https://maps.google.com/maps?q=MovoX%20-%20Digital%20Growth%20Agency%20Krishnagiri%20Tamil%20Nadu&t=&z=17&ie=UTF8&iwloc=&output=embed',
  /** Opens the listing itself (ratings + reviews) in Google Maps. */
  placeUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJYQTi-kc1rDsRNVZAUsyPHFo',
  /** Turn-by-turn directions to the exact coordinates. */
  directionsUrl:
    'https://www.google.com/maps/dir/?api=1&destination=12.5288572%2C78.2137412&destination_place_id=ChIJYQTi-kc1rDsRNVZAUsyPHFo',
};

/** Star row that shows a fractional rating (e.g. 4.9) accurately. */
function Stars({ value }: { value: number }) {
  const stars = [0, 1, 2, 3, 4];
  return (
    <span
      className="relative inline-flex shrink-0 align-middle"
      role="img"
      aria-label={`${value} out of 5 stars`}
    >
      <span className="flex gap-0.5 text-slate-200">
        {stars.map((i) => (
          <Star key={i} className="h-3.5 w-3.5 shrink-0 fill-current" aria-hidden="true" />
        ))}
      </span>
      <span
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${(value / 5) * 100}%` }}
        aria-hidden="true"
      >
        <span className="flex gap-0.5 text-amber-400">
          {stars.map((i) => (
            <Star key={i} className="h-3.5 w-3.5 shrink-0 fill-current" aria-hidden="true" />
          ))}
        </span>
      </span>
    </span>
  );
}

export default function Contact() {
  useSEO({
    title: 'Contact MovoX',
    description:
      'Get in touch with the MovoX team — by email, phone, WhatsApp, or the studio in San Francisco.',
    path: '/contact',
  });

  const [sent, setSent] = useState(false);

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={
          <>
            Let's start a{' '}
            <span className="bg-brand-gradient bg-clip-text text-transparent">conversation.</span>
          </>
        }
        description="Reach us on whichever channel suits you. For project enquiries with a brief, the Start a Project form gets you to the right team fastest."
      />

      <section className="container-site grid gap-10 pb-20 sm:pb-24 lg:grid-cols-5 lg:gap-14">
        <div className="space-y-5 lg:col-span-3">
          {contactChannels.map(({ Icon, label, value, href, note, target }, i) => {
            const inner = (
              <>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {label}
                  </p>
                  <p className="mt-1 font-heading text-base font-bold text-ink">{value}</p>
                  <p className="mt-1 text-xs text-slate-500">{note}</p>
                </div>
              </>
            );
            return (
              <Reveal key={label} delay={i * 0.06}>
                {href ? (
                  <a
                    href={href}
                    target={target}
                    rel={target ? 'noopener noreferrer' : undefined}
                    className="card-surface flex items-center gap-5 p-5 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
                  >
                    {inner}
                  </a>
                ) : (
                  <div className="card-surface flex items-center gap-5 p-5">{inner}</div>
                )}
              </Reveal>
            );
          })}

          {/* Studio map */}
          <Reveal delay={0.2}>
            <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-heading text-sm font-bold text-ink">{MOVOX_PLACE.name}</p>
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                        {MOVOX_PLACE.category}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      {MOVOX_PLACE.address}
                    </p>

                    {/* live rating + real review total */}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-heading font-bold text-ink">
                        {MOVOX_PLACE.rating.toFixed(1)}
                      </span>
                      <Stars value={MOVOX_PLACE.rating} />
                      <a
                        href={MOVOX_PLACE.placeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-brand-700 underline-offset-2 hover:underline"
                      >
                        {MOVOX_PLACE.reviews} reviews
                      </a>
                      <span className="text-slate-300" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-slate-500">Google Business Profile</span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <a
                    href={MOVOX_PLACE.placeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-amber-300 hover:text-amber-600"
                  >
                    <Star className="h-3.5 w-3.5" aria-hidden="true" />
                    Reviews
                  </a>
                  <a
                    href={MOVOX_PLACE.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700"
                  >
                    <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                    Directions
                    <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
                  </a>
                </div>
              </div>

              <div className="relative h-[340px] w-full sm:h-[400px]">
                <iframe
                  title={`Map showing ${MOVOX_PLACE.name} at ${MOVOX_PLACE.address}`}
                  src={MOVOX_PLACE.embedUrl}
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-3">
                <p className="text-[11px] leading-relaxed text-slate-500">
                  <span className="font-semibold text-slate-700">Exact location:</span>{' '}
                  {MOVOX_PLACE.lat}, {MOVOX_PLACE.lng} · Plus code 7J4WG6H7+GF, Krishnagiri
                </p>
                <a
                  href={MOVOX_PLACE.placeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:underline"
                >
                  View on Google Maps
                  <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
                </a>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.15} className="lg:col-span-2">
          <div className="rounded-2xl bg-brand-gradient p-8 text-white shadow-[0_16px_48px_rgba(0,54,85,0.20)]">
            <h2 className="font-heading text-xl font-bold">Send a quick message</h2>
            <p className="mt-2 text-sm text-brand-100/85">
              This contact form is a UI demonstration and does not transmit data. For a
              working enquiry channel, use Start a Project or contact us directly.
            </p>
            {sent ? (
              <div className="mt-6 flex items-start gap-3 rounded-xl bg-white/10 p-4" role="status">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-100" aria-hidden="true" />
                <p className="text-sm text-brand-50">
                  Thank you — this form does not send messages. Please use one of the
                  channels on the left and we will respond within one business day.
                </p>
              </div>
            ) : (
              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
              >
                <div>
                  <label htmlFor="contact-name" className="mb-1.5 block font-heading text-xs font-semibold text-brand-100">
                    Name
                  </label>
                  <input id="contact-name" name="name" type="text" required autoComplete="name" className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-brand-200/60 focus:border-white" placeholder="Your name" />
                </div>
                <div>
                  <label htmlFor="contact-email" className="mb-1.5 block font-heading text-xs font-semibold text-brand-100">
                    Email
                  </label>
                  <input id="contact-email" name="email" type="email" required autoComplete="email" className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-brand-200/60 focus:border-white" placeholder="you@company.com" />
                </div>
                <div>
                  <label htmlFor="contact-message" className="mb-1.5 block font-heading text-xs font-semibold text-brand-100">
                    Message
                  </label>
                  <textarea id="contact-message" name="message" required rows={4} className="w-full resize-none rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-brand-200/60 focus:border-white" placeholder="How can we help?" />
                </div>
                <button type="submit" className="btn btn-primary btn-lg w-full">
                  <span className="btn-content flex items-center justify-center gap-2">
                    <Send className="h-4 w-4" aria-hidden="true" />
                    Send message
                  </span>
                </button>
              </form>
            )}
          </div>
        </Reveal>
      </section>
    </>
  );
}
