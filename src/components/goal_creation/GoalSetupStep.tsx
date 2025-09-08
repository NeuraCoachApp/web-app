'use client'

import React from 'react'
import { GoalStepBase, GoalStepText, GoalStepButton } from './GoalStepBase'
import { useGoalCreationContext } from './GoalCreationProvider'

export function GoalSetupStep() {
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
          placeholder="What would you like to work on or achieve?"
          value={state.goal}
          onChange={(e) => updateState({ goal: e.target.value })}
          rows={4}
          className="w-full max-w-md mx-auto block px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          autoFocus
        />
        <GoalStepButton
          onClick={handleNext}
          disabled={!state.goal.trim()}
        >
          Set Goal
        </GoalStepButton>
      </div>
    </GoalStepBase>
  )
}
