'use client'

import React from 'react'
import { useCoach } from '@/src/contexts/CoachContext'
import VoiceInput from '@/src/components/ui/voice-input'
import { StepBase, StepText, StepButton } from './StepBase'
import { useOnboardingContext } from './OnboardingProvider'

export function WelcomeStep() {
  const { hasVoiceEnabled } = useCoach()
  const {
    state,
    updateState,
    handleVoiceTranscript,
    handleNext,
    getCurrentText,
    currentStepData
  } = useOnboardingContext()

  return (
    <StepBase>
      <StepText 
        title={getCurrentText()}
        subtitle={currentStepData?.subtext}
      />

      <div className="mt-8 space-y-4">
        <div className="relative max-w-md mx-auto">
          <input
            type="text"
            placeholder="Enter your name or use voice input"
            value={state.userName}
            onChange={(e) => {
              updateState({ userName: e.target.value })
              // Clear voice-captured names if user starts typing manually
              if (e.target.value !== state.userName) {
                updateState({ firstName: '', lastName: '' })
              }
            }}
            className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          
          {/* Voice Input Button inside the text input */}
          {hasVoiceEnabled && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <VoiceInput
                onTranscript={handleVoiceTranscript}
                onError={(error) => updateState({ speechError: error })}
                placeholder="Say your name..."
              />
            </div>
          )}
        </div>
        
        {state.speechError && (
          <div className="text-red-400 text-sm text-center max-w-md mx-auto">
            {state.speechError}
          </div>
        )}
        
        {(state.firstName || state.lastName) && (
          <div className="text-center text-sm text-green-400">
            Captured: {state.firstName} {state.lastName}
          </div>
        )}
        
        <StepButton
          onClick={handleNext}
          disabled={!state.userName.trim() && !state.firstName}
        >
          Continue
        </StepButton>
      </div>
    </StepBase>
  )
}
