import type { LucideIcon } from 'lucide-react';
import { Monitor, Smartphone, Palette, Fingerprint, TrendingUp } from 'lucide-react';

export interface PackageFeature {
  text: string;
  included?: boolean;
}

export interface PricingPackage {
  id: string;
  name: string;
  price: number;
  priceLabel?: string;
  period?: string;
  description: string;
  features: PackageFeature[];
  ctaText: string;
  ctaVariant: 'primary' | 'secondary' | 'outline';
  popular?: boolean;
  startingAt?: boolean;
}

/**
 * A comparison-table row: `includes` names the package ids that carry the
 * feature. The tick grid is declared rather than inferred from feature copy, so
 * a package that inherits an earlier tier still ticks when its own list is
 * written as "Everything in X, plus:".
 */
export interface ComparisonRow {
  label: string;
  includes: string[];
}

export interface ServicePricing {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: LucideIcon;
  packages: PricingPackage[];
  comparisonFeatures?: ComparisonRow[];
}

export const pricingData: ServicePricing[] = [
  {
    id: 'website-development',
    name: 'Website Development',
    shortName: 'Web Development',
    description: 'From marketing sites to complex web applications — built for performance, accessibility, and growth.',
    icon: Monitor,
    packages: [
      {
        id: 'starter-website',
        name: 'Starter Website',
        price: 14999,
        priceLabel: '₹14,999',
        description: 'Perfect for small businesses and professionals needing a professional online presence.',
        features: [
          { text: 'Up to 5 custom pages (Home, About, Services, Contact, Blog)' },
          { text: 'Responsive design (mobile, tablet, desktop)' },
          { text: 'Contact form with spam protection' },
          { text: 'Basic on-page SEO setup (meta tags, sitemap, robots.txt)' },
          { text: 'SSL certificate & secure hosting setup' },
          { text: 'CMS for easy content updates (headless or WordPress)' },
          { text: 'Analytics & Search Console integration' },
          { text: '30 days post-launch support' },
          { text: 'Source code handover', included: true },
        ],
        ctaText: 'Get Started',
        ctaVariant: 'outline',
      },
      {
        id: 'business-website',
        name: 'Business Website',
        price: 29999,
        priceLabel: '₹29,999',
        description: 'For growing businesses needing a scalable, SEO-ready website with content management.',
        features: [
          { text: 'Everything in Starter Website, plus:' },
          { text: 'Up to 10 custom pages + blog section' },
          { text: 'Advanced SEO: schema markup, structured data, Core Web Vitals optimization' },
          { text: 'Headless CMS (Contentful/Sanity/Strapi) or WordPress with custom blocks' },
          { text: 'Blog with categories, tags, author profiles, reading time' },
          { text: 'Lead capture forms with CRM/webhook integration' },
          { text: 'Cookie consent & privacy compliance' },
          { text: 'Performance budget enforced in CI/CD' },
          { text: 'WCAG 2.1 AA accessibility compliance' },
          { text: '60 days post-launch support & training' },
        ],
        ctaText: 'Get a Quote',
        ctaVariant: 'primary',
        popular: true,
      },
      {
        id: 'ecommerce-website',
        name: 'E-commerce Website',
        price: 49999,
        priceLabel: '₹49,999',
        description: 'Full-featured online store with secure payments, inventory, and order management.',
        features: [
          { text: 'Everything in Business Website, plus:' },
          { text: 'Product catalog with categories, variants, filters, search' },
          { text: 'Shopping cart, secure checkout, guest & account orders' },
          { text: 'Payment gateway integration (Razorpay/Stripe/PayU/UPI)' },
          { text: 'Inventory management & low-stock alerts' },
          { text: 'Order dashboard: status, invoices, shipping, returns' },
          { text: 'Abandoned cart recovery emails' },
          { text: 'Product schema markup for rich search results' },
          { text: 'Multi-currency / multi-language ready' },
          { text: '90 days post-launch support' },
        ],
        ctaText: 'Discuss Your Project',
        ctaVariant: 'primary',
      },
      {
        id: 'custom-webapp',
        name: 'Custom Web Application',
        price: 79999,
        priceLabel: '₹79,999+',
        period: 'starting at',
        description: 'Dashboards, portals, SaaS platforms — engineered for scale and maintainability.',
        features: [
          { text: 'Everything in E-commerce Website, plus:' },
          { text: 'Custom architecture (React/Next.js + Node/Go/Python)' },
          { text: 'Authentication & RBAC (OAuth, SSO, MFA)' },
          { text: 'Real-time features (WebSockets, Server-Sent Events)' },
          { text: 'API design (REST/GraphQL) with documentation' },
          { text: 'Automated testing (unit, integration, E2E) & CI/CD' },
          { text: 'Multi-tenant or single-tenant deployment options' },
          { text: 'Monitoring, logging, error tracking (Sentry, Datadog)' },
          { text: 'Dedicated project manager & weekly demos' },
        ],
        ctaText: 'Get a Quote',
        ctaVariant: 'secondary',
        startingAt: true,
      },
    ],
    comparisonFeatures: [
      {
        label: 'Pages included',
        includes: ['starter-website', 'business-website', 'ecommerce-website', 'custom-webapp'],
      },
      {
        label: 'CMS / Blog',
        includes: ['starter-website', 'business-website', 'ecommerce-website', 'custom-webapp'],
      },
      {
        label: 'SEO setup',
        includes: ['starter-website', 'business-website', 'ecommerce-website', 'custom-webapp'],
      },
      {
        label: 'E-commerce',
        includes: ['ecommerce-website', 'custom-webapp'],
      },
      {
        label: 'Custom backend',
        includes: ['custom-webapp'],
      },
      {
        label: 'Authentication',
        includes: ['ecommerce-website', 'custom-webapp'],
      },
      {
        label: 'Real-time',
        includes: ['custom-webapp'],
      },
      {
        label: 'Support period',
        includes: ['starter-website', 'business-website', 'ecommerce-website', 'custom-webapp'],
      },
    ],
  },
  {
    id: 'app-development',
    name: 'App Development',
    shortName: 'App Development',
    description: 'Native and cross-platform mobile apps — from MVP to enterprise scale, delivered on time.',
    icon: Smartphone,
    packages: [
      {
        id: 'app-mvp',
        name: 'App Starter / MVP',
        price: 79999,
        priceLabel: '₹79,999+',
        period: 'starting at',
        description: 'Validate your idea fast — core features, clean architecture, app store ready.',
        features: [
          { text: 'iOS & Android (React Native) or single platform' },
          { text: 'Up to 8 core screens + authentication flow' },
          { text: 'REST API integration (your backend or new Node/Go API)' },
          { text: 'Push notifications (Firebase/OneSignal)' },
          { text: 'Offline-first data sync with local storage' },
          { text: 'App Store & Google Play submission assistance' },
          { text: 'Crash reporting (Sentry) & analytics (Amplitude/Mixpanel)' },
          { text: '60 days post-launch bug fixes' },
        ],
        ctaText: 'Get Started',
        ctaVariant: 'outline',
      },
      {
        id: 'business-app',
        name: 'Business App',
        price: 149999,
        priceLabel: '₹1,49,999+',
        period: 'starting at',
        description: 'Full-featured business app with dashboards, roles, and integrations.',
        features: [
          { text: '15+ screens: dashboards, lists, forms, settings, profiles' },
          { text: 'Role-based access control (admin, manager, user)' },
          { text: 'Deep linking, universal links, app clips' },
          { text: 'In-app purchases / subscriptions (RevenueCat)' },
          { text: 'Third-party SDK integrations (maps, chat, payments, BI)' },
          { text: 'Automated testing (Detox/Jest) & CI/CD pipelines' },
          { text: 'App store optimization (ASO) kit: screenshots, video, keywords' },
          { text: '90 days post-launch support & 1 minor update' },
        ],
        ctaText: 'Get a Quote',
        ctaVariant: 'primary',
        popular: true,
      },
      {
        id: 'ecommerce-app',
        name: 'E-commerce App',
        price: 199999,
        priceLabel: '₹1,99,999+',
        period: 'starting at',
        description: 'Shopping app with cart, checkout, orders, and loyalty — synced with your web store.',
        features: [
          { text: 'Product browsing: categories, filters, wishlist, reviews' },
          { text: 'Cart, secure checkout, Apple Pay / Google Pay / UPI' },
          { text: 'Order tracking, history, returns, invoices' },
          { text: 'Loyalty points, coupons, referral system' },
          { text: 'Headless commerce sync (Shopify/BigCommerce/Custom)' },
          { text: 'Push notifications for orders, promos, abandoned cart' },
          { text: 'Offline cart persistence & background sync' },
          { text: '120 days post-launch support' },
        ],
        ctaText: 'Discuss Your Project',
        ctaVariant: 'primary',
      },
      {
        id: 'advanced-app',
        name: 'Advanced App / SaaS',
        price: 299999,
        priceLabel: '₹2,99,999+',
        period: 'starting at',
        description: 'Complex platforms: marketplaces, social, fintech, health — built for scale.',
        features: [
          { text: 'Custom architecture: modular, feature-flagged, scalable' },
          { text: 'Real-time: chat, live tracking, collaborative editing' },
          { text: 'Advanced security: encryption, biometric, compliance (HIPAA/PCI)' },
          { text: 'Micro-frontend or module federation ready' },
          { text: 'Automated release trains (Fastlane, CodePush)' },
          { text: 'Load testing, chaos engineering, SLA monitoring' },
          { text: 'Dedicated team: PM, lead, 2–4 engineers, QA' },
          { text: 'Ongoing retainer available for continuous delivery' },
        ],
        ctaText: 'Get a Quote',
        ctaVariant: 'secondary',
        startingAt: true,
      },
    ],
    comparisonFeatures: [
      { label: 'Platforms (iOS/Android)', includes: ['app-mvp', 'business-app', 'ecommerce-app', 'advanced-app'] },
      { label: 'Screens included', includes: ['app-mvp', 'business-app', 'ecommerce-app', 'advanced-app'] },
      { label: 'Backend/API', includes: ['app-mvp', 'business-app', 'ecommerce-app', 'advanced-app'] },
      { label: 'Auth & roles', includes: ['app-mvp', 'business-app', 'ecommerce-app', 'advanced-app'] },
      { label: 'Payments/IAP', includes: ['business-app', 'ecommerce-app', 'advanced-app'] },
      { label: 'Real-time', includes: ['advanced-app'] },
      { label: 'Testing/CI-CD', includes: ['business-app', 'ecommerce-app', 'advanced-app'] },
      { label: 'Support period', includes: ['app-mvp', 'business-app', 'ecommerce-app', 'advanced-app'] },
    ],
  },
  {
    id: 'graphic-designing',
    name: 'Graphic Designing',
    shortName: 'Graphic Design',
    description: 'Social media creatives, marketing collateral, and design systems — on demand or retainer.',
    icon: Palette,
    packages: [
      {
        id: 'single-creative',
        name: 'Single Social Media Creative',
        price: 499,
        priceLabel: '₹499',
        period: 'per design',
        description: 'One-off professional creative for posts, stories, or ads.',
        features: [
          { text: '1 custom design (1080×1080, 1080×1920, or custom size)' },
          { text: '2 revision rounds included' },
          { text: 'Source files (PSD/AI/Figma) + export-ready PNG/JPG/WebP' },
          { text: 'Brand kit adherence (colors, fonts, logo placement)' },
          { text: 'Delivered within 2 business days' },
        ],
        ctaText: 'Order Now',
        ctaVariant: 'outline',
      },
      {
        id: 'social-starter',
        name: 'Social Media Starter',
        price: 4999,
        priceLabel: '₹4,999',
        period: '/month',
        description: 'Consistent monthly creatives for growing brands.',
        features: [
          { text: '12 designs/month (posts, stories, reels covers, ad creatives)' },
          { text: 'Dedicated designer + monthly content calendar review' },
          { text: 'Brand kit creation/update included (first month)' },
          { text: 'Unlimited revisions within scope' },
          { text: 'Source files + organized asset library (Figma/Drive)' },
          { text: 'Priority delivery: 24–48 hrs per design' },
        ],
        ctaText: 'Get Started',
        ctaVariant: 'primary',
        popular: true,
      },
      {
        id: 'creative-growth',
        name: 'Creative Growth',
        price: 7999,
        priceLabel: '₹7,999',
        period: '/month',
        description: 'Higher volume with strategic design direction.',
        features: [
          { text: '20 designs/month (incl. carousel, infographics, motion graphics)' },
          { text: 'Quarterly creative strategy session (30 min)' },
          { text: 'Motion design: 2 short animations/month (Lottie/MP4)' },
          { text: 'Ad creative variants for A/B testing (up to 4/design)' },
          { text: 'Performance review with metrics (CTR, engagement)' },
          { text: 'Dedicated Slack/Teams channel for quick feedback' },
        ],
        ctaText: 'Get a Quote',
        ctaVariant: 'primary',
      },
      {
        id: 'design-partner',
        name: 'Design Partner',
        price: 11999,
        priceLabel: '₹11,999',
        period: '/month',
        description: 'Full design extension of your marketing team.',
        features: [
          { text: '30 designs/month (any format: static, motion, video thumbnails)' },
          { text: 'Weekly sync + monthly creative performance report' },
          { text: 'Design system maintenance & component library updates' },
          { text: 'Landing page & email template design included' },
          { text: 'Video editing: 2 short cuts/month (Reels/Shorts/Ads)' },
          { text: 'Priority access to senior designers & art direction' },
          { text: 'Annual brand audit & refresh recommendations' },
        ],
        ctaText: 'Discuss Your Project',
        ctaVariant: 'secondary',
      },
    ],
    comparisonFeatures: [
      { label: 'Designs/month', includes: ['social-starter', 'creative-growth', 'design-partner'] },
      { label: 'Formats included', includes: ['single-creative', 'social-starter', 'creative-growth', 'design-partner'] },
      { label: 'Revisions', includes: ['single-creative', 'social-starter', 'creative-growth', 'design-partner'] },
      { label: 'Motion/Video', includes: ['creative-growth', 'design-partner'] },
      { label: 'Strategy sessions', includes: ['creative-growth', 'design-partner'] },
      { label: 'Source files', includes: ['single-creative', 'social-starter', 'creative-growth', 'design-partner'] },
      { label: 'Turnaround', includes: ['single-creative', 'social-starter', 'creative-growth', 'design-partner'] },
      { label: 'Reporting', includes: ['social-starter', 'creative-growth', 'design-partner'] },
    ],
  },
  {
    id: 'branding-packaging',
    name: 'Branding & Packaging',
    shortName: 'Branding',
    description: 'Strategic identity systems and packaging that stand out on the shelf and in the mind.',
    icon: Fingerprint,
    packages: [
      {
        id: 'logo-design',
        name: 'Logo Design',
        price: 4999,
        priceLabel: '₹4,999',
        description: 'A distinctive mark with usage guidelines — the foundation of your brand.',
        features: [
          { text: '3 initial concepts, 1 refined final logo' },
          { text: 'Primary, secondary, monochrome, favicon variants' },
          { text: 'Logo construction guide (spacing, clear space, misuse)' },
          { text: 'Color palette (primary, secondary, accessibility-checked)' },
          { text: 'Typography pairing (heading + body, web-safe fallbacks)' },
          { text: 'Vector source files (AI, SVG, EPS) + PNG exports' },
        ],
        ctaText: 'Get Started',
        ctaVariant: 'outline',
      },
      {
        id: 'brand-starter',
        name: 'Brand Starter',
        price: 9999,
        priceLabel: '₹9,999',
        description: 'Essential identity kit for early-stage businesses.',
        features: [
          { text: 'Everything in Logo Design, plus:' },
          { text: 'Business card, letterhead, envelope, email signature' },
          { text: 'Social media profile kit (avatar, cover, highlights)' },
          { text: 'One-page brand guidelines (PDF)' },
          { text: 'Icon set (12 custom icons, consistent style)' },
          { text: '2 revision rounds on all deliverables' },
        ],
        ctaText: 'Get a Quote',
        ctaVariant: 'primary',
        popular: true,
      },
      {
        id: 'complete-brand-identity',
        name: 'Complete Brand Identity',
        price: 19999,
        priceLabel: '₹19,999',
        description: 'Comprehensive identity system for multi-channel presence.',
        features: [
          { text: 'Everything in Brand Starter, plus:' },
          { text: 'Brand strategy workshop (2 hrs) + positioning statement' },
          { text: 'Verbal identity: tagline, voice principles, messaging pillars' },
          { text: 'Extended guidelines: photography style, illustration, motion' },
          { text: 'Presentation template (PowerPoint/Keynote/Google Slides)' },
          { text: 'Marketing collateral: brochure, flyer, poster templates' },
          { text: 'Environmental/wayfinding signage basics' },
          { text: 'Asset library with naming conventions (Figma + Drive)' },
        ],
        ctaText: 'Get a Quote',
        ctaVariant: 'primary',
      },
      {
        id: 'packaging-design',
        name: 'Packaging Design',
        price: 4999,
        priceLabel: '₹4,999+',
        period: 'per SKU, starting at',
        description: 'Shelf-ready packaging that protects, informs, and sells.',
        features: [
          { text: 'Dieline creation or adaptation to your supplier specs' },
          { text: 'Front/back/side panel design with regulatory compliance' },
          { text: 'Barcode, batch, MRP, legal text placement' },
          { text: 'Print-ready PDF/X with bleed, trim, color profiles' },
          { text: '3D mockups for review (box, bottle, pouch, tube)' },
          { text: 'Vendor coordination support (pre-press checks)' },
        ],
        ctaText: 'Discuss Your Project',
        ctaVariant: 'secondary',
        startingAt: true,
      },
      {
        id: 'branding-packaging-suite',
        name: 'Branding + Packaging Suite',
        price: 29999,
        priceLabel: '₹29,999+',
        period: 'starting at',
        description: 'Unified identity and packaging system for product lines.',
        features: [
          { text: 'Complete Brand Identity (above) + packaging for up to 5 SKUs' },
          { text: 'Packaging architecture: master dieline, variant system' },
          { text: 'Retail-ready: shelf talkers, display boxes, POS materials' },
          { text: 'E-commerce packaging: mailer, unboxing experience, inserts' },
          { text: 'Sustainability audit: material options, recyclability labels' },
          { text: 'Production handover: vendor specs, color proofs, QA checklist' },
        ],
        ctaText: 'Get a Quote',
        ctaVariant: 'secondary',
        startingAt: true,
      },
    ],
    comparisonFeatures: [
      { label: 'Logo & variants', includes: ['logo-design', 'brand-starter', 'complete-brand-identity', 'branding-packaging-suite'] },
      { label: 'Brand guidelines', includes: ['brand-starter', 'complete-brand-identity', 'branding-packaging-suite'] },
      { label: 'Stationery kit', includes: ['brand-starter', 'complete-brand-identity', 'branding-packaging-suite'] },
      { label: 'Verbal identity', includes: ['complete-brand-identity', 'branding-packaging-suite'] },
      { label: 'Packaging SKUs', includes: ['packaging-design', 'branding-packaging-suite'] },
      { label: 'Retail/Display', includes: ['branding-packaging-suite'] },
      { label: 'E-commerce unboxing', includes: ['branding-packaging-suite'] },
      { label: 'Production handover', includes: ['packaging-design', 'branding-packaging-suite'] },
    ],
  },
  {
    id: 'digital-marketing',
    name: 'Digital Marketing',
    shortName: 'Digital Marketing',
    description: 'Full-funnel growth — SEO, paid media, content, and analytics tied to revenue.',
    icon: TrendingUp,
    packages: [
      {
        id: 'social-starter',
        name: 'Social Media Starter',
        price: 7999,
        priceLabel: '₹7,999',
        period: '/month',
        description: 'Managed social presence with content, community, and reporting.',
        features: [
          { text: '3 platforms (Instagram, LinkedIn, Facebook/X)' },
          { text: '12 posts/month + 8 stories/reels (copy + design)' },
          { text: 'Content calendar + monthly theme planning' },
          { text: 'Community management: replies, DMs, comments (business hours)' },
          { text: 'Hashtag research & competitor benchmarking' },
          { text: 'Monthly performance report (reach, engagement, growth)' },
        ],
        ctaText: 'Get Started',
        ctaVariant: 'outline',
      },
      {
        id: 'digital-growth',
        name: 'Digital Growth',
        price: 14999,
        priceLabel: '₹14,999',
        period: '/month',
        description: 'Multi-channel growth with paid amplification and lead tracking.',
        features: [
          { text: 'Everything in Social Starter, plus:' },
          { text: 'Paid media management: ₹15k/month ad budget included' },
          { text: 'Meta & Google Ads: campaign setup, creative, optimization' },
          { text: 'Lead gen forms + CRM integration (HubSpot/Zoho/Salesforce)' },
          { text: 'Landing page optimization (CRO basics, heatmaps)' },
          { text: 'Email automation: welcome, nurture, re-engagement (3 flows)' },
          { text: 'Bi-weekly optimization calls + detailed monthly report' },
        ],
        ctaText: 'Get a Quote',
        ctaVariant: 'primary',
        popular: true,
      },
      {
        id: 'performance-marketing',
        name: 'Performance Marketing',
        price: 19999,
        priceLabel: '₹19,999',
        period: '/month',
        description: 'ROI-focused paid acquisition across search, social, and display.',
        features: [
          { text: '₹30k/month ad budget managed across Google, Meta, LinkedIn' },
          { text: 'Full-funnel campaign structure: awareness → consideration → conversion' },
          { text: 'Advanced audiences: lookalikes, retargeting, customer match' },
          { text: 'Conversion tracking: GA4, server-side, offline imports' },
          { text: 'Creative testing framework: 8+ variants/month' },
          { text: 'Weekly budget pacing & ROAS optimization' },
          { text: 'Dedicated performance strategist + Slack channel' },
        ],
        ctaText: 'Get a Quote',
        ctaVariant: 'primary',
      },
      {
        id: 'full-funnel-growth',
        name: 'Full-Funnel Growth',
        price: 29999,
        priceLabel: '₹29,999',
        period: '/month',
        description: 'End-to-end growth engine: SEO, content, paid, email, CRO, analytics.',
        features: [
          { text: 'Everything in Performance Marketing, plus:' },
          { text: 'Technical & content SEO: audit, keyword strategy, 8 articles/month' },
          { text: 'Content marketing: pillar pages, case studies, lead magnets' },
          { text: 'Advanced CRO: A/B tests, user recordings, funnel analysis' },
          { text: 'Marketing automation: scoring, segmentation, lifecycle flows' },
          { text: 'Attribution modeling & cohort analysis' },
          { text: 'Quarterly growth strategy review with leadership' },
        ],
        ctaText: 'Discuss Your Project',
        ctaVariant: 'secondary',
      },
      {
        id: 'seo-only',
        name: 'SEO-Only Service',
        price: 9999,
        priceLabel: '₹9,999+',
        period: '/month, starting at',
        description: 'Pure-play search growth — technical, content, and authority.',
        features: [
          { text: 'Technical SEO audit & quarterly re-audits' },
          { text: 'Keyword strategy & content cluster planning' },
          { text: '4–8 optimized articles/month (2,000+ words each)' },
          { text: 'On-page optimization: schema, internal linking, Core Web Vitals' },
          { text: 'Link building: outreach, digital PR, partnership placements' },
          { text: 'Monthly ranking & traffic report (GA4 + GSC)' },
        ],
        ctaText: 'Get a Quote',
        ctaVariant: 'secondary',
        startingAt: true,
      },
    ],
    comparisonFeatures: [
      { label: 'Platforms managed', includes: ['social-starter', 'digital-growth', 'performance-marketing', 'full-funnel-growth'] },
      { label: 'Organic posts/month', includes: ['social-starter', 'digital-growth'] },
      { label: 'Ad budget managed', includes: ['digital-growth', 'performance-marketing', 'full-funnel-growth'] },
      { label: 'Paid channels', includes: ['digital-growth', 'performance-marketing', 'full-funnel-growth'] },
      { label: 'SEO & content', includes: ['full-funnel-growth', 'seo-only'] },
      { label: 'Email automation', includes: ['digital-growth', 'full-funnel-growth'] },
      { label: 'CRO / Testing', includes: ['digital-growth', 'performance-marketing', 'full-funnel-growth'] },
      { label: 'Reporting cadence', includes: ['social-starter', 'digital-growth', 'performance-marketing', 'full-funnel-growth', 'seo-only'] },
    ],
  },
];

