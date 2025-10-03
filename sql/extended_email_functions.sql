-- Extended Email Functions for Neura Coach
-- Additional email functions for signup confirmation and payment reminders
-- Execute these commands in your Supabase SQL editor

-- Function to send payment reminder emails for users who haven't paid
-- This function will be called by a cron job every hour
CREATE OR REPLACE FUNCTION send_payment_reminder_emails()
RETURNS void 
SECURITY DEFINER
SET search_path = public,extensions
AS $$
DECLARE
    user_record RECORD;
    user_email TEXT;
    days_since_signup INTEGER;
    payload JSON;
    api_response INTEGER;
BEGIN
    -- Find users who:
    -- 1. Created account 7+ days ago (using profile.created_at)
    -- 2. Don't have an active subscription (subscription_status = '0' or NULL)
    -- 3. Haven't received a payment reminder email yet
    -- 4. Have completed onboarding (have first_name and last_name)
    FOR user_record IN 
        SELECT 
            p.uuid, 
            p.first_name, 
            p.last_name, 
            p.created_at,
            p.subscription_status,
            EXTRACT(DAYS FROM (NOW() - p.created_at))::INTEGER as days_since_signup
        FROM profile p
        WHERE 
            -- User created account at least 7 days ago
            p.created_at <= NOW() - INTERVAL '7 days'
            -- User doesn't have an active subscription (0 = no subscription, NULL = not set)
            AND (p.subscription_status = '0' OR p.subscription_status IS NULL)
            -- User has completed onboarding (has names)
            AND p.first_name IS NOT NULL AND p.first_name != ''
            AND p.last_name IS NOT NULL AND p.last_name != ''
            -- We haven't sent a payment reminder email to this user yet
            AND NOT EXISTS (
                SELECT 1 FROM email_logs 
                WHERE user_uuid = p.uuid AND email_type = 'payment_reminder'
            )
    LOOP
        -- Get email using our helper function
        user_email := get_user_email(user_record.uuid);
        
        -- Only proceed if we found an email
        IF user_email IS NOT NULL THEN
            -- Prepare payload with user data
            payload := json_build_object(
                'email', user_email,
                'firstName', user_record.first_name,
                'lastName', user_record.last_name,
                'daysSinceSignup', user_record.days_since_signup
            );
            
            -- Make HTTP request to payment reminder email API
            -- Using the documented http_post function
            BEGIN
                SELECT status INTO api_response
                FROM http_post(
                    'https://app.neura.coach/api/emails/payment-reminder',
                    payload::text,
                    'application/json'
                );
                
                -- Log the attempt
                INSERT INTO email_logs (user_uuid, email_type, status, created_at)
                VALUES (user_record.uuid, 'payment_reminder', api_response, NOW());
                
                -- Log success
                RAISE NOTICE 'Payment reminder email sent to user %, email: %, days since signup: %', 
                    user_record.uuid, user_email, user_record.days_since_signup;
                
            EXCEPTION
                WHEN OTHERS THEN
                    -- Log the error
                    INSERT INTO email_logs (user_uuid, email_type, status, error_message, created_at)
                    VALUES (user_record.uuid, 'payment_reminder', 500, SQLERRM, NOW());
                    
                    RAISE NOTICE 'Failed to send payment reminder email to user %: %', 
                        user_record.uuid, SQLERRM;
            END;
        END IF;
    END LOOP;
    
    -- Log completion
    RAISE NOTICE 'Payment reminder email job completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to send signup confirmation email when a user account is created
-- This is a backup trigger - the primary signup email sending happens in the application
CREATE OR REPLACE FUNCTION send_signup_email_backup()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_email TEXT;
    api_response INTEGER;
    payload JSON;
BEGIN
    -- Only send for new user insertions as a backup
    -- This trigger only fires if the application didn't send the email
    IF TG_OP = 'INSERT' THEN
        -- Wait 5 minutes to see if the application sent the email
        -- This prevents duplicate emails
        IF NOT EXISTS (
            SELECT 1 FROM email_logs 
            WHERE user_uuid = NEW.uuid 
            AND email_type = 'signup'
            AND created_at >= NOW() - INTERVAL '5 minutes'
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
                
                -- Make HTTP request to signup email API
                -- Using the documented http_post function
                BEGIN
                    SELECT status INTO api_response
                    FROM http_post(
                        'https://app.neura.coach/api/emails/signup',
                        payload::text,
                        'application/json'
                    );
                    
                    -- Log the attempt
                    INSERT INTO email_logs (user_uuid, email_type, status, created_at)
                    VALUES (NEW.uuid, 'signup', api_response, NOW());
                    
                EXCEPTION
                    WHEN OTHERS THEN
                        -- Log the error but don't fail the profile creation
                        INSERT INTO email_logs (user_uuid, email_type, status, error_message, created_at)
                        VALUES (NEW.uuid, 'signup', 500, SQLERRM, NOW());
                END;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the profile creation
        INSERT INTO email_logs (user_uuid, email_type, status, error_message, created_at)
        VALUES (NEW.uuid, 'signup', 500, SQLERRM, NOW());
        
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create backup trigger to send signup email when a new profile is created
-- Note: This is a backup trigger - the primary signup email sending happens in the application
-- This trigger waits 5 minutes to avoid duplicates
DROP TRIGGER IF EXISTS trigger_send_signup_email_backup ON profile;
CREATE TRIGGER trigger_send_signup_email_backup
    AFTER INSERT ON profile
    FOR EACH ROW
    EXECUTE FUNCTION send_signup_email_backup();

-- Set up pgcron job to run payment reminder emails every hour
-- This will check for users who need payment reminders and send them once
SELECT cron.schedule(
    'send-payment-reminders', 
    '0 * * * *',  -- Run every hour at the top of the hour
    'SELECT send_payment_reminder_emails();'
);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION send_payment_reminder_emails() TO authenticated;
GRANT EXECUTE ON FUNCTION send_signup_email_backup() TO authenticated;

-- Add indexes for better performance on email log queries
CREATE INDEX IF NOT EXISTS idx_email_logs_user_type ON email_logs(user_uuid, email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_profile_subscription_status ON profile(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profile_created_at ON profile(created_at);
