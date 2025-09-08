'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { FlowStep, FlowStepText, FlowStepButton } from '@/src/components/voice'
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
    <FlowStep>
      {/* Text content will now only appear as captions after being spoken */}
      
      <div className="mt-8">
        <FlowStepButton
          onClick={handleContinue}
          variant="primary"
        >
          Continue to Dashboard
        </FlowStepButton>
      </div>
    </FlowStep>
  )
}
