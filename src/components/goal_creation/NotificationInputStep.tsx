'use client'

import React, { useState, useEffect } from 'react'
import { FlowStep, FlowStepButton } from '@/src/components/voice'
import { useGoalCreationContext } from './GoalCreationProvider'
import { useCoach } from '@/src/contexts/CoachContext'

export function NotificationInputStep() {
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

  const handleTimeChange = (value: string) => {
    updateState({ notificationTime: value })
  }

  return (
    <FlowStep>
      {/* Text content will now only appear as captions after being spoken */}
      
      <div className="mt-8 space-y-4">
        {showInput && (
          <>
            <div className="flex flex-col items-center space-y-4">
              <input
                type="time"
                value={state.notificationTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
            
            <FlowStepButton onClick={handleNext}>
              Set Notification Time
            </FlowStepButton>
          </>
        )}
      </div>
    </FlowStep>
  )
}
