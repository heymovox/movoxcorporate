/**
 * MovoX Service Agreement — document renderer.
 *
 * Reproduces the clause structure and wording of "Movox agre.pdf"
 * (18 pages, 25 numbered sections + Schedule A) as a letterhead document
 * that can be printed to PDF from the browser.
 *
 * Bracketed placeholders in the source ([Amount], [X–Y business days],
 * [Agreed City, State, India], …) are substituted from the form.
 */
import type { Agreement, ScheduleA } from '../../lib/adminApi';
import { effectiveFee, scheduleTotal } from './ScheduleAEditor';

const inr = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const ddmmyyyy = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const p = (x: number) => String(x).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const or = (v: string | undefined | null, fallback = '—') => {
  const t = (v ?? '').trim();
  return t === '' ? fallback : t;
};

interface DocProps {
  agreement: Agreement;
  schedule: ScheduleA;
}

/* ------------------------------------------------------------------ */
/* primitives                                                          */
/* ------------------------------------------------------------------ */

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-2 text-justify">{children}</p>
);

const Section = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
  <section className="mt-6">
    <h3 className="font-heading text-[13px] font-bold uppercase tracking-wide text-ink">
      {n}. {title}
    </h3>
    {children}
  </section>
);

const Sub = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
  <div className="mt-4">
    <h4 className="font-heading text-[12.5px] font-bold text-ink">
      {n} {title}
    </h4>
    {children}
  </div>
);

const UL = ({ items }: { items: React.ReactNode[] }) => (
  <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-slate-400">
    {items.map((it, i) => (
      <li key={i}>{it}</li>
    ))}
  </ul>
);

const OL = ({ items }: { items: React.ReactNode[] }) => (
  <ol className="mt-2 list-decimal space-y-1 pl-5 marker:text-slate-400">
    {items.map((it, i) => (
      <li key={i}>{it}</li>
    ))}
  </ol>
);

/* ------------------------------------------------------------------ */
/* document                                                            */
/* ------------------------------------------------------------------ */

