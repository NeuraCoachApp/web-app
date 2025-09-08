import { Goal } from '@/src/classes/Goal'
import { Session } from '@/src/classes/Session'

export interface DayProgress {
  date: Date
  dayName: string
  totalSteps: number
  completedSteps: number
  status: 'none' | 'partial' | 'complete'
  sessions: Session[]
}

export interface CalendarProps {
  goal: Goal | null
}

export interface DayRectangleProps {
  dayProgress: DayProgress
  index: number
  onClick: (dayProgress: DayProgress) => void
  isSelected: boolean
}

export interface DaySessionDetailsProps {
  dayProgress: DayProgress | null
}

export interface CalendarStatsProps {
  days: DayProgress[]
}
