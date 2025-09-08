import { Goal } from '@/src/classes/Goal'
import { Step } from '@/src/classes/Step'

export interface TimelineProps {
  goals: Goal[]
  selectedGoalIndex?: number
  onGoalChange?: (index: number) => void
  onStepClick?: (step: Step) => void
}

export interface StepSessionModalProps {
  isOpen: boolean
  onClose: () => void
  step: Step | null
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
  allStepsCompleted: boolean
}

export interface StepSquareProps {
  step: Step
  stepIndex: number
  currentStepIndex: number
  allStepsCompleted: boolean
  onStepClick: (step: Step) => void
}

export interface TimelineLayoutProps {
  children: React.ReactNode
}
