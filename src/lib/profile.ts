import { supabase } from './supabase'

export interface Profile {
  user_uuid: string
  first_name: string | null
  last_name: string | null
  created_at: string
  updated_at: string
}

export interface ProfileUpdate {
  first_name?: string | null
  last_name?: string | null
}

/**
 * Create a new profile for a user
 */
export async function createProfile(userUuid: string): Promise<{ data: Profile | null; error: any }> {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      user_uuid: userUuid,
      first_name: null,
      last_name: null
    })
    .select()
    .single()

  return { data, error }
}

/**
 * Get a user's profile
 */
export async function getProfile(userUuid: string): Promise<{ data: Profile | null; error: any }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_uuid', userUuid)
    .single()

  return { data, error }
}

/**
 * Update a user's profile
 */
export async function updateProfile(userUuid: string, updates: ProfileUpdate): Promise<{ data: Profile | null; error: any }> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('user_uuid', userUuid)
    .select()
    .single()

  return { data, error }
}

/**
 * Get or create a profile for a user
 */
export async function getOrCreateProfile(userUuid: string): Promise<{ data: Profile | null; error: any }> {
  try {
    // First try to get existing profile
    const { data: existingProfile, error: getError } = await getProfile(userUuid)
    
    if (existingProfile) {
      return { data: existingProfile, error: null }
    }
    
    // If the table doesn't exist, return null profile
    if (getError && (getError.message?.includes('relation "profiles" does not exist') || getError.code === '42P01')) {
      console.warn('Profiles table does not exist. Please run the database migration.')
      return { data: null, error: { message: 'Profiles table not set up', code: 'TABLE_MISSING' } }
    }
    
    // If profile doesn't exist and error is not "no rows", return the error
    if (getError && !getError.message?.includes('No rows')) {
      return { data: null, error: getError }
    }
    
    // Create new profile
    return await createProfile(userUuid)
  } catch (error) {
    console.warn('Profile operation failed:', error)
    return { data: null, error }
  }
}
