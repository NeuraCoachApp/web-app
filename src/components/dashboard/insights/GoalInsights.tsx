'use client'

import React, { useMemo, useState } from 'react'
import { InsightsProps } from './types'
import { calculateAggregatedMetrics, filterSessionsByTimeframe } from './utils'
import InsightsHeader from './InsightsHeader'
import EmptyInsightsState from './EmptyInsightsState'
import GoalCompletionChart from './GoalCompletionChart'
import TaskProgressChart from './TaskProgressChart'
import MomentumChart from './MomentumChart'
import MilestoneProgressChart from './MilestoneProgressChart'
import MoodTrendChart from './MoodTrendChart'
import MotivationTrendChart from './MotivationTrendChart'
import SessionCompletionChart from './SessionCompletionChart'
import InsightsSummary from './InsightsSummary'
import TimeframeSelector, { TimeframeOption } from './TimeframeSelector'
import WeeklyReport from './WeeklyReport'

export default function GoalInsights({ goal }: InsightsProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>('week')
  
  const metrics = useMemo(() => calculateAggregatedMetrics(goal, selectedTimeframe), [goal, selectedTimeframe])
  const filteredSessions = useMemo(() => {
    if (!goal) return []
    return filterSessionsByTimeframe(goal.getSessions(), selectedTimeframe)
  }, [goal, selectedTimeframe])
  
  const hasSessionData = metrics.mood.length > 0 || metrics.motivation.length > 0 || metrics.sessionCompletion.length > 0

  // Show empty state if no goal or no session data
  const emptyState = <EmptyInsightsState goal={goal} hasSessionData={hasSessionData} />
  if (emptyState && (!goal || !hasSessionData)) {
    return emptyState
  }

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <InsightsHeader goal={goal!} />
          <TimeframeSelector 
            selectedTimeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
          />
        </div>

        {/* Weekly Report */}
        <div className="mb-8">
          <WeeklyReport 
            goal={goal!}
            timeframe={selectedTimeframe}
            sessions={filteredSessions}
          />
        </div>

        {/* Goal Overview Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Goal Completion Pie Chart */}
          <GoalCompletionChart goal={goal!} />
          
          {/* Milestone Progress */}
          <MilestoneProgressChart goal={goal!} />
        </div>

        {/* Session-Based Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Mood Trend Chart */}
          <MoodTrendChart goal={goal!} data={metrics.mood} />
          
          {/* Motivation Trend Chart */}
          <MotivationTrendChart goal={goal!} data={metrics.motivation} />
          
          {/* Session Completion Rate */}
          <SessionCompletionChart goal={goal!} data={metrics.sessionCompletion} />
        </div>

        {/* Progress and Momentum Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Task Progress Bar Chart */}
          <TaskProgressChart goal={goal!} data={metrics.progress} />
          
          {/* Momentum Line Chart */}
          <MomentumChart goal={goal!} metrics={metrics} />
        </div>

        {/* Insights Summary */}
        <div className="mt-8">
          <InsightsSummary goal={goal!} metrics={metrics} />
        </div>
      </div>
    </div>
  )
}
