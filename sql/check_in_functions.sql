-- Check-In System RPC Functions for NeuraCoach
-- These functions should be executed in your Supabase SQL editor

-- First, add daily_streak column to profile table
ALTER TABLE profile ADD COLUMN IF NOT EXISTS daily_streak INTEGER DEFAULT 0;
ALTER TABLE profile ADD COLUMN IF NOT EXISTS last_check_in_date DATE;

-- Function to calculate task completion percentage for today
CREATE OR REPLACE FUNCTION calculate_daily_progress(p_goal_uuid UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    total_tasks INTEGER := 0;
    completed_tasks INTEGER := 0;
    progress_percentage NUMERIC := 0;
    tasks_data JSON;
    current_timestamp TIMESTAMP := NOW();
BEGIN
    -- Get today's tasks for the goal using same logic as get_todays_tasks_for_checkin
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE t."isCompleted" = true) as completed,
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'uuid', t.uuid,
                'text', t.text,
                'isCompleted', t."isCompleted",
                'start_at', t.start_at,
                'end_at', t.end_at
            )
        ) as tasks
    INTO total_tasks, completed_tasks, tasks_data
    FROM task t
    WHERE t.goal_uuid = p_goal_uuid
    AND (
        -- Task is currently active (within timestamp range)
        (current_timestamp >= t.start_at::timestamp AND current_timestamp <= t.end_at::timestamp)
        OR 
        -- Task is overdue (past end date and not completed)
        (current_timestamp > t.end_at::timestamp AND t."isCompleted" = false)
    );
    
    -- Calculate progress percentage
    IF total_tasks > 0 THEN
        progress_percentage := (completed_tasks::NUMERIC / total_tasks::NUMERIC) * 100;
    END IF;
    
    RETURN JSON_BUILD_OBJECT(
        'date', p_date,
        'total_tasks', COALESCE(total_tasks, 0),
        'completed_tasks', COALESCE(completed_tasks, 0),
        'progress_percentage', ROUND(progress_percentage, 1),
        'tasks', COALESCE(tasks_data, '[]'::json)
    );
END;
$$;

