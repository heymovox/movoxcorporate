# MovoX — Digital Growth

Premium corporate website for MovoX, an integrated digital growth company
(graphic design, branding & packaging, website & app development, digital
marketing & SEO).

**Stack:** React 18 + Vite + TypeScript · Tailwind CSS · React Router ·
Motion (Framer) · React Hook Form + Zod · Lucide icons.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run server` | Reference enquiry API (Express middleware, `server/index.ts`) |

## Start a Project form

The form is fully validated (Zod) with accessible error messaging, but it
**does not transmit data by default**. Set `VITE_API_URL` in `.env` to point
it at a real endpoint. The included reference backend (`server/`):

- Security headers, 32 kb JSON limit, origin allow-list, rate limiting
  (10 requests / 15 min per IP), honeypot spam field, Zod validation
- Appends enquiries to `server/data/enquiries.jsonl`
- `sendEnquiryNotification()` is the integration point for email delivery
  (Postmark / SES / Resend)

## Before publishing

1. **Replace sample data.** Entries in `src/data/portfolio.ts` and
   `src/data/testimonials.ts` are structural placeholders flagged
   `isSample`. Swap in real client projects with written consent and
   verified metrics; remove the flags as you do.
2. **Brand/contact details.** Update address, phone, email, and social URLs
   in `index.html`, `src/components/Footer.tsx`, `src/pages/Contact.tsx`.
3. **Domain.** Replace `movox.agency` in `index.html` (canonical + OG),
   `src/lib/seo.ts` (`SITE_URL`), `public/sitemap.xml`, `public/robots.txt`.
4. **Analytics.** Set `VITE_GA_MEASUREMENT_ID` and add the GA4 snippet to
   `index.html`; verify in Google Search Console.

## SEO

- Per-page titles, meta descriptions, canonical URLs, OG/Twitter tags
  (`src/lib/seo.ts` `useSEO` hook)
- XML sitemap + robots.txt in `public/`
- ProfessionalService JSON-LD in `index.html`
- Semantic headings, descriptive alt text, lazy-loaded local SVG imagery
- Vite code-splitting (vendor/motion chunks); static `dist/` output

## Deploy (Vercel)

`vercel.json` is preconfigured (SPA rewrites, immutable asset caching,
security headers). Connect the repo in the Vercel dashboard — no further
configuration needed. Custom domain + HTTPS are automatic.
