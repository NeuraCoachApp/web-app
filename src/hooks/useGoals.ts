import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/src/contexts/AuthContext'
import { supabase } from '@/src/lib/supabase'
import { onboardingKeys } from './useOnboarding'
import { goalCreationKeys } from './goalCreation/useGoalCreation'
import { Tables } from '@/src/types/database'
import { Goal, Milestone, Task, Session } from '@/src/classes'

// Query keys for React Query
export const goalsKeys = {
  all: ['goals'] as const,
  user: (userId: string) => [...goalsKeys.all, 'user', userId] as const,
}

// Interface for the batch goal object response
export interface BatchGoalObjectResponse {
  goal: Tables<'goal'>
  milestone: Tables<'milestone'>[]
  session: Tables<'session'>[]
  task: Tables<'task'>[]
}

// Type for the goals cache - maps goal_uuid to Goal instance
export type GoalsCache = Map<string, Goal>

/**
 * Fetch all goals for a user using the new get_batch_goal_object RPC function
 */
async function fetchUserGoals(userId: string): Promise<GoalsCache> {
  try {
    console.log('🎯 [fetchUserGoals] Fetching goals for user:', userId)

    const { data, error } = await supabase.rpc('get_batch_goal_object', {
      p_user_uuid: userId
    })

    if (error) {
      console.error('❌ [fetchUserGoals] RPC error:', error)
      throw error
    }

    if (!data || !Array.isArray(data)) {
      console.log('📭 [fetchUserGoals] No goals found for user')
      return new Map()
    }

    console.log('📊 [fetchUserGoals] Raw RPC response:', { dataLength: data.length })

    const goalsCache = new Map<string, Goal>()

    // Process each goal object from the batch response
    for (const item of data as any[]) {
      // Type guard: check that the object has the required fields
      if (!item || typeof item !== 'object' || !item.goal || !item.milestone || !item.session || !item.task) {
        console.warn('⚠️ [fetchUserGoals] Invalid goal object structure, skipping:', item)
        continue
      }

      const goalObject = item as BatchGoalObjectResponse
      const { goal: goalData, milestone: milestonesData, session: sessionsData, task: tasksData } = goalObject

      if (!goalData || !goalData.uuid) {
        console.warn('⚠️ [fetchUserGoals] Invalid goal data, skipping:', goalData)
        continue
      }

      // Create Goal instance
      const goal = new Goal(goalData)

      // Add milestones
      if (milestonesData && Array.isArray(milestonesData)) {
        milestonesData.forEach(milestoneData => {
          try {
            const milestone = new Milestone(milestoneData)
            goal.addMilestone(milestone)
          } catch (error) {
            console.warn('⚠️ [fetchUserGoals] Error creating milestone:', error, milestoneData)
          }
        })
      }

      // Add tasks
      if (tasksData && Array.isArray(tasksData)) {
        tasksData.forEach(taskData => {
          try {
            const task = new Task(taskData)
            goal.addTask(task)
          } catch (error) {
            console.warn('⚠️ [fetchUserGoals] Error creating task:', error, taskData)
          }
        })
      }

      // Add sessions
      if (sessionsData && Array.isArray(sessionsData)) {
        sessionsData.forEach(sessionData => {
          try {
            const session = new Session(sessionData)
            session.setGoal(goal) // Set bidirectional relationship
            goal.addSession(session)
          } catch (error) {
            console.warn('⚠️ [fetchUserGoals] Error creating session:', error, sessionData)
          }
        })
      }

      // Add to cache
      goalsCache.set(goalData.uuid, goal)

      console.log(`✅ [fetchUserGoals] Processed goal "${goalData.text}" with ${goal.getTotalMilestonesCount()} milestones, ${goal.getTotalTasksCount()} tasks, ${goal.getTotalSessionsCount()} sessions`)
    }

    console.log(`🎉 [fetchUserGoals] Successfully cached ${goalsCache.size} goals for user ${userId}`)
    return goalsCache

  } catch (error) {
    console.error('❌ [fetchUserGoals] Error fetching user goals:', error)
    throw error
  }
}

/**
 * Create a new goal
 */
async function createGoal(
  userId: string, 
  goalText: string, 
  initEndAt?: string
): Promise<Goal> {
  try {
    console.log('🎯 [createGoal] Creating goal:', { userId, goalText, initEndAt })

    const { data, error } = await supabase
      .from('goal')
      .insert({
        text: goalText,
        init_end_at: initEndAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // Default to 90 days from now
        user_uuid: userId
      })
      .select()
      .single()

    if (error || !data) {
      console.error('❌ [createGoal] Error creating goal:', error)
      throw error || new Error('Failed to create goal')
    }

    const goal = new Goal(data)
    console.log('✅ [createGoal] Successfully created goal:', goal.uuid)
    return goal

  } catch (error) {
    console.error('❌ [createGoal] Error in createGoal:', error)
    throw error
  }
}

