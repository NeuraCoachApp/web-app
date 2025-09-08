'use client'

import React, { useMemo } from 'react'
import { GoalWithStepsAndSessions, SessionWithGoalAndInsight } from '@/src/lib/mock-data'
import { TrendingUp, Zap, Brain, Calendar, BarChart3, Activity } from 'lucide-react'

// Utility function to check if a step is completed based on 100% progress
function isStepCompleted(step: any): boolean {
  return step.sessions.some((session: any) => session.insight.progress === 100)
}

interface GoalInsightsProps {
  goal: GoalWithStepsAndSessions | null
}

interface MetricData {
  date: string
  value: number
  summary: string
}

interface AggregatedMetrics {
  effort: MetricData[]
  stress: MetricData[]
  progress: MetricData[]
}

function MetricCard({ 
  title, 
  icon: Icon, 
  data, 
  color, 
  unit = '',
  maxValue = 10 
}: { 
  title: string
  icon: React.ComponentType<any>
  data: MetricData[]
  color: string
  unit?: string
  maxValue?: number
}) {
  const latestValue = data.length > 0 ? data[data.length - 1].value : 0
  const previousValue = data.length > 1 ? data[data.length - 2].value : latestValue
  const trend = latestValue - previousValue
  
  // Calculate average
  const average = data.length > 0 
    ? Math.round(data.reduce((sum, item) => sum + item.value, 0) / data.length * 10) / 10
    : 0

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${color}`} />
          <h3 className="font-medium text-card-foreground">{title}</h3>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${color}`}>
            {latestValue}{unit}
          </div>
          {trend !== 0 && (
            <div className={`text-xs flex items-center gap-1 ${
              trend > 0 ? 'text-red-500' : 'text-green-500'
            }`}>
              <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(trend).toFixed(1)}
            </div>
          )}
        </div>
      </div>

      {/* Simple Bar Chart */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Recent Sessions</span>
          <span>Avg: {average}{unit}</span>
        </div>
        <div className="flex items-end gap-1 h-16">
          {data.slice(-10).map((item, index) => {
            const height = (item.value / maxValue) * 100
            return (
              <div key={index} className="flex-1 flex flex-col justify-end">
                <div 
                  className={`rounded-sm opacity-70 hover:opacity-100 transition-opacity cursor-pointer ${
                    color.includes('blue') ? 'bg-blue-500' :
                    color.includes('yellow') ? 'bg-yellow-500' :
                    color.includes('red') ? 'bg-red-500' :
                    'bg-gray-500'
                  }`}
                  style={{ height: `${Math.max(4, height)}%` }}
                  title={`${item.date}: ${item.value}${unit} - ${item.summary}`}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Latest Summary */}
      {data.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(data[data.length - 1].date).toLocaleDateString()}</span>
          </div>
          <p className="line-clamp-2">{data[data.length - 1].summary}</p>
        </div>
      )}
    </div>
  )
}

function ProgressOverview({ goal }: { goal: GoalWithStepsAndSessions }) {
  const completedSteps = goal.steps.filter(step => isStepCompleted(step)).length
  const totalSteps = goal.steps.length
  const completionPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
  
  const totalSessions = goal.steps.reduce((sum, step) => sum + step.sessions.length, 0)
  const stepsWithSessions = goal.steps.filter(step => step.sessions.length > 0).length

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="font-medium text-card-foreground">Goal Progress</h3>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Steps Completed</span>
          <span className="text-primary font-medium">{completedSteps}/{totalSteps}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <div 
            className="bg-primary rounded-full h-3 transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <div className="text-center mt-2">
          <span className="text-2xl font-bold text-primary">{completionPercentage}%</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="text-lg font-semibold text-card-foreground">{totalSessions}</div>
          <div className="text-xs text-muted-foreground">Total Sessions</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-card-foreground">{stepsWithSessions}</div>
          <div className="text-xs text-muted-foreground">Active Steps</div>
        </div>
      </div>
    </div>
  )
}

