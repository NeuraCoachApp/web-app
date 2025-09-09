'use client'

import React, { useState, useEffect } from 'react'
import { FlowStep, FlowStepText, FlowStepButton, FlowInput } from '@/src/components/voice'
import { useOnboardingContext } from './OnboardingProvider'
import { useCoach } from '@/src/contexts/CoachContext'

export function NameInputStep() {
  const {
    state,
    updateState,
    handleVoiceTranscript,
    handleNext,
    getCurrentText,
    currentStepData
  } = useOnboardingContext()
  const { isSpeaking, isPreparingSpeech } = useCoach()
  const [showInput, setShowInput] = useState(false)

  // Show input only after speech is complete
  useEffect(() => {
    if (!isSpeaking && !isPreparingSpeech && !showInput) {
      // Add a small delay to ensure speech has fully completed
      const timer = setTimeout(() => {
        setShowInput(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isSpeaking, isPreparingSpeech, showInput])

  const handleInputChange = (value: string) => {
    updateState({ userName: value })
    // Clear voice-captured names if user starts typing manually
    if (value !== state.userName) {
      updateState({ firstName: '', lastName: '' })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    const isValidInput = isNameValid()
    if (e.key === 'Enter' && isValidInput) {
      e.preventDefault()
      handleNext()
    }
  }

  const isNameValid = () => {
    // Check if typed input has at least 2 words
    const typedWords = state.userName.trim().split(/\s+/)
    const hasValidTypedName = typedWords.length >= 2 && typedWords.every(word => word.length > 0)
    
    // Check if voice recognition captured both first and last name
    const hasValidVoiceName = state.firstName && state.lastName
    
    return hasValidTypedName || hasValidVoiceName
  }

  const capturedInfo = (state.firstName || state.lastName) 
    ? `Captured: ${state.firstName} ${state.lastName}` 
    : undefined

  return (
    <FlowStep>
      {/* Text content will now only appear as captions after being spoken */}
      
      <div className="mt-8 space-y-4">
        {showInput && (
          <>
            <FlowInput
              value={state.userName}
              onChange={handleInputChange}
              onVoiceTranscript={handleVoiceTranscript}
              onKeyDown={handleKeyPress}
              placeholder="Enter your first and last name"
              voicePlaceholder="Say your first and last name..."
              speechError={state.speechError}
              onError={(error) => updateState({ speechError: error })}
              capturedInfo={capturedInfo}
              autoFocus
            />
            
            <FlowStepButton
              onClick={handleNext}
              disabled={!isNameValid()}
            >
              Continue
            </FlowStepButton>
          </>
        )}
      </div>
    </FlowStep>
  )
}