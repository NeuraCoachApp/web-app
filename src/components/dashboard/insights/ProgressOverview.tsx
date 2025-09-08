import React from 'react'
import { BarChart3 } from 'lucide-react'
import { ProgressOverviewProps } from './types'

export default function ProgressOverview({ goal }: ProgressOverviewProps) {
  const completedSteps = goal.getCompletedStepsCount()
  const totalSteps = goal.getTotalStepsCount()
  const completionPercentage = goal.getCompletionPercentage()
  
  const totalSessions = goal.getTotalSessionsCount()
  const stepsWithSessions = goal.getActiveStepsCount()

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
