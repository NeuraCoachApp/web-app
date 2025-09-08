'use client'

import React from 'react'
import { FlowStep, FlowStepText, FlowStepButton, FlowInput } from '@/src/components/voice'
import { useGoalCreationContext } from './GoalCreationProvider'

export function GoalReasonStep() {
  const {
    state,
    updateState,
    handleNext,
    getCurrentText,
    currentStepData
  } = useGoalCreationContext()

  return (
    <FlowStep>
      {/* Text content will now only appear as captions after being spoken */}
      
      <div className="mt-8 space-y-4">
        <FlowInput
          type="textarea"
          value={state.reason}
          onChange={(value) => updateState({ reason: value })}
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
      </div>
    </FlowStep>
  )
}
