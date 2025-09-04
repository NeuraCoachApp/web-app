-- Clean up any existing triggers and functions that might cause conflicts
-- Run this first if you have any existing profile-related triggers

-- Drop existing triggers
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing functions
DROP FUNCTION IF EXISTS create_profile_for_user();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop existing profiles table if it has the old structure
-- WARNING: This will delete all existing profile data
-- Comment out the next line if you want to keep existing data
-- DROP TABLE IF EXISTS profiles;
