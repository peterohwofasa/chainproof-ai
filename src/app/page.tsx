import { 
  HeroSection, 
  SocialProofSection,
  FeaturesSection, 
  DemoSection,
  StatsSection, 
  PricingPreviewSection,
  CTASection 
} from '@/components/hero-section'

export default function Home() {
  return (
    <main>
      <HeroSection />
      <SocialProofSection />
      <FeaturesSection />
      <DemoSection />
      <StatsSection />
      <PricingPreviewSection />
      <CTASection />
    </main>
  )
}