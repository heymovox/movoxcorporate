/**
 * Mobile menu toggle — hamburger morphs into a close X.
 *
 * Geometry (24x24 icon box, 16x2px lines centred at x=12):
 *
 *   closed          open
 *   ───────  y=8     ─\         line 1: +4px, rotate 45°
 *   ───────  y=12    ────  →    line 2: scaleX(0)
 *   ───────  y=16     ─/         line 3: -4px, rotate -45°
 *
 * Both outer lines translate to y=12 *before* rotating, and rotate about
 * their own centre. Because they land on the same point first, the arms cross
 * exactly at the icon's midpoint instead of drifting apart into a ">" shape.
 *
 * Sequence: the middle line collapses first (0ms), then the outer lines cross
 * (90ms). Delays are direction-aware, so closing plays the sequence backwards.
 */
import { useRef, type Ref } from 'react';
import { cn } from '../../lib/utils';

interface Props {
  open: boolean;
  onToggle: () => void;
  buttonRef?: Ref<HTMLButtonElement>;
}

const LINE_BASE =
  'absolute left-1 right-1 h-0.5 rounded-full will-change-transform ' +
  'transition-[transform,opacity,background-color] ' +
  'duration-[420ms] ease-[cubic-bezier(0.34,1.42,0.64,1)] ' +
  'motion-reduce:transition-none';

// Set one colour per state so tailwind-merge keeps exactly one bg-* class.
// Declaring bg-ink in the base string instead would leave the winner up to
// Tailwind's stylesheet order, and the X would stay ink-coloured.
const colour = (open: boolean) => (open ? 'bg-brand-600' : 'bg-ink');

export function MenuToggle({ open, onToggle, buttonRef }: Props) {
  const localRef = useRef<HTMLButtonElement>(null);
  const ref = buttonRef ?? localRef;

  return (
    <button
      ref={ref}
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={open ? 'Close menu' : 'Open menu'}
      aria-controls="mobile-menu"
      className={cn(
        'relative flex h-11 w-11 items-center justify-center rounded-xl',
        'border bg-white text-ink lg:hidden',
        'transition-all duration-300',
        'hover:bg-brand-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        'active:scale-[0.95]',
        open ? 'border-brand-300 bg-brand-50' : 'border-slate-200 hover:border-brand-300',
      )}
    >
      <span className="relative block h-6 w-6" aria-hidden="true">
        {/* line 1 — upper */}
        <span
          className={cn(LINE_BASE, 'top-[7px]', colour(open), open && 'translate-y-1 rotate-45')}
          style={{ transitionDelay: open ? '90ms' : '0ms' }}
        />
        {/* line 2 — middle, collapses first when opening */}
        <span
          className={cn(LINE_BASE, 'top-[11px] origin-center', colour(open), open && 'scale-x-0 opacity-0')}
          style={{ transitionDelay: open ? '0ms' : '90ms', transitionDuration: '180ms' }}
        />
        {/* line 3 — lower */}
        <span
          className={cn(LINE_BASE, 'top-[15px]', colour(open), open && '-translate-y-1 -rotate-45')}
          style={{ transitionDelay: open ? '90ms' : '0ms' }}
        />
      </span>

      <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
    </button>
  );
}