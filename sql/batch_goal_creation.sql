-- Batch Goal Creation Functions for NeuraCoach
-- These functions should be executed in your Supabase SQL editor

-- Function to create a complete goal with all milestones and tasks in one transaction
CREATE OR REPLACE FUNCTION create_complete_goal(
    p_goal_text TEXT,
    p_init_end_at TIMESTAMP WITH TIME ZONE,
    p_milestones_and_tasks JSON
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    user_id UUID;
    goal_uuid UUID;
    milestone_item JSON;
    task_item JSON;
    milestone_uuid UUID;
    result JSON;
BEGIN
    -- Get the authenticated user ID
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Generate UUID for the goal
    goal_uuid := gen_random_uuid();
    
    -- Create the goal
    INSERT INTO goal (
        uuid,
        user_uuid,
        text,
        init_end_at,
        created_at
    ) VALUES (
        goal_uuid,
        user_id,
        p_goal_text,
        p_init_end_at,
        NOW()
    );
    
    -- Process milestones and tasks
    FOR milestone_item IN SELECT * FROM JSON_ARRAY_ELEMENTS(p_milestones_and_tasks)
    LOOP
        -- Generate UUID for the milestone
        milestone_uuid := gen_random_uuid();
        
        -- Create milestone
        INSERT INTO milestone (
            uuid,
            goal_uuid,
            text,
            start_at,
            end_at
        ) VALUES (
            milestone_uuid,
            goal_uuid,
            milestone_item->>'text',
            (milestone_item->>'start_at')::TIMESTAMP WITH TIME ZONE,
            (milestone_item->>'end_at')::TIMESTAMP WITH TIME ZONE
        );
        
        -- Create tasks for this milestone
        FOR task_item IN SELECT * FROM JSON_ARRAY_ELEMENTS(milestone_item->'tasks')
        LOOP
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
                gen_random_uuid(),
                goal_uuid,
                milestone_uuid,
                task_item->>'text',
                (task_item->>'start_at')::TIMESTAMP WITH TIME ZONE,
                (task_item->>'end_at')::TIMESTAMP WITH TIME ZONE,
                COALESCE((task_item->>'isCompleted')::BOOLEAN, FALSE),
                NOW()
            );
        END LOOP;
    END LOOP;
    
    -- Return the created goal UUID
    RETURN JSON_BUILD_OBJECT(
        'goal_uuid', goal_uuid,
        'message', 'Goal created successfully with all milestones and tasks'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and re-raise
        RAISE EXCEPTION 'Failed to create complete goal: %', SQLERRM;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_complete_goal(TEXT, TIMESTAMP WITH TIME ZONE, JSON) TO authenticated;
