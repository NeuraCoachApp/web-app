import { Goal } from '@/src/classes/Goal'
import { Session } from '@/src/classes/Session'
import { AggregatedMetrics, MetricData } from './types'

export function calculateAggregatedMetrics(goal: Goal | null): AggregatedMetrics {
  if (!goal) {
    return { effort: [], stress: [], progress: [] }
  }

  // Collect all sessions from all steps
  const allSessions: Session[] = goal.getAllSessions()
  
  // Sort sessions by date
  const sortedSessions = allSessions.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  // Group sessions by date and calculate daily averages
  const sessionsByDate = sortedSessions.reduce((acc, session) => {
    const date = new Date(session.created_at).toDateString()
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(session)
    return acc
  }, {} as Record<string, Session[]>)

  // Calculate daily metrics
  const effort: MetricData[] = []
  const stress: MetricData[] = []
  const progress: MetricData[] = []

  Object.entries(sessionsByDate).forEach(([date, sessions]) => {
    const sessionsWithInsights = sessions.filter(s => s.getInsight())
    if (sessionsWithInsights.length === 0) return

    const avgEffort = sessionsWithInsights.reduce((sum, s) => sum + (s.getInsight()?.effort_level || 0), 0) / sessionsWithInsights.length
    const avgStress = sessionsWithInsights.reduce((sum, s) => sum + (s.getInsight()?.stress_level || 0), 0) / sessionsWithInsights.length
    const avgProgress = sessionsWithInsights.reduce((sum, s) => sum + (s.getInsight()?.progress || 0), 0) / sessionsWithInsights.length
    
    // Use the most recent session's summary for that date
    const latestSession = sessionsWithInsights[sessionsWithInsights.length - 1]
    const latestInsight = latestSession.getInsight()
    
    if (latestInsight) {
      effort.push({
        date,
        value: Math.round(avgEffort * 10) / 10,
        summary: latestInsight.summary
      })
      
      stress.push({
        date,
        value: Math.round(avgStress * 10) / 10,
        summary: latestInsight.summary
      })
      
      progress.push({
        date,
        value: Math.round(avgProgress),
        summary: latestInsight.summary
      })
    }
  })

  return { effort, stress, progress }
}
