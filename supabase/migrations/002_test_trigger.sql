-- Test script to verify the trigger is working
-- This is optional - you can run this after setting up the trigger

-- Check if the trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check if the function exists
SELECT 
    routine_name, 
    routine_type, 
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Check current profiles (should show all existing profiles)
SELECT 
    user_uuid, 
    first_name, 
    last_name, 
    created_at
FROM profiles
ORDER BY created_at DESC;

-- You can manually test the trigger by creating a test user (be careful!)
-- This is commented out for safety
/*
-- Test user creation (uncomment to test, but be careful!)
-- INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'test@example.com');
-- Then check if a profile was created automatically
*/
