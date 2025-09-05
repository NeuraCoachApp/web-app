import { supabase } from './supabase'
import { Tables, TablesUpdate } from '@/src/types/database'

// Use the generated database types
export type Profile = Tables<'profile'>
export type ProfileUpdate = Pick<TablesUpdate<'profile'>, 'first_name' | 'last_name'>

/**
 * Create a new profile for a user
 */
export async function createProfile(userUuid: string): Promise<{ data: Profile | null; error: any }> {
  // TODO: Remove 'as any' after running SQL migration (sql/setup_profile_system.sql)
  const { data, error } = await supabase.rpc('create_profile' as any, {
    p_user_uuid: userUuid
  })

  // RPC returns an array, we want the first item or null
  return { data: data && data.length > 0 ? data[0] : null, error }
}

/**
 * Get a user's profile
 */
export async function getProfile(userUuid: string): Promise<{ data: Profile | null; error: any }> {
  const { data, error } = await supabase.rpc('get_profile', {
    p_user_uuid: userUuid
  })

  // RPC now returns a single record, not an array
  return { data: data || null, error }
}

/**
 * Update a user's profile
 */
export async function updateProfile(userUuid: string, updates: ProfileUpdate): Promise<{ data: Profile | null; error: any }> {
  // TODO: Remove 'as any' after running SQL migration (sql/setup_profile_system.sql)
  const { data, error } = await supabase.rpc('update_profile' as any, {
    p_user_uuid: userUuid,
    p_first_name: updates.first_name,
    p_last_name: updates.last_name
  })

  // RPC returns an array, we want the first item or null
  return { data: data && data.length > 0 ? data[0] : null, error }
}

/**
 * Get or create a profile for a user
 */
export async function getOrCreateProfile(userUuid: string): Promise<{ data: Profile | null; error: any }> {
  const { data, error } = await supabase.rpc('get_or_create_profile', {
    p_user_uuid: userUuid
  })

  // RPC returns an array, we want the first item or null
  return { data: data && data.length > 0 ? data[0] : null, error }
}
