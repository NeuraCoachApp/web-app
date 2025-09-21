import { Goal } from '@/src/classes/Goal'
import { Session } from '@/src/classes/Session'
import { AggregatedMetrics, MetricData } from './types'
import { TimeframeOption } from './TimeframeSelector'

export function filterSessionsByTimeframe(sessions: Session[], timeframe: TimeframeOption): Session[] {
  if (timeframe === 'all') return sessions

  const now = new Date()
  let cutoffDate: Date

  switch (timeframe) {
    case 'week':
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case 'quarter':
      cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case 'year':
      cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    default:
      return sessions
  }

  return sessions.filter(session => new Date(session.created_at) >= cutoffDate)
}

export function calculateAggregatedMetrics(goal: Goal | null, timeframe: TimeframeOption = 'all'): AggregatedMetrics {
  if (!goal) {
    return { effort: [], stress: [], progress: [], mood: [], motivation: [], sessionCompletion: [] }
  }

  // Collect all sessions from all steps and filter by timeframe
  const allSessions: Session[] = goal.getSessions()
  const filteredSessions = filterSessionsByTimeframe(allSessions, timeframe)
  
  console.log('🔍 [calculateAggregatedMetrics] Debug info:', {
    goalUuid: goal.uuid,
    timeframe: timeframe,
    allSessionsCount: allSessions.length,
    filteredSessionsCount: filteredSessions.length,
    sessions: filteredSessions.map(s => ({
      uuid: s.uuid,
      created_at: s.created_at,
      mood: s.mood,
      motivation: s.motivation,
      summary: s.summary
    }))
  })
  
  // Sort filtered sessions by date
  const sortedSessions = filteredSessions.sort((a, b) => 
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
  const mood: MetricData[] = []
  const motivation: MetricData[] = []
  const sessionCompletion: MetricData[] = []

  Object.entries(sessionsByDate).forEach(([date, sessions]) => {
    // Sessions now have direct properties instead of insights
    const validSessions = sessions.filter(s => s.mood !== undefined && s.motivation !== undefined)
    
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
    const avgMood = validSessions.reduce((sum, s) => sum + (s.mood || 0), 0) / validSessions.length
    const avgMotivation = validSessions.reduce((sum, s) => sum + (s.motivation || 0), 0) / validSessions.length
    const avgSessionCompletion = validSessions.reduce((sum, s) => sum + s.getCompletionPercentage(), 0) / validSessions.length
    
    // Use the most recent session's summary for that date, or a default if empty
    const latestSession = validSessions[validSessions.length - 1]
    
    if (latestSession) {
      const summaryText = latestSession.summary || `Session on ${new Date(latestSession.created_at).toLocaleDateString()}`
      
      effort.push({
        date,
        value: Math.round(avgEffort * 10) / 10,
        summary: summaryText
      })
      
      stress.push({
        date,
        value: Math.round(avgStress * 10) / 10,
        summary: summaryText
      })
      
      progress.push({
        date,
        value: Math.round(avgProgress),
        summary: summaryText
      })
      
      mood.push({
        date,
        value: Math.round(avgMood * 10) / 10,
        summary: summaryText
      })
      
      motivation.push({
        date,
        value: Math.round(avgMotivation * 10) / 10,
        summary: summaryText
      })
      
      sessionCompletion.push({
        date,
        value: Math.round(avgSessionCompletion),
        summary: summaryText
      })
    }
  })

  return { effort, stress, progress, mood, motivation, sessionCompletion }
}
