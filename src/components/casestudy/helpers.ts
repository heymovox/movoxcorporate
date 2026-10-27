/**
 * Shared presentation helpers for the portfolio detail (case study) page.
 *
 * Kept in one place so the hero, sidebar and related-work cards all describe a
 * project with exactly the same accent colour and icon.
 */
import type { LucideIcon } from 'lucide-react';
import { Globe, Megaphone, Palette, Smartphone } from 'lucide-react';
import type { PortfolioCategory } from '../../data/portfolio';

export interface CategoryMeta {
  icon: LucideIcon;
  /** Accent used on dark surfaces (hero, results band). */
  dark: string;
  /** Accent used on light surfaces (cards, chips). */
  light: string;
}

export const categoryMeta: Record<PortfolioCategory, CategoryMeta> = {
  Branding: {
    icon: Palette,
    dark: 'bg-amber-400/15 text-amber-300 border-amber-300/30',
    light: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  Web: {
    icon: Globe,
    dark: 'bg-brand-400/15 text-brand-300 border-brand-300/30',
    light: 'bg-brand-50 text-brand-700 border-brand-200',
  },
  App: {
    icon: Smartphone,
    dark: 'bg-violet-400/15 text-violet-300 border-violet-300/30',
    light: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  Marketing: {
    icon: Megaphone,
    dark: 'bg-emerald-400/15 text-emerald-300 border-emerald-300/30',
    light: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
};

/** Accent cycle used by the results band tiles. */
export const resultAccents = [
  'text-brand-300',
  'text-emerald-300',
  'text-amber-300',
  'text-violet-300',
  'text-rose-300',
] as const;

export interface ParsedValue {
  prefix: string;
  num: number;
  suffix: string;
}

/**
 * Split a result value like "12+ Pages" into a countable number plus its
 * affixes. Returns null for purely textual values ("Print-Ready"), which are
 * rendered statically instead of animated.
 */
export function parseNumeric(value: string): ParsedValue | null {
  const match = value.trim().match(/^(\D*?)(\d+(?:\.\d+)?)(.*)$/);
  if (!match) return null;
  return { prefix: match[1], num: Number(match[2]), suffix: match[3] };
}

/**
 * Break "Client — Deliverable" style titles into a headline and a subtitle.
 * Falls back to the whole string when there is no separator.
 */
export function splitTitle(title: string): { headline: string; sub?: string } {
  const match = title.match(/^(.+?)\s+[—–-]\s+(.+)$/);
  if (!match) return { headline: title };
  return { headline: match[1], sub: match[2] };
}

/** Canonical share URL for a case study. */
export function caseStudyUrl(slug: string): string {
  return `https://heymovox.com/portfolio/${slug}`;
}
