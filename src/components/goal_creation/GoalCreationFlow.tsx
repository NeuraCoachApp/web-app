'use client'

import React from 'react'
import { FlowLayout, IntroScreen } from '@/src/components/voice'
import { goalCreationSteps } from '@/src/hooks/goalCreation/useGoalCreation'
import { useGoalCreationContext } from './GoalCreationProvider'
import { useCoach } from '@/src/contexts/CoachContext'
import { GoalReasonStep } from './GoalReasonStep'
import { GoalSetupStep } from './GoalSetupStep'
import { GoalNotificationStep } from './GoalNotificationStep'
import { GoalTextOnlyStep } from './GoalTextOnlyStep'
import { GoalFinalStep } from './GoalFinalStep'

export function GoalCreationFlow() {
  const {
    state,
    getCurrentText,
    currentStepData,
    showIntro,
    startFlow,
    profile
  } = useGoalCreationContext()
  const { markUserInteracted } = useCoach()

  const renderCurrentStep = () => {
    const stepId = currentStepData?.id

    switch (stepId) {
      case 'questions_time':
        return <GoalReasonStep />
      case 'goal_setup':
        return <GoalSetupStep />
      case 'notification_time':
        return <GoalNotificationStep />
      case 'final':
        return <GoalFinalStep />
      default:
        return <GoalTextOnlyStep />
    }
  }

  const handleStart = () => {
    markUserInteracted() // Enable audio playback
    startFlow() // Start the goal creation flow
  }

  // Show intro screen first
  if (showIntro) {
    return (
      <IntroScreen
        title={`Welcome${profile?.first_name ? `, ${profile.first_name}` : ''}!`}
        description="I'm here to help you set up your personal goal and guide you through your journey. We'll work together to understand what you want to achieve and create a plan that works for you."
        onStart={handleStart}
      />
    )
  }

  return (
    <FlowLayout
      currentStep={state.currentStep}
      totalSteps={goalCreationSteps.length}
      getCurrentText={getCurrentText}
      currentStepData={currentStepData}
      stepKey={state.currentStep}
    >
      {renderCurrentStep()}
    </FlowLayout>
  )
}
