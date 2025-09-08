import React from 'react'
import { InsightsSummaryProps } from './types'

export default function InsightsSummary({ goal, metrics }: InsightsSummaryProps) {
  return (
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
            {goal.getTotalSessionsCount()}
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
  )
}
