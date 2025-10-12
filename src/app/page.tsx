import { HeroSection, FeaturesSection, StatsSection, CTASection } from '@/components/hero-section'

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <CTASection />
    </div>
  )
}