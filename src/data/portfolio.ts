export type PortfolioCategory = 'Branding' | 'Web' | 'App' | 'Marketing';

export interface CaseStudy {
  slug: string;
  title: string;
  client: string;
  clientDescriptor: string;
  category: PortfolioCategory;
  services: string[];
  year: string;
  summary: string;
  image: string;
  challenge: string;
  objectives: string[];
  approach: string[];
  deliverables: string[];
  results: { label: string; value: string; note: string }[];
  quote?: { text: string; author: string; role: string };
  isSample: boolean;
}

export const portfolioCategories: Array<'All' | PortfolioCategory> = [
  'All',
  'Branding',
  'Web',
  'App',
  'Marketing',
];

/**
 * SAMPLE DATA — These entries are structural placeholders.
 * Replace every entry with a real client project, verified metrics,
 * and written client consent before publishing. The `isSample` flag
 * drives the visible disclosure on each case study page.
 */
export const caseStudies: CaseStudy[] = [];

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((c) => c.slug === slug);
}
