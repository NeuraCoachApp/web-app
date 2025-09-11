import { useQuery } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { useAuth } from '@/src/contexts/AuthContext'
import { useProfile } from '../useProfile'
import { useGoals } from '../useGoals'
import { Tables } from '@/src/types/database'
import { Goal } from '@/src/classes/Goal'
import { generateGoalSteps, validateOpenAIConfiguration, GeneratedStep } from '@/src/lib/openai-steps'

export interface GoalCreationStep {
  id: string
  text: string
  subtext: string
  personality: string
}

export interface GoalCreationState {
  currentStep: number
  reason: string
  goal: string
  notificationTime: string
  speechError: string
  goalCreationChecked: boolean
  generatedSteps: GeneratedStep[]
  isGeneratingSteps: boolean
  stepGenerationError: string
  backgroundProcessStatus: 'idle' | 'generating-steps' | 'creating-goal' | 'completed' | 'failed'
}

export interface GoalCreationStatus {
  needsGoalCreation: boolean
  shouldRedirectToGoalCreation: boolean
}

// Goal creation flow steps
export const goalCreationSteps: GoalCreationStep[] = [
  {
    id: 'questions_before',
    text: "Before we start, I had a few questions.",
    subtext: "",
    personality: "gentle and curious"
  },
  {
    id: 'questions_time',
    text: "So tell me, what brings you to me today?",
    subtext: "",
    personality: "caring and attentive"
  },
  {
    id: 'acknowledgment',
    text: "I hear you. We can definitely work on that.",
    subtext: "",
    personality: "understanding and supportive"
  },
  {
    id: 'goal_setup',
    text: "What are your goals?",
    subtext: "Examples: Productivity, Focus, Health, Confidence",
    personality: "supportive and focused"
  },
  {
    id: 'notification_time',
    text: "What time would you like to receive daily notifications?",
    subtext: "",
    personality: "helpful and practical"
  },
  {
    id: 'daily_checkins',
    text: "Note that people who check in daily see progress and mindset shifts faster than those who do not check in regularly.",
    subtext: "",
    personality: "encouraging and factual"
  },
  {
    id: 'results_timeline',
    text: "Many people see results in as little as 2 weeks!",
    subtext: "",
    personality: "optimistic and motivating"
  },
  {
    id: 'final',
    text: "Alright, that's all the talking I'll do for now. Let's get started!",
    subtext: "",
    personality: "excited and ready"
  }
]

// Query keys for React Query
export const goalCreationKeys = {
  all: ['goalCreation'] as const,
  status: (userId: string) => [...goalCreationKeys.all, 'status', userId] as const,
}

/**
 * Check user's goal creation status based on existing goals data
 */
function checkGoalCreationStatus(goalsCache: Map<string, Goal> | null): GoalCreationStatus {
  console.log('🎯 [Goal Creation] Checking goal creation status:', { 
    hasData: !!goalsCache, 
    goalCount: goalsCache?.size || 0 
  })
  
  // If no goals, needs goal creation
  if (!goalsCache || goalsCache.size === 0) {
    console.log('🎯 [Goal Creation] User needs goal creation')
    return {
      needsGoalCreation: true,
      shouldRedirectToGoalCreation: true
    }
  }
  
  // User has goals - no goal creation needed
  console.log('🎯 [Goal Creation] User already has goals, no goal creation needed')
  return {
    needsGoalCreation: false,
    shouldRedirectToGoalCreation: false
  }
}

/**
 * Hook to fetch and cache goal creation status
 * This reuses the existing useGoals hook to avoid duplication
 */
