import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/src/contexts/AuthContext'
import { supabase } from '@/src/lib/supabase'
import { onboardingKeys } from './useOnboarding'
import { goalCreationKeys } from './goalCreation/useGoalCreation'
import { Tables } from '@/src/types/database'
import { Goal } from '@/src/classes/Goal'
import { Session } from '@/src/classes/Session'
import { fetchUserGoalsWithDetails, fetchUserSessions, createSessionWithInsight } from '@/src/lib/queries'
import { getMockGoals, getMockSessions } from '@/src/lib/mock-data'
import { Insight } from '../classes'

type UserGoal = Tables<'user_goal'>

export interface SessionWithGoalAndInsight {
  goal: Tables<'goal'>
  insight: Tables<'insight'>
  created_at: string
}

// Query keys for React Query
export const goalsKeys = {
  all: ['goals'] as const,
  user: (userId: string) => [...goalsKeys.all, 'user', userId] as const,
}

export const sessionsKeys = {
  all: ['sessions'] as const,
  user: (userId: string) => [...sessionsKeys.all, 'user', userId] as const,
}

/**
 * Check if user has goals assigned
 */
async function getUserGoals(userUuid: string): Promise<{ data: UserGoal[] | null; error: any }> {
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
async function createGoal(goalText: string, endAt?: string): Promise<{ data: Goal | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('goal')
      .insert({
        text: goalText,
        end_at: endAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // Default to 90 days from now
      })
      .select()
      .single()
    
    if (error || !data) {
      return { data: null, error }
    }
    
    // Convert to Goal class instance
    const goal = new Goal(data)
    return { data: goal, error: null }
  } catch (error) {
    console.warn('Error creating goal:', error)
    return { data: null, error }
  }
}

/**
 * Assign a goal to a user
 */
async function assignGoalToUser(userUuid: string, goalUuid: string): Promise<{ data: UserGoal | null; error: any }> {
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
async function createAndAssignGoal(userUuid: string, goalText: string, endAt?: string): Promise<{ data: { goal: Goal; userGoal: UserGoal } | null; error: any }> {
  // First create the goal
  const { data: goal, error: goalError } = await createGoal(goalText, endAt)
  
  if (goalError || !goal) {
    return { data: null, error: goalError }
  }
  
  // Then assign it to the user
  const { data: userGoal, error: assignError } = await assignGoalToUser(userUuid, goal.uuid)
  
  if (assignError || !userGoal) {
    return { data: null, error: assignError }
  }
  
  return { data: { goal, userGoal }, error: null }
}

/**
 * Fetch all user sessions with their related goal and insight data
 */
async function getUserSessions(userUuid: string): Promise<{ data: SessionWithGoalAndInsight[] | null; error: any }> {
  try {
    console.log('📊 [getUserSessions] Starting fetch for user:', userUuid)
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('session')
      .select(`
        created_at,
        goal:goal_uuid (
          uuid,
          text,
          created_at,
          end_at
        ),
        insight:insight_uuid (
          uuid,
          summary,
          progress,
          effort_level,
          stress_level,
          created_at
        )
      `)
      .eq('user_uuid', userUuid)
      .order('created_at', { ascending: true })
    
    console.log('📊 [getUserSessions] Sessions query result:', { sessions, sessionsError })
    console.log('📊 [getUserSessions] Raw sessions data:', JSON.stringify(sessions, null, 2))
    
    if (sessionsError) {
      console.warn('❌ Error fetching user sessions:', sessionsError)
      return { data: null, error: sessionsError }
    }

    if (!sessions || sessions.length === 0) {
      console.log('📭 No sessions found for user')
      
      // Debug: Try a simple query to see if sessions exist at all
      const { data: debugSessions, error: debugError } = await supabase
        .from('session')
        .select('*')
        .eq('user_uuid', userUuid)
      
      console.log('🔍 [getUserSessions] Debug simple query:', { debugSessions, debugError })
      
      return { data: [], error: null }
    }

    // Filter and structure the data
    const structuredSessions: SessionWithGoalAndInsight[] = sessions
      .filter(session => session.goal && session.insight)
      .map(session => ({
        goal: session.goal as Goal,
        insight: session.insight as Insight,
        created_at: session.created_at
      }))
    
    console.log(`✅ [getUserSessions] Successfully processed ${structuredSessions.length} sessions`)
    return { data: structuredSessions, error: null }
  } catch (error) {
    console.warn('❌ Error in getUserSessions:', error)
    return { data: null, error }
  }
}

/**
 * Hook to fetch and cache user goals data using Goal classes
 */
export function useUserGoals(userId?: string) {
  return useQuery({
    queryKey: goalsKeys.user(userId || ''),
    queryFn: async (): Promise<Goal[]> => {
      if (!userId) {
        console.log('🎯 [useUserGoals] No user ID provided')
        return []
      }
      
      // First check for mock data
      const mockGoals = getMockGoals(userId)
      if (mockGoals.length > 0) {
        console.log('🎭 [useUserGoals] Using mock goals:', { userId, goalCount: mockGoals.length })
        return mockGoals
      }
      
      console.log('🎯 [useUserGoals] Fetching real goals for user:', userId)
      const goals = await fetchUserGoalsWithDetails(userId)
      
      console.log('✅ [useUserGoals] Successfully fetched goals:', { userId, goalCount: goals.length })
      return goals
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to fetch user's sessions using Session classes
 */
export function useSessions(userId?: string) {
  return useQuery({
    queryKey: sessionsKeys.user(userId || ''),
    queryFn: async (): Promise<Session[]> => {
      if (!userId) {
        console.log('📊 [useSessions] No user ID provided')
        return []
      }
      
      // First check for mock data
      const mockSessions = getMockSessions(userId)
      if (mockSessions.length > 0) {
        console.log('🎭 [useSessions] Using mock sessions:', { userId, sessionCount: mockSessions.length })
        // Convert mock sessions to Session class instances if needed
        return mockSessions.map(mockSession => {
          const session = new Session({
            uuid: `mock-${Date.now()}-${Math.random()}`,
            created_at: mockSession.created_at,
            goal_uuid: mockSession.goal.uuid,
            insight_uuid: mockSession.insight.uuid,
            user_uuid: userId
          })
          // Set relations would need to be implemented based on mock data structure
          return session
        })
      }
      
      console.log('📊 [useSessions] Fetching real sessions for user:', userId)
      const sessions = await fetchUserSessions(userId)
      
      console.log('✅ [useSessions] Successfully fetched sessions:', { userId, sessionCount: sessions.length })
      return sessions
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
    mutationFn: async ({ goalText, endAt }: { goalText: string; endAt?: string }) => {
      if (!user) throw new Error('No user found')
      const { data, error } = await createAndAssignGoal(user.id, goalText, endAt)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      if (user) {
        // Invalidate user goals to refetch fresh data
        queryClient.invalidateQueries({ queryKey: goalsKeys.user(user.id) })
        
        // Invalidate sessions data
        queryClient.invalidateQueries({ queryKey: sessionsKeys.user(user.id) })
        
        // Also invalidate onboarding status since it depends on goals
        queryClient.invalidateQueries({ queryKey: onboardingKeys.status(user.id) })
        
        // Invalidate goal creation status since user now has goals
        queryClient.invalidateQueries({ queryKey: goalCreationKeys.status(user.id) })
      }
    },
    onError: (error) => {
      console.error('Failed to create goal:', error)
    },
  })
}
