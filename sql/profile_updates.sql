-- Profile Updates for NeuraCoach
-- These functions should be executed in your Supabase SQL editor

-- Add notification_time column to profile table
ALTER TABLE profile ADD COLUMN IF NOT EXISTS notification_time TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_DATE + TIME '09:00:00');

-- Update the update_profile function to handle notification_time
CREATE OR REPLACE FUNCTION update_profile(
  p_user_uuid UUID,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_notification_time TEXT DEFAULT NULL
)
RETURNS TABLE(
  uuid UUID,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  updated_profile RECORD;
  parsed_notification_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Parse notification_time safely
  IF p_notification_time IS NOT NULL THEN
    BEGIN
      parsed_notification_time := p_notification_time::TIMESTAMP WITH TIME ZONE;
    EXCEPTION WHEN others THEN
      -- If parsing fails, try to parse as time only and use current date
      BEGIN
        parsed_notification_time := CURRENT_DATE + p_notification_time::TIME;
      EXCEPTION WHEN others THEN
        -- If all parsing fails, use the existing notification_time
        parsed_notification_time := NULL;
      END;
    END;
  END IF;

  UPDATE profile
  SET 
    first_name = COALESCE(p_first_name, profile.first_name),
    last_name = COALESCE(p_last_name, profile.last_name),
    notification_time = COALESCE(parsed_notification_time, profile.notification_time),
    updated_at = NOW()
  WHERE profile.uuid = p_user_uuid
  RETURNING * INTO updated_profile;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for uuid: %', p_user_uuid;
  END IF;
  
  RETURN QUERY
  SELECT updated_profile.uuid, updated_profile.first_name, updated_profile.last_name,
         updated_profile.created_at, updated_profile.updated_at;
END;
$$;

-- Update get_profile function to return notification_time
CREATE OR REPLACE FUNCTION get_profile(p_user_uuid UUID)
RETURNS TABLE(
  uuid UUID,
  first_name TEXT,
  last_name TEXT,
  coach_link TEXT,
  daily_streak INTEGER,
  last_check_in_date DATE,
  notification_time TIMESTAMP WITH TIME ZONE,
  subscription_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  profile_exists BOOLEAN;
BEGIN
  -- Check if profile exists first
  SELECT EXISTS(SELECT 1 FROM profile WHERE profile.uuid = p_user_uuid) INTO profile_exists;
  
  IF NOT profile_exists THEN
    RAISE EXCEPTION 'Profile not found for uuid: %', p_user_uuid;
  END IF;
  
  RETURN QUERY
  SELECT 
    p.uuid,
    p.first_name,
    p.last_name,
    p.coach_link,
    p.daily_streak,
    p.last_check_in_date,
    p.notification_time,
    p.subscription_status,
    p.created_at,
    p.updated_at
  FROM profile p
  WHERE p.uuid = p_user_uuid;
END;
$$;

-- Create profile function should also handle notification_time
CREATE OR REPLACE FUNCTION create_profile(p_user_uuid UUID)
RETURNS TABLE(
  uuid UUID,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  existing_profile RECORD;
  profile_exists BOOLEAN;
BEGIN
  -- Check if profile already exists
  SELECT EXISTS(SELECT 1 FROM profile WHERE profile.uuid = p_user_uuid) INTO profile_exists;
  
  IF profile_exists THEN
    -- Profile already exists, return existing profile data
    RETURN QUERY
    SELECT 
      p.uuid AS uuid,
      p.first_name AS first_name,
      p.last_name AS last_name,
      p.created_at AS created_at,
      p.updated_at AS updated_at
    FROM profile p
    WHERE p.uuid = p_user_uuid;
    RETURN;
  END IF;

  -- Create new profile with all required fields and return the result directly
  RETURN QUERY
  WITH inserted_profile AS (
    INSERT INTO profile (
      uuid, 
      first_name, 
      last_name, 
      coach_link, 
      daily_streak, 
      last_check_in_date, 
      notification_time, 
      subscription_status, 
      created_at, 
      updated_at
    )
    VALUES (
      p_user_uuid, 
      NULL, -- first_name
      NULL, -- last_name
      '', -- coach_link (empty string as default)
      0, -- daily_streak
      NULL, -- last_check_in_date
      (CURRENT_DATE + TIME '09:00:00'), -- notification_time
      NULL, -- subscription_status
      NOW(), -- created_at
      NOW() -- updated_at
    )
    RETURNING profile.uuid, profile.first_name, profile.last_name, profile.created_at, profile.updated_at
  )
  SELECT 
    inserted_profile.uuid,
    inserted_profile.first_name,
    inserted_profile.last_name,
    inserted_profile.created_at,
    inserted_profile.updated_at
  FROM inserted_profile;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_profile(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_profile(UUID) TO authenticated;
