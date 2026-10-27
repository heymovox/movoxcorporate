export type ServiceSlug =
  | 'graphic-design'
  | 'branding-packaging'
  | 'website-development'
  | 'app-development'
  | 'digital-marketing';

export interface Service {
  slug: ServiceSlug;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  icon: string;
  capabilities: string[];
  deliverables: string[];
  process: { step: string; detail: string }[];
}

export const services: Service[] = [
  {
    slug: 'graphic-design',
    name: 'Graphic Design',
    shortName: 'Graphic Design',
    tagline: 'Design that makes your brand impossible to ignore.',
    description:
      'From full identity systems to campaign collateral, our design team builds visual languages that are distinctive, consistent, and built to perform across every touchpoint.',
    icon: 'Palette',
    capabilities: [
      'Logo & visual identity systems',
      'Brand guidelines & asset libraries',
      'Marketing collateral & sales decks',
      'Social media design systems',
      'Illustration & iconography',
      'Print & production artwork',
    ],
    deliverables: [
      'Identity system & logo suite',
      'Brand guidelines document',
      'Ready-to-use design templates',
      'Production-ready print files',
    ],
    process: [
      { step: 'Discover', detail: 'Workshops and research to understand your market and audience.' },
      { step: 'Plan', detail: 'Creative territories and art direction proposals.' },
      { step: 'Create', detail: 'Design iterations with structured feedback rounds.' },
      { step: 'Launch', detail: 'Final asset delivery with guidelines and handover.' },
    ],
  },
  {
    slug: 'branding-packaging',
    name: 'Branding & Packaging',
    shortName: 'Branding & Packaging',
    tagline: 'Brands people remember, packaging people pick up.',
    description:
      'We build brands from the ground up — strategy, naming, identity, and packaging that stand out on the shelf and stay in the mind.',
    icon: 'Fingerprint',
    capabilities: [
      'Brand strategy & positioning',
      'Naming & verbal identity',
      'Visual identity design',
      'Packaging design & structural art',
      'Retail & shelf-ready artwork',
      'Brand architecture for portfolios',
    ],
    deliverables: [
      'Brand strategy document',
      'Complete visual identity system',
      'Packaging design suite',
      'Shelf-ready production artwork',
    ],
    process: [
      { step: 'Discover', detail: 'Category analysis and brand positioning workshops.' },
      { step: 'Plan', detail: 'Naming routes, architecture, and creative platforms.' },
      { step: 'Create', detail: 'Identity and packaging developed in parallel sprints.' },
      { step: 'Launch', detail: 'Rollout support, artwork adaptation, and guidelines.' },
    ],
  },
  {
    slug: 'website-development',
    name: 'Website Development',
    shortName: 'Web Development',
    tagline: 'Websites engineered to convert visitors into customers.',
    description:
      'Custom-built, fast, accessible websites — from marketing sites to complex platforms — developed with modern stacks and a relentless focus on performance.',
    icon: 'Monitor',
    capabilities: [
      'Corporate & marketing websites',
      'E-commerce & online stores',
      'Web applications & portals',
      'CMS & headless CMS builds',
      'Performance & Core Web Vitals optimization',
      'Accessibility (WCAG) compliance',
    ],
    deliverables: [
      'Custom responsive website',
      'CMS integration & admin training',
      'SEO-ready architecture',
      'Performance & accessibility report',
    ],
    process: [
      { step: 'Discover', detail: 'Goals, audience, and technical requirements mapping.' },
      { step: 'Plan', detail: 'Sitemap, wireframes, and technology selection.' },
      { step: 'Create', detail: 'Agile development with staged reviews.' },
      { step: 'Launch', detail: 'QA, deployment, analytics setup, and handover.' },
    ],
  },
  {
    slug: 'app-development',
    name: 'App Development',
    shortName: 'App Development',
    tagline: 'Mobile and web apps your users will love to use.',
    description:
      'From MVP to scale, we design and build iOS, Android, and cross-platform apps with clean architecture, smooth motion, and dependable performance.',
    icon: 'Smartphone',
    capabilities: [
      'iOS & Android native development',
      'Cross-platform (React Native) apps',
      'MVP design & development',
      'API design & third-party integrations',
      'App Store & Google Play submission',
      'Ongoing maintenance & iteration',
    ],
    deliverables: [
      'Production-ready mobile/web app',
      'API layer & integrations',
      'Store listing & submission',
      'Source code & technical documentation',
    ],
    process: [
      { step: 'Discover', detail: 'User research, feature scoping, and technical spikes.' },
      { step: 'Plan', detail: 'Architecture, roadmap, and release planning.' },
      { step: 'Create', detail: 'Sprint-based development with demo reviews.' },
      { step: 'Launch', detail: 'Beta testing, store submission, and launch support.' },
    ],
  },
  {
    slug: 'digital-marketing',
    name: 'Digital Marketing & SEO',
    shortName: 'Digital Marketing',
    tagline: 'Measured marketing that compounds your growth.',
    description:
      'Full-funnel digital marketing — SEO, paid media, content, and analytics — tied to revenue metrics and optimized continuously against real data.',
    icon: 'TrendingUp',
    capabilities: [
      'Technical & content SEO',
      'Google & Bing Ads management',
      'Social media marketing',
      'Content strategy & production',
      'Email marketing & automation',
      'Analytics, CRO & attribution',
    ],
    deliverables: [
      'SEO audit & optimization roadmap',
      'Monthly campaign performance reports',
      'Content calendar & published assets',
      'Conversion rate optimization wins',
    ],
    process: [
      { step: 'Discover', detail: 'Funnel analysis, keyword research, and benchmarking.' },
      { step: 'Plan', detail: 'Channel strategy and campaign architecture.' },
      { step: 'Create', detail: 'Campaigns launched, content produced.' },
      { step: 'Launch', detail: 'Measurement dashboards and tracking.' },
      { step: 'Improve', detail: 'Continuous testing and optimization cycles.' },
    ],
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
