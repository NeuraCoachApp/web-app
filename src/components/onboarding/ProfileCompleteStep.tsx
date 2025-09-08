'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { FlowStep, FlowStepText, FlowStepButton } from '@/src/components/voice'
import { useOnboardingContext } from './OnboardingProvider'
import { useCoach } from '@/src/contexts/CoachContext'
import { useAuth } from '@/src/contexts/AuthContext'
import { onboardingKeys } from '@/src/hooks/useOnboarding'

export function ProfileCompleteStep() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { getCurrentText, currentStepData } = useOnboardingContext()
  const { isSpeaking, isPreparingSpeech } = useCoach()
  const [showButton, setShowButton] = useState(false)

  // Show button only after speech is complete
  useEffect(() => {
    if (!isSpeaking && !isPreparingSpeech && !showButton) {
      // Add a small delay to ensure speech has fully completed
      const timer = setTimeout(() => {
        setShowButton(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isSpeaking, isPreparingSpeech, showButton])

  const handleContinue = async () => {
    // Ensure onboarding status cache is invalidated before navigation
    if (user) {
      await queryClient.invalidateQueries({ 
        queryKey: onboardingKeys.status(user.id) 
      })
    }
    
    // Wait a moment to ensure all mutations have completed and caches are invalidated
    await new Promise(resolve => setTimeout(resolve, 300))
    router.push('/dashboard')
  }

  return (
    <FlowStep>
      {/* Text content will now only appear as captions after being spoken */}
      
      <div className="mt-8">
        {showButton && (
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
