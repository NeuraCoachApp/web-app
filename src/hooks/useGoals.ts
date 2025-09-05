import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/src/contexts/AuthContext'
import { supabase } from '@/src/lib/supabase'

// Query keys for React Query
export const goalsKeys = {
  all: ['goals'] as const,
  user: (userId: string) => [...goalsKeys.all, 'user', userId] as const,
}

/**
 * Check if user has goals assigned
 */
async function getUserGoals(userUuid: string): Promise<{ data: any[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('user_goal')
      .select('*')
      .eq('user_uuid', userUuid)
    
    if (error) {
      console.warn('Error fetching user goals:', error)
      return { data: null, error }
    }
    
    return { data, error: null }
  } catch (error) {
    console.warn('Error in getUserGoals:', error)
    return { data: null, error }
  }
}

/**
 * Create a goal entry
 */
async function createGoal(goalText: string): Promise<{ data: any | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('goal')
      .insert({
        goal: goalText
      })
      .select()
      .single()
    
    return { data, error }
  } catch (error) {
    console.warn('Error creating goal:', error)
    return { data: null, error }
  }
}

/**
 * Assign a goal to a user
 */
async function assignGoalToUser(userUuid: string, goalUuid: string): Promise<{ data: any | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('user_goal')
      .insert({
        user_uuid: userUuid,
        goal_uuid: goalUuid
      })
      .select()
      .single()
    
    return { data, error }
  } catch (error) {
    console.warn('Error assigning goal to user:', error)
    return { data: null, error }
  }
}

/**
 * Create a goal and assign it to a user
 */
async function createAndAssignGoal(userUuid: string, goalText: string): Promise<{ data: any | null; error: any }> {
  // First create the goal
  const { data: goal, error: goalError } = await createGoal(goalText)
  
  if (goalError || !goal) {
    return { data: null, error: goalError }
  }
  
  // Then assign it to the user
  const { data: userGoal, error: assignError } = await assignGoalToUser(userUuid, goal.goal_uuid)
  
  return { data: { goal, userGoal }, error: assignError }
}

/**
 * Hook to fetch and cache user goals data
 */
export function useUserGoals(userId?: string) {
  return useQuery({
    queryKey: goalsKeys.user(userId || ''),
    queryFn: async () => {
      if (!userId) return null
      const { data, error } = await getUserGoals(userId)
      if (error) {
        console.warn('Error fetching user goals:', error)
        return null
      }
      return data
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to create and assign a goal to a user with cache invalidation
 */
export function useCreateGoal() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (goalText: string) => {
      if (!user) throw new Error('No user found')
      const { data, error } = await createAndAssignGoal(user.id, goalText)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      if (user) {
        // Invalidate user goals to refetch fresh data
        queryClient.invalidateQueries({ queryKey: goalsKeys.user(user.id) })
        
        // Also invalidate onboarding status since it depends on goals
        queryClient.invalidateQueries({ queryKey: ['onboarding-status', user.id] })
      }
    },
    onError: (error) => {
      console.error('Failed to create goal:', error)
    },
  })
}
