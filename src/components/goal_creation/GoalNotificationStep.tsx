'use client'

import React from 'react'
import { GoalStepBase, GoalStepText, GoalStepButton } from './GoalStepBase'
import { useGoalCreationContext } from './GoalCreationProvider'

export function GoalNotificationStep() {
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
        <div className="flex flex-col items-center space-y-4">
          <input
            type="time"
            value={state.notificationTime}
            onChange={(e) => updateState({ notificationTime: e.target.value })}
            className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <GoalStepButton onClick={handleNext}>
            Set Notification Time
          </GoalStepButton>
        </div>
      </div>
    </GoalStepBase>
  )
}
