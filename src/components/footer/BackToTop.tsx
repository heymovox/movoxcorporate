/**
 * Floating back-to-top control.
 *
 * Fades in once the visitor is far enough down the page to want it, and
 * respects prefers-reduced-motion.
 */
import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '../../lib/utils';

export function BackToTop({ threshold = 400 }: { threshold?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  function scrollToTop() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={cn(
        'fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full',
        'bg-brand-gradient text-white shadow-[0_10px_30px_rgba(0,54,85,0.28)]',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(0,54,85,0.34)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
      )}
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}