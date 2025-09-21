-- RPC Functions for NeuraCoach Data Fetching
-- These functions should be executed in your Supabase SQL editor

-- Row Level Security Policies
-- Enable RLS on all relevant tables
ALTER TABLE goal ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone ENABLE ROW LEVEL SECURITY;
ALTER TABLE task ENABLE ROW LEVEL SECURITY;
ALTER TABLE session ENABLE ROW LEVEL SECURITY;

-- Note: All RPC functions use SECURITY INVOKER (not SECURITY DEFINER) 
-- so they respect RLS policies and run with the caller's permissions

-- Create policy that only allows users to access their own goals
CREATE POLICY "Users can only access their own goals" ON goal
    FOR ALL USING (user_uuid = auth.uid());

-- Create policy that only allows users to access milestones for their goals
CREATE POLICY "Users can only access their own milestones" ON milestone
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM goal g 
            WHERE g.uuid = milestone.goal_uuid 
            AND g.user_uuid = auth.uid()
        )
    );

-- Create policy that only allows users to access tasks for their goals
CREATE POLICY "Users can only access their own tasks" ON task
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM goal g 
            WHERE g.uuid = task.goal_uuid 
            AND g.user_uuid = auth.uid()
        )
    );

-- Create policy that only allows users to access their own sessions
CREATE POLICY "Users can only access their own sessions" ON session
    FOR ALL USING (user_uuid = auth.uid());
-- =============================================================================
-- NEW DATABASE STRUCTURE QUERIES
-- =============================================================================

-- Helper function to get a single goal record
CREATE OR REPLACE FUNCTION get_goal(p_goal_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT JSON_BUILD_OBJECT(
        'uuid', g.uuid,
        'text', g.text,
        'created_at', g.created_at,
        'init_end_at', g.init_end_at,
        'user_uuid', g.user_uuid
    ) INTO result
    FROM goal g
    WHERE g.uuid = p_goal_uuid;
    
    RETURN result;
END;
$$;

-- Helper function to get all milestones for a goal
CREATE OR REPLACE FUNCTION get_batch_milestones(p_goal_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT JSON_AGG(
        JSON_BUILD_OBJECT(
            'uuid', m.uuid,
            'text', m.text,
            'start_at', m.start_at,
            'end_at', m.end_at,
            'goal_uuid', m.goal_uuid
        ) ORDER BY m.start_at ASC
    ) INTO result
    FROM milestone m
    WHERE m.goal_uuid = p_goal_uuid;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Helper function to get all sessions for a goal
CREATE OR REPLACE FUNCTION get_batch_sessions(p_goal_uuid UUID)
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
            'user_uuid', s.user_uuid,
            'summary', s.summary,
            'mood', s.mood,
            'motivation', s.motivation,
            'blocker', s.blocker,
            'completion', (
                SELECT JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'task_uuid', (completion_item).task_uuid,
                        'iscompleted', (completion_item).iscompleted
                    )
                )
                FROM UNNEST(s.completion) AS completion_item
            )
        ) ORDER BY s.created_at DESC
    ) INTO result
    FROM session s
    WHERE s.goal_uuid = p_goal_uuid;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Helper function to get all tasks for a goal
CREATE OR REPLACE FUNCTION get_batch_tasks(p_goal_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT JSON_AGG(
        JSON_BUILD_OBJECT(
            'uuid', t.uuid,
            'text', t.text,
            'created_at', t.created_at,
            'start_at', t.start_at,
            'end_at', t.end_at,
            'isCompleted', t."isCompleted",
            'goal_uuid', t.goal_uuid,
            'milestone_uuid', t.milestone_uuid
        ) ORDER BY t.start_at ASC
    ) INTO result
    FROM task t
    WHERE t.goal_uuid = p_goal_uuid;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Main function to get batch goal objects for a user
CREATE OR REPLACE FUNCTION get_batch_goal_object(p_user_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    result JSON;
    goal_record RECORD;
    goal_obj JSON;
    milestones_data JSON;
    sessions_data JSON;
    tasks_data JSON;
    goal_objects JSON[] := '{}';
BEGIN
    -- Verify the requesting user matches the authenticated user
    IF p_user_uuid != auth.uid() THEN
        RETURN '[]'::json;
    END IF;
    
    -- Loop through each goal for the user
    FOR goal_record IN 
        SELECT uuid FROM goal 
        WHERE user_uuid = p_user_uuid 
        ORDER BY created_at DESC
    LOOP
        -- Get the goal data
        SELECT get_goal(goal_record.uuid) INTO goal_obj;
        
        -- Get related data for this goal
        SELECT get_batch_milestones(goal_record.uuid) INTO milestones_data;
        SELECT get_batch_sessions(goal_record.uuid) INTO sessions_data;
        SELECT get_batch_tasks(goal_record.uuid) INTO tasks_data;
        
        -- Build the complete goal object
        goal_objects := goal_objects || JSON_BUILD_OBJECT(
            'goal', goal_obj,
            'milestone', milestones_data,
            'session', sessions_data,
            'task', tasks_data
        );
    END LOOP;
    
    -- Convert array to JSON array
    SELECT JSON_AGG(unnest) INTO result FROM unnest(goal_objects);
    
    RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Grant execute permissions for new functions
GRANT EXECUTE ON FUNCTION get_goal(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_batch_milestones(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_batch_sessions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_batch_tasks(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_batch_goal_object(UUID) TO authenticated;
