import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/src/contexts/AuthContext'
import { supabase } from '@/src/lib/supabase'
import { onboardingKeys } from './useOnboarding'
import { Tables, TablesUpdate } from '@/src/types/database'

// Use the generated database types
export type Profile = Tables<'profile'>
export type ProfileUpdate = {
  first_name?: string | null
  last_name?: string | null
}

// Query keys for React Query
export const profileKeys = {
  all: ['profile'] as const,
  user: (userId: string) => [...profileKeys.all, userId] as const,
}

/**
 * Get or create a profile for a user
 */
async function getOrCreateProfile(userUuid: string): Promise<{ data: Profile | null; error: any }> {
  // Use get_profile RPC which returns full profile data
  const { data, error } = await supabase.rpc('get_profile', {
    p_user_uuid: userUuid
  })

  // RPC returns a single object or null
  return { data, error }
}

/**
 * Update a user's profile
 */
async function updateProfile(userUuid: string, updates: ProfileUpdate): Promise<{ data: Profile | null; error: any }> {
  // First update using the RPC function
  const { error: updateError } = await supabase.rpc('update_profile', {
    p_user_uuid: userUuid,
    p_first_name: updates.first_name || undefined,
    p_last_name: updates.last_name || undefined
  })

  if (updateError) return { data: null, error: updateError }

  // Then fetch the full profile data
  return getOrCreateProfile(userUuid)
}

/**
 * Hook to fetch and cache user profile data
 */
export function useProfile(userId?: string) {
  return useQuery({
    queryKey: profileKeys.user(userId || ''),
    queryFn: async () => {
      if (!userId) return null
      const { data, error } = await getOrCreateProfile(userId)
      if (error) {
        console.warn('Profile loading failed:', error)
        return null
      }
      return data
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  }) ?? null
}

/**
 * Hook to update user profile with cache invalidation
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (updates: ProfileUpdate) => {
      if (!user) throw new Error('No user found')
      const { data, error } = await updateProfile(user.id, updates)
      if (error) throw error
      return data
    },
    onSuccess: (data, variables) => {
      if (user) {
        // Update the cache with the new profile data
        queryClient.setQueryData(profileKeys.user(user.id), data)
        
        // Also invalidate to ensure fresh data on next fetch
        queryClient.invalidateQueries({ queryKey: profileKeys.user(user.id) })
        
        // Note: We don't invalidate onboarding status here during onboarding flow
        // This will be handled manually at the end of onboarding to prevent premature redirects
      }
    },
    onError: (error) => {
      console.error('Failed to update profile:', error)
    },
  })
}