/**
 * Create a new milestone for a goal
 */
async function createMilestone(
  goalUuid: string,
  milestoneData: {
    text: string
    start_at: string
    end_at: string
  }
): Promise<Milestone> {
  try {
    console.log('🎯 [createMilestone] Creating milestone:', { goalUuid, milestoneData })

    const { data, error } = await supabase
      .from('milestone')
      .insert({
        text: milestoneData.text,
        start_at: milestoneData.start_at,
        end_at: milestoneData.end_at,
        goal_uuid: goalUuid
      })
      .select()
      .single()

    if (error || !data) {
      console.error('❌ [createMilestone] Error creating milestone:', error)
      throw error || new Error('Failed to create milestone')
    }

    const milestone = new Milestone(data)
    console.log('✅ [createMilestone] Successfully created milestone:', milestone.uuid)
    return milestone

  } catch (error) {
    console.error('❌ [createMilestone] Error in createMilestone:', error)
    throw error
  }
}

/**
 * Create a complete goal with all milestones and tasks in one batch operation
 */
async function createCompleteGoal(
  userId: string,
  goalText: string,
  initEndAt: string,
  milestonesAndTasks: {
    text: string
    start_at: string
    end_at: string
    tasks: {
      text: string
      start_at: string
      end_at: string
      isCompleted?: boolean
    }[]
  }[]
): Promise<{ goal_uuid: string }> {
  try {
    console.log('🎯 [createCompleteGoal] Creating complete goal with batch operation:', {
      goalText,
      milestoneCount: milestonesAndTasks.length,
      totalTasks: milestonesAndTasks.reduce((sum, m) => sum + m.tasks.length, 0)
    })

    const { data, error } = await supabase.rpc('create_complete_goal', {
      p_goal_text: goalText,
      p_init_end_at: initEndAt,
      p_milestones_and_tasks: milestonesAndTasks
    })

    if (error || !data) {
      console.error('❌ [createCompleteGoal] Error creating complete goal:', error)
      throw error || new Error('Failed to create complete goal')
    }

    console.log('✅ [createCompleteGoal] Successfully created complete goal:', (data as any).goal_uuid)
    return data as { goal_uuid: string }

  } catch (error) {
    console.error('❌ [createCompleteGoal] Error in createCompleteGoal:', error)
    throw error
  }
}

/**
 * Create a new task for a goal
 */
async function createTask(
  goalUuid: string,
  milestoneUuid: string,
  taskData: {
    text: string
    start_at: string
    end_at: string
  }
): Promise<Task> {
  try {
    console.log('📋 [createTask] Creating task:', { goalUuid, milestoneUuid, taskData })

    const { data, error } = await supabase
      .from('task')
      .insert({
        text: taskData.text,
        start_at: taskData.start_at,
        end_at: taskData.end_at,
        goal_uuid: goalUuid,
        milestone_uuid: milestoneUuid,
        isCompleted: false
      })
      .select()
      .single()

    if (error || !data) {
      console.error('❌ [createTask] Error creating task:', error)
      throw error || new Error('Failed to create task')
    }

    const task = new Task(data)
    console.log('✅ [createTask] Successfully created task:', task.uuid)
    return task

  } catch (error) {
    console.error('❌ [createTask] Error in createTask:', error)
    throw error
  }
}

/**
 * Update task completion status
 */
async function updateTaskCompletion(
  taskUuid: string,
  isCompleted: boolean
): Promise<Task> {
  try {
    console.log('✅ [updateTaskCompletion] Updating task:', { taskUuid, isCompleted })

    const { data, error } = await supabase
      .from('task')
      .update({ isCompleted })
      .eq('uuid', taskUuid)
      .select()
      .single()

    if (error || !data) {
      console.error('❌ [updateTaskCompletion] Error updating task:', error)
      throw error || new Error('Failed to update task completion')
    }

    const task = new Task(data)
    console.log('✅ [updateTaskCompletion] Successfully updated task:', task.uuid)
    return task

  } catch (error) {
    console.error('❌ [updateTaskCompletion] Error in updateTaskCompletion:', error)
    throw error
  }
}

/**
 * Comprehensive hook for managing all goal-related functionality
 * Single source of truth using get_batch_goal_object RPC function
 */
