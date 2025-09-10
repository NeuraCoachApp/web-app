'use client'

import React, { useState, useEffect } from 'react'
import { FlowStep, FlowStepButton, FlowInput } from '@/src/components/voice'
import { useGoalCreationContext } from './GoalCreationProvider'
import { useCoach } from '@/src/contexts/CoachContext'

export function GoalInputStep() {
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
    updateState({ goal: value })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && state.goal.trim()) {
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
              value={state.goal}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="What would you like to work on or achieve?"
              showVoiceButton={false}
              autoFocus
              rows={3}
            />
            
            <FlowStepButton
              onClick={handleNext}
              disabled={!state.goal.trim()}
            >
              Set Goal
            </FlowStepButton>
          </>
        )}
      </div>
    </FlowStep>
  )
}
