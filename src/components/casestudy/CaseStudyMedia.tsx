/**
 * Cover artwork + lightbox, share row and the sample-content disclosure.
 *
 * The card overlaps the dark hero above it (see `relative z-10`), giving the
 * page its signature "artwork breaking out of the masthead" treatment.
 */
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Copy, Expand, Info, Link2, MessageCircle, X } from 'lucide-react';
import type { CaseStudy } from '../../data/portfolio';
import { categoryMeta, caseStudyUrl } from './helpers';

export function CaseStudyMedia({ project }: { project: CaseStudy }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const meta = categoryMeta[project.category] ?? categoryMeta.Branding;
  const Icon = meta.icon;
  const url = caseStudyUrl(project.slug);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const share = [
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      label: 'X',
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(project.title)}`,
    },
    {
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(`${project.title} — ${url}`)}`,
    },
  ];

  return (
    <>
      <div className="container-site relative z-10 -mt-28 pb-12 sm:-mt-36 sm:pb-16">
        <motion.figure
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white shadow-[0_28px_70px_rgba(0,37,59,0.35)] sm:rounded-[2rem]"
        >
          <div className="group relative aspect-[16/10] w-full overflow-hidden bg-slate-100 sm:aspect-[21/9]">
            <img
              src={project.image}
              alt={`${project.title} — project visual`}
              className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-950/55 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-brand-950/70 px-4 py-2 font-heading text-xs font-bold text-white opacity-0 backdrop-blur-md transition-all duration-300 hover:bg-brand-950 focus-visible:opacity-100 group-hover:opacity-100"
            >
              <Expand className="h-4 w-4" aria-hidden="true" />
              View fullscreen
            </button>
          </div>

          <figcaption className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-5 py-4">
            <span className="flex items-center gap-3">
              <span
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${meta.light}`}
                aria-hidden="true"
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-heading text-sm font-bold text-ink">
                  {project.title}
                </span>
                <span className="block text-xs text-slate-500">
                  {project.category} · {project.year || 'Year n/a'} · {project.client || 'MovoX client'}
                </span>
              </span>
            </span>

            <span className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    Copy link
                  </>
                )}
              </button>
              {share.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700"
                >
                  {s.label === 'WhatsApp' && (
                    <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {s.label !== 'WhatsApp' && <Link2 className="h-3.5 w-3.5" aria-hidden="true" />}
                  {s.label}
                </a>
              ))}
            </span>
          </figcaption>
        </motion.figure>

        {project.isSample && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5"
            role="note"
          >
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-amber-900">
              <strong className="font-semibold">Sample case study.</strong> This entry
              demonstrates the case study structure. Replace it with a real client
              project — including written client consent and verified results — before
              publishing.
            </p>
          </motion.div>
        )}
      </div>

      {/* lightbox */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[90] flex flex-col bg-brand-950/96 p-4 backdrop-blur-md sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={`${project.title} — full size project visual`}
            onClick={close}
          >
            <div className="flex items-center justify-between gap-4">
              <p className="min-w-0 truncate font-heading text-sm font-bold text-white">
                {project.title}
              </p>
              <button
                type="button"
                onClick={close}
                aria-label="Close fullscreen view"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <motion.img
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              src={project.image}
              alt={`${project.title} — project visual (full size)`}
              onClick={(e) => e.stopPropagation()}
              className="mx-auto my-4 min-h-0 w-full flex-1 rounded-2xl object-contain"
            />
            <p className="text-center text-xs text-brand-100/75">
              Press <strong className="text-white">Esc</strong> or click outside to close
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
