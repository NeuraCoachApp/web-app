'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/contexts/AuthContext'
import { useCoach } from '@/src/contexts/CoachContext'
import { useOnboardingFlow, OnboardingState, OnboardingStep, OnboardingStatus } from '@/src/hooks/useOnboarding'
import { Profile } from '@/src/hooks/useProfile'

interface OnboardingContextType {
  state: OnboardingState
  updateState: (updates: Partial<OnboardingState>) => void
  setCurrentStep: (step: number) => void
  handleVoiceTranscript: (transcript: string, isFinal: boolean) => Promise<void>
  handleNext: () => Promise<void>
  shouldAutoAdvance: () => boolean
  getCurrentText: () => string
  currentStepData: OnboardingStep
  isInputStep: boolean
  isLastStep: boolean
  profile: Profile | null | undefined
  onboardingStatus: OnboardingStatus | undefined
  showIntro: boolean
  startFlow: () => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function useOnboardingContext() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboardingContext must be used within an OnboardingProvider')
  }
  return context
}

interface OnboardingProviderProps {
  children: React.ReactNode
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { user, loading } = useAuth()
  const { isSpeaking, isPreparingSpeech } = useCoach()
  const router = useRouter()
  const onboardingFlow = useOnboardingFlow()
  const [showIntro, setShowIntro] = useState(true)

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  // Initialize onboarding step
  useEffect(() => {
    onboardingFlow.initializeStep()
  }, [onboardingFlow.initializeStep])

  // Check if user should be redirected away from onboarding
  // Only check this initially, not during the active flow to prevent premature redirects
  useEffect(() => {
    if (!user || loading || !onboardingFlow.state.onboardingChecked || !onboardingFlow.onboardingStatus) return

    // Only redirect if we haven't started the onboarding flow yet (showIntro is still true)
    // and if no onboarding is needed
    if (showIntro && !onboardingFlow.onboardingStatus.shouldRedirectToOnboarding) {
      router.push('/dashboard')
      return
    }
  }, [user, loading, onboardingFlow.state.onboardingChecked, onboardingFlow.onboardingStatus, router, showIntro])

  const startFlow = () => {
    setShowIntro(false)
  }

  // Auto-advance logic for non-input steps - wait for speech completion
  useEffect(() => {
    if (!showIntro && onboardingFlow.shouldAutoAdvance()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⏱️ [Auto-advance] Monitoring speech for step', {
          currentStep: onboardingFlow.state.currentStep,
          stepId: onboardingFlow.currentStepData?.id,
          isLastStep: onboardingFlow.isLastStep,
          isSpeaking,
          isPreparingSpeech
        })
      }
      
      // Wait for speech to complete, then advance after a short delay
      // BUT don't auto-advance on the last step - let user click the button
      if (!isSpeaking && !isPreparingSpeech && !onboardingFlow.isLastStep) {
        const timer = setTimeout(async () => {
          if (process.env.NODE_ENV === 'development') {
            console.log('⏱️ [Auto-advance] Speech completed, advancing step', {
              currentStep: onboardingFlow.state.currentStep,
              stepId: onboardingFlow.currentStepData?.id,
              isLastStep: onboardingFlow.isLastStep
            })
          }
          
          onboardingFlow.setCurrentStep(onboardingFlow.state.currentStep + 1)
        }, 1000) // Short 1 second delay after speech completes
        
        return () => {
          if (process.env.NODE_ENV === 'development') {
            console.log('⏱️ [Auto-advance] Clearing completion timer for step', onboardingFlow.state.currentStep)
          }
          clearTimeout(timer)
        }
      }
    }
  }, [onboardingFlow.state.currentStep, router, showIntro, isSpeaking, isPreparingSpeech])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const contextValue = {
    ...onboardingFlow,
    showIntro,
    startFlow
  }

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  )
}
