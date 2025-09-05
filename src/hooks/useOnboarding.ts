import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/src/contexts/AuthContext'
import { useProfile, Profile } from './useProfile'
import { goalsKeys } from './useGoals'
import { supabase } from '@/src/lib/supabase'

export interface OnboardingStatus {
  needsProfileSetup: boolean
  needsGoalSetup: boolean
  shouldRedirectToOnboarding: boolean
  onboardingStep?: 'profile' | 'goal'
}

// Query keys for React Query
export const onboardingKeys = {
  all: ['onboarding'] as const,
  status: (userId: string) => [...onboardingKeys.all, 'status', userId] as const,
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
 * Check user's onboarding status based on profile and goals
 */
async function checkOnboardingStatus(
  userUuid: string, 
  profile: Profile | null
): Promise<OnboardingStatus> {
  // Check if profile has first_name and last_name
  const hasProfileInfo = profile?.first_name && profile?.last_name
  
  // If no profile info, needs complete onboarding from the start
  if (!hasProfileInfo) {
    return {
      needsProfileSetup: true,
      needsGoalSetup: true,
      shouldRedirectToOnboarding: true,
      onboardingStep: 'profile'
    }
  }
  
  // Check if user has goals
  const { data: userGoals, error } = await getUserGoals(userUuid)
  
  // If error fetching goals or no goals, needs goal setup
  if (error || !userGoals || userGoals.length === 0) {
    return {
      needsProfileSetup: false,
      needsGoalSetup: true,
      shouldRedirectToOnboarding: true,
      onboardingStep: 'goal'
    }
  }
  
  // User has both profile info and goals - no onboarding needed
  return {
    needsProfileSetup: false,
    needsGoalSetup: false,
    shouldRedirectToOnboarding: false
  }
}

/**
 * Hook to fetch and cache onboarding status
 * This depends on both profile and goals data
 */
export function useOnboardingStatus(userId?: string) {
  const { data: profile } = useProfile(userId)

  return useQuery({
    queryKey: onboardingKeys.status(userId || ''),
    queryFn: async (): Promise<OnboardingStatus> => {
      if (!userId) {
        return {
          needsProfileSetup: true,
          needsGoalSetup: true,
          shouldRedirectToOnboarding: true,
          onboardingStep: 'profile'
        }
      }
      
      return await checkOnboardingStatus(userId, profile ?? null)
    },
    enabled: !!userId && profile !== undefined, // Wait for profile to be loaded
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter than profile/goals since it's computed)
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to check if user needs onboarding
 * Returns loading state and redirect decision
 */
export function useOnboardingRedirect() {
  const { user } = useAuth()
  const { data: onboardingStatus, isLoading, error } = useOnboardingStatus(user?.id)

  return {
    shouldRedirect: onboardingStatus?.shouldRedirectToOnboarding ?? false,
    onboardingStep: onboardingStatus?.onboardingStep,
    isLoading,
    error,
    status: onboardingStatus
  }
}
