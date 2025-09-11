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
  
  // If no sessions at all, it's a red day (none)
  if (sessionsFromDay.length === 0) {
    return {
      date,
      dayName: getDayName(date),
      totalSteps: 0,
      completedSteps: 0,
      status: 'none',
      sessions: sessionsFromDay
    }
  }
  
  // Get tasks that were active/assigned for this day
  const tasksActiveToday = goal.getTasks().filter(task => {
    // Check for null values before creating dates
    if (!task.start_at || !task.end_at) return false
    
    const taskStartDate = new Date(task.start_at)
    const taskEndDate = new Date(task.end_at)
    const currentDate = new Date(date)
    
    // Task is active if the date falls within its timeframe
    return currentDate >= taskStartDate && currentDate <= taskEndDate
  })
  
  // Count sessions from this day (indicates work was done)
  const sessionsToday = sessionsFromDay.length
  
  const totalTasks = tasksActiveToday.length
  const hasWork = sessionsToday > 0
  
  let status: 'none' | 'partial' | 'complete' = 'none'
  
  if (!hasWork) {
    // No sessions logged = red
    status = 'none'
  } else if (totalTasks > 0 && sessionsToday >= totalTasks) {
    // High session activity relative to active tasks = green
    status = 'complete'
  } else {
    // Some work done = yellow
    status = 'partial'
  }
  
  return {
    date,
    dayName: getDayName(date),
    totalSteps: totalTasks,
    completedSteps: hasWork ? 1 : 0,
    status,
    sessions: sessionsFromDay
  }
}
