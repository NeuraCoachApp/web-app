import { Goal } from '@/src/classes/Goal'
import { Milestone } from '@/src/classes/Milestone'

export function determineCurrentMilestoneIndex(milestones: Milestone[]): number {
  if (milestones.length === 0) return -1
  
  // Find the first milestone that is currently active (within date range)
  const activeMilestoneIndex = milestones.findIndex(milestone => milestone.isActive())
  
  if (activeMilestoneIndex !== -1) return activeMilestoneIndex
  
  // If no active milestone, find first upcoming milestone
  const upcomingMilestoneIndex = milestones.findIndex(milestone => milestone.isUpcoming())
  
  return upcomingMilestoneIndex !== -1 ? upcomingMilestoneIndex : milestones.length - 1
}

export function areAllMilestonesCompleted(milestones: Milestone[]): boolean {
  if (milestones.length === 0) return false
  return milestones.every(milestone => milestone.isPast())
}

export function logTimelineDebugInfo(goals: Goal[], selectedGoalIndex: number, currentGoal: Goal | null, sortedMilestones: Milestone[], currentMilestoneIndex: number, allMilestonesCompleted: boolean) {
  console.log('🎨 [GoalTimeline] Received goals:', goals)
  console.log('🎨 [GoalTimeline] Goals count:', goals?.length || 0)
  console.log('🎨 [GoalTimeline] Selected goal index:', selectedGoalIndex)
  console.log('🎨 [GoalTimeline] Current goal:', currentGoal)
  console.log('🎨 [GoalTimeline] Milestones sorted by date:', sortedMilestones.length)
  console.log('🎨 [GoalTimeline] Milestone date order:', 
    sortedMilestones.map((milestone, i) => `${i + 1}. ${milestone.text} (${milestone.getFormattedStartDate()}-${milestone.getFormattedEndDate()}) ${milestone.isPast() ? '✅' : milestone.isActive() ? '🟡' : '⭕'}`).join(' | ')
  )
  console.log('🎨 [GoalTimeline] Current milestone index:', currentMilestoneIndex)
  console.log('🎨 [GoalTimeline] All milestones completed:', allMilestonesCompleted)
}
