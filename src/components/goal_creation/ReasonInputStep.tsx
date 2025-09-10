'use client'

import React, { useState, useEffect } from 'react'
import { FlowStep, FlowStepButton, FlowInput } from '@/src/components/voice'
import { useGoalCreationContext } from './GoalCreationProvider'
import { useCoach } from '@/src/contexts/CoachContext'

export function ReasonInputStep() {
  const {
    state,
    updateState,
    handleNext,
  } = useGoalCreationContext()
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
    updateState({ reason: value })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && state.reason.trim()) {
      e.preventDefault()
      handleNext()
    }
  }

  return (
    <FlowStep>
      {/* Text content will now only appear as captions after being spoken */}
      
      <div className="mt-8 space-y-4">
        {showInput && (
          <>
            <FlowInput
              type="textarea"
              value={state.reason}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="Tell me what brings you here today..."
              showVoiceButton={false}
              autoFocus
            />
            
            <FlowStepButton
              onClick={handleNext}
              disabled={!state.reason.trim()}
            >
              Continue
            </FlowStepButton>
          </>
        )}
      </div>
    </FlowStep>
  )
}
