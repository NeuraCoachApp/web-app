'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { FlowStep, FlowStepButton } from '@/src/components/voice'
import { useGoalCreationContext } from './GoalCreationProvider'
import { useCoach } from '@/src/contexts/CoachContext'
import { useAuth } from '@/src/contexts/AuthContext'
import { goalCreationKeys } from '@/src/hooks/goalCreation/useGoalCreation'

export function TextOnlyStep() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { currentStepData, isLastStep, updateState } = useGoalCreationContext()
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
    if (user) {
      // Invalidate goal creation status cache so the dashboard knows not to redirect back
      await queryClient.invalidateQueries({ queryKey: goalCreationKeys.status(user.id) })
      
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
            Let's Get Started!
          </FlowStepButton>
        )}
      </div>
    </FlowStep>
  )
}
