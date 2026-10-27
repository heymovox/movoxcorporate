/**
 * Sticky "jump to" navigation with scroll-spy.
 *
 * Sits directly under the fixed header (top-16 matches its scrolled height) and
 * keeps the long case-study body navigable.
 */
import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

export interface JumpItem {
  id: string;
  label: string;
}

export function JumpNav({ items }: { items: JumpItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? '');

  useEffect(() => {
    if (items.length === 0) return;
    const sections = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-140px 0px -55% 0px', threshold: 0 },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="sticky top-16 z-40 border-y border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <nav
        aria-label="Case study sections"
        className="container-site flex items-center gap-1 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <span className="mr-2 hidden shrink-0 font-heading text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:inline">
          In this study
        </span>
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={isActive ? 'true' : undefined}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 font-heading text-xs font-semibold transition-all duration-300',
                isActive
                  ? 'bg-brand-gradient text-white shadow-[0_6px_16px_rgba(35,130,184,0.3)]'
                  : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700',
              )}
            >
              {item.label}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
