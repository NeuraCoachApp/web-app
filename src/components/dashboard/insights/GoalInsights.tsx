'use client'

import React, { useMemo } from 'react'
import { TrendingUp, Zap, Brain } from 'lucide-react'
import { InsightsProps } from './types'
import { calculateAggregatedMetrics } from './utils'
import InsightsHeader from './InsightsHeader'
import MetricCard from './MetricCard'
import ProgressOverview from './ProgressOverview'
import InsightsSummary from './InsightsSummary'
import EmptyInsightsState from './EmptyInsightsState'

export default function GoalInsights({ goal }: InsightsProps) {
  const metrics = useMemo(() => calculateAggregatedMetrics(goal), [goal])
  const hasSessionData = metrics.effort.length > 0 || metrics.stress.length > 0 || metrics.progress.length > 0

  // Show empty state if no goal or no session data
  const emptyState = <EmptyInsightsState goal={goal} hasSessionData={hasSessionData} />
  if (emptyState && (!goal || !hasSessionData)) {
    return emptyState
  }

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <InsightsHeader goal={goal!} />

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Progress Overview */}
          <ProgressOverview goal={goal!} />
          
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

        <InsightsSummary goal={goal!} metrics={metrics} />
      </div>
    </div>
  )
}
