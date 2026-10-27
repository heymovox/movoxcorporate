import { useSEO } from '../lib/seo';
import { Hero } from '../components/home/Hero';
import { ClientTrust } from '../components/home/ClientTrust';
import { ServicesSection } from '../components/home/ServicesSection';
import { FeaturedWork } from '../components/home/FeaturedWork';
import { WhyMovox } from '../components/home/WhyMovox';
import { ProcessSection } from '../components/home/ProcessSection';
import { TestimonialsSection } from '../components/home/TestimonialsSection';
import { InsightsSection } from '../components/home/InsightsSection';
import { NavSection } from '../components/header/NavSection';

export default function Home() {
  useSEO({
    title: 'MovoX — Digital Growth | Branding, Web & App Development, Marketing',
    description:
      'MovoX is an integrated digital growth company: graphic design, branding & packaging, website & app development, and digital marketing & SEO.',
    path: '/',
  });

  return (
    <>
      <Hero />
      <ClientTrust />
      <NavSection path="/services">
        <ServicesSection />
      </NavSection>
      <NavSection path="/portfolio">
        <FeaturedWork />
      </NavSection>
      <WhyMovox />
      <ProcessSection />
      <TestimonialsSection />
      <NavSection path="/insights">
        <InsightsSection />
      </NavSection>
    </>
  );
}
