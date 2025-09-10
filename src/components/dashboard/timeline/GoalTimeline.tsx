'use client'

import React, { useState, useMemo } from 'react'
import { Step } from '@/src/classes/Step'
import { TimelineProps } from './types'
import { determineCurrentStepIndex, areAllStepsCompleted, logTimelineDebugInfo } from './utils'
import StepSessionModal from './StepSessionModal'
import GoalSwitcher from './GoalSwitcher'
import GoalSquare from './GoalSquare'
import StepSquare from './StepSquare'
import TimelineLayout, { TimelineCompletionIndicator } from './TimelineLayout'
import PlaceholderTimeline from './PlaceholderTimeline'


export default function GoalTimeline({ 
  goals, 
  selectedGoalIndex: externalSelectedGoalIndex = 0, 
  onGoalChange, 
  onStepClick 
}: TimelineProps) {
  const [selectedStep, setSelectedStep] = useState<Step | null>(null)
  const [internalSelectedGoalIndex, setInternalSelectedGoalIndex] = useState(0)
  const [showGoalDropdown, setShowGoalDropdown] = useState(false)

  // Use external goal index if provided, otherwise use internal state
  const selectedGoalIndex = onGoalChange ? externalSelectedGoalIndex : internalSelectedGoalIndex
  const setSelectedGoalIndex = onGoalChange || setInternalSelectedGoalIndex

  const currentGoal = goals && goals.length > 0 ? goals[selectedGoalIndex] : null

  // Get steps from the current goal
  const sortedSteps = useMemo(() => {
    if (!currentGoal) return []
    return currentGoal.getSteps()
  }, [currentGoal])

  // Determine current step index using utility function
  const currentStepIndex = useMemo(() => determineCurrentStepIndex(sortedSteps), [sortedSteps])

  // Check if all steps are completed using utility function
  const allStepsCompleted = useMemo(() => areAllStepsCompleted(sortedSteps), [sortedSteps])

  // Debug logging using utility function
  logTimelineDebugInfo(goals, selectedGoalIndex, currentGoal, sortedSteps, currentStepIndex, allStepsCompleted)

  if (!goals || goals.length === 0) {
    return <PlaceholderTimeline />
  }

  const handleStepClick = (step: Step) => {
    setSelectedStep(step)
    
    if (onStepClick) {
      onStepClick(step)
    }
  }

  return (
    <>
      <div className="w-full">
        <GoalSwitcher 
          goals={goals}
          selectedGoalIndex={selectedGoalIndex}
          onGoalChange={setSelectedGoalIndex}
          showDropdown={showGoalDropdown}
          setShowDropdown={setShowGoalDropdown}
        />
        
        <TimelineLayout>
          {/* Goal Square */}
          {currentGoal && (
            <>
              <GoalSquare goal={currentGoal} allStepsCompleted={allStepsCompleted} />
            </>
          )}

          {/* Steps with alternating up/down pattern */}
          <div className="relative flex items-center">
            {/* Main horizontal timeline line */}
            <div className={`absolute top-1/2 left-0 right-0 h-0.5 transform -translate-y-1/2 ${
              allStepsCompleted ? 'bg-green-500' : 'bg-primary'
            }`} />
            
            {sortedSteps.map((step, stepIndex) => (
              <StepSquare
                key={step.uuid}
                step={step}
                stepIndex={stepIndex}
                currentStepIndex={currentStepIndex}
                allStepsCompleted={allStepsCompleted}
                onStepClick={handleStepClick}
              />
            ))}
          </div>
          
          {/* Goal Completion Indicator */}
          {sortedSteps.length > 0 && (
            <TimelineCompletionIndicator 
              allStepsCompleted={allStepsCompleted}
              currentGoal={currentGoal}
            />
          )}
        </TimelineLayout>
      </div>

      {/* Step Session Modal */}
      <StepSessionModal
        isOpen={!!selectedStep}
        onClose={() => setSelectedStep(null)}
        step={selectedStep}
      />
    </>
  )
}
