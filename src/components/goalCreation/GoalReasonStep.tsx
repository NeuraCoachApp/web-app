'use client'

import React from 'react'
import { GoalStepBase, GoalStepText, GoalStepButton } from './GoalStepBase'
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
    <GoalStepBase>
      <GoalStepText 
        title={getCurrentText()}
        subtitle={currentStepData?.subtext}
      />

      <div className="mt-8 space-y-4">
        <textarea
          placeholder="Tell me what brings you here today..."
          value={state.reason}
          onChange={(e) => updateState({ reason: e.target.value })}
          rows={4}
          className="w-full max-w-md mx-auto block px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          autoFocus
        />
        <GoalStepButton
          onClick={handleNext}
          disabled={!state.reason.trim()}
        >
          Continue
        </GoalStepButton>
      </div>
    </GoalStepBase>
  )
}