export default function AgreementDocument({ agreement: a, schedule: s }: DocProps) {
  const fee = effectiveFee(s);
  const lineTotal = scheduleTotal(s.lineItems);

  return (
    <article className="text-[11.5px] leading-[1.65] text-slate-800">
      {/* ---------- title block ---------- */}
      <header className="text-center">
        <h1 className="font-heading text-lg font-extrabold uppercase tracking-wide text-ink">
          Website Development &amp; Service Pricing Section Agreement
        </h1>
        <dl className="mx-auto mt-3 grid max-w-md grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-left text-[11px]">
          <dt className="text-slate-500">Prepared by</dt>
          <dd className="font-semibold text-ink">MovoX Digital Growth</dd>
          <dt className="text-slate-500">Project</dt>
          <dd className="font-semibold text-ink">{or(a.project_name, 'MovoX Website – Service Pricing Section Development')}</dd>
          <dt className="text-slate-500">Agreement Type</dt>
          <dd className="font-semibold text-ink">{or(a.agreement_type)}</dd>
          <dt className="text-slate-500">Effective Date</dt>
          <dd className="font-semibold text-ink">{ddmmyyyy(a.effective_date)}</dd>
          <dt className="text-slate-500">Agreement Reference</dt>
          <dd className="font-mono font-semibold text-ink">{a.reference}</dd>
        </dl>
      </header>

      {/* ---------- 1. parties ---------- */}
      <Section n="1" title="Parties to the Agreement">
        <P>
          This Website Development Agreement (“Agreement”) is entered into between the
          following parties:
        </P>

        <div className="mt-4 rounded-lg border border-slate-200 p-4">
          <p className="font-semibold text-ink">Service Provider</p>
          <dl className="mt-1.5 space-y-0.5">
            <Row k="Name" v="MovoX Digital Growth" />
            <Row k="Website" v="https://www.heymovox.com" />
            <Row k="Email" v="info@heymovox.com" />
            <Row
              k="Address"
              v="8M, TB Link Road, Near Thirupathi Gounder Mahal, Oldpet, Krishnagiri – 635001."
            />
          </dl>
          <p className="mt-2">
            Hereinafter referred to as the <strong>“Service Provider”</strong> or{' '}
            <strong>“MovoX”</strong>.
          </p>
        </div>

        <div className="mt-3 rounded-lg border border-slate-200 p-4">
          <p className="font-semibold text-ink">Client</p>
          <dl className="mt-1.5 space-y-0.5">
            <Row k="Legal Name / Company Name" v={or(a.client_company || a.client_name)} />
            <Row k="Authorized Representative" v={or(a.client_rep_name || a.client_name)} />
            <Row k="Designation" v={a.client_rep_designation} />
            <Row k="Email" v={a.client_email} />
            <Row k="Contact Number" v={a.client_phone} />
            <Row k="Billing Address" v={a.client_address} />
            <Row k="GSTIN" v={a.client_gstin} />
          </dl>
          <p className="mt-2">
            Hereinafter referred to as the <strong>“Client”</strong>.
          </p>
        </div>

        <P>
          The Service Provider and the Client may collectively be referred to as the{' '}
          <strong>“Parties”</strong>.
        </P>
      </Section>

      {/* ---------- 2. project overview ---------- */}
      <Section n="2" title="Project Overview">
        <P>
          The Client appoints MovoX Digital Growth to design, develop, and integrate a
          modern, responsive, premium-quality Service Pricing Section into the existing
          MovoX website.
        </P>
        <P>The project will present five principal service categories:</P>
        <OL
          items={[
            'Website Development',
            'App Development',
            'Graphic Designing',
            'Branding & Packaging',
            'Digital Marketing',
          ]}
        />
        <P>
          The objective is to provide transparent service pricing, communicate package
          deliverables, improve user navigation, support search engine visibility, and
          encourage qualified enquiries through contact forms, quotation requests, and
          WhatsApp.
        </P>
        <P>
          The implementation will follow the approved MovoX visual direction, using primary
          brand colour <span className="font-mono">#2382b8</span>, secondary brand colour{' '}
          <span className="font-mono">#003655</span>, subtle blue gradients, and a clean,
          minimal interface.
        </P>
      </Section>

      {/* ---------- 3. objectives ---------- */}
      <Section n="3" title="Project Objectives">
        <P>The project shall aim to achieve the following objectives:</P>
        <UL
          items={[
            'Present service packages and prices in a clear, structured format.',
            'Help prospective customers compare service packages.',
            'Improve the overall website user experience across desktop, tablet, and mobile devices.',
            'Provide clear calls to action for enquiries and quotation requests.',
            'Support SEO through appropriate page structure, metadata, and semantic HTML.',
            'Improve accessibility, readability, and navigation.',
            'Make future price and package updates easier through centralized pricing configuration.',
            'Integrate the new pricing experience into the existing website navigation and sitemap without unnecessarily changing unrelated sections.',
          ]}
        />
        <P>
          The Parties acknowledge that these are implementation objectives and not
          guarantees of a specific number of leads, conversions, search rankings, or
          revenue.
        </P>
      </Section>

      {/* ---------- 4. scope of work ---------- */}
      <Section n="4" title="Scope of Work">
        <Sub n="4.1" title="UI/UX Design">
          <P>MovoX shall design a consistent pricing interface incorporating:</P>
          <UL
            items={[
              'Clean, light-background layouts.',
              'Primary and secondary brand colours.',
              'Subtle gradients and restrained visual effects.',
              'Consistent typography, spacing, alignment, and card dimensions.',
              'Service-specific icons or suitable visual identifiers.',
              'Clearly emphasized package prices.',
              'Distinct package names and concise deliverable lists.',
              'Primary and secondary call-to-action buttons.',
              'Responsive pricing cards and mobile-friendly layouts.',
              'Hover states, focus indicators, and subtle transitions where appropriate.',
            ]}
          />
          <P>
            The final design direction shall be subject to Client approval before
            implementation.
          </P>
        </Sub>

        <Sub n="4.2" title="Website Development">
          <P>The Service Provider shall implement the approved design using:</P>
          <UL
            items={[
              'React for user interface development.',
              'Vite as the development and build tool.',
              'Tailwind CSS for styling and responsive layouts.',
              'Reusable React components for pricing cards and related interface elements.',
              'A centralized pricing data configuration for package information.',
              'Appropriate semantic HTML and accessible interactive controls.',
            ]}
          />
          <P>
            The implementation shall be integrated with the existing MovoX website
            architecture, subject to access to and compatibility with the current codebase.
          </P>
        </Sub>

        <Sub n="4.3" title="Website Development Pricing">
          <P>The following packages shall be displayed.</P>
          <PriceList
            entries={[
              { name: 'Starter Website', price: '₹14,999', items: ['Up to 5 website pages.', 'Responsive design.', 'Standard contact form.', 'Basic on-page SEO setup.'] },
              { name: 'Business Website', price: '₹29,999', items: ['Up to 10 website pages.', 'Responsive website design.', 'SEO setup.', 'CMS/blog functionality.'] },
              { name: 'E-commerce Website', price: '₹49,999', items: ['Product catalogue.', 'Shopping cart.', 'Checkout functionality.', 'Payment gateway integration.'] },
              { name: 'Custom Web Application', price: 'Starting at ₹79,999', items: ['Custom dashboards.', 'Portal functionality.', 'Application-specific workflows.', 'SaaS-oriented functionality, subject to the approved project scope.'] },
            ]}
          />
        </Sub>

        <Sub n="4.4" title="App Development Pricing">
          <PriceList
            entries={[
              { name: 'App Starter / MVP', price: 'Starting at ₹79,999', items: ['Core application functionality.', 'Essential user interface and screens.', 'Basic navigation and user flows.', 'Initial MVP implementation based on the approved specification.'] },
              { name: 'Business App', price: 'Starting at ₹1,49,999', items: ['Business-oriented application screens.', 'User and account workflows.', 'Backend/API integration as specified.', 'Business functionality agreed during discovery.'] },
              { name: 'E-commerce App', price: 'Starting at ₹1,99,999', items: ['Product browsing.', 'Cart and checkout workflows.', 'Payment integration.', 'Order-related functionality as specified.'] },
              { name: 'Advanced App / SaaS', price: 'Starting at ₹2,99,999', items: ['Advanced application workflows.', 'Dashboard and account functionality.', 'Subscription or SaaS functionality where specified.', 'Required integrations and backend architecture as agreed.'] },
            ]}
          />
          <P>
            The app package prices are indicative starting prices. Supported platforms,
            native or cross-platform implementation, backend requirements, and integrations
            must be confirmed in the project quotation.
          </P>
        </Sub>

        <Sub n="4.5" title="Graphic Designing Pricing">
          <PriceList
            entries={[
              { name: 'Single Social Media Creative', price: '₹499', items: ['One social media design.', 'One approved creative direction.', 'Final deliverable in an agreed format.'] },
              { name: 'Social Media Starter', price: '₹4,999/month', items: ['12 social media designs per month.'] },
              { name: 'Creative Growth', price: '₹7,999/month', items: ['20 social media designs per month.'] },
              { name: 'Design Partner', price: '₹11,999/month', items: ['30 social media designs per month.'] },
            ]}
          />
          <P>
            Monthly packages cover the stated number of designs. Additional deliverables,
            video editing, motion graphics, advanced illustration, and other work are
            chargeable separately if not expressly included in the approved quotation.
          </P>
        </Sub>

        <Sub n="4.6" title="Branding & Packaging Pricing">
          <PriceList
            entries={[
              { name: 'Logo Design', price: '₹4,999', items: ['Logo design deliverable.', 'Approved final logo files.', 'Agreed export formats.'] },
              { name: 'Brand Starter', price: '₹9,999', items: ['Brand identity essentials.', 'Approved logo and supporting brand elements as specified in the quotation.'] },
              { name: 'Complete Brand Identity', price: '₹19,999', items: ['Comprehensive brand identity deliverables.', 'Brand colour and typography specifications.', 'Brand usage guidance, according to the approved scope.'] },
              { name: 'Packaging Design', price: 'Starting at ₹4,999', items: ['Packaging artwork for the agreed product and format.', 'Required layout and design files.', 'Print-ready exports where specified.'] },
              { name: 'Branding + Packaging Suite', price: 'Starting at ₹29,999', items: ['Combined branding and packaging deliverables.', 'Scope based on the agreed number of products, packaging formats, and brand assets.'] },
            ]}
          />
          <P>
            Printing, physical prototypes, product photography, manufacturing, and regulatory
            or compliance consultancy are excluded unless explicitly included in writing.
          </P>
        </Sub>

        <Sub n="4.7" title="Digital Marketing Pricing">
          <PriceList
            entries={[
              { name: 'Social Media Starter', price: '₹7,999/month', items: ['Social media marketing support.', 'Content planning and publishing deliverables as defined in the quotation.', 'Scope and platform allocation to be agreed.'] },
              { name: 'Digital Growth', price: '₹14,999/month', items: ['Expanded digital marketing activities.', 'Social media and campaign coordination.', 'Deliverables based on the approved marketing plan.'] },
              { name: 'Performance Marketing', price: '₹19,999/month', items: ['Paid campaign planning and management.', 'Campaign setup and optimization.', 'Performance reporting as specified.'] },
              { name: 'Full-Funnel Growth', price: '₹29,999/month', items: ['Integrated marketing activities across the agreed customer journey.', 'Campaign coordination and optimization.', 'Reporting based on the approved scope.'] },
              { name: 'SEO-Only Service', price: 'Starting at ₹9,999/month', items: ['SEO assessment and planning.', 'On-page optimization.', 'Keyword and content recommendations.', 'Reporting and agreed ongoing optimization.'] },
            ]}
          />
          <P>
            The exact channels, content quantities, advertising campaign count, reporting
            frequency, SEO deliverables, and responsibilities shall be documented in the
            relevant quotation or statement of work.
          </P>
          <P>
            These prices represent service package pricing and are not a guarantee of
            advertising results, rankings, impressions, enquiries, or sales.
          </P>
        </Sub>

        <Sub n="4.8" title="Pricing Card Components">
          <P>Each applicable package shall display:</P>
          <UL
            items={[
              'Package name.',
              'Price or starting price.',
              'Billing frequency, where applicable.',
              'Concise deliverable list.',
              'Suitable service icon.',
              'Relevant call-to-action button.',
              'Applicable pricing and scope notes.',
            ]}
          />
          <P>
            The user interface shall use reusable components to maintain visual consistency
            across the five service categories.
          </P>
        </Sub>

        <Sub n="4.9" title="Centralized Pricing Configuration">
          <P>
            The implementation shall use a centralized configuration for service package
            names, prices, billing periods, descriptions, features, CTA labels, and relevant
            enquiry destinations.
          </P>
          <P>
            This configuration shall make routine pricing updates easier for a developer. It
            does not constitute a full content management system or provide a public-facing
            admin panel unless separately agreed.
          </P>
        </Sub>

        <Sub n="4.10" title="Service Comparison">
          <P>
            A service comparison option shall be implemented to help users review relevant
            packages within a service category.
          </P>
          <P>
            The comparison interface may include package price, included deliverables,
            limits, and billing frequency where applicable.
          </P>
          <P>
            Comparison behaviour, layout, and mobile interaction shall be agreed during
            design approval. Features shall only be shown as included where they are
            supported by the approved package scope.
          </P>
        </Sub>

        <Sub n="4.11" title="FAQ Section">
          <P>The pricing experience shall include an FAQ section addressing relevant questions, such as:</P>
          <UL
            items={[
              'How is the final project price calculated?',
              'Are the listed prices fixed?',
              'Are GST and external expenses included?',
              'Can a package be customized?',
              'What happens if additional features are requested?',
              'Are hosting and domain expenses included?',
              'How does the quotation and project approval process work?',
              'What are the payment and delivery terms?',
            ]}
          />
          <P>
            Answers shall be based on the approved commercial terms and shall not introduce
            unsupported guarantees.
          </P>
        </Sub>

        <Sub n="4.12" title="Custom Quotation CTA">
          <P>
            A custom quotation call to action shall be provided for projects that do not fit
            the listed packages. The CTA shall direct users to the agreed contact or
            quotation workflow. The form may collect project requirements, service
            category, estimated budget, preferred timeline, and contact information, subject
            to the approved implementation scope.
          </P>
        </Sub>

        <Sub n="4.13" title="Contact and WhatsApp Integration">
          <P>The package CTAs may include:</P>
          <UL
            items={[
              'Get Started.',
              'Get a Quote.',
              'Discuss Your Project.',
              'Request a Custom Quote.',
            ]}
          />
          <P>
            Buttons shall connect to the approved contact form, quotation page, or
            designated WhatsApp enquiry number.
          </P>
          <P>
            WhatsApp integration shall use the Client-approved business number and enquiry
            message. The project does not include WhatsApp automation, CRM integration, or
            paid messaging services unless separately agreed.
          </P>
        </Sub>

        <Sub n="4.14" title="SEO and Accessibility">
          <P>
            The Service Provider shall implement reasonable on-page SEO and accessibility
            practices within the agreed scope, including:
          </P>
          <UL
            items={[
              'Semantic heading structure.',
              'Appropriate page titles and meta descriptions.',
              'Descriptive internal links.',
              'Relevant image alternative text.',
              'Keyboard-accessible navigation and controls.',
              'Visible focus states.',
              'Appropriate colour contrast.',
              'Responsive page structure.',
              'Search engine crawlability, subject to the existing website architecture.',
            ]}
          />
          <P>
            Search engine rankings, indexing time, traffic levels, and search visibility are
            not guaranteed.
          </P>
        </Sub>

        <Sub n="4.15" title="Sitemap and Navigation Integration">
          <P>
            The new pricing experience shall be integrated into the existing MovoX sitemap
            and navigation as approved. Where appropriate, dedicated pricing pages or
            service-specific pricing sections shall be created for the five service
            categories.
          </P>
          <P>
            Unrelated website pages, content, design systems, integrations, and business
            functionality shall remain unchanged except where modifications are necessary for
            the approved integration.
          </P>
        </Sub>
      </Section>

      {/* ---------- 5. deliverables ---------- */}
      <Section n="5" title="Project Deliverables">
        <P>
          Subject to the final quotation, approved scope, and technical feasibility, the
          deliverables shall include:
        </P>
        <OL
          items={[
            'Approved service pricing UI/UX design.',
            'Responsive React implementation.',
            'Reusable pricing card components.',
            'Centralized pricing configuration.',
            'Five service category pricing experiences.',
            'Service comparison interface.',
            'FAQ section.',
            'Custom quotation call to action.',
            'Contact form or WhatsApp enquiry routing, as agreed.',
            'SEO-friendly page structure and metadata.',
            'Accessibility and responsive implementation checks.',
            'Integration with the existing website navigation and sitemap.',
            'Production build and deployment support, if included in the quotation.',
            'Project source code handover, subject to the payment and ownership provisions of this Agreement.',
          ]}
        />
        <P>
          Any deliverable not explicitly stated in this Agreement or the approved quotation
          shall be treated as outside the agreed scope.
        </P>
      </Section>

      {/* ---------- 6. timeline ---------- */}
      <Section n="6" title="Project Timeline">
        <P>
          The estimated project duration shall be{' '}
          <strong>{or(s.estimatedDelivery, '[X–Y business days]')}</strong>, commencing
          after:
        </P>
        <UL
          items={[
            'Agreement execution.',
            'Receipt of the agreed advance payment.',
            'Access to the necessary website codebase, hosting, and relevant systems.',
            'Receipt of required content, contact details, and brand assets.',
            'Confirmation of the project requirements.',
          ]}
        />
        <P>Indicative project phases:</P>
        <table className="mt-2 w-full border-collapse text-[11px]">
          <thead>
            <tr className="border-y border-slate-300 text-left">
              <th className="w-32 py-1.5 pr-2 font-semibold">Phase</th>
              <th className="py-1.5 font-semibold">Activity</th>
            </tr>
          </thead>
          <tbody>
            {[
              'Phase 1',
              'Phase 2',
              'Phase 3',
              'Phase 4',
              'Phase 5',
            ].map((ph, i) => (
              <tr key={ph} className="border-b border-slate-200">
                <td className="py-1.5 pr-2 font-medium text-ink">{ph}</td>
                <td className="py-1.5">
                  {
                    [
                      'Requirement confirmation and scope finalization',
                      'UI/UX design and Client approval',
                      'Frontend development and integration',
                      'Functional testing and revisions',
                      'Client acceptance and deployment',
                    ][i]
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <P>
          The timeline may be revised if the Client delays approvals, content, access,
          payments, or required decisions. Third-party service interruptions and unforeseen
          technical constraints may also affect delivery.
        </P>
        <P>A revised schedule shall be communicated to the Client where reasonably practicable.</P>
      </Section>

      {/* ---------- 7. fee & payment ---------- */}
      <Section n="7" title="Project Fee and Payment Terms">
        <dl className="mt-2 space-y-0.5">
          <Row k="Total agreed project fee" v={inr(fee)} strong />
          <Row k="GST" v={or(s.gst, '[Applicable / Not applicable / As separately invoiced]')} />
        </dl>
        <P>
          The final commercial amount shall be recorded in the approved quotation and
          incorporated into this Agreement.
        </P>
        <P>Suggested payment milestones, subject to mutual approval:</P>
        <UL
          items={[
            `${or(s.advancePayment, '40%')} — Advance payment: Upon signing the Agreement and before project commencement.`,
            `${or(s.milestonePayment, '40%')} — Development milestone: Upon completion of the main development and integration stage.`,
            `${or(s.finalPayment, '20%')} — Final payment: Before production deployment or release of final deliverables, as agreed.`,
          ]}
        />
        <P>
          Alternative payment milestones may be specified in the approved quotation. The
          Client shall make payments against invoices issued by the Service Provider using
          the agreed payment method.
        </P>
        <P>
          If a payment remains overdue, MovoX may provide written notice and suspend affected
          work after a reasonable opportunity to resolve the overdue amount. The project
          timeline shall be adjusted accordingly.
        </P>
        <P>
          Any additional work approved outside the original scope shall be quoted separately
          and may require advance payment.
        </P>
      </Section>

      {/* ---------- 8. pricing clarifications ---------- */}
      <Section n="8" title="Pricing Clarifications and External Costs">
        <P>
          The service prices displayed on the website are indicative package prices and
          shall not automatically constitute a binding quotation for every project.
        </P>
        <P>Final pricing depends on the nature and complexity of the project, including:</P>
        <UL
          items={[
            'Project scope and specifications.',
            'Number of pages, screens, products, or deliverables.',
            'Supported platforms and devices.',
            'Required features and business logic.',
            'Backend and database requirements.',
            'Third-party integrations.',
            'Custom workflows and security requirements.',
            'Content volume and implementation complexity.',
            'Delivery timeline and ongoing support requirements.',
          ]}
        />
        <P>
          Packages labelled “Starting at” represent an initial price level, not a fixed
          price for every possible implementation. The final price and deliverables shall be
          confirmed through a written quotation approved by both Parties.
        </P>
        <P>
          The following costs shall be additional where applicable and unless expressly
          included in the approved quotation:
        </P>
        <UL
          items={[
            'GST and other applicable taxes.',
            'Domain registration and renewal.',
            'Website hosting, cloud infrastructure, and storage.',
            'Third-party software subscriptions and API usage.',
            'Payment gateway charges and transaction fees.',
            'Advertising spend and media buying budgets.',
            'Printing, manufacturing, prototypes, and physical samples.',
            'Premium fonts, stock images, licensed assets, and commercial plugins.',
            'App store developer accounts and publication fees.',
            'External vendor charges and specialist services.',
            'Ongoing maintenance, support, and post-launch enhancements.',
          ]}
        />
        <P>
          External expenses shall be communicated to the Client for approval where reasonably
          practicable before the relevant expenditure is incurred.
        </P>
      </Section>

      {/* ---------- 9. client responsibilities ---------- */}
      <Section n="9" title="Client Responsibilities">
        <P>The Client agrees to:</P>
        <OL
          items={[
            'Provide accurate project requirements and timely decisions.',
            'Supply all necessary logos, brand assets, approved copy, images, and other content.',
            'Provide authorized access to the website codebase, hosting, domain, and relevant systems.',
            'Verify the accuracy of package prices, feature descriptions, service terms, and legal disclosures.',
            'Ensure that supplied content and assets may lawfully be used.',
            'Designate an authorized representative for approvals and project communication.',
            'Review submitted deliverables within a reasonable period.',
            'Make payments in accordance with the agreed schedule.',
            'Obtain internal approvals and any necessary third-party permissions.',
          ]}
        />
        <P>
          Delays attributable to missing Client inputs or approvals may extend the delivery
          timeline.
        </P>
      </Section>

      {/* ---------- 10. design approval ---------- */}
      <Section n="10" title="Design Approval and Revisions">
        <P>The Service Provider shall submit the agreed design concepts for Client review.</P>
        <P>
          The project includes <strong>{or(s.designRevisionRounds, '[Number]')}</strong>{' '}
          rounds of design revisions and{' '}
          <strong>{or(s.developmentRevisionRounds, '[Number]')}</strong> rounds of
          implementation revisions, as recorded in the quotation.
        </P>
        <P>
          A revision means a reasonable adjustment to the approved direction, layout,
          styling, or existing functionality within the agreed scope.
        </P>
        <P>The following shall ordinarily be treated as additional work:</P>
        <UL
          items={[
            'A complete redesign after approval.',
            'New pages or service categories not included in the agreed scope.',
            'New integrations or substantial feature additions.',
            'Changes to the approved technology or architecture.',
            'New requirements arising after scope confirmation.',
            'Rework caused by materially changed business requirements.',
          ]}
        />
        <P>
          All revisions and changes shall be consolidated and communicated by the Client
          through the agreed communication channel. Additional work shall commence only after
          written approval of the revised scope, cost, and timeline.
        </P>
      </Section>

      {/* ---------- 11. change requests ---------- */}
      <Section n="11" title="Change Request Management">
        <P>Either Party may request a change to the approved project scope.</P>
        <P>
          The Service Provider shall assess the request and, where necessary, provide a
          written change request covering:
        </P>
        <UL
          items={[
            'Description of the requested change.',
            'Impact on existing functionality.',
            'Additional charges.',
            'Revised delivery timeline.',
            'Any third-party dependencies or risks.',
          ]}
        />
        <P>
          No change shall be considered included merely because it is discussed verbally or
          informally. A change request shall become part of the project scope only after
          written acceptance by both Parties.
        </P>
      </Section>

      {/* ---------- 12. testing ---------- */}
      <Section n="12" title="Testing and Client Acceptance">
        <P>
          Before handover, MovoX shall perform reasonable checks of the implemented
          functionality against the approved scope. Testing may include:
        </P>
        <UL
          items={[
            'Responsive layout checks.',
            'Pricing and package display verification.',
            'Navigation and CTA functionality.',
            'Form or WhatsApp routing checks, where included.',
            'Basic browser compatibility checks.',
            'Build and deployment verification.',
            'Basic accessibility and semantic markup checks.',
          ]}
        />
        <P>
          The Client shall review the completed work within{' '}
          {or(s.acceptanceDays, '5')} business days of submission and either approve it or
          provide a consolidated written list of material deviations from the agreed
          specifications. MovoX shall address verified in-scope deviations within a
          reasonable period.
        </P>
        <P>
          A request for new features or a different design direction shall be handled under
          the change request process. If the Client does not respond within the review
          period, MovoX may request written confirmation and agree on a revised acceptance
          schedule. Silence alone shall not automatically waive material contractual
          obligations.
        </P>
      </Section>

      {/* ---------- 13. deployment ---------- */}
      <Section n="13" title="Deployment and Handover">
        <P>
          Where deployment is included, MovoX shall assist with deploying the approved
          implementation to the agreed production environment. The Client shall provide the
          necessary authorized credentials and ensure that relevant hosting, domain, and
          third-party services are active.
        </P>
        <P>The handover may include:</P>
        <UL
          items={[
            'Final production-ready build.',
            'Project source code, as agreed.',
            'Pricing configuration and update instructions.',
            'Relevant setup documentation.',
            'Agreed deployment information.',
            'Access credentials or ownership transfer through an appropriate secure process.',
          ]}
        />
        <P>
          Passwords, API keys, and other confidential credentials shall not be included in
          public repositories or unsecured documentation. Deployment is subject to payment of
          all amounts due under the agreed payment milestones.
        </P>
      </Section>

      {/* ---------- 14. IP ---------- */}
      <Section n="14" title="Intellectual Property and Ownership">
        <P>
          Upon receipt of full payment for the relevant project, the Client shall receive
          ownership of the original, specifically commissioned deliverables to the extent
          legally transferable and expressly covered by the Agreement.
        </P>
        <P>
          The following shall remain subject to their existing ownership or licence terms:
        </P>
        <UL
          items={[
            'Open-source software.',
            'Third-party libraries and frameworks.',
            'Licensed fonts, stock assets, and plugins.',
            'Third-party APIs and hosted services.',
            'Pre-existing tools, reusable components, templates, and know-how owned by MovoX.',
          ]}
        />
        <P>Where required, the Client shall comply with applicable third-party licence terms.</P>
        <P>
          MovoX retains the right to use its pre-existing methods, development practices,
          general skills, and non-client-specific reusable components.
        </P>
        <P>
          Neither Party shall use the other Party’s trademarks or confidential materials
          outside the permitted project purposes without authorization, except where
          expressly agreed in writing. Portfolio display and public case-study use of the
          completed work shall be subject to the Client’s approval where the project or its
          materials are confidential.
        </P>
      </Section>

      {/* ---------- 15. confidentiality ---------- */}
      <Section n="15" title="Confidentiality and Data Protection">
        <P>
          Both Parties shall protect non-public business, technical, financial, customer, and
          project information received from the other Party. Confidential information shall
          be used only for the purposes of performing this Agreement and shall not be
          disclosed to unauthorized persons.
        </P>
        <P>These obligations shall not apply to information that:</P>
        <UL
          items={[
            'Is publicly available through no breach of this Agreement.',
            'Was lawfully known before disclosure.',
            'Is independently developed without using confidential information.',
            'Must be disclosed under applicable law or a valid legal requirement.',
          ]}
        />
        <P>
          Where personal information is processed through forms or other project
          functionality, the Parties shall cooperate to establish appropriate privacy
          notices, access controls, and data-handling arrangements. Each Party shall comply
          with applicable data protection and privacy obligations relevant to its role.
        </P>
      </Section>

      {/* ---------- 16. third party ---------- */}
      <Section n="16" title="Third-Party Services and Dependencies">
        <P>
          The project may depend on third-party platforms, libraries, APIs, hosting
          providers, payment gateways, messaging services, or external integrations.
        </P>
        <P>
          MovoX shall use reasonable care when implementing agreed integrations but shall
          not be responsible for independent failures, pricing changes, service
          interruptions, policy changes, or discontinued features of third-party providers.
        </P>
        <P>
          Third-party service fees and account requirements shall remain the Client’s
          responsibility unless otherwise specified in writing. Additional work required
          because of a third-party change may be quoted separately.
        </P>
      </Section>

      {/* ---------- 17. warranty ---------- */}
      <Section n="17" title="Warranty and Bug Fixes">
        <P>
          MovoX shall provide a <strong>{or(s.bugFixDays, '[15/30]')}</strong>-day
          post-launch bug-fix period, beginning from the agreed production launch date, if
          included in the approved quotation. During this period, MovoX shall correct
          reproducible defects that materially prevent the delivered functionality from
          operating according to the approved specifications.
        </P>
        <P>The bug-fix period shall not cover:</P>
        <UL
          items={[
            'New features or design changes.',
            'Client modifications to the source code.',
            'Issues caused by unauthorized third-party changes.',
            'External hosting or provider outages.',
            'Unsupported software or environments.',
            'Additional integrations or requirements introduced after approval.',
            'Maintenance or enhancements outside the original scope.',
          ]}
        />
        <P>
          Any applicable warranty shall be limited to the agreed deliverables and shall not
          constitute a guarantee of uninterrupted operation or specific commercial outcomes.
        </P>
      </Section>

      {/* ---------- 18. maintenance ---------- */}
      <Section n="18" title="Maintenance and Ongoing Support">
        <P>
          Unless expressly included in the quotation, ongoing maintenance is excluded from
          the project fee. Maintenance may be provided under a separate agreement or service
          plan covering items such as:
        </P>
        <UL
          items={[
            'Software updates.',
            'Security updates and monitoring.',
            'Backup management.',
            'Performance optimization.',
            'Content and pricing updates.',
            'Hosting and infrastructure support.',
            'Troubleshooting and technical assistance.',
          ]}
        />
        <P>
          Response times, service availability, maintenance charges, and support hours shall
          be documented separately if ongoing support is required.
        </P>
      </Section>

      {/* ---------- 19. liability ---------- */}
      <Section n="19" title="Limitation of Liability">
        <P>
          Each Party shall remain responsible for its obligations under this Agreement and
          applicable law. To the extent permitted by applicable law, neither Party shall be
          liable to the other for indirect, incidental, special, or consequential losses,
          including loss of anticipated profits or business opportunities, arising from the
          project.
        </P>
        <P>
          Subject to applicable law and any liability that cannot legally be excluded or
          limited, the aggregate liability of either Party arising out of this Agreement
          shall not exceed the total professional fees paid or payable under this Agreement.
        </P>
        <P>
          Nothing in this clause excludes liability that cannot lawfully be excluded or
          limited, including liability arising from fraud or wilful misconduct where
          applicable. The Client remains responsible for business decisions, marketing claims,
          pricing accuracy, regulatory disclosures, and the lawful use of the completed
          website.
        </P>
      </Section>

      {/* ---------- 20. termination ---------- */}
      <Section n="20" title="Termination and Cancellation">
        <P>
          Either Party may terminate this Agreement by written notice if the other Party
          commits a material breach and fails to remedy that breach within 15 calendar days
          after receiving written notice describing the breach. The Parties may also
          terminate the project by mutual written agreement.
        </P>
        <P>
          If the Client terminates the project for convenience, the Client shall pay for
          completed work, approved milestones, and reasonable non-cancellable commitments
          incurred up to the effective termination date, subject to applicable law and the
          agreed commercial terms.
        </P>
        <P>
          Any refund of advance payments shall be determined by the value of work completed,
          the applicable payment terms, and any lawful non-refundable commitments.
        </P>
        <P>
          Upon termination, MovoX shall hand over paid-for deliverables covered by the
          Agreement, subject to the relevant payment and intellectual property provisions. If
          MovoX terminates the Agreement due to an unresolved material breach by the Client,
          the Parties shall settle outstanding amounts in accordance with this Agreement and
          applicable law.
        </P>
      </Section>

      {/* ---------- 21. force majeure ---------- */}
      <Section n="21" title="Force Majeure">
        <P>
          Neither Party shall be considered in breach solely because performance is delayed
          by events beyond its reasonable control, including natural disasters, governmental
          restrictions, major infrastructure failures, widespread cyber incidents, or
          significant third-party service disruptions.
        </P>
        <P>
          The affected Party shall notify the other Party within a reasonable period and take
          reasonable steps to reduce the impact. If the event continues for an extended
          period, the Parties shall discuss a reasonable adjustment to the schedule, scope,
          or termination arrangements.
        </P>
      </Section>

      {/* ---------- 22. communication ---------- */}
      <Section n="22" title="Communication and Formal Approvals">
        <P>
          Project communications shall be conducted through the mutually agreed email
          address, project management platform, or other written channel.
        </P>
        <P>
          Written approval through the agreed channel may be used to confirm designs,
          quotations, change requests, milestone completion, and delivery acceptance.
        </P>
        <P>
          Material changes to the Agreement itself must be documented in writing and
          accepted by both Parties.
        </P>
      </Section>

      {/* ---------- 23. governing law ---------- */}
      <Section n="23" title="Governing Law and Dispute Resolution">
        <P>
          This Agreement shall be governed by the laws of{' '}
          <strong>{or(a.law_country, 'India')}</strong>.
        </P>
        <P>
          The Parties shall first attempt to resolve disputes through good-faith discussions
          between their authorized representatives.
        </P>
        <P>
          If the dispute cannot be resolved through discussions within a reasonable period,
          either Party may pursue remedies available under applicable law before the competent
          courts having jurisdiction at{' '}
          <strong>
            {[a.law_city, a.law_state, a.law_country].filter(Boolean).join(', ') ||
              '[Agreed City, State, India]'}
          </strong>
          , subject to applicable law. Any mandatory statutory rights or remedies shall remain
          unaffected.
        </P>
      </Section>

      {/* ---------- 24. entire agreement ---------- */}
      <Section n="24" title="Entire Agreement">
        <P>
          This Agreement, together with the approved quotation, statement of work, and
          written change requests incorporated into it, constitutes the agreement between the
          Parties regarding the project.
        </P>
        <P>
          If any inconsistency arises, the following order of precedence shall apply unless
          the Parties expressly agree otherwise:
        </P>
        <OL
          items={[
            'A later written amendment signed or accepted by both Parties.',
            'This Agreement.',
            'The approved statement of work or technical specification.',
            'The approved quotation.',
          ]}
        />
        <P>
          Any provision held invalid or unenforceable shall be interpreted or severed to the
          extent necessary, without invalidating the remaining provisions.
        </P>
      </Section>

      {/* ---------- Schedule A ---------- */}
      <div className="mt-10 break-before-page">
        <h2 className="font-heading text-center text-base font-extrabold uppercase tracking-wide text-ink">
          Schedule A — Project Commercial Summary
        </h2>
        <table className="mt-4 w-full border-collapse text-[11px]">
          <thead>
            <tr className="border-y border-slate-300 text-left">
              <th className="w-1/2 py-2 pr-3 font-semibold">Particular</th>
              <th className="py-2 font-semibold">Agreed Details</th>
            </tr>
          </thead>
          <tbody>
            <Row2 k="Project Name" v={or(a.project_name, 'MovoX Service Pricing Section')} />
            <Row2 k="Website" v={or(s.website, 'https://www.heymovox.com')} />
            <Row2 k="Technology" v={or(s.technology, 'React, Vite, Tailwind CSS')} />
            <Row2 k="Total Project Fee" v={inr(fee)} strong />
            <Row2 k="GST / Taxes" v={or(s.gst, 'As applicable')} />
            <Row2 k="Advance Payment" v={or(s.advancePayment, '40%')} />
            <Row2 k="Milestone Payment" v={or(s.milestonePayment, '40%')} />
            <Row2 k="Final Payment" v={or(s.finalPayment, '20%')} />
            <Row2 k="Estimated Delivery" v={or(s.estimatedDelivery, '[X–Y business days]')} />
            <Row2 k="Design Revision Rounds" v={or(s.designRevisionRounds, '[Number]')} />
            <Row2 k="Development Revision Rounds" v={or(s.developmentRevisionRounds, '[Number]')} />
            <Row2 k="Post-launch Bug-fix Period" v={`${or(s.bugFixDays, '[Number]')} days`} />
            <Row2 k="Deployment Included" v={or(s.deploymentIncluded, '[Yes / No]')} />
            <Row2 k="Source Code Handover" v={or(s.sourceCodeHandover, '[Yes / No / Conditions]')} />
            <Row2 k="Maintenance" v={or(s.maintenance, '[Included / Excluded / Separate Plan]')} />
            <Row2 k="Hosting and Domain" v={or(s.hostingAndDomain, '[Included / Excluded]')} />
            <Row2 k="Additional Expenses" v="As specified in Section 8" />
          </tbody>
        </table>

        {s.lineItems.length > 0 && (
          <>
            <h3 className="mt-6 font-heading text-[12.5px] font-bold text-ink">
              Agreed Services &amp; Pricing
            </h3>
            <table className="mt-2 w-full border-collapse text-[11px]">
              <thead>
                <tr className="border-y border-slate-300 text-left">
                  <th className="w-8 py-1.5 pr-1 font-semibold">#</th>
                  <th className="py-1.5 pr-2 font-semibold">Service</th>
                  <th className="py-1.5 pr-2 font-semibold">Description</th>
                  <th className="py-1.5 pr-2 text-right font-semibold">Qty</th>
                  <th className="py-1.5 pr-2 text-right font-semibold">Unit</th>
                  <th className="py-1.5 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {s.lineItems.map((item, i) => (
                  <tr key={item.id} className="border-b border-slate-200 align-top">
                    <td className="py-1.5 pr-1 text-slate-500">{i + 1}</td>
                    <td className="py-1.5 pr-2 font-medium text-ink">
                      {or(item.serviceName)}
                      {item.packageName && (
                        <span className="block font-normal text-slate-500">
                          {item.packageName}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 pr-2 text-slate-600">
                      {or(item.description, '—')}
                    </td>
                    <td className="py-1.5 pr-2 text-right">{item.quantity}</td>
                    <td className="py-1.5 pr-2 text-right">{inr(item.unitPrice)}</td>
                    <td className="py-1.5 text-right font-semibold">
                      {inr((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-y border-slate-300">
                  <td colSpan={5} className="py-1.5 pr-2 text-right font-semibold">
                    Subtotal
                  </td>
                  <td className="py-1.5 text-right font-semibold">{inr(lineTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </>
        )}

        {s.notes && (
          <div className="mt-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Notes
            </p>
            <p className="mt-1 whitespace-pre-wrap">{s.notes}</p>
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 gap-12">
          <ApprovalSlot
            party="Client Approval"
            signature={a.client_signature}
            name={a.client_signed_name || a.client_rep_name || a.client_name}
            signedAt={a.client_signed_at}
            designation={a.client_rep_designation}
          />
          <ApprovalSlot
            party="MovoX Approval"
            signature={a.movox_signature}
            name={a.movox_signed_name || a.movox_rep_name}
            signedAt={a.movox_signed_at}
            designation={a.movox_rep_designation}
          />
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* small pieces                                                        */
/* ------------------------------------------------------------------ */

const Row = ({ k, v, strong }: { k: string; v?: string; strong?: boolean }) => (
  <div className="flex gap-2">
    <span className="shrink-0 text-slate-500">{k}:</span>
    <span className={strong ? 'font-bold text-ink' : 'font-medium text-ink'}>{or(v)}</span>
  </div>
);

const Row2 = ({ k, v, strong }: { k: string; v: string; strong?: boolean }) => (
  <tr className="border-b border-slate-200">
    <td className="py-1.5 pr-3 text-slate-600">{k}</td>
    <td className={`py-1.5 ${strong ? 'font-bold text-ink' : 'font-medium text-ink'}`}>{v}</td>
  </tr>
);

const PriceList = ({
  entries,
}: {
  entries: { name: string; price: string; items: string[] }[];
}) => (
  <div className="mt-2 space-y-3">
    {entries.map(e => (
      <div key={e.name}>
        <p className="font-semibold text-ink">
          {e.name} — <span className="text-brand-700">{e.price}</span>
        </p>
        <UL items={e.items.map(i => <span className="text-[11px]">{i}</span>)} />
      </div>
    ))}
  </div>
);

const signedOn = (iso: string | null | undefined) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return ddmmyyyy(d.toISOString());
};

/**
 * One approval block in Schedule A. Renders the captured signature above a
 * ruled line, or an empty ruled line when it has not been signed yet.
 */
const ApprovalSlot = ({
  party,
  signature,
  name,
  signedAt,
  designation,
}: {
  party: string;
  signature?: string;
  name?: string;
  signedAt?: string | null;
  designation?: string;
}) => (
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{party}</p>

    <div className="mt-2 flex h-[70px] items-end justify-center border-b border-slate-400 pb-1">
      {signature ? (
        <img
          src={signature}
          alt={`${party} signature`}
          className="max-h-[64px] w-auto object-contain"
        />
      ) : null}
    </div>

    <p className="mt-0.5 text-[10px] text-slate-500">
      {or(name)}
      {designation ? `, ${designation}` : ''}
    </p>
    <p className="text-[10px] text-slate-400">
      {signedOn(signedAt) ? `Date: ${signedOn(signedAt)}` : 'Date: —'}
    </p>
  </div>
);