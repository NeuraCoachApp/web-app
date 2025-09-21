-- Email notification functions for Neura Coach - FIXED VERSION
-- This version addresses the "permission denied for table users" error
-- Execute these commands in your Supabase SQL editor

-- First, ensure the http extension is enabled (run as superuser)
CREATE EXTENSION IF NOT EXISTS http;

-- Create a security definer function to access auth.users safely
-- This function runs with the privileges of the function owner (postgres)
CREATE OR REPLACE FUNCTION get_user_email(user_id UUID)
RETURNS TEXT
SECURITY DEFINER
SET search_path = auth, public
LANGUAGE plpgsql
AS $$
DECLARE
    user_email TEXT;
BEGIN
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = user_id;
    
    RETURN user_email;
EXCEPTION
    WHEN OTHERS THEN
        -- Return NULL if any error occurs
        RETURN NULL;
END;
$$;

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION get_user_email(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_email(UUID) TO anon;

-- Create email logs table to track email sending
CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    user_uuid UUID REFERENCES profile(uuid),
    email_type VARCHAR(50) NOT NULL,
    status INTEGER,
    error_message TEXT,
    message_id TEXT, -- Resend message ID
    created_at TIMESTAMP DEFAULT NOW()
);

-- Function to send welcome email when profile is completed with names
CREATE OR REPLACE FUNCTION send_welcome_email()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_email TEXT;
    api_response INTEGER;
    payload JSON;
BEGIN
    -- Only proceed if both first_name and last_name are provided and not empty
    IF NEW.first_name IS NOT NULL AND NEW.first_name != '' AND 
       NEW.last_name IS NOT NULL AND NEW.last_name != '' THEN
        
        -- Check if this is the first time both names are being set
        -- (either INSERT with names, or UPDATE where OLD didn't have both names)
        IF TG_OP = 'INSERT' OR 
           (TG_OP = 'UPDATE' AND (
               OLD.first_name IS NULL OR OLD.first_name = '' OR
               OLD.last_name IS NULL OR OLD.last_name = ''
           )) THEN
        
            -- Check if we haven't already sent a welcome email for this user
            IF NOT EXISTS (
                SELECT 1 FROM email_logs 
                WHERE user_uuid = NEW.uuid AND email_type = 'welcome'
            ) THEN
                
                -- Get email using our helper function
                user_email := get_user_email(NEW.uuid);
                
                -- Only proceed if we found an email
                IF user_email IS NOT NULL THEN
        -- Prepare payload with user data
        payload := json_build_object(
            'email', user_email,
            'firstName', NEW.first_name,
            'lastName', NEW.last_name
        );
        
                    -- Make HTTP request to welcome email API
                    -- Using the documented http_post function
                    SELECT status INTO api_response
                    FROM http_post(
                        'https://app.neura.coach/api/emails/welcome',
                        payload::text,
                        'application/json'
                    );
        
                    -- Log the attempt
                    INSERT INTO email_logs (user_uuid, email_type, status, created_at)
                    VALUES (NEW.uuid, 'welcome', api_response, NOW());
                END IF;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the profile creation
        INSERT INTO email_logs (user_uuid, email_type, status, error_message, created_at)
        VALUES (NEW.uuid, 'welcome', 500, SQLERRM, NOW());
        
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to send notification emails (called by pgcron every minute)
CREATE OR REPLACE FUNCTION send_notification_emails()
RETURNS void 
SECURITY DEFINER
SET search_path = public,extensions
AS $$
DECLARE
    profile_record RECORD;
    user_email TEXT;
    now_time TIME;
    notification_hour INTEGER;
    current_hour INTEGER;
    current_minute INTEGER;
    target_time TIME;
    payload JSON;
    api_response INTEGER;
BEGIN
    -- Get current time (in user's timezone - you may need to adjust this)
    now_time := CURRENT_TIME;
    current_hour := EXTRACT(hour FROM now_time);
    current_minute := EXTRACT(minute FROM now_time);
    
    -- Loop through all profiles where we should send notification
    -- Send email 5 minutes before the notification hour (at XX:55)
    FOR profile_record IN 
        SELECT uuid, first_name, last_name, notification_time
        FROM profile 
        WHERE notification_time IS NOT NULL
    LOOP
        -- Extract the hour from the notification time
        notification_hour := EXTRACT(hour FROM profile_record.notification_time::TIME);
        
        -- Calculate the target time (5 minutes before the notification hour)
        -- If notification is at 21:00, send at 20:55
        -- Handle edge case: if notification is at 00:00, send at 23:55 (previous day)
        IF notification_hour = 0 THEN
            target_time := '23:55:00'::TIME;
        ELSE
            target_time := ((notification_hour - 1) || ':55:00')::TIME;
        END IF;
        
        -- Check if current time matches our target time (within the same minute)
        IF current_hour = EXTRACT(hour FROM target_time) AND 
           current_minute = EXTRACT(minute FROM target_time) THEN
            
            -- Check if we haven't already sent a notification today for this user
            -- to prevent duplicate emails if the function runs multiple times in the same minute
            IF NOT EXISTS (
                SELECT 1 FROM email_logs 
                WHERE user_uuid = profile_record.uuid 
                AND email_type = 'notification'
                AND DATE(created_at) = CURRENT_DATE
            ) THEN
                -- Get email using our helper function
                user_email := get_user_email(profile_record.uuid);
                
                -- Only proceed if we found an email
                IF user_email IS NOT NULL THEN
                    -- Prepare payload with user data
                    payload := json_build_object(
                        'email', user_email,
                        'firstName', profile_record.first_name,
                        'lastName', profile_record.last_name,
                        'sessionTime', 'Today at ' || profile_record.notification_time,
                        'sessionLink', 'https://app.neura.coach/check-in'
                    );
                    
                    -- Make HTTP request to notification email API
                    BEGIN
                        SELECT status INTO api_response
                        FROM http_post(
                            'https://app.neura.coach/api/emails/notification',
                            payload::text,
                            'application/json'
                        );
                        
                        -- Log the attempt
                        INSERT INTO email_logs (user_uuid, email_type, status, created_at)
                        VALUES (profile_record.uuid, 'notification', api_response, NOW());
                        
                    EXCEPTION
                        WHEN OTHERS THEN
                            -- Log the error
                            INSERT INTO email_logs (user_uuid, email_type, status, error_message, created_at)
                            VALUES (profile_record.uuid, 'notification', 500, SQLERRM, NOW());
                    END;
                END IF;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to send welcome email when a new profile is created
DROP TRIGGER IF EXISTS trigger_send_welcome_email ON profile;
CREATE TRIGGER trigger_send_welcome_email
    AFTER INSERT OR UPDATE ON profile
    FOR EACH ROW
    EXECUTE FUNCTION send_welcome_email();

-- Set up pgcron job to run every minute
-- This will be executed once to set up the cron job
SELECT cron.schedule('send-notifications', '* * * * *', 'SELECT send_notification_emails();');

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION send_welcome_email() TO authenticated;
GRANT EXECUTE ON FUNCTION send_notification_emails() TO authenticated;
GRANT ALL ON TABLE email_logs TO authenticated;