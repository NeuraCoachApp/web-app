'use client'

import ParallaxWrapper from "@/src/components/ui/parallax-wrapper"
import HeroSection from "./HeroSection"
import OverviewSection from "./OverviewSection"
import HowItWorksSection from "./HowItWorksSection"
import WhoIsThisForSection from "./WhoIsThisForSection"
import GallerySection from "./GallerySection"
import AboutSection from "./AboutSection"
import TestimonialsSection from "./TestimonialsSection"
import PricingSection from "./PricingSection"
import FAQSection from "./FAQSection"
import Footer from "./Footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <ParallaxWrapper speed={0.3}>
        <HeroSection />
      </ParallaxWrapper>
      
      <ParallaxWrapper speed={0.1}>
        <OverviewSection />
      </ParallaxWrapper>
      
      <ParallaxWrapper speed={0.15}>
        <HowItWorksSection />
      </ParallaxWrapper>
      
      <ParallaxWrapper speed={0.08}>
        <WhoIsThisForSection />
      </ParallaxWrapper>
      
      <ParallaxWrapper speed={0.12}>
        <GallerySection />
      </ParallaxWrapper>
      
      <ParallaxWrapper speed={0.06}>
        <AboutSection />
      </ParallaxWrapper>
      
      <ParallaxWrapper speed={0.09}>
        <TestimonialsSection />
      </ParallaxWrapper>
      
      <ParallaxWrapper speed={0.05}>
        <PricingSection />
      </ParallaxWrapper>
      
      <ParallaxWrapper speed={0.03}>
        <FAQSection />
      </ParallaxWrapper>
      
      <Footer />
    </div>
  )
}
