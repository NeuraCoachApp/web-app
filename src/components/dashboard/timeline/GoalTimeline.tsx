'use client'

import React, { useState, useMemo } from 'react'
import { Milestone } from '@/src/classes/Milestone'
import { Task } from '@/src/classes/Task'
import { TimelineProps } from './types'
import { determineCurrentMilestoneIndex, areAllMilestonesCompleted, logTimelineDebugInfo } from './utils'
import MilestoneTasksModal from './MilestoneTasksModal'
import GoalSwitcher from './GoalSwitcher'
import GoalSquare from './GoalSquare'
import MilestoneSquare from './MilestoneSquare'
import TimelineLayout, { TimelineCompletionIndicator } from './TimelineLayout'
import PlaceholderTimeline from './PlaceholderTimeline'


export default function GoalTimeline({ 
  goals, 
  selectedGoalIndex: externalSelectedGoalIndex = 0, 
  onGoalChange, 
  onMilestoneClick 
}: TimelineProps) {
  const [internalSelectedGoalIndex, setInternalSelectedGoalIndex] = useState(0)
  const [showGoalDropdown, setShowGoalDropdown] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)

  // Use external goal index if provided, otherwise use internal state
  const selectedGoalIndex = onGoalChange ? externalSelectedGoalIndex : internalSelectedGoalIndex
  const setSelectedGoalIndex = onGoalChange || setInternalSelectedGoalIndex

  const currentGoal = goals && goals.length > 0 ? goals[selectedGoalIndex] : null

  // Get milestones from the current goal
  const sortedMilestones = useMemo(() => {
    if (!currentGoal) return []
    return currentGoal.getMilestones()
  }, [currentGoal])

  // Determine current milestone index using utility function
  const currentMilestoneIndex = useMemo(() => determineCurrentMilestoneIndex(sortedMilestones), [sortedMilestones])

  // Check if all milestones are completed using utility function
  const allMilestonesCompleted = useMemo(() => areAllMilestonesCompleted(sortedMilestones), [sortedMilestones])

  // Debug logging using utility function
  logTimelineDebugInfo(goals, selectedGoalIndex, currentGoal, sortedMilestones, currentMilestoneIndex, allMilestonesCompleted)

  if (!goals || goals.length === 0) {
    return <PlaceholderTimeline />
  }

  const handleMilestoneClick = (milestone: Milestone) => {
    setSelectedMilestone(milestone)
    
    if (onMilestoneClick) {
      onMilestoneClick(milestone)
    }
  }

  const closeModal = () => {
    setSelectedMilestone(null)
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
              <GoalSquare goal={currentGoal} allMilestonesCompleted={allMilestonesCompleted} />
            </>
          )}

          {/* Milestones with alternating up/down pattern */}
          <div className="relative flex items-center">
            {/* Main horizontal timeline line */}
            <div className={`absolute top-1/2 left-0 right-0 h-0.5 transform -translate-y-1/2 ${
              allMilestonesCompleted ? 'bg-green-500' : 'bg-primary'
            }`} />
            
            {sortedMilestones.map((milestone, milestoneIndex) => (
              <MilestoneSquare
                key={milestone.uuid}
                milestone={milestone}
                milestoneIndex={milestoneIndex}
                currentMilestoneIndex={currentMilestoneIndex}
                allMilestonesCompleted={allMilestonesCompleted}
                onMilestoneClick={handleMilestoneClick}
              />
            ))}
          </div>
          
          {/* Goal Completion Indicator */}
          {sortedMilestones.length > 0 && (
            <TimelineCompletionIndicator 
              allMilestonesCompleted={allMilestonesCompleted}
              currentGoal={currentGoal}
            />
          )}
        </TimelineLayout>
      </div>

      {/* Milestone Tasks Modal */}
      <MilestoneTasksModal
        isOpen={!!selectedMilestone}
        onClose={closeModal}
        milestone={selectedMilestone}
        goal={currentGoal}
      />
    </>
  )
}
