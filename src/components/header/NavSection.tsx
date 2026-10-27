/**
 * Wraps a block of the page and tags it with a nav path.
 *
 * The header's scroll-spy looks for `[data-nav-section="<path>"]` and lights
 * the matching nav item while that block is in view, so on the homepage the
 * nav tracks which section you're reading.
 */
import type { ElementType, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface Props {
  /** Nav path this block represents, e.g. '/services'. */
  path: string;
  /** How long the block counts as "current" near the bottom of the page. */
  tail?: boolean;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

export function NavSection({
  path,
  tail = false,
  as: Tag = 'div',
  className,
  children,
}: Props) {
  return (
    <Tag data-nav-section={path} className={cn(tail && 'scroll-mt-32', className)}>
      {children}
    </Tag>
  );
}