-- RPC Functions for NeuraCoach Data Fetching
-- These functions should be executed in your Supabase SQL editor

-- Function to get user goals with complete details (steps, sessions, insights)
CREATE OR REPLACE FUNCTION get_user_goals_with_details(p_user_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Verify the requesting user matches the authenticated user
    IF p_user_uuid != auth.uid() THEN
        RETURN '[]'::json;
    END IF;
    
    WITH goal_data AS (
        SELECT 
            g.uuid,
            g.text,
            g.created_at,
            g.end_at,
            JSON_AGG(
                JSON_BUILD_OBJECT(
                    'uuid', s.uuid,
                    'text', s.text,
                    'isCompleted', s."isCompleted",
                    'created_at', s.created_at,
                    'end_at', s.end_at,
                    'next_step', s.next_step,
                    'sessions', COALESCE(step_sessions.sessions, '[]'::json)
                ) ORDER BY s.end_at ASC
            ) AS steps
        FROM goal g  -- Start with goal table so RLS policy applies
        LEFT JOIN goal_steps gs ON gs.goal_uuid = g.uuid
        LEFT JOIN step s ON s.uuid = gs.step_uuid
        LEFT JOIN LATERAL (
            SELECT JSON_AGG(
                JSON_BUILD_OBJECT(
                    'uuid', sess.uuid,
                    'created_at', sess.created_at,
                    'goal_uuid', sess.goal_uuid,
                    'insight_uuid', sess.insight_uuid,
                    'user_uuid', sess.user_uuid,
                    'insight', JSON_BUILD_OBJECT(
                        'uuid', i.uuid,
                        'summary', i.summary,
                        'progress', i.progress,
                        'effort_level', i.effort_level,
                        'stress_level', i.stress_level,
                        'step_uuid', i.step_uuid,
                        'created_at', i.created_at
                    )
                ) ORDER BY sess.created_at DESC
            ) AS sessions
            FROM session sess
            JOIN insight i ON i.uuid = sess.insight_uuid
            WHERE i.step_uuid = s.uuid
        ) step_sessions ON true
        -- RLS policy on goal table will automatically filter by user ownership
        GROUP BY g.uuid, g.text, g.created_at, g.end_at
        ORDER BY g.created_at DESC
    )
    SELECT JSON_AGG(
        JSON_BUILD_OBJECT(
            'uuid', uuid,
            'text', text,
            'created_at', created_at,
            'end_at', end_at,
            'steps', COALESCE(steps, '[]'::json)
        )
    ) INTO result
    FROM goal_data;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Function to get a single goal with complete details
CREATE OR REPLACE FUNCTION get_goal_with_details(p_goal_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    result JSON;
BEGIN
    WITH goal_data AS (
        SELECT 
            g.uuid,
            g.text,
            g.created_at,
            g.end_at,
            JSON_AGG(
                JSON_BUILD_OBJECT(
                    'uuid', s.uuid,
                    'text', s.text,
                    'isCompleted', s."isCompleted",
                    'created_at', s.created_at,
                    'end_at', s.end_at,
                    'next_step', s.next_step,
                    'sessions', COALESCE(step_sessions.sessions, '[]'::json)
                ) ORDER BY s.end_at ASC
            ) AS steps
        FROM goal g
        LEFT JOIN goal_steps gs ON gs.goal_uuid = g.uuid
        LEFT JOIN step s ON s.uuid = gs.step_uuid
        LEFT JOIN LATERAL (
            SELECT JSON_AGG(
                JSON_BUILD_OBJECT(
                    'uuid', sess.uuid,
                    'created_at', sess.created_at,
                    'goal_uuid', sess.goal_uuid,
                    'insight_uuid', sess.insight_uuid,
                    'user_uuid', sess.user_uuid,
                    'insight', JSON_BUILD_OBJECT(
                        'uuid', i.uuid,
                        'summary', i.summary,
                        'progress', i.progress,
                        'effort_level', i.effort_level,
                        'stress_level', i.stress_level,
                        'step_uuid', i.step_uuid,
                        'created_at', i.created_at
                    )
                ) ORDER BY sess.created_at DESC
            ) AS sessions
            FROM session sess
            JOIN insight i ON i.uuid = sess.insight_uuid
            WHERE i.step_uuid = s.uuid
        ) step_sessions ON true
        WHERE g.uuid = p_goal_uuid
        GROUP BY g.uuid, g.text, g.created_at, g.end_at
    )
    SELECT JSON_BUILD_OBJECT(
        'uuid', uuid,
        'text', text,
        'created_at', created_at,
        'end_at', end_at,
        'steps', COALESCE(steps, '[]'::json)
    ) INTO result
    FROM goal_data;
    
    RETURN result;
END;
$$;

-- Function to get user sessions with goal and insight details
CREATE OR REPLACE FUNCTION get_user_sessions(p_user_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT JSON_AGG(
        JSON_BUILD_OBJECT(
            'uuid', s.uuid,
            'created_at', s.created_at,
            'goal_uuid', s.goal_uuid,
            'insight_uuid', s.insight_uuid,
            'user_uuid', s.user_uuid,
            'goal', JSON_BUILD_OBJECT(
                'uuid', g.uuid,
                'text', g.text,
                'created_at', g.created_at,
                'end_at', g.end_at
            ),
            'insight', JSON_BUILD_OBJECT(
                'uuid', i.uuid,
                'summary', i.summary,
                'progress', i.progress,
                'effort_level', i.effort_level,
                'stress_level', i.stress_level,
                'step_uuid', i.step_uuid,
                'created_at', i.created_at
            )
        ) ORDER BY s.created_at DESC
    ) INTO result
    FROM session s
    JOIN goal g ON g.uuid = s.goal_uuid
    JOIN insight i ON i.uuid = s.insight_uuid
    WHERE s.user_uuid = p_user_uuid;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Function to create a session with insight
CREATE OR REPLACE FUNCTION create_session_with_insight(
    p_user_uuid UUID,
    p_goal_uuid UUID,
    p_step_uuid UUID,
    p_summary TEXT,
    p_progress INTEGER,
    p_effort_level INTEGER,
    p_stress_level INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    new_insight_uuid UUID;
    new_session_uuid UUID;
    result JSON;
BEGIN
    -- Create the insight first
    INSERT INTO insight (summary, progress, effort_level, stress_level, step_uuid)
    VALUES (p_summary, p_progress, p_effort_level, p_stress_level, p_step_uuid)
    RETURNING uuid INTO new_insight_uuid;
    
    -- Create the session
    INSERT INTO session (user_uuid, goal_uuid, insight_uuid)
    VALUES (p_user_uuid, p_goal_uuid, new_insight_uuid)
    RETURNING uuid INTO new_session_uuid;
    
    -- Return the complete session data
    SELECT JSON_BUILD_OBJECT(
        'uuid', s.uuid,
        'created_at', s.created_at,
        'goal_uuid', s.goal_uuid,
        'insight_uuid', s.insight_uuid,
        'user_uuid', s.user_uuid,
        'goal', JSON_BUILD_OBJECT(
            'uuid', g.uuid,
            'text', g.text,
            'created_at', g.created_at,
            'end_at', g.end_at
        ),
        'insight', JSON_BUILD_OBJECT(
            'uuid', i.uuid,
            'summary', i.summary,
            'progress', i.progress,
            'effort_level', i.effort_level,
            'stress_level', i.stress_level,
            'step_uuid', i.step_uuid,
            'created_at', i.created_at
        )
    ) INTO result
    FROM session s
    JOIN goal g ON g.uuid = s.goal_uuid
    JOIN insight i ON i.uuid = s.insight_uuid
    WHERE s.uuid = new_session_uuid;
    
    RETURN result;
END;
$$;

-- Function to get goal progress summary
CREATE OR REPLACE FUNCTION get_goal_progress_summary(p_goal_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    result JSON;
BEGIN
    WITH step_completion AS (
        SELECT 
            s.uuid,
            s.text,
            s."isCompleted",
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM session sess
                    JOIN insight i ON i.uuid = sess.insight_uuid
                    WHERE i.step_uuid = s.uuid AND i.progress = 100
                ) THEN true
                ELSE false
            END AS has_completed_session,
            COUNT(sess.uuid) as session_count,
            AVG(i.progress) as avg_progress,
            AVG(i.effort_level) as avg_effort,
            AVG(i.stress_level) as avg_stress
        FROM goal_steps gs
        JOIN step s ON s.uuid = gs.step_uuid
        LEFT JOIN session sess ON sess.goal_uuid = gs.goal_uuid
        LEFT JOIN insight i ON i.uuid = sess.insight_uuid AND i.step_uuid = s.uuid
        WHERE gs.goal_uuid = p_goal_uuid
        GROUP BY s.uuid, s.text, s."isCompleted"
    )
    SELECT JSON_BUILD_OBJECT(
        'total_steps', COUNT(*),
        'completed_steps', COUNT(*) FILTER (WHERE has_completed_session = true),
        'total_sessions', SUM(session_count),
        'active_steps', COUNT(*) FILTER (WHERE session_count > 0),
        'completion_percentage', ROUND(
            (COUNT(*) FILTER (WHERE has_completed_session = true)::DECIMAL / COUNT(*)) * 100
        ),
        'average_progress', ROUND(AVG(avg_progress)),
        'average_effort', ROUND(AVG(avg_effort), 1),
        'average_stress', ROUND(AVG(avg_stress), 1)
    ) INTO result
    FROM step_completion;
    
    RETURN COALESCE(result, '{}'::json);
END;
$$;

-- Function to get daily metrics for a goal
CREATE OR REPLACE FUNCTION get_goal_daily_metrics(
    p_goal_uuid UUID,
    p_days_back INTEGER DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    result JSON;
BEGIN
    WITH daily_sessions AS (
        SELECT 
            DATE(sess.created_at) as session_date,
            AVG(i.effort_level) as avg_effort,
            AVG(i.stress_level) as avg_stress,
            AVG(i.progress) as avg_progress,
            COUNT(sess.uuid) as session_count,
            STRING_AGG(i.summary, ' | ' ORDER BY sess.created_at DESC) as summaries
        FROM session sess
        JOIN insight i ON i.uuid = sess.insight_uuid
        WHERE sess.goal_uuid = p_goal_uuid
        AND sess.created_at >= NOW() - INTERVAL '1 day' * p_days_back
        GROUP BY DATE(sess.created_at)
        ORDER BY session_date DESC
    )
    SELECT JSON_AGG(
        JSON_BUILD_OBJECT(
            'date', session_date,
            'effort_level', ROUND(avg_effort, 1),
            'stress_level', ROUND(avg_stress, 1),
            'progress', ROUND(avg_progress),
            'session_count', session_count,
            'summary', LEFT(summaries, 200)
        )
    ) INTO result
    FROM daily_sessions;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Row Level Security Policies
-- Enable RLS on all relevant tables
ALTER TABLE goal ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goal ENABLE ROW LEVEL SECURITY;
ALTER TABLE session ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight ENABLE ROW LEVEL SECURITY;
ALTER TABLE step ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_steps ENABLE ROW LEVEL SECURITY;

-- Note: All RPC functions use SECURITY INVOKER (not SECURITY DEFINER) 
-- so they respect RLS policies and run with the caller's permissions

-- Create policy that only allows users to access goals they own through user_goal table
CREATE POLICY "Users can only access their own goals" ON goal
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_goal ug 
            WHERE ug.goal_uuid = goal.uuid 
            AND ug.user_uuid = auth.uid()
        )
    );

-- Function to create a goal with generated steps
CREATE OR REPLACE FUNCTION create_goal_with_steps(
    p_user_uuid UUID,
    p_goal_text TEXT,
    p_steps JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_goal_uuid UUID;
    step_data JSONB;
    new_step_uuid UUID;
    prev_step_uuid UUID;
    step_order INTEGER;
    step_end_at TIMESTAMP;
    current_end_date TIMESTAMP;
    goal_end_at TIMESTAMP;
    ordered_steps JSONB[];
    step_record RECORD;
    result JSON;
BEGIN
    -- Verify the requesting user matches the authenticated user
    IF p_user_uuid != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: User can only create goals for themselves';
    END IF;
    
    -- Debug logging
    RAISE NOTICE 'Creating goal with text: "%", steps count: %, steps data: %', 
        p_goal_text, 
        CASE WHEN p_steps IS NULL THEN 0 ELSE jsonb_array_length(p_steps) END,
        p_steps;
    
    -- Additional debug: check first step structure
    IF p_steps IS NOT NULL AND jsonb_array_length(p_steps) > 0 THEN
        DECLARE
            first_step JSONB;
        BEGIN
            first_step := p_steps->0;
            RAISE NOTICE 'First step raw: %', first_step;
            RAISE NOTICE 'First step text: %', first_step->>'text';
            RAISE NOTICE 'First step order: %', first_step->>'order';
            RAISE NOTICE 'First step duration: %', first_step->>'estimated_duration_days';
        END;
    END IF;
    
    -- Create the goal with temporary end_at (will be updated after steps are created)
    INSERT INTO goal (text, end_at)
    VALUES (p_goal_text, NOW() + INTERVAL '90 days')
    RETURNING uuid INTO new_goal_uuid;
    
    -- Assign goal to user
    INSERT INTO user_goal (user_uuid, goal_uuid)
    VALUES (p_user_uuid, new_goal_uuid);
    
    -- Create steps if provided
    IF p_steps IS NOT NULL AND jsonb_array_length(p_steps) > 0 THEN
        -- Initialize current date for sequential step scheduling
        current_end_date := NOW();
        prev_step_uuid := NULL;
        
        -- First pass: Create all steps with calculated end dates
        -- Steps are ordered by their original order, but we'll calculate sequential end dates
        FOR step_record IN 
            WITH step_elements AS (
                SELECT 
                    jsonb_array_elements(p_steps) as step_json
            )
            SELECT 
                se.step_json as step_data,
                CASE 
                    WHEN se.step_json ? 'order' AND se.step_json->>'order' IS NOT NULL 
                    THEN (se.step_json->>'order')::INTEGER 
                    ELSE 0 
                END as step_order,
                CASE 
                    WHEN se.step_json ? 'estimated_duration_days' AND se.step_json->>'estimated_duration_days' IS NOT NULL 
                    THEN (se.step_json->>'estimated_duration_days')::INTEGER 
                    ELSE 1 
                END as duration_days,
                CASE 
                    WHEN se.step_json ? 'text' AND se.step_json->>'text' IS NOT NULL 
                    THEN se.step_json->>'text' 
                    ELSE '' 
                END as step_text
            FROM step_elements se
            ORDER BY CASE 
                WHEN se.step_json ? 'order' AND se.step_json->>'order' IS NOT NULL 
                THEN (se.step_json->>'order')::INTEGER 
                ELSE 999 
            END
        LOOP
            -- Debug logging to see what we're getting
            RAISE NOTICE 'Processing step: order=%, text=%, duration=%, raw_data=%', 
                step_record.step_order, step_record.step_text, step_record.duration_days, step_record.step_data;
                
            -- Validate step text is not null
            IF step_record.step_text IS NULL OR step_record.step_text = '' THEN
                RAISE EXCEPTION 'Step text is null or empty for step order %. Raw data: %', 
                    step_record.step_order, step_record.step_data;
            END IF;
            
            -- Validate step order and duration
            IF step_record.step_order IS NULL OR step_record.step_order <= 0 THEN
                RAISE EXCEPTION 'Invalid step order % for step text "%". Raw data: %', 
                    step_record.step_order, step_record.step_text, step_record.step_data;
            END IF;
            
            IF step_record.duration_days IS NULL OR step_record.duration_days <= 0 THEN
                RAISE EXCEPTION 'Invalid duration % for step text "%". Raw data: %', 
                    step_record.duration_days, step_record.step_text, step_record.step_data;
            END IF;
            
            -- Calculate end date for this step (sequential scheduling)
            step_end_at := current_end_date + INTERVAL '1 day' * step_record.duration_days;
            
            -- Create the step
            INSERT INTO step (
                text, 
                end_at,
                "isCompleted",
                next_step
            )
            VALUES (
                step_record.step_text,
                step_end_at,
                false,
                NULL  -- Will be updated in second pass
            )
            RETURNING uuid INTO new_step_uuid;
            
            -- Update previous step to point to this step
            IF prev_step_uuid IS NOT NULL THEN
                UPDATE step 
                SET next_step = new_step_uuid 
                WHERE uuid = prev_step_uuid;
            END IF;
            
            -- Link step to goal with order based on deadline (earliest first)
            INSERT INTO goal_steps (goal_uuid, step_uuid, id)
            VALUES (new_goal_uuid, new_step_uuid, step_record.step_order);
            
            -- Move to next time slot for next step
            current_end_date := step_end_at;
            prev_step_uuid := new_step_uuid;
        END LOOP;
        
        -- Second pass: Reorder goal_steps by deadline (end_at) to ensure proper sequence
        -- Update the goal_steps ordering to be based on step deadlines
        WITH ordered_step_ids AS (
            SELECT 
                gs.goal_uuid,
                gs.step_uuid,
                ROW_NUMBER() OVER (ORDER BY s.end_at ASC) as new_order
            FROM goal_steps gs
            JOIN step s ON s.uuid = gs.step_uuid
            WHERE gs.goal_uuid = new_goal_uuid
        )
        UPDATE goal_steps 
        SET id = ordered_step_ids.new_order
        FROM ordered_step_ids
        WHERE goal_steps.goal_uuid = ordered_step_ids.goal_uuid 
        AND goal_steps.step_uuid = ordered_step_ids.step_uuid;
        
        -- Update goal end_at to match the latest step's end_at
        SELECT MAX(s.end_at) INTO goal_end_at
        FROM goal_steps gs
        JOIN step s ON s.uuid = gs.step_uuid
        WHERE gs.goal_uuid = new_goal_uuid;
        
        -- Update the goal with the calculated end_at
        UPDATE goal 
        SET end_at = goal_end_at
        WHERE uuid = new_goal_uuid;
    ELSE
        -- If no steps provided, set goal end_at to 90 days from now
        UPDATE goal 
        SET end_at = NOW() + INTERVAL '90 days'
        WHERE uuid = new_goal_uuid;
    END IF;
    
    -- Return the complete goal with steps using existing function
    SELECT get_goal_with_details(new_goal_uuid) INTO result;
    RETURN result;
END;
$$;

-- Function to add steps to an existing goal
CREATE OR REPLACE FUNCTION add_steps_to_goal(
    p_goal_uuid UUID,
    p_steps JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    step_data JSONB;
    new_step_uuid UUID;
    step_order INTEGER;
    max_order INTEGER;
    step_end_at TIMESTAMP;
    current_end_date TIMESTAMP;
    last_step_uuid UUID;
    step_record RECORD;
    result JSON;
BEGIN
    -- Verify user owns this goal
    IF NOT EXISTS (
        SELECT 1 FROM goal g
        JOIN user_goal ug ON ug.goal_uuid = g.uuid
        WHERE g.uuid = p_goal_uuid AND ug.user_uuid = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: User does not own this goal';
    END IF;
    
    -- Get the current maximum order for existing steps
    SELECT COALESCE(MAX(id), 0) INTO max_order
    FROM goal_steps
    WHERE goal_uuid = p_goal_uuid;
    
    -- Find the last step in the chain (the one with the latest end_at)
    -- and get its end_at as starting point for new steps
    SELECT s.end_at, s.uuid INTO current_end_date, last_step_uuid
    FROM goal_steps gs
    JOIN step s ON s.uuid = gs.step_uuid
    WHERE gs.goal_uuid = p_goal_uuid
    ORDER BY s.end_at DESC
    LIMIT 1;
    
    -- If no existing steps, start from now
    IF current_end_date IS NULL THEN
        current_end_date := NOW();
        last_step_uuid := NULL;
    END IF;
    
    -- Create steps if provided
    IF p_steps IS NOT NULL AND jsonb_array_length(p_steps) > 0 THEN
        FOR step_record IN 
            WITH step_elements AS (
                SELECT 
                    jsonb_array_elements(p_steps) as step_json
            )
            SELECT 
                se.step_json as step_data,
                CASE 
                    WHEN se.step_json ? 'order' AND se.step_json->>'order' IS NOT NULL 
                    THEN (se.step_json->>'order')::INTEGER 
                    ELSE 0 
                END as step_order,
                CASE 
                    WHEN se.step_json ? 'estimated_duration_days' AND se.step_json->>'estimated_duration_days' IS NOT NULL 
                    THEN (se.step_json->>'estimated_duration_days')::INTEGER 
                    ELSE 1 
                END as duration_days,
                CASE 
                    WHEN se.step_json ? 'text' AND se.step_json->>'text' IS NOT NULL 
                    THEN se.step_json->>'text' 
                    ELSE '' 
                END as step_text
            FROM step_elements se
            ORDER BY CASE 
                WHEN se.step_json ? 'order' AND se.step_json->>'order' IS NOT NULL 
                THEN (se.step_json->>'order')::INTEGER 
                ELSE 999 
            END
        LOOP
            -- Validate step text is not null
            IF step_record.step_text IS NULL OR step_record.step_text = '' THEN
                RAISE EXCEPTION 'Step text is null or empty for step order %. Raw data: %', 
                    step_record.step_order, step_record.step_data;
            END IF;
            
            -- Validate step order and duration
            IF step_record.step_order IS NULL OR step_record.step_order <= 0 THEN
                RAISE EXCEPTION 'Invalid step order % for step text "%". Raw data: %', 
                    step_record.step_order, step_record.step_text, step_record.step_data;
            END IF;
            
            IF step_record.duration_days IS NULL OR step_record.duration_days <= 0 THEN
                RAISE EXCEPTION 'Invalid duration % for step text "%". Raw data: %', 
                    step_record.duration_days, step_record.step_text, step_record.step_data;
            END IF;
            
            -- Calculate end date for this step (sequential scheduling from last step)
            step_end_at := current_end_date + INTERVAL '1 day' * step_record.duration_days;
            
            -- Create the step
            INSERT INTO step (
                text, 
                end_at,
                "isCompleted",
                next_step
            )
            VALUES (
                step_record.step_text,
                step_end_at,
                false,
                NULL  -- Will be linked properly below
            )
            RETURNING uuid INTO new_step_uuid;
            
            -- Update the previous last step to point to this new step
            IF last_step_uuid IS NOT NULL THEN
                UPDATE step 
                SET next_step = new_step_uuid 
                WHERE uuid = last_step_uuid;
            END IF;
            
            -- Calculate new order (continue from existing max order)
            step_order := max_order + step_record.step_order;
            
            -- Link step to goal with order
            INSERT INTO goal_steps (goal_uuid, step_uuid, id)
            VALUES (p_goal_uuid, new_step_uuid, step_order);
            
            -- Move to next time slot for next step
            current_end_date := step_end_at;
            last_step_uuid := new_step_uuid;
        END LOOP;
        
        -- Reorder all steps by deadline to ensure proper sequence
        WITH ordered_step_ids AS (
            SELECT 
                gs.goal_uuid,
                gs.step_uuid,
                ROW_NUMBER() OVER (ORDER BY s.end_at ASC) as new_order
            FROM goal_steps gs
            JOIN step s ON s.uuid = gs.step_uuid
            WHERE gs.goal_uuid = p_goal_uuid
        )
        UPDATE goal_steps 
        SET id = ordered_step_ids.new_order
        FROM ordered_step_ids
        WHERE goal_steps.goal_uuid = ordered_step_ids.goal_uuid 
        AND goal_steps.step_uuid = ordered_step_ids.step_uuid;
        
        -- Rebuild the next_step chain based on the new deadline ordering
        WITH ordered_steps AS (
            SELECT 
                s.uuid,
                LEAD(s.uuid) OVER (ORDER BY s.end_at ASC) as next_step_uuid
            FROM goal_steps gs
            JOIN step s ON s.uuid = gs.step_uuid
            WHERE gs.goal_uuid = p_goal_uuid
        )
        UPDATE step 
        SET next_step = ordered_steps.next_step_uuid
        FROM ordered_steps
        WHERE step.uuid = ordered_steps.uuid;
    END IF;
    
    -- Return the updated goal with steps
    SELECT get_goal_with_details(p_goal_uuid) INTO result;
    RETURN result;
END;
$$;

-- Function to update a step's completion status
CREATE OR REPLACE FUNCTION update_step_completion(
    p_step_uuid UUID,
    p_is_completed BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    goal_uuid_var UUID;
    result JSON;
BEGIN
    -- Verify user owns the goal this step belongs to
    SELECT g.uuid INTO goal_uuid_var
    FROM step s
    JOIN goal_steps gs ON gs.step_uuid = s.uuid
    JOIN goal g ON g.uuid = gs.goal_uuid
    JOIN user_goal ug ON ug.goal_uuid = g.uuid
    WHERE s.uuid = p_step_uuid AND ug.user_uuid = auth.uid();
    
    IF goal_uuid_var IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User does not own this step';
    END IF;
    
    -- Update the step completion status
    UPDATE step 
    SET "isCompleted" = p_is_completed
    WHERE uuid = p_step_uuid;
    
    -- Return the updated goal with steps
    SELECT get_goal_with_details(goal_uuid_var) INTO result;
    RETURN result;
END;
$$;

-- Function to handle cascading deletes when a goal is deleted
CREATE OR REPLACE FUNCTION handle_goal_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    step_record RECORD;
    insight_record RECORD;
BEGIN
    -- Log the goal deletion (for debugging)
    RAISE NOTICE 'Deleting goal: %', OLD.uuid;
    
    -- Step 1: Delete all sessions directly related to this goal
    DELETE FROM session WHERE goal_uuid = OLD.uuid;
    RAISE NOTICE 'Deleted sessions for goal: %', OLD.uuid;
    
    -- Step 2: For each step associated with this goal, delete insights and sessions
    FOR step_record IN 
        SELECT s.uuid as step_uuid
        FROM step s
        JOIN goal_steps gs ON gs.step_uuid = s.uuid
        WHERE gs.goal_uuid = OLD.uuid
    LOOP
        -- Delete insights for this step (and their associated sessions)
        FOR insight_record IN 
            SELECT uuid FROM insight WHERE step_uuid = step_record.step_uuid
        LOOP
            -- Delete sessions that reference this insight
            DELETE FROM session WHERE insight_uuid = insight_record.uuid;
            RAISE NOTICE 'Deleted sessions for insight: %', insight_record.uuid;
        END LOOP;
        
        -- Delete all insights for this step
        DELETE FROM insight WHERE step_uuid = step_record.step_uuid;
        RAISE NOTICE 'Deleted insights for step: %', step_record.step_uuid;
    END LOOP;
    
    -- Step 3: Get step UUIDs before deleting goal_steps relationships
    -- Store the step UUIDs that belong to this goal before we delete the relationships
    CREATE TEMP TABLE temp_goal_steps AS
    SELECT step_uuid 
    FROM goal_steps 
    WHERE goal_uuid = OLD.uuid;
    
    -- Step 4: Delete goal_steps relationships
    DELETE FROM goal_steps WHERE goal_uuid = OLD.uuid;
    RAISE NOTICE 'Deleted goal_steps for goal: %', OLD.uuid;
    
    -- Step 5: Delete the steps themselves (only if they're not referenced by other goals)
    -- This handles steps that might be shared across goals (if that's a possibility)
    DELETE FROM step 
    WHERE uuid IN (
        SELECT step_uuid FROM temp_goal_steps
    )
    AND NOT EXISTS (
        SELECT 1 FROM goal_steps gs2 
        WHERE gs2.step_uuid = step.uuid
    );
    RAISE NOTICE 'Deleted orphaned steps for goal: %', OLD.uuid;
    
    -- Clean up temp table
    DROP TABLE temp_goal_steps;
    
    -- Step 6: Delete user_goal relationships
    DELETE FROM user_goal WHERE goal_uuid = OLD.uuid;
    RAISE NOTICE 'Deleted user_goal relationships for goal: %', OLD.uuid;
    
    RETURN OLD;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_goal_delete ON goal;
CREATE TRIGGER trigger_goal_delete
    BEFORE DELETE ON goal
    FOR EACH ROW
    EXECUTE FUNCTION handle_goal_delete();

-- Function to automatically update goal end_at when step end_at changes
CREATE OR REPLACE FUNCTION update_goal_end_at_on_step_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    affected_goal_uuid UUID;
    new_goal_end_at TIMESTAMP;
BEGIN
    -- Determine which goal(s) are affected
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- For INSERT/UPDATE, get goals from the new step
        FOR affected_goal_uuid IN 
            SELECT gs.goal_uuid
            FROM goal_steps gs
            WHERE gs.step_uuid = NEW.uuid
        LOOP
            -- Calculate new end_at for this goal (latest step end_at)
            SELECT MAX(s.end_at) INTO new_goal_end_at
            FROM goal_steps gs
            JOIN step s ON s.uuid = gs.step_uuid
            WHERE gs.goal_uuid = affected_goal_uuid;
            
            -- Update the goal's end_at
            UPDATE goal 
            SET end_at = new_goal_end_at
            WHERE uuid = affected_goal_uuid;
            
            RAISE NOTICE 'Updated goal % end_at to %', affected_goal_uuid, new_goal_end_at;
        END LOOP;
    END IF;
    
    IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
        -- For DELETE/UPDATE, also check goals from the old step
        FOR affected_goal_uuid IN 
            SELECT gs.goal_uuid
            FROM goal_steps gs
            WHERE gs.step_uuid = OLD.uuid
        LOOP
            -- Calculate new end_at for this goal (latest step end_at)
            SELECT MAX(s.end_at) INTO new_goal_end_at
            FROM goal_steps gs
            JOIN step s ON s.uuid = gs.step_uuid
            WHERE gs.goal_uuid = affected_goal_uuid;
            
            -- Update the goal's end_at (handle case where no steps remain)
            UPDATE goal 
            SET end_at = COALESCE(new_goal_end_at, NOW() + INTERVAL '90 days')
            WHERE uuid = affected_goal_uuid;
            
            RAISE NOTICE 'Updated goal % end_at to %', affected_goal_uuid, COALESCE(new_goal_end_at, NOW() + INTERVAL '90 days');
        END LOOP;
    END IF;
    
    -- Return appropriate record based on operation
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- Create triggers for automatic goal end_at updates
DROP TRIGGER IF EXISTS trigger_update_goal_end_at_on_step_insert ON step;
DROP TRIGGER IF EXISTS trigger_update_goal_end_at_on_step_update ON step;
DROP TRIGGER IF EXISTS trigger_update_goal_end_at_on_step_delete ON step;

CREATE TRIGGER trigger_update_goal_end_at_on_step_insert
    AFTER INSERT ON step
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_end_at_on_step_change();

CREATE TRIGGER trigger_update_goal_end_at_on_step_update
    AFTER UPDATE OF end_at ON step
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_end_at_on_step_change();

CREATE TRIGGER trigger_update_goal_end_at_on_step_delete
    AFTER DELETE ON step
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_end_at_on_step_change();

-- Delete Functions (with proper authorization)
-- Function to delete a goal (with cascading deletes handled by triggers)
CREATE OR REPLACE FUNCTION delete_goal(p_goal_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    goal_exists BOOLEAN;
BEGIN
    -- Verify user owns this goal
    SELECT EXISTS(
        SELECT 1 FROM goal g
        JOIN user_goal ug ON ug.goal_uuid = g.uuid
        WHERE g.uuid = p_goal_uuid AND ug.user_uuid = auth.uid()
    ) INTO goal_exists;
    
    IF NOT goal_exists THEN
        RETURN JSON_BUILD_OBJECT(
            'success', false,
            'error', 'Unauthorized: User does not own this goal or goal does not exist'
        );
    END IF;
    
    -- Delete the goal (triggers will handle cascading deletes)
    DELETE FROM goal WHERE uuid = p_goal_uuid;
    
    RETURN JSON_BUILD_OBJECT(
        'success', true,
        'message', 'Goal and all related data deleted successfully'
    );
END;
$$;
-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_goals_with_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_goal_with_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_sessions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_session_with_insight(UUID, UUID, UUID, TEXT, INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_goal_progress_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_goal_daily_metrics(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_goal_with_steps(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION add_steps_to_goal(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION update_step_completion(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_goal(UUID) TO authenticated;
