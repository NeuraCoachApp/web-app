import React from 'react'
import { InsightsHeaderProps } from './types'

export default function InsightsHeader({ goal }: InsightsHeaderProps) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-inter font-semibold text-foreground mb-2">
        Goal Insights
      </h2>
      <p className="text-muted-foreground text-sm">
        {goal.text}
      </p>
    </div>
  )
}
