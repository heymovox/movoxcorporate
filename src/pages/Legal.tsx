import type { ReactNode } from 'react';
import { useSEO } from '../lib/seo';
import { Reveal } from '../components/Reveal';

interface LegalSection {
  heading: string;
  body: ReactNode;
}

function LegalLayout({
  title,
  description,
  path,
  updated,
  sections,
}: {
  title: string;
  description: string;
  path: string;
  updated: string;
  sections: LegalSection[];
}) {
  useSEO({ title, description, path });

  return (
    <>
      <section className="bg-white pb-16 pt-[124px] sm:pb-20 sm:pt-[132px]">
        <div className="container-site max-w-3xl">
          <Reveal>
            <span className="chip">Legal</span>
            <h1 className="mt-5 font-heading text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-sm font-medium text-slate-500">
              Last updated: {updated}
            </p>
          </Reveal>
          <div className="mt-10 space-y-10">
            {sections.map((section, i) => (
              <Reveal key={section.heading} delay={Math.min(i * 0.04, 0.15)}>
                <section aria-labelledby={`${path}-section-${i}`}>
                  <h2
                    id={`${path}-section-${i}`}
                    className="font-heading text-xl font-bold text-ink"
                  >
                    {section.heading}
                  </h2>
                  <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700">
                    {section.body}
                  </div>
                </section>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="mt-12 rounded-2xl border border-slate-200/70 bg-brand-50/60 p-6 text-sm leading-relaxed text-slate-700">
              Questions about this document? Contact us at{' '}
              <a
                href="mailto:info@heymovox.com"
                className="font-semibold text-brand-700 underline underline-offset-2"
              >
                info@heymovox.com
              </a>
              .
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}

const p = (text: string) => <p>{text}</p>;

export function Privacy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description="How MovoX collects, uses, and protects personal data submitted through this website."
      path="/privacy-policy"
      updated="October 1, 2026"
      sections={[
        {
          heading: 'Who we are',
          body: p(
            'MovoX — Digital Growth ("MovoX", "we", "us") operates this website and processes personal data submitted through our contact and enquiry forms. Our studio is located in Krishnagiri, Tamil Nadu, India.',
          ),
        },
        {
          heading: 'What we collect',
          body: (
            <>
              {p(
                'When you submit an enquiry, we collect the information you provide: your name, business name, work email, phone number (optional), the service you are interested in, your budget range, preferred timeline, and your project brief.',
              )}
              {p(
                'We also collect standard technical data automatically when you visit: browser type, device, pages visited, and approximate location (country/region), used in aggregate to improve the site.',
              )}
            </>
          ),
        },
        {
          heading: 'How we use it',
          body: (
            <>
              {p('We use submitted information to:')}
              <ul className="list-disc space-y-1.5 pl-5">
                <li>Respond to your enquiry and prepare proposals</li>
                <li>Deliver the services you engage us for</li>
                <li>Send service-related communications you have requested</li>
                <li>Improve our website and services in aggregate</li>
              </ul>
              {p(
                'We do not sell your personal data. We do not use it for unrelated marketing without your consent.',
              )}
            </>
          ),
        },
        {
          heading: 'Legal basis and retention',
          body: p(
            'We process enquiry data on the basis of your consent and our legitimate interest in responding to business enquiries. Enquiry records are retained for 24 months from last contact, after which they are deleted unless an active engagement requires longer retention under contract or legal obligation.',
          ),
        },
        {
          heading: 'Third-party processors',
          body: p(
            'We use a small set of vetted processors to operate this site: hosting and deployment infrastructure, form/enquiry storage, email delivery, and privacy-respecting analytics. Each processor is bound by a data processing agreement. We do not transfer data outside your region except where the processor provides adequate safeguards.',
          ),
        },
        {
          heading: 'Your rights',
          body: (
            <>
              {p(
                'Depending on your jurisdiction (including GDPR and CCPA/CPRA), you may have the right to:',
              )}
              <ul className="list-disc space-y-1.5 pl-5">
                <li>Access the personal data we hold about you</li>
                <li>Request correction or deletion of your data</li>
                <li>Object to or restrict processing</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time, without affecting prior processing</li>
              </ul>
              {p(
                'To exercise any of these rights, email info@heymovox.com. We respond within 30 days. You also have the right to lodge a complaint with your local supervisory authority.',
              )}
            </>
          ),
        },
        {
          heading: 'Cookies and analytics',
          body: p(
            'This site uses privacy-respecting, cookie-free analytics in aggregate form where technically possible, and cookies only where strictly necessary for site function. You can block cookies in your browser settings without affecting core site functionality.',
          ),
        },
        {
          heading: 'Changes to this policy',
          body: p(
            'If we change this policy, we will update the date above and, where changes are significant, provide notice on this page. This document is generated from the current MovoX privacy policy; contact us for the full legal text.',
          ),
        },
      ]}
    />
  );
}

export function Terms() {
  return (
    <LegalLayout
      title="Terms & Conditions"
      description="The terms governing use of the MovoX website and engagement of MovoX services."
      path="/terms"
      updated="October 1, 2026"
      sections={[
        {
          heading: 'Acceptance of terms',
          body: p(
            'By using this website or engaging MovoX — Digital Growth ("MovoX"), you agree to these Terms & Conditions. If you do not agree, please do not use the site or submit enquiries.',
          ),
        },
        {
          heading: 'Website content',
          body: (
            <>
              {p(
                'Content on this site — including case studies, portfolio examples, blog articles, and service descriptions — is provided for general information about MovoX capabilities. Portfolio entries marked as sample demonstrations describe the engagement structure and are not attributed to real clients unless explicitly stated with consent.',
              )}
              {p(
                'We make reasonable efforts to keep content accurate and current, but we do not warrant that all information is complete or error-free at all times.',
              )}
            </>
          ),
        },
        {
          heading: 'Intellectual property',
          body: p(
            'All website content, designs, trademarks, and materials are the property of MovoX or its licensors and are protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works from site content without written permission, except for personal, non-commercial reference with attribution.',
          ),
        },
        {
          heading: 'Enquiries and proposals',
          body: p(
            'Submitting an enquiry does not create a client relationship, obligation, or contract. Engagements begin only when both parties execute a written statement of work or agreement. Proposals we provide are valid for 30 days unless otherwise stated.',
          ),
        },
        {
          heading: 'No professional advice',
          body: p(
            'Blog articles and case studies reflect general experience and opinion. They do not constitute legal, financial, or professional advice, and outcomes described are specific to their engagements.',
          ),
        },
        {
          heading: 'Limitation of liability',
          body: p(
            'To the maximum extent permitted by law, MovoX is not liable for indirect, incidental, or consequential damages arising from use of this website or reliance on its content. Our total liability for any claim relating to an engagement is limited to the fees paid for the services giving rise to the claim.',
          ),
        },
        {
          heading: 'Governing law',
          body: p(
            'These terms are governed by the laws of the State of California, USA, without regard to conflict-of-law rules. Disputes are resolved in the state or federal courts located in San Francisco County, California.',
          ),
        },
        {
          heading: 'Contact',
          body: p(
            'Questions about these terms: info@heymovox.com, Krishnagiri, Tamil Nadu, India.',
          ),
        },
      ]}
    />
  );
}
