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
BEGIN
  UPDATE profile
  SET 
    first_name = COALESCE(p_first_name, profile.first_name),
    last_name = COALESCE(p_last_name, profile.last_name),
    notification_time = COALESCE(p_notification_time::TIMESTAMP WITH TIME ZONE, profile.notification_time),
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
BEGIN
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
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for uuid: %', p_user_uuid;
  END IF;
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
  new_profile RECORD;
BEGIN
  INSERT INTO profile (uuid, notification_time, created_at, updated_at)
  VALUES (p_user_uuid, (CURRENT_DATE + TIME '09:00:00'), NOW(), NOW())
  RETURNING * INTO new_profile;
  
  RETURN QUERY
  SELECT new_profile.uuid, new_profile.first_name, new_profile.last_name,
         new_profile.created_at, new_profile.updated_at;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_profile(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_profile(UUID) TO authenticated;
