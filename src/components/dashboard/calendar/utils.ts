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
  goal.getSteps().forEach(step => {
    step.getSessions().forEach(session => {
      const sessionDate = new Date(session.created_at).toISOString().split('T')[0]
      if (sessionDate === dateStr) {
        sessionsFromDay.push(session)
      }
    })
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
  
  // Get steps that were active/assigned for this day (had sessions on this day or are currently active)
  const stepsActiveToday = goal.getSteps().filter(step => {
    // Check for null values before creating dates
    if (!step.created_at || !step.end_at) return false
    
    const stepStartDate = new Date(step.created_at)
    const stepEndDate = new Date(step.end_at)
    const currentDate = new Date(date)
    
    // Step is active if the date falls within its timeframe
    return currentDate >= stepStartDate && currentDate <= stepEndDate
  })
  
  // Get steps that had any progress (sessions) on this specific date
  const stepsWorkedOnToday = stepsActiveToday.filter(step => 
    step.getSessions().some(session => {
      const sessionDate = new Date(session.created_at).toISOString().split('T')[0]
      return sessionDate === dateStr
    })
  )
  
  const totalSteps = stepsActiveToday.length
  const workedSteps = stepsWorkedOnToday.length
  
  let status: 'none' | 'partial' | 'complete' = 'none'
  
  if (workedSteps === 0) {
    // No work done on any assigned steps = red
    status = 'none'
  } else if (workedSteps === totalSteps) {
    // Made progress on ALL assigned steps = green
    status = 'complete'
  } else {
    // Made progress on some but not all assigned steps = yellow
    status = 'partial'
  }
  
  return {
    date,
    dayName: getDayName(date),
    totalSteps,
    completedSteps: workedSteps,
    status,
    sessions: sessionsFromDay
  }
}
