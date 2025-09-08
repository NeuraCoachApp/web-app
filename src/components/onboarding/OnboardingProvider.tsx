'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/contexts/AuthContext'
import { useOnboardingFlow, OnboardingState, OnboardingStep, OnboardingStatus } from '@/src/hooks/useOnboarding'
import { Profile } from '@/src/hooks/useProfile'
import { getCoachSpeakingTime, logSpeakingTimeDebug } from '@/src/lib/speech-timing'

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
  useEffect(() => {
    if (!user || loading || !onboardingFlow.state.onboardingChecked || !onboardingFlow.onboardingStatus) return

    // If no onboarding needed, redirect to dashboard
    if (!onboardingFlow.onboardingStatus.shouldRedirectToOnboarding) {
      router.push('/dashboard')
      return
    }
  }, [user, loading, onboardingFlow.state.onboardingChecked, onboardingFlow.onboardingStatus, router])

  const startFlow = () => {
    setShowIntro(false)
  }

  // Auto-advance logic for non-input steps
  useEffect(() => {
    if (!showIntro && onboardingFlow.shouldAutoAdvance()) {
      // Calculate speaking time based on the current step's text content
      const currentText = onboardingFlow.getCurrentText()
      const currentSubtext = onboardingFlow.currentStepData?.subtext
      const speakingTime = getCoachSpeakingTime(currentText, currentSubtext)
      
      // Log timing for debugging
      if (process.env.NODE_ENV === 'development') {
        logSpeakingTimeDebug(currentText, currentSubtext)
      }
      
      const timer = setTimeout(async () => {
        if (onboardingFlow.isLastStep) {
          // Wait a moment to ensure all mutations have completed and caches are invalidated
          await new Promise(resolve => setTimeout(resolve, 200))
          // After profile onboarding, go to dashboard
          router.push('/dashboard')
        } else {
          onboardingFlow.setCurrentStep(onboardingFlow.state.currentStep + 1)
        }
      }, speakingTime)
      
      return () => clearTimeout(timer)
    }
  }, [onboardingFlow, router, showIntro])

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
