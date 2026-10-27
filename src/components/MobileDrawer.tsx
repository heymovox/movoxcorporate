/**
 * Left-side drawer for small screens.
 *
 * Handles the bits that are easy to get wrong per-implementation: overlay
 * click, Escape, body scroll lock, focus trap and focus restoration.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useFocusTrap } from './header/useHeaderBehaviour';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Used for the dialog's accessible name. */
  label: string;
  children: ReactNode;
  className?: string;
}

export function MobileDrawer({
  open,
  onClose,
  label,
  children,
  className,
}: MobileDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  useFocusTrap(panelRef, open);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className={cn(
              'fixed inset-y-0 left-0 z-50 w-[86vw] max-w-xs overflow-y-auto overscroll-contain bg-white shadow-2xl lg:hidden',
              className,
            )}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Hamburger trigger used by both dashboards. */
export function DrawerTrigger({
  onClick,
  controls,
  label = 'Open navigation',
}: {
  onClick: () => void;
  controls: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-controls={controls}
      aria-expanded={false}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-ink transition-colors hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 lg:hidden"
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    </button>
  );
}