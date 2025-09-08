'use client'

import { OnboardingProvider, OnboardingFlow } from '@/src/components/onboarding'

export default function Onboarding() {
  return (
    <OnboardingProvider>
      <OnboardingFlow />
    </OnboardingProvider>
  )
}
