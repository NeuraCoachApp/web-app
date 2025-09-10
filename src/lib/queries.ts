import { supabase } from './supabase'
import { Goal } from '@/src/classes/Goal'
import { Step } from '@/src/classes/Step'
import { Insight } from '@/src/classes/Insight'
import { Session } from '@/src/classes/Session'

// Type definitions for RPC function responses
interface GoalRPCData {
  uuid: string
  text: string
  created_at: string
  end_at: string
  steps: StepRPCData[]
}

interface StepRPCData {
  uuid: string
  text: string
  isCompleted: boolean
  created_at: string
  end_at: string
  next_step: string | null
  sessions: SessionRPCData[]
}

interface SessionRPCData {
  uuid: string
  created_at: string
  goal_uuid: string
  insight_uuid: string
  user_uuid: string
  insight: InsightRPCData
}

interface InsightRPCData {
  uuid: string
  summary: string
  progress: number
  effort_level: number
  stress_level: number
  step_uuid: string
  created_at: string
}

/**
 * Fetch all goals for a user with their steps, sessions, and insights using RPC
 */
export async function fetchUserGoalsWithDetails(userId: string): Promise<Goal[]> {
  try {
    const { data, error } = await supabase.rpc('get_user_goals_with_details', {
      p_user_uuid: userId
    })

    console.log('🔍 [fetchUserGoalsWithDetails] RPC result:', { data, error })

    if (error) {
      console.error('Error fetching user goals with RPC:', error)
      return []
    }

    if (!data || !Array.isArray(data)) {
      return []
    }

    const goals: Goal[] = []

    for (const goalData of data as any as GoalRPCData[]) {
      const goal = new Goal({
        uuid: goalData.uuid,
        text: goalData.text,
        created_at: goalData.created_at,
        end_at: goalData.end_at
      })

      // Process steps
      if (goalData.steps && Array.isArray(goalData.steps)) {
        for (const stepData of goalData.steps) {
          const step = new Step({
            uuid: stepData.uuid,
            text: stepData.text,
            isCompleted: stepData.isCompleted,
            created_at: stepData.created_at,
            end_at: stepData.end_at,
            next_step: stepData.next_step
          })

          // Process sessions for this step
          if (stepData.sessions && Array.isArray(stepData.sessions)) {
            for (const sessionData of stepData.sessions) {
              const insight = new Insight({
                uuid: sessionData.insight.uuid,
                summary: sessionData.insight.summary,
                progress: sessionData.insight.progress,
                effort_level: sessionData.insight.effort_level,
                stress_level: sessionData.insight.stress_level,
                step_uuid: sessionData.insight.step_uuid,
                created_at: sessionData.insight.created_at
              })
              insight.setStep(step)

              const session = new Session({
                uuid: sessionData.uuid,
                created_at: sessionData.created_at,
                goal_uuid: sessionData.goal_uuid,
                insight_uuid: sessionData.insight_uuid,
                user_uuid: sessionData.user_uuid
              })
              session.setGoal(goal)
              session.setInsight(insight)
              step.addSession(session)
            }
          }

          goal.addStep(step)
        }
      }

      goals.push(goal)
    }

    return goals
  } catch (error) {
    console.error('Error fetching user goals with details:', error)
    return []
  }
}

/**
 * Fetch a single goal with all its details using RPC
 */
export async function fetchGoalWithDetails(goalUuid: string): Promise<Goal | null> {
  try {
    const { data, error } = await supabase.rpc('get_goal_with_details' as any, {
      p_goal_uuid: goalUuid
    })

    if (error) {
      console.error('Error fetching goal with RPC:', error)
      return null
    }

    if (!data) {
      return null
    }

    const goalData = data as any as GoalRPCData
    const goal = new Goal({
      uuid: goalData.uuid,
      text: goalData.text,
      created_at: goalData.created_at,
      end_at: goalData.end_at
    })

    // Process steps
    if (goalData.steps && Array.isArray(goalData.steps)) {
      for (const stepData of goalData.steps) {
        const step = new Step({
          uuid: stepData.uuid,
          text: stepData.text,
          isCompleted: stepData.isCompleted,
          created_at: stepData.created_at,
          end_at: stepData.end_at,
          next_step: stepData.next_step
        })

        // Process sessions for this step
        if (stepData.sessions && Array.isArray(stepData.sessions)) {
          for (const sessionData of stepData.sessions) {
            const insight = new Insight({
              uuid: sessionData.insight.uuid,
              summary: sessionData.insight.summary,
              progress: sessionData.insight.progress,
              effort_level: sessionData.insight.effort_level,
              stress_level: sessionData.insight.stress_level,
              step_uuid: sessionData.insight.step_uuid,
              created_at: sessionData.insight.created_at
            })
            insight.setStep(step)

            const session = new Session({
              uuid: sessionData.uuid,
              created_at: sessionData.created_at,
              goal_uuid: sessionData.goal_uuid,
              insight_uuid: sessionData.insight_uuid,
              user_uuid: sessionData.user_uuid
            })
            session.setGoal(goal)
            session.setInsight(insight)
            step.addSession(session)
          }
        }

        goal.addStep(step)
      }
    }

    return goal
  } catch (error) {
    console.error('Error fetching goal with details:', error)
    return null
  }
}

