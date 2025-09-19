import { Goal } from '@/src/classes/Goal'
import { Session } from '@/src/classes/Session'
import { DayProgress } from './types'

export function getDayName(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[date.getDay()]
}

export function getDateString(date: Date): string {
  return date.toISOString().split('T')[0] // YYYY-MM-DD format
}

/**
 * Get tasks that were relevant for a specific date
 * Includes both active tasks and overdue tasks that should have been worked on
 */
export function getTasksForDate(goal: Goal, date: Date): { active: any[], overdue: any[], total: number } {
  const allTasks = goal.getTasks()
  const currentDate = new Date(date)
  
  // Get tasks that were active on this specific date
  const activeTasksForDay = allTasks.filter(task => {
    if (!task.start_at || !task.end_at) return false
    
    const taskStartDate = new Date(task.start_at)
    const taskEndDate = new Date(task.end_at)
    
    // Task is active if the date falls within its timeframe
    return currentDate >= taskStartDate && currentDate <= taskEndDate
  })
  
  // Get tasks that were overdue on this date (ended before this date and not completed)
  const overdueTasksForDay = allTasks.filter(task => {
    if (!task.start_at || !task.end_at) return false
    
    const taskEndDate = new Date(task.end_at)
    
    // Task is overdue on this date if:
    // 1. The task ended before this date
    // 2. The task is not completed
    return taskEndDate < currentDate && !task.isCompleted
  })
  
  return {
    active: activeTasksForDay,
    overdue: overdueTasksForDay,
    total: activeTasksForDay.length + overdueTasksForDay.length
  }
}

export function calculateDayProgress(goal: Goal, date: Date): DayProgress {
  const dateStr = getDateString(date)
  
  // Get all sessions from this specific date across all steps
  const sessionsFromDay: Session[] = []
  goal.getSessions().forEach(session => {
    const sessionDate = new Date(session.created_at).toISOString().split('T')[0]
    if (sessionDate === dateStr) {
      sessionsFromDay.push(session)
    }
  })
  
  // Get tasks that were relevant for this day (active + overdue)
  const { active, overdue, total } = getTasksForDate(goal, date)
  const allRelevantTasks = [...active, ...overdue]
  
  // Count completed tasks among those that were relevant for this day
  const completedTasksCount = allRelevantTasks.filter(task => task.isCompleted).length
  
  // Determine status based on work done and task completion
  const hasWork = sessionsFromDay.length > 0
  let status: 'none' | 'partial' | 'complete' = 'none'
  
  if (total === 0) {
    // No tasks assigned for this day
    status = hasWork ? 'partial' : 'none'
  } else if (completedTasksCount === total) {
    // All tasks completed
    status = 'complete'
  } else if (completedTasksCount > 0 || hasWork) {
    // Some tasks completed or some work done
    status = 'partial'
  } else {
    // No tasks completed and no work done
    status = 'none'
  }
  
  return {
    date,
    dayName: getDayName(date),
    totalSteps: total,
    completedSteps: completedTasksCount,
    status,
    sessions: sessionsFromDay
  }
}
