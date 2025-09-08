import React from 'react'
import { Activity, Brain } from 'lucide-react'
import { Goal } from '@/src/classes/Goal'

interface EmptyInsightsStateProps {
  goal: Goal | null
  hasSessionData: boolean
}

export default function EmptyInsightsState({ goal, hasSessionData }: EmptyInsightsStateProps) {
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

  return null
}
