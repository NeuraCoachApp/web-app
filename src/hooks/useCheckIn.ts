import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { useAuth } from '@/src/contexts/AuthContext'
import { supabase } from '@/src/lib/supabase'
import { useGoals } from './useGoals'
import { getTodaysTasks } from '@/src/components/dashboard/timeline/utils'

export interface TaskCompletion {
  task_uuid: string
  isCompleted: boolean
}

export interface DailyProgress {
  date: string
  total_tasks: number
  completed_tasks: number
  progress_percentage: number
  tasks: Array<{
    uuid: string
    text: string
    isCompleted: boolean
    start_at: string
    end_at: string
    milestone_uuid: string
    milestone_text: string
  }>
}

export interface UserStreak {
  daily_streak: number
  last_check_in_date: string | null
  can_check_in_today: boolean
}

export interface CheckInSession {
  uuid: string
  created_at: string
  streak_updated: boolean
}

export interface CheckInData {
  goal_uuid: string
  summary: string
  mood: number // 1-10 scale
  motivation: number // 1-10 scale
  blocker: string
  task_completions: TaskCompletion[]
}

// Query keys for React Query
export const checkInKeys = {
  all: ['checkIn'] as const,
  dailyProgress: (goalUuid: string) => [...checkInKeys.all, 'dailyProgress', goalUuid] as const,
  userStreak: (userId: string) => [...checkInKeys.all, 'userStreak', userId] as const,
  todaysTasks: (goalUuid: string) => [...checkInKeys.all, 'todaysTasks', goalUuid] as const,
}

/**
 * Hook to get today's daily progress for a goal
 */
export function useDailyProgress(goalUuid?: string) {
  return useQuery({
    queryKey: checkInKeys.dailyProgress(goalUuid || ''),
    queryFn: async (): Promise<DailyProgress> => {
      if (!goalUuid) {
        throw new Error('Goal UUID is required')
      }

      const { data, error } = await supabase.rpc('calculate_daily_progress', {
        p_goal_uuid: goalUuid
      })

      if (error) {
        console.error('Error fetching daily progress:', error)
        throw new Error(`Failed to fetch daily progress: ${error.message}`)
      }

      return data as unknown as DailyProgress
    },
    enabled: !!goalUuid,
    staleTime: 5 * 60 * 1000, // 5 minutes - aligned with useGoals for better caching
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to get user's current streak
 */
export function useUserStreak(userId?: string) {
  return useQuery({
    queryKey: checkInKeys.userStreak(userId || ''),
    queryFn: async (): Promise<UserStreak> => {
      if (!userId) {
        throw new Error('User ID is required')
      }

      const { data, error } = await supabase.rpc('get_user_streak', {
        p_user_uuid: userId
      })

      if (error) {
        console.error('Error fetching user streak:', error)
        throw new Error(`Failed to fetch user streak: ${error.message}`)
      }

      return data as unknown as UserStreak
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - aligned with useGoals for better caching
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to get today's tasks for check-in
 * Uses cached goals data instead of making separate API call
 */
export function useTodaysTasks(goalUuid?: string) {
  const { user } = useAuth()
  const { goals } = useGoals(user?.id)
  
  return useQuery({
    queryKey: checkInKeys.todaysTasks(goalUuid || ''),
    queryFn: () => {
      if (!goalUuid || !goals) {
        return []
      }

      const goal = goals.get(goalUuid)
      if (!goal) {
        console.warn(`Goal with UUID ${goalUuid} not found in cache`)
        return []
      }

      // Use the same logic as dashboard to get today's tasks from cached data
      const todaysTasks = getTodaysTasks(goal)
      
      // Convert to the format expected by check-in components
      return todaysTasks.map(task => {
        // Find the milestone for this task
        const milestone = goal.getMilestones().find((m: any) => m.uuid === task.milestone_uuid)
        
        return {
          uuid: task.uuid,
          text: task.text,
          isCompleted: task.isCompleted,
          start_at: task.start_at,
          end_at: task.end_at,
          milestone_uuid: task.milestone_uuid,
          milestone_text: milestone?.text || ''
        }
      })
    },
    enabled: !!goalUuid && !!goals, // Wait for goals cache to be loaded
    staleTime: 5 * 60 * 1000, // 5 minutes - same as useGoals
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// useCanCheckInNow hook moved to AuthContext for better separation of concerns

/**
 * Hook to create a check-in session
 */
export function useCreateCheckIn() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (checkInData: CheckInData): Promise<CheckInSession> => {
      const { data, error } = await supabase.rpc('create_check_in_session', {
        p_goal_uuid: checkInData.goal_uuid,
        p_summary: checkInData.summary,
        p_mood: checkInData.mood,
        p_motivation: checkInData.motivation,
        p_blocker: checkInData.blocker,
        p_task_completions: checkInData.task_completions as any
      })

      if (error) {
        console.error('Error creating check-in session:', error)
        throw new Error(`Failed to create check-in: ${error.message}`)
      }

      return data as unknown as CheckInSession
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: checkInKeys.dailyProgress(variables.goal_uuid) })
      queryClient.invalidateQueries({ queryKey: checkInKeys.userStreak(user?.id || '') })
      queryClient.invalidateQueries({ queryKey: checkInKeys.todaysTasks(variables.goal_uuid) })
      
      // Also invalidate goals data since task completion status may have changed
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    }
  })
}

/**
 * Hook to update task completion status
 */
export function useUpdateTaskCompletion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskUuid, isCompleted }: { taskUuid: string; isCompleted: boolean }): Promise<boolean> => {
      const { data, error } = await supabase.rpc('update_task_completion', {
        p_task_uuid: taskUuid,
        p_is_completed: isCompleted
      })

      if (error) {
        console.error('Error updating task completion:', error)
        throw new Error(`Failed to update task: ${error.message}`)
      }

      return data
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: checkInKeys.all })
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    }
  })
}

/**
 * Main hook for check-in flow management
 */
export function useCheckInFlow() {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState<'assessment' | 'chat' | 'mood' | 'complete'>('assessment')
  const [checkInData, setCheckInData] = useState<Partial<CheckInData>>({
    task_completions: []
  })

  const createCheckIn = useCreateCheckIn()
  const updateTaskCompletion = useUpdateTaskCompletion()

  const updateCheckInData = useCallback((updates: Partial<CheckInData>) => {
    setCheckInData(prev => ({ ...prev, ...updates }))
  }, [])

  const submitCheckIn = useCallback(async () => {
    if (!checkInData.goal_uuid || !user) {
      throw new Error('Missing required check-in data')
    }

    const finalData: CheckInData = {
      goal_uuid: checkInData.goal_uuid,
      summary: checkInData.summary || '',
      mood: checkInData.mood || 5,
      motivation: checkInData.motivation || 5,
      blocker: checkInData.blocker || '',
      task_completions: checkInData.task_completions || []
    }

    // First update task completions
    if (finalData.task_completions.length > 0) {
      for (const completion of finalData.task_completions) {
        await updateTaskCompletion.mutateAsync({
          taskUuid: completion.task_uuid,
          isCompleted: completion.isCompleted
        })
      }
    }

    // Then create the check-in session
    return await createCheckIn.mutateAsync(finalData)
  }, [checkInData, user, createCheckIn, updateTaskCompletion])

  return {
    currentStep,
    setCurrentStep,
    checkInData,
    updateCheckInData,
    submitCheckIn,
    isSubmitting: createCheckIn.isPending || updateTaskCompletion.isPending,
    error: createCheckIn.error || updateTaskCompletion.error
  }
}