export function getServicePricing(id: string): ServicePricing | undefined {
  return pricingData.find((p) => p.id === id);
}

export function getPackage(serviceId: string, packageId: string): PricingPackage | undefined {
  const service = getServicePricing(serviceId);
  return service?.packages.find((p) => p.id === packageId);
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Short terms shown as a scannable list beside the pricing tables. */
export const pricingNotes: string[] = [
  'All prices are in Indian Rupees (INR) and exclude 18% GST where applicable.',
  'Final pricing depends on project scope, platforms, features, integrations, and timeline.',
  'Rates marked "Starting at" are estimates for typical scopes; complex projects require a custom quote.',
  'Monthly retainers auto-renew unless cancelled with 30 days\' notice.',
  'Support periods cover bug fixes and minor adjustments; new features or scope changes are scoped separately.',
];

/**
 * Costs deliberately excluded from the quoted figure.
 * Kept as its own list so it renders as scannable items instead of the
 * 350-character run-on sentence it used to be.
 */
export const pricingExclusions: string[] = [
  'Advertising spend',
  'Domain registration',
  'Hosting & server costs',
  'Third-party SaaS subscriptions',
  'Payment gateway fees',
  'Printing & production costs',
  'Stock photography & illustration licences',
  'Copywriting',
  'Translation',
  'Legal & compliance review',
  'Ongoing maintenance beyond the support period',
];

/**
 * Flat text form, derived so the two representations cannot drift apart.
 * The exclusions line is deliberately joined with commas to match the
 * original wording.
 */
export const pricingDisclaimer = [
  ...pricingNotes.map(note => `* ${note}`),
  `* The following are NOT included unless explicitly stated: ${pricingExclusions
    .map(item => item.toLowerCase())
    .join(', ')}.`,
].join('\n');

export const pricingFAQs = [
  {
    q: 'Are these prices fixed or will they change for my project?',
    a: 'The listed prices are starting estimates for standard scopes. Your final quote depends on exact requirements — number of pages/screens, integrations, custom features, timeline, and platforms. We provide a detailed fixed-price proposal after a discovery call.',
  },
  {
    q: 'What does "Starting at" mean?',
    a: 'It indicates the minimum investment for a typical engagement in that category. Complex projects (e.g., custom web apps, advanced apps, full branding suites) often exceed the base price. We\'ll scope it precisely before any commitment.',
  },
  {
    q: 'Is GST included in the prices shown?',
    a: 'No. All prices exclude 18% GST (or applicable rate). GST will be added to invoices as per Indian tax regulations.',
  },
  {
    q: 'What payment terms do you offer?',
    a: 'Standard terms: 40% on project kickoff, 40% at mid-point milestone, 20% on delivery. For monthly retainers, payment is due in advance on the 1st of each month. We accept bank transfer (NEFT/RTGS/IMPS), UPI, and major cards via Razorpay.',
  },
  {
    q: 'Do you provide hosting, domains, or third-party subscriptions?',
    a: 'We can set up and manage hosting (Vercel, AWS, Netlify, VPS), domain registration, and SaaS subscriptions (CMS, analytics, email, payments) on your behalf, but these costs are billed separately at actuals. We do not markup third-party fees.',
  },
  {
    q: 'What happens after the support period ends?',
    a: 'Post-launch support covers bug fixes and minor content tweaks. After the period ends, you can: (a) engage us on a monthly maintenance retainer, (b) purchase a support pack, or (c) manage updates yourself — we provide full source code, documentation, and a handover session.',
  },
  {
    q: 'Can I upgrade/downgrade my package later?',
    a: 'Yes. Retainer packages (design, marketing) can be adjusted with 30 days\' notice. For project-based work (web, app, branding), scope changes are handled via change orders with revised timelines and pricing.',
  },
  {
    q: 'Do you offer discounts for startups, non-profits, or long-term contracts?',
    a: 'We evaluate partnership discounts on a case-by-case basis for verified non-profits, early-stage startups (pre-seed/seed), and 12+ month retainer commitments. Mention it during the discovery call and we\'ll explore options.',
  },
  {
    q: 'How do I get started?',
    a: 'Click "Get a Quote" or "Discuss Your Project" on any package, or visit the Start a Project page. We\'ll schedule a 30-minute discovery call, understand your goals, and send a detailed proposal within 1–2 business days.',
  },
];

export function getWhatsAppURL(message?: string): string {
  const base = 'https://wa.me/919500621262';
  if (message) return `${base}?text=${encodeURIComponent(message)}`;
  return base;
}

export function getPackageWhatsAppMessage(serviceName: string, packageName: string): string {
  return `Hi MovoX team, I'm interested in the "${packageName}" package under ${serviceName}. Please share next steps.`;
}