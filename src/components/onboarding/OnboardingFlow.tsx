'use client'

import React from 'react'
import { FlowLayout, IntroScreen } from '@/src/components/voice'
import { onboardingSteps } from '@/src/hooks/useOnboarding'
import { useOnboardingContext } from './OnboardingProvider'
import { useCoach } from '@/src/contexts/CoachContext'
import { WelcomeStep } from './WelcomeStep'
import { ProfileCompleteStep } from './ProfileCompleteStep'

export function OnboardingFlow() {
  const {
    state,
    getCurrentText,
    currentStepData,
    showIntro,
    startFlow
  } = useOnboardingContext()
  const { markUserInteracted } = useCoach()

  const renderCurrentStep = () => {
    const stepId = currentStepData?.id

    switch (stepId) {
      case 'welcome':
        return <WelcomeStep />
      case 'profile_complete':
        return <ProfileCompleteStep />
      default:
        return <WelcomeStep />
    }
  }

  const handleStart = () => {
    markUserInteracted() // Enable audio playback
    startFlow() // Start the onboarding flow
  }

  // Show intro screen first
  if (showIntro) {
    return (
      <IntroScreen
        title="Welcome to NeuraCoach!"
        description="I'm your AI coach, here to guide you through a personalized experience. We'll start by getting to know you better, then help you set up goals that matter to you."
        onStart={handleStart}
      />
    )
  }

  return (
    <FlowLayout
      currentStep={state.currentStep}
      totalSteps={onboardingSteps.length}
      getCurrentText={getCurrentText}
      currentStepData={currentStepData}
      stepKey={`${state.currentStep}`}
    >
      {renderCurrentStep()}
    </FlowLayout>
  )
}
