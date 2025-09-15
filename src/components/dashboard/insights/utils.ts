import { Goal } from '@/src/classes/Goal'
import { Session } from '@/src/classes/Session'
import { AggregatedMetrics, MetricData } from './types'

export function calculateAggregatedMetrics(goal: Goal | null): AggregatedMetrics {
  if (!goal) {
    return { effort: [], stress: [], progress: [] }
  }

  // Collect all sessions from all steps
  const allSessions: Session[] = goal.getSessions()
  
  console.log('🔍 [calculateAggregatedMetrics] Debug info:', {
    goalUuid: goal.uuid,
    sessionsCount: allSessions.length,
    sessions: allSessions.map(s => ({
      uuid: s.uuid,
      created_at: s.created_at,
      mood: s.mood,
      motivation: s.motivation,
      summary: s.summary
    }))
  })
  
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
    // Sessions now have direct properties instead of insights
    const validSessions = sessions.filter(s => s.summary && s.mood && s.motivation)
    
    console.log('🔍 [calculateAggregatedMetrics] Processing date:', date, {
      totalSessions: sessions.length,
      validSessions: validSessions.length,
      sessions: sessions.map(s => ({ uuid: s.uuid, mood: s.mood, motivation: s.motivation, summary: s.summary }))
    })
    
    if (validSessions.length === 0) return

    // Calculate averages from session properties
    const avgEffort = validSessions.reduce((sum, s) => sum + (s.motivation || 0), 0) / validSessions.length
    const avgStress = validSessions.reduce((sum, s) => sum + (10 - s.mood || 0), 0) / validSessions.length // Inverse mood as stress
    const avgProgress = validSessions.reduce((sum, s) => sum + (s.mood * 10 || 0), 0) / validSessions.length // Use mood as progress indicator
    
    // Use the most recent session's summary for that date
    const latestSession = validSessions[validSessions.length - 1]
    
    if (latestSession) {
      effort.push({
        date,
        value: Math.round(avgEffort * 10) / 10,
        summary: latestSession.summary
      })
      
      stress.push({
        date,
        value: Math.round(avgStress * 10) / 10,
        summary: latestSession.summary
      })
      
      progress.push({
        date,
        value: Math.round(avgProgress),
        summary: latestSession.summary
      })
    }
  })

  return { effort, stress, progress }
}