export default function GoalInsights({ goal }: GoalInsightsProps) {
  const metrics: AggregatedMetrics = useMemo(() => {
    if (!goal) {
      return { effort: [], stress: [], progress: [] }
    }

    // Collect all sessions from all steps
    const allSessions: SessionWithGoalAndInsight[] = goal.steps.flatMap(step => step.sessions)
    
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
    }, {} as Record<string, SessionWithGoalAndInsight[]>)

    // Calculate daily metrics
    const effort: MetricData[] = []
    const stress: MetricData[] = []
    const progress: MetricData[] = []

    Object.entries(sessionsByDate).forEach(([date, sessions]) => {
      const avgEffort = sessions.reduce((sum, s) => sum + s.insight.effort_level, 0) / sessions.length
      const avgStress = sessions.reduce((sum, s) => sum + s.insight.stress_level, 0) / sessions.length
      const avgProgress = sessions.reduce((sum, s) => sum + s.insight.progress, 0) / sessions.length
      
      // Use the most recent session's summary for that date
      const latestSession = sessions[sessions.length - 1]
      
      effort.push({
        date,
        value: Math.round(avgEffort * 10) / 10,
        summary: latestSession.insight.summary
      })
      
      stress.push({
        date,
        value: Math.round(avgStress * 10) / 10,
        summary: latestSession.insight.summary
      })
      
      progress.push({
        date,
        value: Math.round(avgProgress),
        summary: latestSession.insight.summary
      })
    })

    return { effort, stress, progress }
  }, [goal])

  if (!goal) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Activity className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-inter font-semibold text-foreground mb-2">
          No Goal Selected
        </h3>
        <p className="text-muted-foreground text-center">
          Select a goal to view insights and progress metrics.
        </p>
      </div>
    )
  }

  const hasSessionData = metrics.effort.length > 0 || metrics.stress.length > 0 || metrics.progress.length > 0

  if (!hasSessionData) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Brain className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-inter font-semibold text-foreground mb-2">
          No Session Data Yet
        </h3>
        <p className="text-muted-foreground text-center mb-4">
          Start working on your goal steps to see insights and progress tracking.
        </p>
        <div className="text-sm text-muted-foreground">
          Goal: {goal.text}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-inter font-semibold text-foreground mb-2">
            Goal Insights
          </h2>
          <p className="text-muted-foreground text-sm">
            {goal.text}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Progress Overview */}
          <ProgressOverview goal={goal} />
          
          {/* Effort Metric */}
          <MetricCard
            title="Effort Level"
            icon={Zap}
            data={metrics.effort}
            color="text-yellow-500"
            unit="/10"
            maxValue={10}
          />
          
          {/* Stress Metric */}
          <MetricCard
            title="Stress Level"
            icon={Brain}
            data={metrics.stress}
            color="text-red-500"
            unit="/10"
            maxValue={10}
          />
          
          {/* Progress Metric */}
          <MetricCard
            title="Session Progress"
            icon={TrendingUp}
            data={metrics.progress}
            color="text-blue-500"
            unit="%"
            maxValue={100}
          />
        </div>

        {/* Summary Stats */}
        <div className="mt-8 bg-background border border-border rounded-lg p-6">
          <h3 className="font-medium text-foreground mb-4">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-foreground">
                {metrics.effort.length}
              </div>
              <div className="text-xs text-muted-foreground">Days Active</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-foreground">
                {goal.steps.reduce((sum, step) => sum + step.sessions.length, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total Sessions</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-yellow-500">
                {metrics.effort.length > 0 
                  ? (metrics.effort.reduce((sum, item) => sum + item.value, 0) / metrics.effort.length).toFixed(1)
                  : '0'
                }/10
              </div>
              <div className="text-xs text-muted-foreground">Avg Effort</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-red-500">
                {metrics.stress.length > 0 
                  ? (metrics.stress.reduce((sum, item) => sum + item.value, 0) / metrics.stress.length).toFixed(1)
                  : '0'
                }/10
              </div>
              <div className="text-xs text-muted-foreground">Avg Stress</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
