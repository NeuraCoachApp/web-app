import { Goal } from '@/src/classes/Goal'
import { Milestone } from '@/src/classes/Milestone'
import { Task } from '@/src/classes/Task'

export interface TimelineProps {
  goals: Goal[]
  selectedGoalIndex?: number
  onGoalChange?: (index: number) => void
  onMilestoneClick?: (milestone: Milestone) => void
}

export interface MilestoneTasksModalProps {
  isOpen: boolean
  onClose: () => void
  milestone: Milestone | null
  goal: Goal | null
}

export interface GoalSwitcherProps {
  goals: Goal[]
  selectedGoalIndex: number
  onGoalChange: (index: number) => void
  showDropdown: boolean
  setShowDropdown: (show: boolean) => void
}

export interface GoalSquareProps {
  goal: Goal
  allMilestonesCompleted: boolean
}

export interface MilestoneSquareProps {
  milestone: Milestone
  milestoneIndex: number
  currentMilestoneIndex: number
  allMilestonesCompleted: boolean
  onMilestoneClick: (milestone: Milestone) => void
}

export interface TimelineLayoutProps {
  children: React.ReactNode
}
