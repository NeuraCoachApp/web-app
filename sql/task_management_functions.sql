-- Task Management RPC Functions for NeuraCoach
-- These functions should be executed in your Supabase SQL editor

-- Function to update a task's content and timeline
CREATE OR REPLACE FUNCTION update_task_details(
    p_task_uuid UUID,
    p_new_text TEXT DEFAULT NULL,
    p_new_start_at TIMESTAMP DEFAULT NULL,
    p_new_end_at TIMESTAMP DEFAULT NULL
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
    
    -- Update the task with provided values
    UPDATE task 
    SET 
        text = COALESCE(p_new_text, text),
        start_at = COALESCE(p_new_start_at, start_at),
        end_at = COALESCE(p_new_end_at, end_at)
    WHERE uuid = p_task_uuid;
    
    RETURN TRUE;
END;
$$;

-- Function to create a new task
CREATE OR REPLACE FUNCTION create_task(
    p_goal_uuid UUID,
    p_milestone_uuid UUID,
    p_text TEXT,
    p_start_at TIMESTAMP,
    p_end_at TIMESTAMP,
    p_is_completed BOOLEAN DEFAULT FALSE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    new_task_uuid UUID;
    user_id UUID;
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
    
    -- Verify the milestone belongs to the goal
    IF NOT EXISTS (
        SELECT 1 FROM milestone m 
        WHERE m.uuid = p_milestone_uuid 
        AND m.goal_uuid = p_goal_uuid
    ) THEN
        RAISE EXCEPTION 'Milestone not found or does not belong to goal';
    END IF;
    
    -- Generate UUID for the new task
    new_task_uuid := gen_random_uuid();
    
    -- Insert the new task
    INSERT INTO task (
        uuid,
        goal_uuid,
        milestone_uuid,
        text,
        start_at,
        end_at,
        "isCompleted",
        created_at
    ) VALUES (
        new_task_uuid,
        p_goal_uuid,
        p_milestone_uuid,
        p_text,
        p_start_at,
        p_end_at,
        p_is_completed,
        NOW()
    );
    
    RETURN JSON_BUILD_OBJECT(
        'uuid', new_task_uuid,
        'goal_uuid', p_goal_uuid,
        'milestone_uuid', p_milestone_uuid,
        'text', p_text,
        'start_at', p_start_at,
        'end_at', p_end_at,
        'isCompleted', p_is_completed,
        'created_at', NOW()
    );
END;
$$;

-- Function to delete a task
CREATE OR REPLACE FUNCTION delete_task(
    p_task_uuid UUID
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
    
    -- Delete the task
    DELETE FROM task WHERE uuid = p_task_uuid;
    
    RETURN TRUE;
END;
$$;

-- Function to batch update multiple tasks (for AI adjustments)
CREATE OR REPLACE FUNCTION batch_update_tasks(
    p_task_updates JSON
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    update_item JSON;
    task_uuid_val UUID;
    updated_count INTEGER := 0;
    results JSON[] := '{}';
    user_id UUID;
BEGIN
    -- Get the authenticated user ID
    user_id := auth.uid();
    
    -- Process each task update
    FOR update_item IN SELECT * FROM JSON_ARRAY_ELEMENTS(p_task_updates)
    LOOP
        task_uuid_val := (update_item->>'task_uuid')::UUID;
        
        -- Verify the task belongs to the user's goal
        IF EXISTS (
            SELECT 1 FROM task t
            JOIN goal g ON g.uuid = t.goal_uuid
            WHERE t.uuid = task_uuid_val 
            AND g.user_uuid = user_id
        ) THEN
            -- Update the task
            UPDATE task 
            SET 
                text = COALESCE((update_item->>'new_text'), text),
                start_at = COALESCE((update_item->>'new_start_at')::TIMESTAMP, start_at),
                end_at = COALESCE((update_item->>'new_end_at')::TIMESTAMP, end_at)
            WHERE uuid = task_uuid_val;
            
            updated_count := updated_count + 1;
            
            -- Add to results
            results := results || JSON_BUILD_OBJECT(
                'task_uuid', task_uuid_val,
                'action', update_item->>'action',
                'reason', update_item->>'reason',
                'success', true
            );
        ELSE
            -- Add failed result
            results := results || JSON_BUILD_OBJECT(
                'task_uuid', task_uuid_val,
                'action', update_item->>'action',
                'reason', update_item->>'reason',
                'success', false,
                'error', 'Task not found or access denied'
            );
        END IF;
    END LOOP;
    
    -- Convert array to JSON array
    RETURN JSON_BUILD_OBJECT(
        'updated_count', updated_count,
        'results', (SELECT JSON_AGG(unnest) FROM unnest(results))
    );
END;
$$;

-- Grant execute permissions for new functions
GRANT EXECUTE ON FUNCTION update_task_details(UUID, TEXT, TIMESTAMP, TIMESTAMP) TO authenticated;
GRANT EXECUTE ON FUNCTION create_task(UUID, UUID, TEXT, TIMESTAMP, TIMESTAMP, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_task(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION batch_update_tasks(JSON) TO authenticated;