/**
 * Fetch sessions for a user with goal and insight details using RPC
 */
export async function fetchUserSessions(userId: string): Promise<Session[]> {
  try {
    const { data, error } = await supabase.rpc('get_user_sessions' as any, {
      p_user_uuid: userId
    })

    if (error) {
      console.error('Error fetching user sessions with RPC:', error)
      return []
    }

    if (!data || !Array.isArray(data)) {
      return []
    }

    const sessions: Session[] = []

    for (const sessionData of data as any as (SessionRPCData & { goal: GoalRPCData })[]) {
      const session = new Session({
        uuid: sessionData.uuid,
        created_at: sessionData.created_at,
        goal_uuid: sessionData.goal_uuid,
        insight_uuid: sessionData.insight_uuid,
        user_uuid: sessionData.user_uuid
      })

      // Set goal
      if (sessionData.goal) {
        const goal = new Goal({
          uuid: sessionData.goal.uuid,
          text: sessionData.goal.text,
          created_at: sessionData.goal.created_at,
          end_at: sessionData.goal.end_at
        })
        session.setGoal(goal)
      }

      // Set insight
      if (sessionData.insight) {
        const insight = new Insight({
          uuid: sessionData.insight.uuid,
          summary: sessionData.insight.summary,
          progress: sessionData.insight.progress,
          effort_level: sessionData.insight.effort_level,
          stress_level: sessionData.insight.stress_level,
          step_uuid: sessionData.insight.step_uuid,
          created_at: sessionData.insight.created_at
        })
        session.setInsight(insight)
      }

      sessions.push(session)
    }

    return sessions
  } catch (error) {
    console.error('Error fetching user sessions:', error)
    return []
  }
}

/**
 * Create a new session with insight using RPC
 */
export async function createSessionWithInsight(
  userId: string,
  goalUuid: string,
  stepUuid: string,
  insightData: {
    summary: string
    progress: number
    effort_level: number
    stress_level: number
  }
): Promise<Session | null> {
  try {
    const { data, error } = await supabase.rpc('create_session_with_insight' as any, {
      p_user_uuid: userId,
      p_goal_uuid: goalUuid,
      p_step_uuid: stepUuid,
      p_summary: insightData.summary,
      p_progress: insightData.progress,
      p_effort_level: insightData.effort_level,
      p_stress_level: insightData.stress_level
    })

    if (error) {
      console.error('Error creating session with insight via RPC:', error)
      return null
    }

    if (!data) {
      return null
    }

    const sessionData = data as any as SessionRPCData & { goal: GoalRPCData }
    const session = new Session({
      uuid: sessionData.uuid,
      created_at: sessionData.created_at,
      goal_uuid: sessionData.goal_uuid,
      insight_uuid: sessionData.insight_uuid,
      user_uuid: sessionData.user_uuid
    })

    // Set goal
    if (sessionData.goal) {
      const goal = new Goal({
        uuid: sessionData.goal.uuid,
        text: sessionData.goal.text,
        created_at: sessionData.goal.created_at,
        end_at: sessionData.goal.end_at
      })
      session.setGoal(goal)
    }

    // Set insight
    if (sessionData.insight) {
      const insight = new Insight({
        uuid: sessionData.insight.uuid,
        summary: sessionData.insight.summary,
        progress: sessionData.insight.progress,
        effort_level: sessionData.insight.effort_level,
        stress_level: sessionData.insight.stress_level,
        step_uuid: sessionData.insight.step_uuid,
        created_at: sessionData.insight.created_at
      })
      session.setInsight(insight)
    }

    return session
  } catch (error) {
    console.error('Error creating session with insight:', error)
    return null
  }
}

/**
 * Get goal progress summary using RPC
 */
export async function fetchGoalProgressSummary(goalUuid: string): Promise<any> {
  try {
    const { data, error } = await supabase.rpc('get_goal_progress_summary' as any, {
      p_goal_uuid: goalUuid
    })

    if (error) {
      console.error('Error fetching goal progress summary:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching goal progress summary:', error)
    return null
  }
}

/**
 * Get daily metrics for a goal using RPC
 */
export async function fetchGoalDailyMetrics(
  goalUuid: string, 
  daysBack: number = 30
): Promise<any[]> {
  try {
    const { data, error } = await supabase.rpc('get_goal_daily_metrics' as any, {
      p_goal_uuid: goalUuid,
      p_days_back: daysBack
    })

    if (error) {
      console.error('Error fetching goal daily metrics:', error)
      return []
    }

    return (data as any) || []
  } catch (error) {
    console.error('Error fetching goal daily metrics:', error)
    return []
  }
}
