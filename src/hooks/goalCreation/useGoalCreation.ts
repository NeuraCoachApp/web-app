import { useQuery } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { useAuth } from '@/src/contexts/AuthContext'
import { useProfile } from '../useProfile'
import { useGoals } from '../useGoals'
import { Tables } from '@/src/types/database'
import { Goal, Milestone, Task } from '@/src/classes'
import { generateGoalSteps, validateOpenAIConfiguration, GeneratedStep } from '@/src/lib/openai-steps'
import { useSpeechRecognition } from '@/src/lib/audio/speech-recognition'

export interface GoalCreationStep {
  id: string
  text: string
  subtext: string
  personality: string
  [key: string]: unknown
}

export interface GoalCreationState {
  currentStep: number
  // 10 comprehensive questions
  goal: string                    // What is your goal?
  deadline: string               // When do you want to complete it by?
  motivation: string             // Why is this goal important to you?
  currentProgress: string        // Where are you right now, what have you done so far?
  obstacles: string              // What obstacles have you faced (or do you expect to face)?
  dailySuccess: string           // What would success look like for you on a daily basis?
  timeCommitment: string         // How much time per day can you realistically commit?
  bestTimeOfDay: string          // What time of day do you work best?
  supportNeeded: string          // What support, tools, or resources do you need?
  celebration: string            // How do you want to celebrate at the end?
  notificationTime: string       // Notification time (keeping existing)
  
