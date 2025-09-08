'use client'

import React from 'react'
import { FlowStep, FlowStepText, FlowStepButton, FlowInput } from '@/src/components/voice'
import { useOnboardingContext } from './OnboardingProvider'

export function WelcomeStep() {
  const {
    state,
    updateState,
    handleVoiceTranscript,
    handleNext,
    getCurrentText,
    currentStepData
  } = useOnboardingContext()

  const handleInputChange = (value: string) => {
    updateState({ userName: value })
    // Clear voice-captured names if user starts typing manually
    if (value !== state.userName) {
      updateState({ firstName: '', lastName: '' })
    }
  }

  const capturedInfo = (state.firstName || state.lastName) 
    ? `Captured: ${state.firstName} ${state.lastName}` 
    : undefined

  return (
    <FlowStep>
      {/* Text content will now only appear as captions after being spoken */}
      
      <div className="mt-8 space-y-4">
        <FlowInput
          value={state.userName}
          onChange={handleInputChange}
          onVoiceTranscript={handleVoiceTranscript}
          placeholder="Enter your name or use voice input"
          voicePlaceholder="Say your name..."
          speechError={state.speechError}
          onError={(error) => updateState({ speechError: error })}
          capturedInfo={capturedInfo}
          autoFocus
        />
        
        <FlowStepButton
          onClick={handleNext}
          disabled={!state.userName.trim() && !state.firstName}
        >
          Continue
        </FlowStepButton>
      </div>
    </FlowStep>
  )
}
