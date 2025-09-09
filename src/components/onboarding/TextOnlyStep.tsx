'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { FlowStep, FlowStepButton } from '@/src/components/voice'
import { useOnboardingContext } from './OnboardingProvider'
import { useCoach } from '@/src/contexts/CoachContext'
import { useAuth } from '@/src/contexts/AuthContext'
import { onboardingKeys } from '@/src/hooks/useOnboarding'
import { profileKeys } from '@/src/hooks/useProfile'

export function TextOnlyStep() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { currentStepData, isLastStep, updateState } = useOnboardingContext()
  const { isSpeaking, isPreparingSpeech } = useCoach()
  const [showButton, setShowButton] = useState(false)

  // Show button only after speech is complete and only for the last step
  useEffect(() => {
    if (isLastStep && !isSpeaking && !isPreparingSpeech && !showButton) {
      // Add a small delay to ensure speech has fully completed
      const timer = setTimeout(() => {
        setShowButton(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isLastStep, isSpeaking, isPreparingSpeech, showButton])

  const handleContinue = async () => {
    // Mark flow as completed to prevent reinitialization
    updateState({ flowCompleted: true })
    
    if (user) {
      // Now that onboarding is complete, invalidate onboarding status cache
      // so the dashboard knows not to redirect back to onboarding
      await queryClient.invalidateQueries({ queryKey: onboardingKeys.status(user.id) })
      
      // Wait for cache to update
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    router.push('/dashboard')
  }

  return (
    <FlowStep>
      {/* Text content will appear as captions after being spoken */}
      
      <div className="mt-8">
        {isLastStep && showButton && (
          <FlowStepButton
            onClick={handleContinue}
            variant="primary"
          >
            Continue to Dashboard
          </FlowStepButton>
        )}
      </div>
    </FlowStep>
  )
}
