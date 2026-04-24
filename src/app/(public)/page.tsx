import { HeroSection } from "@/components/sections/HeroSection";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { MidPageCta } from "@/components/sections/MidPageCta";
import { PricingSection } from "@/components/sections/PricingSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { FaqSection } from "@/components/sections/FaqSection";
import { FinalCta } from "@/components/sections/FinalCta";

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <MidPageCta />
      <PricingSection />
      <TestimonialsSection />
      <FaqSection />
      <FinalCta />
    </>
  );
}
