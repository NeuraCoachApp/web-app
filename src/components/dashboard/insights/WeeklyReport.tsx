'use client'

import React from 'react'
import { Goal } from '@/src/classes/Goal'
import { Session } from '@/src/classes/Session'
import { Task } from '@/src/classes/Task'
import { TimeframeOption } from './TimeframeSelector'
import { 
  CheckCircle, 
  Circle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Target,
  Calendar,
  BarChart3,
  Smile,
  Zap,
  AlertTriangle
} from 'lucide-react'

interface WeeklyReportProps {
  goal: Goal
  timeframe: TimeframeOption
  sessions: Session[]
}

interface TaskAccomplishment {
  task: Task
  completedSessions: Session[]
  totalSessions: number
  completionRate: number
  trend: 'up' | 'down' | 'stable'
}

interface WeeklyReportData {
  totalSessions: number
  averageMood: number
  averageMotivation: number
  taskAccomplishments: TaskAccomplishment[]
  moodTrend: 'up' | 'down' | 'stable'
  motivationTrend: 'up' | 'down' | 'stable'
  completedTasksCount: number
  totalTasksWorkedOn: number
  topBlockers: string[]
  progressSummary: string
}

function calculateWeeklyReportData(goal: Goal, sessions: Session[]): WeeklyReportData {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      averageMood: 0,
      averageMotivation: 0,
      taskAccomplishments: [],
      moodTrend: 'stable',
      motivationTrend: 'stable',
      completedTasksCount: 0,
      totalTasksWorkedOn: 0,
      topBlockers: [],
      progressSummary: 'No sessions recorded for this period.'
    }
  }

  // Sort sessions by date for trend analysis
  const sortedSessions = sessions.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  // Calculate averages
  const totalSessions = sessions.length
  const averageMood = sessions.reduce((sum, s) => sum + s.mood, 0) / totalSessions
  const averageMotivation = sessions.reduce((sum, s) => sum + s.motivation, 0) / totalSessions

  // Calculate trends (compare first half vs second half)
  const midpoint = Math.floor(sessions.length / 2)
  const firstHalf = sortedSessions.slice(0, midpoint)
  const secondHalf = sortedSessions.slice(midpoint)

  const firstHalfMood = firstHalf.length > 0 ? firstHalf.reduce((sum, s) => sum + s.mood, 0) / firstHalf.length : averageMood
  const secondHalfMood = secondHalf.length > 0 ? secondHalf.reduce((sum, s) => sum + s.mood, 0) / secondHalf.length : averageMood
  const firstHalfMotivation = firstHalf.length > 0 ? firstHalf.reduce((sum, s) => sum + s.motivation, 0) / firstHalf.length : averageMotivation
  const secondHalfMotivation = secondHalf.length > 0 ? secondHalf.reduce((sum, s) => sum + s.motivation, 0) / secondHalf.length : averageMotivation

  const moodTrend: 'up' | 'down' | 'stable' = 
    Math.abs(secondHalfMood - firstHalfMood) < 0.5 ? 'stable' :
    secondHalfMood > firstHalfMood ? 'up' : 'down'

  const motivationTrend: 'up' | 'down' | 'stable' = 
    Math.abs(secondHalfMotivation - firstHalfMotivation) < 0.5 ? 'stable' :
    secondHalfMotivation > firstHalfMotivation ? 'up' : 'down'

  // Analyze task accomplishments
  const allTasks = goal.getTasks()
  const taskAccomplishments: TaskAccomplishment[] = []

  // Get all unique task UUIDs worked on in sessions
  const workedOnTaskUuids = new Set<string>()
  sessions.forEach(session => {
    session.getWorkedOnTaskUuids().forEach(uuid => workedOnTaskUuids.add(uuid))
  })

  workedOnTaskUuids.forEach(taskUuid => {
    const task = allTasks.find(t => t.uuid === taskUuid)
    if (!task) return

    const taskSessions = sessions.filter(s => 
      s.getWorkedOnTaskUuids().includes(taskUuid)
    )
    const completedSessions = sessions.filter(s => 
      s.isTaskCompleted(taskUuid)
    )

    const completionRate = taskSessions.length > 0 ? 
      (completedSessions.length / taskSessions.length) * 100 : 0

    // Simple trend calculation based on recent vs earlier completions
    const recentSessions = taskSessions.slice(-Math.ceil(taskSessions.length / 2))
    const earlierSessions = taskSessions.slice(0, Math.floor(taskSessions.length / 2))
    
    const recentCompletionRate = recentSessions.length > 0 ? 
      (recentSessions.filter(s => s.isTaskCompleted(taskUuid)).length / recentSessions.length) * 100 : 0
    const earlierCompletionRate = earlierSessions.length > 0 ? 
      (earlierSessions.filter(s => s.isTaskCompleted(taskUuid)).length / earlierSessions.length) * 100 : 0

    const trend: 'up' | 'down' | 'stable' = 
      Math.abs(recentCompletionRate - earlierCompletionRate) < 10 ? 'stable' :
      recentCompletionRate > earlierCompletionRate ? 'up' : 'down'

    taskAccomplishments.push({
      task,
      completedSessions,
      totalSessions: taskSessions.length,
      completionRate,
      trend
    })
  })

  // Sort by completion rate and total sessions
  taskAccomplishments.sort((a, b) => {
    if (Math.abs(a.completionRate - b.completionRate) < 10) {
      return b.totalSessions - a.totalSessions
    }
    return b.completionRate - a.completionRate
  })

  // Calculate completed tasks count
  const completedTasksCount = sessions.reduce((sum, session) => 
    sum + session.getCompletedTasksCount(), 0
  )

  // Get top blockers
  const blockers = sessions
    .filter(s => s.hasBlockers())
    .map(s => s.blocker.trim())
    .filter(b => b.length > 0)
  
  const blockerCounts = blockers.reduce((acc, blocker) => {
    acc[blocker] = (acc[blocker] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topBlockers = Object.entries(blockerCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([blocker]) => blocker)

  // Generate progress summary
  const progressSummary = `Completed ${completedTasksCount} tasks across ${totalSessions} sessions. Average mood: ${averageMood.toFixed(1)}/10, motivation: ${averageMotivation.toFixed(1)}/10.`

  return {
    totalSessions,
    averageMood,
    averageMotivation,
    taskAccomplishments,
    moodTrend,
    motivationTrend,
    completedTasksCount,
    totalTasksWorkedOn: workedOnTaskUuids.size,
    topBlockers,
    progressSummary
  }
}

function getTrendIcon(trend: 'up' | 'down' | 'stable') {
  switch (trend) {
    case 'up':
      return <TrendingUp className="w-4 h-4 text-green-500" />
    case 'down':
      return <TrendingDown className="w-4 h-4 text-red-500" />
    case 'stable':
      return <Minus className="w-4 h-4 text-muted-foreground" />
  }
}

function getTrendColor(trend: 'up' | 'down' | 'stable') {
  switch (trend) {
    case 'up':
      return 'text-green-600 dark:text-green-400'
    case 'down':
      return 'text-red-600 dark:text-red-400'
    case 'stable':
      return 'text-muted-foreground'
  }
}

export default function WeeklyReport({ goal, timeframe, sessions }: WeeklyReportProps) {
  const reportData = calculateWeeklyReportData(goal, sessions)

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case 'week':
        return 'Past Week'
      case 'month':
        return 'Past Month'
      case 'quarter':
        return 'Past 3 Months'
      case 'year':
        return 'Past Year'
      case 'all':
        return 'All Time'
    }
  }

  if (reportData.totalSessions === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            {getTimeframeLabel()} Report
          </h3>
        </div>
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No sessions recorded for this time period.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">
          {getTimeframeLabel()} Report
        </h3>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-background rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-foreground">Sessions</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{reportData.totalSessions}</div>
        </div>

        <div className="bg-background rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-foreground">Tasks Done</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{reportData.completedTasksCount}</div>
        </div>

        <div className="bg-background rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Smile className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-foreground">Avg Mood</span>
            {getTrendIcon(reportData.moodTrend)}
          </div>
          <div className={`text-2xl font-bold ${getTrendColor(reportData.moodTrend)}`}>
            {reportData.averageMood.toFixed(1)}/10
          </div>
        </div>

        <div className="bg-background rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-foreground">Avg Motivation</span>
            {getTrendIcon(reportData.motivationTrend)}
          </div>
          <div className={`text-2xl font-bold ${getTrendColor(reportData.motivationTrend)}`}>
            {reportData.averageMotivation.toFixed(1)}/10
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="bg-background rounded-lg p-4 border border-border mb-6">
        <h4 className="font-semibold text-foreground mb-2">Progress Summary</h4>
        <p className="text-muted-foreground">{reportData.progressSummary}</p>
      </div>

      {/* Task Accomplishments */}
      {reportData.taskAccomplishments.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-foreground mb-4">Task Accomplishments</h4>
          <div className="space-y-3">
            {reportData.taskAccomplishments.slice(0, 10).map((accomplishment) => (
              <div key={accomplishment.task.uuid} className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {accomplishment.completionRate >= 80 ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-foreground">{accomplishment.task.text}</span>
                      {getTrendIcon(accomplishment.trend)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Worked on {accomplishment.totalSessions} time{accomplishment.totalSessions !== 1 ? 's' : ''}, 
                      completed {accomplishment.completedSessions.length} time{accomplishment.completedSessions.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      accomplishment.completionRate >= 80 ? 'text-green-600 dark:text-green-400' :
                      accomplishment.completionRate >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {Math.round(accomplishment.completionRate)}%
                    </div>
                    <div className="text-xs text-muted-foreground">completion</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Blockers */}
      {reportData.topBlockers.length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            Common Blockers
          </h4>
          <div className="space-y-2">
            {reportData.topBlockers.map((blocker, index) => (
              <div key={index} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">{blocker}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