-- Function to create a check-in session
CREATE OR REPLACE FUNCTION create_check_in_session(
    p_goal_uuid UUID,
    p_summary TEXT,
    p_mood INTEGER,
    p_motivation INTEGER,
    p_blocker TEXT DEFAULT '',
    p_task_completions JSON DEFAULT '[]'::json
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    session_uuid UUID;
    user_id UUID;
    completion_array task_completion[];
    completion_item JSON;
    streak_updated BOOLEAN := FALSE;
BEGIN
    -- Get the authenticated user ID
    user_id := auth.uid();
    
    -- Verify the goal belongs to the user
    IF NOT EXISTS (
        SELECT 1 FROM goal g 
        WHERE g.uuid = p_goal_uuid 
        AND g.user_uuid = user_id
    ) THEN
        RAISE EXCEPTION 'Goal not found or access denied';
    END IF;
    
    -- Convert JSON task completions to array of composite types
    FOR completion_item IN SELECT * FROM JSON_ARRAY_ELEMENTS(p_task_completions)
    LOOP
        completion_array := completion_array || ROW(
            (completion_item->>'task_uuid')::UUID,
            (completion_item->>'isCompleted')::BOOLEAN
        )::task_completion;
    END LOOP;
    
    -- Generate UUID for the session
    session_uuid := gen_random_uuid();
    
    -- Insert the session
    INSERT INTO session (
        uuid,
        user_uuid,
        goal_uuid,
        summary,
        mood,
        motivation,
        blocker,
        completion,
        created_at
    ) VALUES (
        session_uuid,
        user_id,
        p_goal_uuid,
        p_summary,
        p_mood,
        p_motivation,
        p_blocker,
        completion_array,
        NOW()
    );
    
    -- Update daily streak
    SELECT update_daily_streak(user_id) INTO streak_updated;
    
    RETURN JSON_BUILD_OBJECT(
        'uuid', session_uuid,
        'created_at', NOW(),
        'streak_updated', streak_updated
    );
END;
$$;

-- Function to update daily streak
CREATE OR REPLACE FUNCTION update_daily_streak(p_user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    current_streak INTEGER := 0;
    last_check_in DATE;
    today DATE := CURRENT_DATE;
    streak_continued BOOLEAN := FALSE;
BEGIN
    -- Get current streak and last check-in date
    SELECT daily_streak, last_check_in_date
    INTO current_streak, last_check_in
    FROM profile
    WHERE uuid = p_user_uuid;
    
    -- If no previous check-in or first time
    IF last_check_in IS NULL THEN
        current_streak := 1;
        streak_continued := TRUE;
    -- If last check-in was yesterday, continue streak
    ELSIF last_check_in = today - INTERVAL '1 day' THEN
        current_streak := current_streak + 1;
        streak_continued := TRUE;
    -- If last check-in was today, don't change streak
    ELSIF last_check_in = today THEN
        streak_continued := FALSE;
    -- If last check-in was more than 1 day ago, reset streak
    ELSE
        current_streak := 1;
        streak_continued := TRUE;
    END IF;
    
    -- Update the profile with new streak and check-in date
    UPDATE profile
    SET 
        daily_streak = current_streak,
        last_check_in_date = today
    WHERE uuid = p_user_uuid;
    
    RETURN streak_continued;
END;
$$;

-- Function to get user's current streak
CREATE OR REPLACE FUNCTION get_user_streak(p_user_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT JSON_BUILD_OBJECT(
        'daily_streak', COALESCE(p.daily_streak, 0),
        'last_check_in_date', p.last_check_in_date,
        'can_check_in_today', (
            p.last_check_in_date IS NULL OR 
            p.last_check_in_date < CURRENT_DATE
        )
    ) INTO result
    FROM profile p
    WHERE p.uuid = p_user_uuid;
    
    RETURN COALESCE(result, JSON_BUILD_OBJECT(
        'daily_streak', 0,
        'last_check_in_date', null,
        'can_check_in_today', true
    ));
END;
$$;

-- Function to check if user can check in (within allowed time window)
CREATE OR REPLACE FUNCTION can_check_in_now()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    current_hour INTEGER;
BEGIN
    -- Get current hour in user's timezone (assuming UTC for now, can be enhanced)
    current_hour := EXTRACT(HOUR FROM NOW());
    
    -- Allow check-in between 6 PM (18:00) and 11:59 PM (23:59)
    -- This can be customized based on requirements
    RETURN current_hour >= 18 OR current_hour <= 23;
END;
$$;

-- Function to get today's tasks with completion status
CREATE OR REPLACE FUNCTION get_todays_tasks_for_checkin(p_goal_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    result JSON;
    now TIMESTAMP := NOW();
BEGIN
    SELECT JSON_AGG(
        JSON_BUILD_OBJECT(
            'uuid', t.uuid,
            'text', t.text,
            'isCompleted', t."isCompleted",
            'start_at', t.start_at,
            'end_at', t.end_at,
            'milestone_uuid', t.milestone_uuid,
            'milestone_text', m.text
        ) ORDER BY t.start_at ASC
    ) INTO result
    FROM task t
    JOIN milestone m ON m.uuid = t.milestone_uuid
    WHERE t.goal_uuid = p_goal_uuid
    AND (
        -- Task is currently active (within timestamp range)
        (now >= t.start_at::timestamp AND now <= t.end_at::timestamp)
        OR 
        -- Task is overdue (past end date and not completed)
        (now > t.end_at::timestamp AND t."isCompleted" = false)
    );
    
    RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Function to update task completion status
CREATE OR REPLACE FUNCTION update_task_completion(
    p_task_uuid UUID,
    p_is_completed BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    -- Verify the task belongs to the user's goal
    IF NOT EXISTS (
        SELECT 1 FROM task t
        JOIN goal g ON g.uuid = t.goal_uuid
        WHERE t.uuid = p_task_uuid 
        AND g.user_uuid = auth.uid()
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Update the task
    UPDATE task 
    SET "isCompleted" = p_is_completed
    WHERE uuid = p_task_uuid;
    
    RETURN TRUE;
END;
$$;

-- Grant execute permissions for new functions
GRANT EXECUTE ON FUNCTION calculate_daily_progress(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION create_check_in_session(UUID, TEXT, INTEGER, INTEGER, TEXT, JSON) TO authenticated;
GRANT EXECUTE ON FUNCTION update_daily_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_check_in_now() TO authenticated;
GRANT EXECUTE ON FUNCTION get_todays_tasks_for_checkin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_task_completion(UUID, BOOLEAN) TO authenticated;
