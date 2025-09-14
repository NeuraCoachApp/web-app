import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { useAuth } from '@/src/contexts/AuthContext'
import { supabase } from '@/src/lib/supabase'

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
  canCheckIn: () => [...checkInKeys.all, 'canCheckIn'] as const,
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
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
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
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to get today's tasks for check-in
 */
export function useTodaysTasks(goalUuid?: string) {
  return useQuery({
    queryKey: checkInKeys.todaysTasks(goalUuid || ''),
    queryFn: async () => {
      if (!goalUuid) {
        throw new Error('Goal UUID is required')
      }

      const { data, error } = await supabase.rpc('get_todays_tasks_for_checkin', {
        p_goal_uuid: goalUuid
      })

      if (error) {
        console.error('Error fetching today\'s tasks:', error)
        throw new Error(`Failed to fetch today's tasks: ${error.message}`)
      }

      return data || []
    },
    enabled: !!goalUuid,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook to check if user can check in now (time window validation)
 */
export function useCanCheckInNow() {
  return useQuery({
    queryKey: checkInKeys.canCheckIn(),
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc('can_check_in_now')

      if (error) {
        console.error('Error checking check-in availability:', error)
        return false
      }

      return data
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: (data) => {
      // More frequent updates during critical times
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      
      // Update every 10 seconds when:
      // - Close to opening (5:55 PM - 6:05 PM)
      // - Close to closing (11:50 PM - 11:59 PM)
      if ((currentHour === 17 && currentMinute >= 55) || 
          (currentHour === 18 && currentMinute <= 5) ||
          (currentHour === 23 && currentMinute >= 50)) {
        return 10 * 1000 // 10 seconds
      }
      
      // Update every 30 seconds during check-in window
      if (data && currentHour >= 18 && currentHour <= 23) {
        return 30 * 1000 // 30 seconds
      }
      
      // Normal update every minute
      return 60 * 1000 // 1 minute
    },
  })
}

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