export function useGoals(userId?: string, options?: { enabled?: boolean }) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Main query for fetching goals data
  const goalsQuery = useQuery({
    queryKey: goalsKeys.user(userId || ''),
    queryFn: async (): Promise<GoalsCache> => {
      if (!userId) {
        console.log('🎯 [useGoals] No user ID provided')
        return new Map()
      }
      
      return await fetchUserGoals(userId)
    },
    enabled: !!userId && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Disable refetch on focus during check-in
    refetchOnReconnect: false, // Disable refetch on reconnect during check-in
  })

  // Mutation for creating goals
  const createGoalMutation = useMutation({
    mutationFn: async ({ 
      goalText, 
      initEndAt 
    }: { 
      goalText: string; 
      initEndAt?: string 
    }) => {
      if (!user) throw new Error('No user found')
      return await createGoal(user.id, goalText, initEndAt)
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: goalsKeys.user(user.id) })
        queryClient.invalidateQueries({ queryKey: onboardingKeys.status(user.id) })
        queryClient.invalidateQueries({ queryKey: goalCreationKeys.status(user.id) })
      }
    },
    onError: (error) => {
      console.error('Failed to create goal:', error)
    },
  })

  // Mutation for creating complete goals with all milestones and tasks in one batch
  const createCompleteGoalMutation = useMutation({
    mutationFn: async ({ 
      goalText, 
      initEndAt, 
      milestonesAndTasks 
    }: { 
      goalText: string; 
      initEndAt: string;
      milestonesAndTasks: {
        text: string
        start_at: string
        end_at: string
        tasks: {
          text: string
          start_at: string
          end_at: string
          isCompleted?: boolean
        }[]
      }[]
    }) => {
      if (!user) throw new Error('No user found')
      return await createCompleteGoal(user.id, goalText, initEndAt, milestonesAndTasks)
    },
    onSuccess: () => {
      if (user) {
        // Only invalidate once after the complete goal is created
        queryClient.invalidateQueries({ queryKey: goalsKeys.user(user.id) })
        queryClient.invalidateQueries({ queryKey: onboardingKeys.status(user.id) })
        queryClient.invalidateQueries({ queryKey: goalCreationKeys.status(user.id) })
      }
    },
    onError: (error) => {
      console.error('Failed to create complete goal:', error)
    },
  })

  // Mutation for creating milestones
  const createMilestoneMutation = useMutation({
    mutationFn: async ({ 
      goalUuid,
      milestoneData
    }: { 
      goalUuid: string;
      milestoneData: {
        text: string
        start_at: string
        end_at: string
      }
    }) => {
      return await createMilestone(goalUuid, milestoneData)
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: goalsKeys.user(user.id) })
      }
    },
    onError: (error) => {
      console.error('Failed to create milestone:', error)
    },
  })

  // Mutation for creating tasks
  const createTaskMutation = useMutation({
    mutationFn: async ({ 
      goalUuid,
      milestoneUuid,
      taskData
    }: { 
      goalUuid: string;
      milestoneUuid: string;
      taskData: {
        text: string
        start_at: string
        end_at: string
      }
    }) => {
      return await createTask(goalUuid, milestoneUuid, taskData)
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: goalsKeys.user(user.id) })
      }
    },
    onError: (error) => {
      console.error('Failed to create task:', error)
    },
  })

  // Mutation for updating task completion
  const updateTaskCompletionMutation = useMutation({
    mutationFn: async ({ 
      taskUuid,
      isCompleted
    }: { 
      taskUuid: string;
      isCompleted: boolean
    }) => {
      return await updateTaskCompletion(taskUuid, isCompleted)
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: goalsKeys.user(user.id) })
      }
    },
    onError: (error) => {
      console.error('Failed to update task completion:', error)
    },
  })

  // Derived values
  const goals = goalsQuery.data || new Map()
  const hasGoals = goals.size > 0

  return {
    // Data
    goals, // Map<goal_uuid, Goal> - source of truth from get_batch_goal_object
    hasGoals,
    
    // Query state
    isLoading: goalsQuery.isLoading,
    error: goalsQuery.error,
    refetch: goalsQuery.refetch,
    
    // Mutations
    createGoal: createGoalMutation.mutate,
    createGoalAsync: createGoalMutation.mutateAsync,
    createCompleteGoal: createCompleteGoalMutation.mutate,
    createCompleteGoalAsync: createCompleteGoalMutation.mutateAsync,
    createMilestone: createMilestoneMutation.mutate,
    createMilestoneAsync: createMilestoneMutation.mutateAsync,
    createTask: createTaskMutation.mutate,
    createTaskAsync: createTaskMutation.mutateAsync,
    updateTaskCompletion: updateTaskCompletionMutation.mutate,
    
    // Mutation states
    isCreatingGoal: createGoalMutation.isPending,
    isCreatingMilestone: createMilestoneMutation.isPending,
    isCreatingTask: createTaskMutation.isPending,
    isUpdatingTask: updateTaskCompletionMutation.isPending,
  }
}