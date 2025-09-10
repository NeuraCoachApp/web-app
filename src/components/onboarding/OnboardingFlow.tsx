'use client'

import React from 'react'
import { FlowLayout, IntroScreen } from '@/src/components/voice'
import { onboardingSteps } from '@/src/hooks/useOnboarding'
import { useOnboardingContext } from './OnboardingProvider'
import { useCoach } from '@/src/contexts/CoachContext'
import { WelcomeStep } from './WelcomeStep'
import { NameInputStep } from './NameInputStep'
import { TextOnlyStep } from './TextOnlyStep'

export function OnboardingFlow() {
  const {
    state,
    getCurrentText,
    currentStepData,
    showIntro,
    startFlow
  } = useOnboardingContext()
  const { markUserInteracted } = useCoach()

  // Function to get next step's text for prefetching
  const getNextStepText = (): string | null => {
    const nextStepIndex = state.currentStep + 1
    if (nextStepIndex >= onboardingSteps.length) {
      return null
    }

    const nextStep = onboardingSteps[nextStepIndex]
    let nextText = nextStep.text

    // Handle personalization for the next step
    if (nextStep.id === 'personal_welcome') {
      nextText = nextText.replace('[Name]', state.firstName || state.userName || 'there')
    }

    // Add subtext if present
    if (nextStep.subtext) {
      nextText = `${nextText} ${nextStep.subtext}`
    }

    return nextText
  }

  const renderCurrentStep = () => {
    const stepId = currentStepData?.id

    switch (stepId) {
      case 'greeting':
        return <WelcomeStep />
      case 'name_input':
        return <NameInputStep />
      case 'personal_welcome':
        return <TextOnlyStep />
      case 'ava_introduction':
        return <TextOnlyStep />
      case 'growth_message':
        return <TextOnlyStep />
      case 'statistics':
        return <TextOnlyStep />
      case 'reassurance':
        return <TextOnlyStep />
      case 'mission_statement':
        return <TextOnlyStep />
      default:
        return <TextOnlyStep />
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
        description="I'm Ava, your AI coach. I'll guide you through a personalized journey to help you grow and achieve your goals in a way no other platform has done before."
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
      getNextStepText={getNextStepText}
    >
      {renderCurrentStep()}
    </FlowLayout>
  )
}
