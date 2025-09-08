'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { StepBase, StepText, StepButton } from './StepBase'
import { useOnboardingContext } from './OnboardingProvider'

export function ProfileCompleteStep() {
  const router = useRouter()
  const { getCurrentText, currentStepData } = useOnboardingContext()

  const handleContinue = async () => {
    // Wait a moment to ensure all mutations have completed and caches are invalidated
    await new Promise(resolve => setTimeout(resolve, 200))
    router.push('/dashboard')
  }

  return (
    <StepBase>
      <StepText 
        title={getCurrentText()}
        subtitle={currentStepData?.subtext}
      />

      <div className="mt-8">
        <StepButton
          onClick={handleContinue}
          variant="primary"
          className="px-12 py-4"
        >
          Continue to Dashboard
        </StepButton>
      </div>
    </StepBase>
  )
}
