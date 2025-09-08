import { Goal } from '@/src/classes/Goal'
import { Step } from '@/src/classes/Step'

export function determineCurrentStepIndex(steps: Step[]): number {
  if (steps.length === 0) return -1
  
  // Find the first step that is not completed but has sessions (user is working on it)
  const activeStepIndex = steps.findIndex(step => 
    !step.isCompleted() && step.getSessions().length > 0
  )
  
  if (activeStepIndex !== -1) return activeStepIndex
  
  // If no active step with sessions, find first incomplete step
  const firstIncompleteIndex = steps.findIndex(step => !step.isCompleted())
  
  return firstIncompleteIndex !== -1 ? firstIncompleteIndex : steps.length - 1
}

export function areAllStepsCompleted(steps: Step[]): boolean {
  if (steps.length === 0) return false
  return steps.every(step => step.isCompleted())
}

export function logTimelineDebugInfo(goals: Goal[], selectedGoalIndex: number, currentGoal: Goal | null, sortedSteps: Step[], currentStepIndex: number, allStepsCompleted: boolean) {
  console.log('🎨 [GoalTimeline] Received goals:', goals)
  console.log('🎨 [GoalTimeline] Goals count:', goals?.length || 0)
  console.log('🎨 [GoalTimeline] Selected goal index:', selectedGoalIndex)
  console.log('🎨 [GoalTimeline] Current goal:', currentGoal)
  console.log('🎨 [GoalTimeline] Sorted steps count:', sortedSteps.length)
  console.log('🎨 [GoalTimeline] Current step index:', currentStepIndex)
  console.log('🎨 [GoalTimeline] All steps completed:', allStepsCompleted)
  
  sortedSteps.forEach((step, index) => {
    const isCompleted = step.isCompleted()
    const isFuture = index > currentStepIndex && !isCompleted
    console.log(`📋 [GoalTimeline] Step ${index + 1}: ${isCompleted ? '✅' : '⭕'} ${isFuture ? '🔮' : '🎯'} ${step.text.substring(0, 30)}... (Next: ${step.next_step?.substring(0, 8) || 'null'}, Sessions: ${step.getSessions().length})`)
  })
}