export function useGoalCreationStatus(userId?: string) {
  const { goals, isLoading, error } = useGoals(userId)
  
  return useQuery({
    queryKey: goalCreationKeys.status(userId || ''),
    queryFn: (): GoalCreationStatus => {
      if (!userId) {
        console.log('🎯 [Goal Creation] No user ID provided')
        return {
          needsGoalCreation: true,
          shouldRedirectToGoalCreation: true
        }
      }
      
      if (error) {
        console.log('🎯 [Goal Creation] Error loading user goals:', error)
        return {
          needsGoalCreation: true,
          shouldRedirectToGoalCreation: true
        }
      }
      
      return checkGoalCreationStatus(goals || null)
    },
    enabled: !!userId && !isLoading, // Wait for user goals to load
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to check if user needs goal creation
 */
export function useGoalCreationRedirect() {
  const { user } = useAuth()
  const { data: goalCreationStatus, isLoading, error } = useGoalCreationStatus(user?.id)

  return {
    shouldRedirect: goalCreationStatus?.shouldRedirectToGoalCreation ?? false,
    isLoading,
    error,
    status: goalCreationStatus
  }
}

/**
 * Utility function to get current step text with name replacements
 */
export function getCurrentStepText(step: GoalCreationStep, firstName?: string): string {
  if (step.id === 'final') {
    return step.text.replace('______', firstName || 'friend')
  }
  if (step.id === 'questions_time') {
    return step.text.replace('______', firstName || 'friend')
  }
  return step.text
}

/**
 * Main hook for managing goal creation flow state and actions
 */
export function useGoalCreationFlow() {
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const { data: goalCreationStatus } = useGoalCreationStatus(user?.id)
  const { createGoal } = useGoals(user?.id)

  // State management
  const [state, setState] = useState<GoalCreationState>({
    currentStep: 0,
    reason: '',
    goal: '',
    notificationTime: '09:00',
    speechError: '',
    goalCreationChecked: false,
    generatedSteps: [],
    isGeneratingSteps: false,
    stepGenerationError: '',
    backgroundProcessStatus: 'idle'
  })

  // Initialize starting step based on goal creation status
  const initializeStep = useCallback(() => {
    if (!user || !goalCreationStatus || state.goalCreationChecked) return

    // If no goal creation needed, don't initialize
    if (!goalCreationStatus.shouldRedirectToGoalCreation) {
      return
    }

    // Start from beginning for goal creation flow
    setState(prev => ({ 
      ...prev, 
      goalCreationChecked: true
    }))
  }, [user, goalCreationStatus, state.goalCreationChecked])

  // Generate steps using OpenAI
  const generateSteps = useCallback(async (goalText: string, reason?: string) => {
    if (!validateOpenAIConfiguration()) {
      setState(prev => ({ 
        ...prev, 
        stepGenerationError: 'OpenAI API key not configured properly' 
      }))
      return
    }

    setState(prev => ({ 
      ...prev, 
      isGeneratingSteps: true, 
      stepGenerationError: '' 
    }))

    try {
      console.log('🤖 [Goal Creation] Generating steps for goal:', goalText)
      const response = await generateGoalSteps(goalText, reason)
      
      setState(prev => ({ 
        ...prev, 
        generatedSteps: response.steps,
        isGeneratingSteps: false
      }))
      
      console.log('✅ [Goal Creation] Successfully generated steps:', response.steps.length)
      return response.steps
    } catch (error) {
      console.error('❌ [Goal Creation] Failed to generate steps:', error)
      setState(prev => ({ 
        ...prev, 
        isGeneratingSteps: false,
        stepGenerationError: error instanceof Error ? error.message : 'Failed to generate steps'
      }))
      return null
    }
  }, [])

  // Background goal creation process
  const createGoalInBackground = useCallback(async (goalText: string, reason: string) => {
    if (!user) return

    console.log('🎯 [Goal Creation] Starting background goal creation process')
    setState(prev => ({ ...prev, backgroundProcessStatus: 'creating-goal' }))
    
    try {
      // Create goal directly (we'll add milestone/task generation later if needed)
      createGoal({ 
        goalText: goalText,
        initEndAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days from now
      })
      console.log('✅ [Goal Creation] Successfully created goal')
      
      setState(prev => ({ ...prev, backgroundProcessStatus: 'completed' }))
    } catch (error) {
      console.error('❌ [Goal Creation] Background goal creation failed:', error)
      setState(prev => ({ ...prev, backgroundProcessStatus: 'failed' }))
    }
  }, [user, createGoal])

  // Handle next step logic for goal creation flow
  const handleNext = useCallback(async () => {
    if (state.currentStep === 1 && state.reason.trim()) { // questions_time step
      setState(prev => ({ ...prev, currentStep: 2 }))
    } else if (state.currentStep === 3 && state.goal.trim()) { // goal_setup step
      // Start background goal creation process (don't await)
      createGoalInBackground(state.goal.trim(), state.reason.trim())
      
      // Immediately move to next step - don't wait for background process
      setState(prev => ({ ...prev, currentStep: 4 }))
    } else if (state.currentStep === 4) { // notification_time step
      setState(prev => ({ ...prev, currentStep: 5 }))
    } else if (state.currentStep < goalCreationSteps.length - 1) {
      setState(prev => ({ ...prev, currentStep: state.currentStep + 1 }))
    }
  }, [state, createGoalInBackground])

  // Auto-advance for non-input steps (but not the final step)
  const shouldAutoAdvance = useCallback(() => {
    const inputSteps = [1, 3, 4] // questions_time (reason), goal_setup, notification_time
    const finalStep = goalCreationSteps.length - 1 // Don't auto-advance the final step
    return state.currentStep >= 0 && 
           !inputSteps.includes(state.currentStep) && 
           state.currentStep !== finalStep
  }, [state.currentStep])

  // Update state functions
  const updateState = useCallback((updates: Partial<GoalCreationState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const setCurrentStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, currentStep: step }))
  }, [])

  return {
    state,
    updateState,
    setCurrentStep,
    initializeStep,
    handleNext,
    shouldAutoAdvance,
    generateSteps,
    createGoalInBackground,
    getCurrentText: () => getCurrentStepText(
      goalCreationSteps[state.currentStep], 
      profile?.first_name || undefined
    ),
    currentStepData: goalCreationSteps[state.currentStep],
    isInputStep: [1, 3, 4].includes(state.currentStep), // questions_time, goal_setup, notification_time
    isLastStep: state.currentStep === goalCreationSteps.length - 1,
    profile,
    goalCreationStatus
  }
}