  // Legacy fields (keeping for backwards compatibility during transition)
  reason: string
  
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

// Goal creation flow steps - Only the 10 essential questions
export const goalCreationSteps: GoalCreationStep[] = [
  {
    id: 'goal_question',
    text: "What is your goal?",
    subtext: "",
    personality: "focused and supportive"
  },
  {
    id: 'deadline_question',
    text: "When do you want to complete it by?",
    subtext: "",
    personality: "practical and encouraging"
  },
  {
    id: 'motivation_question',
    text: "Why is this goal important to you?",
    subtext: "",
    personality: "curious and empathetic"
  },
  {
    id: 'current_progress_question',
    text: "Where are you right now, what have you done so far?",
    subtext: "",
    personality: "understanding and non-judgmental"
  },
  {
    id: 'obstacles_question',
    text: "What obstacles have you faced (or do you expect to face)?",
    subtext: "",
    personality: "thoughtful and strategic"
  },
  {
    id: 'daily_success_question',
    text: "What would success look like for you on a daily basis?",
    subtext: "",
    personality: "inspiring and practical"
  },
  {
    id: 'time_commitment_question',
    text: "How much time per day can you realistically commit?",
    subtext: "",
    personality: "realistic and supportive"
  },
  {
    id: 'best_time_question',
    text: "What time of day do you work best?",
    subtext: "",
    personality: "helpful and practical"
  },
  {
    id: 'support_question',
    text: "What support, tools, or resources do you need?",
    subtext: "",
    personality: "resourceful and caring"
  },
  {
    id: 'celebration_question',
    text: "How do you want to celebrate at the end?",
    subtext: "",
    personality: "joyful and motivating"
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
  const { createGoalAsync, createMilestoneAsync, createTaskAsync } = useGoals(user?.id)
  const { extractName } = useSpeechRecognition()

  // State management
  const [state, setState] = useState<GoalCreationState>({
    currentStep: 0,
    // 10 comprehensive questions
    goal: '',
    deadline: '',
    motivation: '',
    currentProgress: '',
    obstacles: '',
    dailySuccess: '',
    timeCommitment: '',
    bestTimeOfDay: '',
    supportNeeded: '',
    celebration: '',
    notificationTime: '09:00',
    
    // Legacy fields
    reason: '',
    
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
  const createGoalInBackground = useCallback(async (goalText: string, motivation: string) => {
    if (!user) return

    console.log('🎯 [Goal Creation] Starting comprehensive goal creation process')
    setState(prev => ({ ...prev, backgroundProcessStatus: 'generating-steps' }))
    
    try {
      // Step 1: Generate AI-powered milestones and tasks using comprehensive data
      console.log('🤖 [Goal Creation] Generating AI steps with comprehensive context')
      
      // Create a rich context for AI generation
      const comprehensiveContext = `
Goal: ${goalText}
Motivation: ${motivation}
Current Progress: ${state.currentProgress}
Time Commitment: ${state.timeCommitment} per day
Best Time: ${state.bestTimeOfDay}
Obstacles: ${state.obstacles}
Daily Success Metrics: ${state.dailySuccess}
Support Needed: ${state.supportNeeded}
Celebration Plan: ${state.celebration}
`.trim()

      const generatedSteps = await generateSteps(goalText, comprehensiveContext)
      
      if (!generatedSteps || generatedSteps.length === 0) {
        throw new Error('Failed to generate AI steps for goal')
      }
      
      console.log('🤖 [Goal Creation] AI generated milestones with daily tasks:', 
        generatedSteps.map(step => ({
          milestone: step.text,
          duration: step.estimated_duration_days,
          dailyTaskCount: step.daily_tasks.length,
          dailyTasks: step.daily_tasks.map(task => ({
            day: task.day_number,
            text: task.text,
            isPrep: task.is_preparation
          }))
        }))
      )

      console.log('✅ [Goal Creation] Generated AI steps:', generatedSteps.length)

      // Step 2: Parse deadline to create a proper end date
      let endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // Default 90 days
      
      if (state.deadline.trim()) {
        const deadlineText = state.deadline.toLowerCase()
        if (deadlineText.includes('week')) {
          const weeks = parseInt(deadlineText.match(/(\d+)/)?.[0] || '12')
          endDate = new Date(Date.now() + weeks * 7 * 24 * 60 * 60 * 1000)
        } else if (deadlineText.includes('month')) {
          const months = parseInt(deadlineText.match(/(\d+)/)?.[0] || '3')
          endDate = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000)
        } else if (deadlineText.includes('year')) {
          const years = parseInt(deadlineText.match(/(\d+)/)?.[0] || '1')
          endDate = new Date(Date.now() + years * 365 * 24 * 60 * 60 * 1000)
        }
      }

      setState(prev => ({ ...prev, backgroundProcessStatus: 'creating-goal' }))

      // Step 3: Create the goal first
      const goalData = { 
        goalText: goalText,
        initEndAt: endDate.toISOString()
      }

      console.log('🎯 [Goal Creation] Creating goal with AI-generated structure')
      const createdGoal = await createGoalAsync(goalData)
      console.log('✅ [Goal Creation] Goal created successfully:', createdGoal.uuid)

      // Step 4: Create milestones and tasks from AI-generated steps
      console.log('🎯 [Goal Creation] Creating milestones and tasks from AI steps')
      
      const startDate = new Date()
      let currentDate = new Date(startDate)
      
      for (let i = 0; i < generatedSteps.length; i++) {
        const step = generatedSteps[i]
        const milestoneStartDate = new Date(currentDate)
        const milestoneEndDate = new Date(currentDate.getTime() + step.estimated_duration_days * 24 * 60 * 60 * 1000)
        
        console.log(`🎯 [Goal Creation] Creating milestone ${i + 1}: "${step.text}" with ${step.daily_tasks.length} daily tasks`)
        
        // Create milestone
        const milestone = await createMilestoneAsync({
          goalUuid: createdGoal.uuid,
          milestoneData: {
            text: step.text,
            start_at: milestoneStartDate.toISOString(),
            end_at: milestoneEndDate.toISOString()
          }
        })
        console.log('✅ [Goal Creation] Milestone created:', milestone.uuid)

        // Create individual daily tasks for this milestone
        console.log(`📋 [Goal Creation] Creating ${step.daily_tasks.length} daily tasks for milestone: "${step.text}"`)
        
        for (let j = 0; j < step.daily_tasks.length; j++) {
          const dailyTask = step.daily_tasks[j]
          
          // Calculate individual task dates (each task is one day)
          const taskDate = new Date(milestoneStartDate.getTime() + (dailyTask.day_number - 1) * 24 * 60 * 60 * 1000)
          const taskStartDate = new Date(taskDate)
          taskStartDate.setHours(0, 0, 0, 0) // Start of day
          
          const taskEndDate = new Date(taskDate)
          taskEndDate.setHours(23, 59, 59, 999) // End of day
          
          console.log(`📅 [Goal Creation] Creating daily task ${j + 1}/${step.daily_tasks.length}: "${dailyTask.text}" for day ${dailyTask.day_number}`)
          console.log(`🎯 [Goal Creation] Success criteria: "${dailyTask.success_criteria}"`)
          if (dailyTask.is_preparation) {
            console.log(`🔧 [Goal Creation] This is a preparation task`)
          }
          
          const task = await createTaskAsync({
            goalUuid: createdGoal.uuid,
            milestoneUuid: milestone.uuid,
            taskData: {
              text: dailyTask.text,
              start_at: taskStartDate.toISOString(),
              end_at: taskEndDate.toISOString()
            }
          })
          console.log(`✅ [Goal Creation] Daily task created: ${task.uuid}`)
        }

        // Move to next milestone start date (add 1 day buffer after milestone ends)
        currentDate = new Date(milestoneEndDate.getTime() + 24 * 60 * 60 * 1000)
      }
      
      console.log('✅ [Goal Creation] Successfully created complete goal structure with AI-generated milestones and tasks')
      setState(prev => ({ ...prev, backgroundProcessStatus: 'completed' }))
      
    } catch (error: any) {
      console.error('❌ [Goal Creation] Comprehensive goal creation failed:', error)
      
      // Provide specific error messages for different failure types
      let errorMessage = 'Could not generate goal structure. Please try again.'
      if (error?.status === 429) {
        errorMessage = 'OpenAI rate limit exceeded. Please try again in a few minutes.'
      } else if (error?.message?.includes('truncated')) {
        errorMessage = 'Your goal description is too long. Please try with a shorter description.'
      } else if (error?.message?.includes('invalid JSON')) {
        errorMessage = 'AI response format error. Please try again.'
      } else if (error?.message?.includes('OpenAI')) {
        errorMessage = 'AI service temporarily unavailable. Please try again.'
      } else if (error?.message?.includes('API key')) {
        errorMessage = 'AI service configuration error. Please contact support.'
      }
      
      setState(prev => ({ 
        ...prev, 
        backgroundProcessStatus: 'failed',
        stepGenerationError: errorMessage
      }))
    }
  }, [user, createGoalAsync, createMilestoneAsync, createTaskAsync, generateSteps, state])

  // Handle voice transcript for any input step
  const handleVoiceTranscript = useCallback(async (transcript: string, isFinal: boolean, stepId: string) => {
    if (!isFinal) {
      // For real-time transcription, update the appropriate field based on stepId
      setState(prev => {
        switch (stepId) {
          case 'goal_question':
            return { ...prev, goal: transcript }
          case 'deadline_question':
            return { ...prev, deadline: transcript }
          case 'motivation_question':
            return { ...prev, motivation: transcript }
          case 'current_progress_question':
            return { ...prev, currentProgress: transcript }
          case 'obstacles_question':
            return { ...prev, obstacles: transcript }
          case 'daily_success_question':
            return { ...prev, dailySuccess: transcript }
          case 'time_commitment_question':
            return { ...prev, timeCommitment: transcript }
          case 'best_time_question':
            return { ...prev, bestTimeOfDay: transcript }
          case 'support_question':
            return { ...prev, supportNeeded: transcript }
          case 'celebration_question':
            return { ...prev, celebration: transcript }
          default:
            return prev
        }
      })
      return
    }

    // Clear any previous speech errors
    setState(prev => ({ ...prev, speechError: '' }))
    
    try {
      // For final transcription, just update the field directly
      setState(prev => {
        switch (stepId) {
          case 'goal_question':
            return { ...prev, goal: transcript.trim() }
          case 'deadline_question':
            return { ...prev, deadline: transcript.trim() }
          case 'motivation_question':
            return { ...prev, motivation: transcript.trim() }
          case 'current_progress_question':
            return { ...prev, currentProgress: transcript.trim() }
          case 'obstacles_question':
            return { ...prev, obstacles: transcript.trim() }
          case 'daily_success_question':
            return { ...prev, dailySuccess: transcript.trim() }
          case 'time_commitment_question':
            return { ...prev, timeCommitment: transcript.trim() }
          case 'best_time_question':
            return { ...prev, bestTimeOfDay: transcript.trim() }
          case 'support_question':
            return { ...prev, supportNeeded: transcript.trim() }
          case 'celebration_question':
            return { ...prev, celebration: transcript.trim() }
          default:
            return prev
        }
      })
    } catch (error) {
      console.error('Voice transcript error:', error)
      setState(prev => ({ 
        ...prev, 
        speechError: 'There was an error processing your voice input. Please try again.' 
      }))
    }
  }, [])

  // Handle next step logic for goal creation flow
  const handleNext = useCallback(async () => {
    const currentStepData = goalCreationSteps[state.currentStep]
    const stepId = currentStepData?.id
    
    // Handle input validation and progression for each question step
    switch (stepId) {
      case 'goal_question':
        if (state.goal.trim()) {
          setState(prev => ({ ...prev, currentStep: state.currentStep + 1 }))
        }
        break
      case 'deadline_question':
        if (state.deadline.trim()) {
          setState(prev => ({ ...prev, currentStep: state.currentStep + 1 }))
        }
        break
      case 'motivation_question':
        if (state.motivation.trim()) {
          setState(prev => ({ ...prev, currentStep: state.currentStep + 1 }))
        }
        break
      case 'current_progress_question':
        if (state.currentProgress.trim()) {
          setState(prev => ({ ...prev, currentStep: state.currentStep + 1 }))
        }
        break
      case 'obstacles_question':
        if (state.obstacles.trim()) {
          setState(prev => ({ ...prev, currentStep: state.currentStep + 1 }))
        }
        break
      case 'daily_success_question':
        if (state.dailySuccess.trim()) {
          setState(prev => ({ ...prev, currentStep: state.currentStep + 1 }))
        }
        break
      case 'time_commitment_question':
        if (state.timeCommitment.trim()) {
          setState(prev => ({ ...prev, currentStep: state.currentStep + 1 }))
        }
        break
      case 'best_time_question':
        if (state.bestTimeOfDay.trim()) {
          setState(prev => ({ ...prev, currentStep: state.currentStep + 1 }))
        }
        break
      case 'support_question':
        if (state.supportNeeded.trim()) {
          setState(prev => ({ ...prev, currentStep: state.currentStep + 1 }))
        }
        break
      case 'celebration_question':
        if (state.celebration.trim()) {
          // This is the final question - start background goal creation process
          createGoalInBackground(state.goal.trim(), state.motivation.trim())
          // Set a completion flag to trigger redirect
          setState(prev => ({ ...prev, backgroundProcessStatus: 'generating-steps' }))
        }
        break
      default:
        // For non-input steps, just advance
        if (state.currentStep < goalCreationSteps.length - 1) {
          setState(prev => ({ ...prev, currentStep: state.currentStep + 1 }))
        }
        break
    }
  }, [state, createGoalInBackground])

  // Auto-advance for non-input steps (but not the final step)
  const shouldAutoAdvance = useCallback(() => {
    const currentStepData = goalCreationSteps[state.currentStep]
    const stepId = currentStepData?.id
    
    // Input steps that require user interaction
    const inputStepIds = [
      'goal_question',
      'deadline_question', 
      'motivation_question',
      'current_progress_question',
      'obstacles_question',
      'daily_success_question',
      'time_commitment_question',
      'best_time_question',
      'support_question',
      'celebration_question'
    ]
    
    const finalStep = goalCreationSteps.length - 1 // Don't auto-advance the final step
    return state.currentStep >= 0 && 
           !inputStepIds.includes(stepId) && 
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
    handleVoiceTranscript,
    shouldAutoAdvance,
    generateSteps,
    createGoalInBackground,
    getCurrentText: () => getCurrentStepText(
      goalCreationSteps[state.currentStep], 
      profile?.first_name || undefined
    ),
    currentStepData: goalCreationSteps[state.currentStep],
    isInputStep: (() => {
      const currentStepData = goalCreationSteps[state.currentStep]
      const stepId = currentStepData?.id
      const inputStepIds = [
        'goal_question',
        'deadline_question', 
        'motivation_question',
        'current_progress_question',
        'obstacles_question',
        'daily_success_question',
        'time_commitment_question',
        'best_time_question',
        'support_question',
        'celebration_question'
      ]
      return inputStepIds.includes(stepId)
    })(),
    isLastStep: state.currentStep === goalCreationSteps.length - 1,
    profile,
    goalCreationStatus
  }
}
