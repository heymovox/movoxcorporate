export type InsightCategory =
  | 'Branding'
  | 'Web Development'
  | 'App Development'
  | 'Marketing & SEO'
  | 'Process';

export interface Insight {
  slug: string;
  title: string;
  excerpt: string;
  category: InsightCategory;
  date: string;
  readingMinutes: number;
  image: string;
  author: string;
  authorRole: string;
  body: { heading?: string; paragraphs: string[] }[];
  relatedServices: string[];
}

export const insightCategories: Array<'All' | InsightCategory> = [
  'All',
  'Branding',
  'Web Development',
  'App Development',
  'Marketing & SEO',
  'Process',
];

export const insights: Insight[] = [];

export function getInsight(slug: string): Insight | undefined {
  return insights.find((i) => i.slug === slug);
}
