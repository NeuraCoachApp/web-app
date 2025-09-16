import { Goal } from '@/src/classes/Goal'

export interface MetricData {
  date: string
  value: number
  summary: string
}

export interface AggregatedMetrics {
  effort: MetricData[]
  stress: MetricData[]
  progress: MetricData[]
  mood: MetricData[]
  motivation: MetricData[]
  sessionCompletion: MetricData[]
}

export interface InsightsProps {
  goal: Goal | null
}

export interface MetricCardProps {
  title: string
  icon: React.ComponentType<any>
  data: MetricData[]
  color: string
  unit?: string
  maxValue?: number
}

export interface ProgressOverviewProps {
  goal: Goal
}

export interface InsightsHeaderProps {
  goal: Goal
}

export interface InsightsSummaryProps {
  goal: Goal
  metrics: AggregatedMetrics
}
