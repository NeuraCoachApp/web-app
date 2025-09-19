-- Email notification functions for Neura Coach
-- Simple trigger-based approach using HTTP calls to neura.coach API

-- Function to send welcome email when a new profile is created
CREATE OR REPLACE FUNCTION send_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    api_response INTEGER;
    payload JSON;
BEGIN
    -- Get email from auth.users table
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = NEW.uuid;
    
    -- Only proceed if we found an email
    IF user_email IS NOT NULL THEN
        -- Prepare payload with user data
        payload := json_build_object(
            'email', user_email,
            'firstName', NEW.first_name,
            'lastName', NEW.last_name
        );
        
        -- Make HTTP request to welcome email API
        -- This requires the http extension to be enabled
        SELECT status INTO api_response
        FROM http((
            'POST',
            'https://neura.coach/api/emails/welcome',
            ARRAY[http_header('Content-Type', 'application/json')],
            payload::text
        )::http_request);
        
        -- Log the attempt
        INSERT INTO email_logs (user_uuid, email_type, status, created_at)
        VALUES (NEW.uuid, 'welcome', api_response, NOW());
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

-- Create trigger to send welcome email when a new profile is created
DROP TRIGGER IF EXISTS trigger_send_welcome_email ON profile;
CREATE TRIGGER trigger_send_welcome_email
    AFTER INSERT ON profile
    FOR EACH ROW
    EXECUTE FUNCTION send_welcome_email();

-- Function to send notification emails (called by pgcron every minute)
CREATE OR REPLACE FUNCTION send_notification_emails()
RETURNS void AS $$
DECLARE
    profile_record RECORD;
    user_email TEXT;
    current_minute TIME;
    payload JSON;
    api_response INTEGER;
BEGIN
    -- Get current time (in user's timezone - you may need to adjust this)
    current_minute := CURRENT_TIME;
    
    -- Loop through all profiles where notification_time matches current time
    FOR profile_record IN 
        SELECT uuid, first_name, last_name, notification_time
        FROM profile 
        WHERE notification_time::TIME = current_minute::TIME
    LOOP
        -- Get email from auth.users table
        SELECT email INTO user_email 
        FROM auth.users 
        WHERE id = profile_record.uuid;
        
        -- Only proceed if we found an email
        IF user_email IS NOT NULL THEN
            -- Prepare payload with user data
            payload := json_build_object(
                'email', user_email,
                'firstName', profile_record.first_name,
                'lastName', profile_record.last_name,
                'sessionTime', 'Today at ' || profile_record.notification_time,
                'sessionLink', 'https://neura.coach/check-in'
            );
            
            -- Make HTTP request to notification email API
            BEGIN
                SELECT status INTO api_response
                FROM http((
                    'POST',
                    'https://neura.coach/api/emails/notification',
                    ARRAY[http_header('Content-Type', 'application/json')],
                    payload::text
                )::http_request);
                
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
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Set up pgcron job to run every minute
-- This will be executed once to set up the cron job
SELECT cron.schedule('send-notifications', '* * * * *', 'SELECT send_notification_emails();');
