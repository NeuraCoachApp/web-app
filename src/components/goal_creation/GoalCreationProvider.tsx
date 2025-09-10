'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/contexts/AuthContext'
import { useGoalCreationFlow, GoalCreationState, GoalCreationStep, GoalCreationStatus } from '@/src/hooks/goalCreation/useGoalCreation'
import { Profile } from '@/src/hooks/useProfile'
import { getCoachSpeakingTime } from '@/src/lib/speech-timing'

interface GoalCreationContextType {
  state: GoalCreationState
  updateState: (updates: Partial<GoalCreationState>) => void
  setCurrentStep: (step: number) => void
  handleNext: () => Promise<void>
  shouldAutoAdvance: () => boolean
  getCurrentText: () => string
  currentStepData: GoalCreationStep
  isInputStep: boolean
  isLastStep: boolean
  profile: Profile | null | undefined
  goalCreationStatus: GoalCreationStatus | undefined
  showIntro: boolean
  startFlow: () => void
}

const GoalCreationContext = createContext<GoalCreationContextType | undefined>(undefined)

export function useGoalCreationContext() {
  const context = useContext(GoalCreationContext)
  if (context === undefined) {
    throw new Error('useGoalCreationContext must be used within a GoalCreationProvider')
  }
  return context
}

interface GoalCreationProviderProps {
  children: React.ReactNode
}

export function GoalCreationProvider({ children }: GoalCreationProviderProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const goalCreationFlow = useGoalCreationFlow()
  const [showIntro, setShowIntro] = useState(true)

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  // Initialize goal creation step
  useEffect(() => {
    goalCreationFlow.initializeStep()
  }, [goalCreationFlow.initializeStep])

  // Check if user should be redirected away from goal creation
  useEffect(() => {
    if (!user || loading || !goalCreationFlow.state.goalCreationChecked || !goalCreationFlow.goalCreationStatus) return

    // If no goal creation needed, redirect to dashboard
    if (!goalCreationFlow.goalCreationStatus.shouldRedirectToGoalCreation) {
      router.push('/dashboard')
      return
    }
  }, [user, loading, goalCreationFlow.state.goalCreationChecked, goalCreationFlow.goalCreationStatus, router])

  const startFlow = () => {
    setShowIntro(false)
  }

  // Auto-advance logic for non-input steps
  useEffect(() => {
    if (!showIntro && goalCreationFlow.shouldAutoAdvance()) {
      // Calculate speaking time based on the current step's text content
      const currentText = goalCreationFlow.getCurrentText()
      const currentSubtext = goalCreationFlow.currentStepData?.subtext
      const speakingTime = getCoachSpeakingTime(currentText, currentSubtext)
      
      const timer = setTimeout(async () => {
        if (goalCreationFlow.isLastStep) {
          // Wait a moment to ensure all mutations have completed and caches are invalidated
          await new Promise(resolve => setTimeout(resolve, 200))
          router.push('/dashboard')
        } else {
          goalCreationFlow.setCurrentStep(goalCreationFlow.state.currentStep + 1)
        }
      }, speakingTime)
      
      return () => clearTimeout(timer)
    }
  }, [goalCreationFlow, router, showIntro])

  if (!user) {
    return null
  }

  const contextValue = {
    ...goalCreationFlow,
    showIntro,
    startFlow
  }

  return (
    <GoalCreationContext.Provider value={contextValue}>
      {children}
    </GoalCreationContext.Provider>
  )
}
