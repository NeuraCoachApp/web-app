// Main composed component
export { default as GoalInsights } from './GoalInsights'

// Individual sub-components
export { default as InsightsHeader } from './InsightsHeader'
export { default as MetricCard } from './MetricCard'
export { default as ProgressOverview } from './ProgressOverview'
export { default as InsightsSummary } from './InsightsSummary'
export { default as EmptyInsightsState } from './EmptyInsightsState'

// New visual chart components
export { default as GoalCompletionChart } from './GoalCompletionChart'
export { default as TaskProgressChart } from './TaskProgressChart'
export { default as MomentumChart } from './MomentumChart'
export { default as MilestoneProgressChart } from './MilestoneProgressChart'

// Session-based insight charts
export { default as MoodTrendChart } from './MoodTrendChart'
export { default as MotivationTrendChart } from './MotivationTrendChart'
export { default as SessionCompletionChart } from './SessionCompletionChart'

// Types and utilities
export * from './types'
export * from './utils'
