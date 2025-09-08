'use client'

import React from 'react'
import { GoalWithStepsAndSessions } from '@/src/lib/mock-data'
import { Calendar, CheckCircle, AlertCircle, XCircle } from 'lucide-react'

interface GoalCalendarProps {
  goal: GoalWithStepsAndSessions | null
}

interface DayProgress {
  date: Date
  dayName: string
  totalSteps: number
  completedSteps: number
  status: 'none' | 'partial' | 'complete'
}

function getDayName(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[date.getDay()]
}

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0] // YYYY-MM-DD format
}

function isStepCompleted(step: any): boolean {
  // A step is completed if it has at least one session with 100% progress
  return step.sessions.some((session: any) => session.insight.progress === 100)
}

function calculateDayProgress(goal: GoalWithStepsAndSessions, date: Date): DayProgress {
  const dateStr = getDateString(date)
  
  // Get steps that had sessions on this specific date
  const stepsWorkedOnToday = goal.steps.filter(step => 
    step.sessions.some(session => {
      const sessionDate = new Date(session.created_at).toISOString().split('T')[0]
      return sessionDate === dateStr
    })
  )
  
  // Get steps that were completed on this day (had a 100% progress session on this day)
  const stepsCompletedToday = stepsWorkedOnToday.filter(step => {
    return step.sessions.some(session => {
      const sessionDate = new Date(session.created_at).toISOString().split('T')[0]
      return sessionDate === dateStr && session.insight.progress === 100
    })
  })
  
  // For daily progress, we only count steps that were actually worked on that day
  const totalSteps = stepsWorkedOnToday.length
  const completedSteps = stepsCompletedToday.length
  
  let status: 'none' | 'partial' | 'complete' = 'none'
  
  if (completedSteps === 0) {
    status = 'none'
  } else if (completedSteps === totalSteps) {
    status = 'complete'
  } else {
    status = 'partial'
  }
  
  return {
    date,
    dayName: getDayName(date),
    totalSteps,
    completedSteps,
    status
  }
}

function DayRectangle({ dayProgress, index }: { dayProgress: DayProgress; index: number }) {
  const { date, dayName, totalSteps, completedSteps, status } = dayProgress
  
  const getStatusColor = () => {
    switch (status) {
      case 'complete':
        return 'bg-emerald-600 text-white'
      case 'partial':
        return 'bg-amber-500 text-white'
      case 'none':
        return totalSteps > 0 ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-600'
      default:
        return 'bg-gray-300 text-gray-600'
    }
  }
  
  const getStatusIcon = () => {
    if (totalSteps === 0) return null
    
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-3 h-3" />
      case 'partial':
        return <AlertCircle className="w-3 h-3" />
      case 'none':
        return <XCircle className="w-3 h-3" />
      default:
        return null
    }
  }
  
  const isToday = getDateString(date) === getDateString(new Date())
  const isFuture = date > new Date()
  const isFirst = index === 0
  const isLast = index === 6
  
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div className="text-xs text-muted-foreground font-medium">
        {dayName}
      </div>
      <div
        className={`
          w-full h-16 flex flex-col items-center justify-center
          transition-all duration-200 hover:scale-105 cursor-pointer relative
          ${getStatusColor()}
          ${isFirst ? 'rounded-l-lg' : ''}
          ${isLast ? 'rounded-r-lg' : ''}
          ${isToday ? 'ring-2 ring-primary ring-inset' : ''}
          ${isFuture ? 'opacity-50' : ''}
        `}
        title={totalSteps > 0 
          ? `${date.toLocaleDateString()}: ${completedSteps}/${totalSteps} steps completed that day`
          : `${date.toLocaleDateString()}: No steps worked on`
        }
      >
        {totalSteps > 0 ? (
          <>
            <div className="flex items-center justify-center mb-0.5">
              {getStatusIcon()}
            </div>
            <div className="text-xs font-semibold">
              {completedSteps}/{totalSteps}
            </div>
          </>
        ) : (
          <div className="text-xs font-medium opacity-70">
            No steps
          </div>
        )}
        
        {/* Today indicator */}
        {isToday && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></div>
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        {date.getDate()}
      </div>
    </div>
  )
}

export default function GoalCalendar({ goal }: GoalCalendarProps) {
  if (!goal) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-3">
          <Calendar className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Select a goal to view progress calendar
          </p>
        </div>
      </div>
    )
  }
  
  // Generate last 7 days
  const days: DayProgress[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    days.push(calculateDayProgress(goal, date))
  }
  
  // Calculate overall stats
  const totalDaysWithProgress = days.filter(day => day.totalSteps > 0).length
  const perfectDays = days.filter(day => day.status === 'complete' && day.totalSteps > 0).length
  const activeDays = days.filter(day => day.totalSteps > 0).length
  
  return (
    <div className="bg-card rounded-lg border border-border p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="font-medium text-card-foreground">7-Day Progress</h3>
      </div>
      
      {/* Goal Title */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {goal.text}
        </p>
      </div>
      
      {/* Calendar Grid */}
      <div className="flex items-start mb-4">
        {days.map((dayProgress, index) => (
          <DayRectangle key={index} dayProgress={dayProgress} index={index} />
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mb-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-muted-foreground">All Complete</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span className="text-muted-foreground">Partial</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-muted-foreground">Incomplete</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-300 rounded"></div>
          <span className="text-muted-foreground">No Steps</span>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center border-t border-border pt-4">
        <div>
          <div className="text-lg font-semibold text-card-foreground">{totalDaysWithProgress}</div>
          <div className="text-xs text-muted-foreground">Days Worked</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-green-600">{perfectDays}</div>
          <div className="text-xs text-muted-foreground">Perfect Days</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-primary">
            {totalDaysWithProgress > 0 ? Math.round((perfectDays / totalDaysWithProgress) * 100) : 0}%
          </div>
          <div className="text-xs text-muted-foreground">Success Rate</div>
        </div>
      </div>
    </div>
  )
}
