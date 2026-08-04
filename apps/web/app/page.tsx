import { Navigation } from './sections/navigation';
import { HeroSection } from './sections/hero';
import { FeaturesSection } from './sections/features';
import { HowItWorksSection } from './sections/how-it-works';
import { WhyChooseUsSection } from './sections/why-choose-us';
import { TechnologySection } from './sections/technology';
import { FAQSection } from './sections/faq';
import { FooterSection } from './sections/footer-section';

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TechnologySection />
        <WhyChooseUsSection />
        <FAQSection />
      </main>
      <FooterSection />
    </>
  );
}
