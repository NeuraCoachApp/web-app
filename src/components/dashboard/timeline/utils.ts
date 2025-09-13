import { Goal } from '@/src/classes/Goal'
import { Milestone } from '@/src/classes/Milestone'
import { Task } from '@/src/classes/Task'

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

/**
 * Get tasks that are relevant for today based on their timeframes
 * Returns tasks that are:
 * 1. Currently active (today is within start_at and end_at)
 * 2. Overdue (end_at has passed and task is not completed)
 */
export function getTodaysTasks(goal: Goal | null): Task[] {
  if (!goal) return []
  
  const allTasks = goal.getTasks()
  const todaysTasks = allTasks.filter(task => {
    return task.isActive() || task.isOverdue()
  })
  
  // Sort by priority: overdue first, then by start date
  return todaysTasks.sort((a, b) => {
    // Overdue tasks first
    if (a.isOverdue() && !b.isOverdue()) return -1
    if (!a.isOverdue() && b.isOverdue()) return 1
    
    // Then sort by start date (earlier first)
    return a.getStartDate().getTime() - b.getStartDate().getTime()
  })
}

/**
 * Get tasks grouped by their status for today
 */
export function getTodaysTasksByStatus(goal: Goal | null): {
  active: Task[]
  overdue: Task[]
  completed: Task[]
} {
  if (!goal) return { active: [], overdue: [], completed: [] }
  
  const todaysTasks = getTodaysTasks(goal)
  
  return {
    active: todaysTasks.filter(task => task.isActive() && !task.isCompleted),
    overdue: todaysTasks.filter(task => task.isOverdue()),
    completed: todaysTasks.filter(task => task.isCompleted && (task.isActive() || task.isOverdue()))
  }
}
