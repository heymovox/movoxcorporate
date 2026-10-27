/**
 * Header behaviour hooks.
 *
 * Kept separate from Header.tsx so the component stays readable.
 */
import { useEffect, useRef, useState, type RefObject } from 'react';

/** True once the page has scrolled past `threshold` pixels. */
export function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return scrolled;
}

/** 0–100 read-progress through the document. */
export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return progress;
}

/**
 * Scroll-spy: returns the path of the nav item whose section is in view.
 * Falls back to the current location so the active item never disappears.
 */
export function useScrollSpy(paths: string[], fallback: string) {
  const [active, setActive] = useState(fallback);

  useEffect(() => {
    let frame = 0;

    const compute = () => {
      frame = 0;
      // Look at the upper third of the viewport.
      const line = window.scrollY + window.innerHeight * 0.3;
      let best = fallback;

      for (const path of paths) {
        const el = document.querySelector<HTMLElement>(`[data-nav-section="${path}"]`);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        const bottom = top + el.offsetHeight;
        if (line >= top && line < bottom) {
          best = path;
          break;
        }
      }

      setActive((prev) => (prev === best ? prev : best));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [paths, fallback]);

  return active;
}

/**
 * Traps Tab focus inside `ref` while `active`, and restores focus to the
 * element that opened it on close. Escape is handled by the caller.
 */
export function useFocusTrap(ref: RefObject<HTMLElement>, active: boolean) {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const node = ref.current;
    if (!node) return;

    const focusables = () =>
      Array.from(
        node.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(el => el.offsetParent !== null);

    // Move focus into the panel on the next frame.
    const raf = window.requestAnimationFrame(() => focusables()[0]?.focus());

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [ref, active]);
}