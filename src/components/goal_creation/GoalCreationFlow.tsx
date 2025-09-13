'use client'

import React from 'react'
import { FlowLayout, IntroScreen } from '@/src/components/voice'
import { goalCreationSteps } from '@/src/hooks/goalCreation/useGoalCreation'
import { useGoalCreationContext } from './GoalCreationProvider'
import { useCoach } from '@/src/contexts/CoachContext'
import { ComprehensiveInputStep } from './ComprehensiveInputStep'
import { TextOnlyStep } from './TextOnlyStep'

export function GoalCreationFlow() {
  const {
    state,
    updateState,
    getCurrentText,
    currentStepData,
    showIntro,
    startFlow,
    profile
  } = useGoalCreationContext()
  const { markUserInteracted } = useCoach()

  // Show completion message when goal creation is in progress
  if (state.backgroundProcessStatus === 'generating-steps' || state.backgroundProcessStatus === 'creating-goal') {
    return (
      <FlowLayout
        currentStep={state.currentStep}
        totalSteps={goalCreationSteps.length}
        getCurrentText={() => "Perfect! I'm creating your personalized goal plan with AI-generated milestones and tasks. This will just take a moment..."}
        currentStepData={{ id: 'completion', text: "Creating your goal...", subtext: "", personality: "excited" }}
        stepKey={state.currentStep}
      >
        <div className="flex flex-col items-center space-y-6 mt-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-center text-gray-300">
            Creating your goal with AI-powered milestones and tasks...
          </p>
        </div>
      </FlowLayout>
    )
  }

  // Show success message when completed
  if (state.backgroundProcessStatus === 'completed') {
    return (
      <FlowLayout
        currentStep={state.currentStep}
        totalSteps={goalCreationSteps.length}
        getCurrentText={() => "Your goal is all set up! I'm excited to be your coach on this journey. Let's make it happen!"}
        currentStepData={{ id: 'success', text: "Goal created successfully!", subtext: "", personality: "enthusiastic" }}
        stepKey={state.currentStep}
      >
        <div className="flex flex-col items-center space-y-6 mt-8">
          <div className="text-green-500 text-6xl">✓</div>
          <p className="text-center text-gray-300">
            Your goal has been created successfully! Redirecting to your dashboard...
          </p>
        </div>
      </FlowLayout>
    )
  }

  // Show error message when failed
  if (state.backgroundProcessStatus === 'failed') {
    return (
      <FlowLayout
        currentStep={state.currentStep}
        totalSteps={goalCreationSteps.length}
        getCurrentText={() => "I encountered an issue creating your goal. Let's try again."}
        currentStepData={{ id: 'error', text: "Goal creation failed", subtext: "", personality: "understanding" }}
        stepKey={state.currentStep}
      >
        <div className="flex flex-col items-center space-y-6 mt-8">
          <div className="text-red-500 text-6xl">⚠</div>
          <p className="text-center text-gray-300">
            {state.stepGenerationError || "Something went wrong while creating your goal."}
          </p>
          <button
            onClick={() => updateState({ backgroundProcessStatus: 'idle' })}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </FlowLayout>
    )
  }

  const renderCurrentStep = () => {
    const stepId = currentStepData?.id

    switch (stepId) {
      case 'goal_question':
        return (
          <ComprehensiveInputStep
            stepId={stepId}
            value={state.goal}
            onChange={(value) => updateState({ goal: value })}
            placeholder="What would you like to work on or achieve?"
            inputType="textarea"
            buttonText="Set Goal"
          />
        )
      
      case 'deadline_question':
        return (
          <ComprehensiveInputStep
            stepId={stepId}
            value={state.deadline}
            onChange={(value) => updateState({ deadline: value })}
            placeholder="e.g., '3 months', 'by December 2024', 'in 6 weeks'"
            inputType="text"
            buttonText="Continue"
          />
        )
      
      case 'motivation_question':
        return (
          <ComprehensiveInputStep
            stepId={stepId}
            value={state.motivation}
            onChange={(value) => updateState({ motivation: value })}
            placeholder="What's driving this desire for change? How will achieving this goal impact your life?"
            inputType="textarea"
            buttonText="Continue"
          />
        )
      
      case 'current_progress_question':
        return (
          <ComprehensiveInputStep
            stepId={stepId}
            value={state.currentProgress}
            onChange={(value) => updateState({ currentProgress: value })}
            placeholder="What have you already tried? Where are you starting from?"
            inputType="textarea"
            buttonText="Continue"
          />
        )
      
      case 'obstacles_question':
        return (
          <ComprehensiveInputStep
            stepId={stepId}
            value={state.obstacles}
            onChange={(value) => updateState({ obstacles: value })}
            placeholder="What challenges do you expect? What has held you back before?"
            inputType="textarea"
            buttonText="Continue"
          />
        )
      
      case 'daily_success_question':
        return (
          <ComprehensiveInputStep
            stepId={stepId}
            value={state.dailySuccess}
            onChange={(value) => updateState({ dailySuccess: value })}
            placeholder="What small daily actions would show you're making progress?"
            inputType="textarea"
            buttonText="Continue"
          />
        )
      
      case 'time_commitment_question':
        return (
          <ComprehensiveInputStep
            stepId={stepId}
            value={state.timeCommitment}
            onChange={(value) => updateState({ timeCommitment: value })}
            placeholder="e.g., '30 minutes', '1 hour', '2-3 hours'"
            inputType="text"
            buttonText="Continue"
          />
        )
      
      case 'best_time_question':
        return (
          <ComprehensiveInputStep
            stepId={stepId}
            value={state.bestTimeOfDay}
            onChange={(value) => updateState({ bestTimeOfDay: value })}
            placeholder="When do you have the most energy and focus?"
            inputType="select"
            options={[
              'Early morning (5am-8am)',
              'Morning (8am-12pm)', 
              'Afternoon (12pm-5pm)',
              'Evening (5pm-9pm)',
              'Late evening (9pm-12am)',
              'It varies day to day'
            ]}
            buttonText="Continue"
          />
        )
      
      case 'support_question':
        return (
          <ComprehensiveInputStep
            stepId={stepId}
            value={state.supportNeeded}
            onChange={(value) => updateState({ supportNeeded: value })}
            placeholder="What tools, resources, or support from others do you need?"
            inputType="textarea"
            buttonText="Continue"
          />
        )
      
      case 'celebration_question':
        return (
          <ComprehensiveInputStep
            stepId={stepId}
            value={state.celebration}
            onChange={(value) => updateState({ celebration: value })}
            placeholder="How will you reward yourself when you achieve this goal?"
            inputType="textarea"
            buttonText="Create My Goal"
          />
        )
      
      
      default:
        return <TextOnlyStep />
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
