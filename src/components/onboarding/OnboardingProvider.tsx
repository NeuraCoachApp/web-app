'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/contexts/AuthContext'
import { useCoach } from '@/src/contexts/CoachContext'
import { useSubscription } from '@/src/contexts/SubscriptionContext'
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
  const { canAccessDashboard, isLoading: subscriptionLoading } = useSubscription()
  const router = useRouter()
  const onboardingFlow = useOnboardingFlow()
  const [showIntro, setShowIntro] = useState(true)

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  // Redirect to pricing if user doesn't have subscription access
  useEffect(() => {
    if (!loading && !subscriptionLoading && user && !canAccessDashboard) {
      router.push('/pricing')
    }
  }, [user, loading, subscriptionLoading, canAccessDashboard, router])

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
      
      if (!isSpeaking && !isPreparingSpeech && !onboardingFlow.isLastStep) {
        const timer = setTimeout(async () => {
          // Double-check that we should still auto-advance and speech is still complete
          if (onboardingFlow.shouldAutoAdvance() && !isSpeaking && !isPreparingSpeech) {     
            onboardingFlow.setCurrentStep(onboardingFlow.state.currentStep + 1)
          }
        }, 100) // Increased delay to ensure speech completion and user comprehension
        
        return () => {
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
