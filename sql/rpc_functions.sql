-- RPC Functions for NeuraCoach Data Fetching
-- These functions should be executed in your Supabase SQL editor

-- Function to get user goals with complete details (steps, sessions, insights)
CREATE OR REPLACE FUNCTION get_user_goals_with_details(p_user_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
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
                    'isCompleted', s.isCompleted,
                    'created_at', s.created_at,
                    'end_at', s.end_at,
                    'next_step', s.next_step,
                    'sessions', COALESCE(step_sessions.sessions, '[]'::json)
                ) ORDER BY gs.id
            ) AS steps
        FROM user_goal ug
        JOIN goal g ON g.uuid = ug.goal_uuid
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
        WHERE ug.user_uuid = p_user_uuid
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
SECURITY DEFINER
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
                    'isCompleted', s.isCompleted,
                    'created_at', s.created_at,
                    'end_at', s.end_at,
                    'next_step', s.next_step,
                    'sessions', COALESCE(step_sessions.sessions, '[]'::json)
                ) ORDER BY gs.id
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
SECURITY DEFINER
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
SECURITY DEFINER
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
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    WITH step_completion AS (
        SELECT 
            s.uuid,
            s.text,
            s.isCompleted,
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
        GROUP BY s.uuid, s.text, s.isCompleted
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
SECURITY DEFINER
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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_goals_with_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_goal_with_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_sessions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_session_with_insight(UUID, UUID, UUID, TEXT, INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_goal_progress_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_goal_daily_metrics(UUID, INTEGER) TO authenticated;
