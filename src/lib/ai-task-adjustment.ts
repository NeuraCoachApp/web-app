/**
 * AI-Powered Task Adjustment System
 * Uses check-in data (mood, motivation, progress, blockers) to intelligently adjust user tasks
 */

import OpenAI from 'openai'
import { supabase } from './supabase'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPEN_AI_STEPS_CREATOR,
  dangerouslyAllowBrowser: true
})

export interface CheckInAnalysis {
  needsAdjustment: boolean
  adjustmentType: 'timeline' | 'difficulty' | 'support' | 'none'
  adjustmentReason: string
  recommendedAction: string
}

export interface TaskAdjustment {
  task_uuid: string
  new_text?: string
  new_start_at?: string
  new_end_at?: string
  action: 'update' | 'postpone' | 'simplify' | 'split'
  reason: string
  [key: string]: string | undefined
}

export interface AITaskAdjustmentResponse {
  adjustments: TaskAdjustment[]
  overall_strategy: string
  encouragement_message: string
}

export interface BatchUpdateResult {
  updated_count: number
  results: Array<{
    task_uuid: string
    action: string
    reason: string
    success: boolean
    error?: string
  }>
}

export interface TaskForAdjustment {
  uuid: string
  text: string
  start_at: string
  end_at: string
  isCompleted: boolean
}

/**
 * Analyze check-in data to determine if task adjustments are needed
 */
export function analyzeCheckInData(
  mood: number,
  motivation: number,
  progressPercentage: number,
  blocker: string
): CheckInAnalysis {
  // Calculate adjustment need based on multiple factors
  const lowMood = mood <= 4
  const lowMotivation = motivation <= 4
  const lowProgress = progressPercentage < 50
  const hasSignificantBlocker = blocker.length > 50
  
  // Determine if adjustment is needed
  const needsAdjustment = lowMood || lowMotivation || lowProgress || hasSignificantBlocker
  
  if (!needsAdjustment) {
    return {
      needsAdjustment: false,
      adjustmentType: 'none',
      adjustmentReason: 'User is performing well across all metrics',
      recommendedAction: 'Continue with current task schedule'
    }
  }
  
  // Determine adjustment type based on primary issue
  let adjustmentType: 'timeline' | 'difficulty' | 'support' | 'none'
  let adjustmentReason: string
  let recommendedAction: string
  
  if (lowProgress && hasSignificantBlocker) {
    adjustmentType = 'timeline'
    adjustmentReason = 'Low progress with significant blockers indicates timeline pressure'
    recommendedAction = 'Extend deadlines and break down complex tasks'
  } else if (lowMood && lowMotivation) {
    adjustmentType = 'difficulty'
    adjustmentReason = 'Low mood and motivation require easier, more achievable tasks'
    recommendedAction = 'Simplify tasks and add quick wins'
  } else if (lowMotivation) {
    adjustmentType = 'support'
    adjustmentReason = 'Low motivation needs additional support and engagement'
    recommendedAction = 'Add motivational milestones and support resources'
  } else if (lowProgress) {
    adjustmentType = 'timeline'
    adjustmentReason = 'Low progress suggests unrealistic timeline expectations'
    recommendedAction = 'Adjust task scheduling and reduce daily load'
  } else {
    adjustmentType = 'support'
    adjustmentReason = 'User needs additional support to overcome current challenges'
    recommendedAction = 'Add supportive tasks and resources'
  }
  
  return {
    needsAdjustment,
    adjustmentType,
    adjustmentReason,
    recommendedAction
  }
}

/**
 * Use OpenAI to generate intelligent task adjustments
 */
export async function generateTaskAdjustments(
  goalText: string,
  currentTasks: TaskForAdjustment[],
  checkInData: {
    mood: number
    motivation: number
    progressPercentage: number
    blocker: string
    summary: string
  },
  analysis: CheckInAnalysis
): Promise<AITaskAdjustmentResponse> {
  try {
    const systemPrompt = `You are an AI life coach specializing in adaptive task management. Your role is to intelligently adjust user tasks based on their check-in data to maximize success while maintaining realistic expectations.

CURRENT SITUATION:
- Goal: ${goalText}
- Progress: ${checkInData.progressPercentage}%
- Mood: ${checkInData.mood}/10
- Motivation: ${checkInData.motivation}/10
- Main Blocker: ${checkInData.blocker}
- Session Summary: ${checkInData.summary}

ADJUSTMENT ANALYSIS:
- Needs Adjustment: ${analysis.needsAdjustment}
- Adjustment Type: ${analysis.adjustmentType}
- Reason: ${analysis.adjustmentReason}
- Recommended Action: ${analysis.recommendedAction}

CURRENT TASKS:
${currentTasks.map(task => `- UUID: ${task.uuid} - "${task.text}" (${task.isCompleted ? 'COMPLETED' : 'PENDING'}) [${task.start_at} to ${task.end_at}]`).join('\n')}

ADJUSTMENT GUIDELINES:
1. TIMELINE ADJUSTMENTS: Extend deadlines, reduce daily load, add buffer time
2. DIFFICULTY ADJUSTMENTS: Break complex tasks into smaller steps, add quick wins
3. SUPPORT ADJUSTMENTS: Add preparatory tasks, resources, or motivational milestones

TASK ADJUSTMENT ACTIONS:
- "update": Change task text or requirements
- "postpone": Move task to later date
- "simplify": Make task easier or break into smaller parts
- "split": Break one task into multiple simpler tasks

RESPONSE FORMAT:
Return a JSON object with this exact structure:
{
  "adjustments": [
    {
      "task_uuid": "use-actual-uuid-from-current-tasks-list-above",
      "new_text": "Updated task description (optional)",
      "new_start_at": "2024-01-15T00:00:00.000Z (optional)",
      "new_end_at": "2024-01-15T23:59:59.999Z (optional)",
      "action": "update|postpone|simplify|split",
      "reason": "Explanation for this adjustment"
    }
  ],
  "overall_strategy": "Brief explanation of the overall adjustment strategy",
  "encouragement_message": "Supportive message for the user about these changes"
}

IMPORTANT: 
- ALWAYS use the actual UUIDs from the CURRENT TASKS list above
- DO NOT use placeholder values like "existing-task-uuid"
- Only adjust tasks that are NOT completed
- Each task_uuid must exactly match a UUID from the current tasks list

IMPORTANT:
- Only adjust tasks that are NOT completed
- Maintain logical task progression and dependencies
- Keep task text actionable and specific
- Ensure new dates are realistic and achievable
- Focus on setting the user up for success tomorrow`

    const userPrompt = `Based on the user's check-in data showing ${analysis.adjustmentReason.toLowerCase()}, please generate appropriate task adjustments that will help them succeed while addressing their current challenges.

Focus on ${analysis.recommendedAction.toLowerCase()} to support their current state (mood: ${checkInData.mood}/10, motivation: ${checkInData.motivation}/10, progress: ${checkInData.progressPercentage}%).`

    console.log('🤖 [AI Task Adjustment] Generating task adjustments for:', goalText)
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    })

    const responseContent = response.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response from OpenAI')
    }

    console.log('🤖 [AI Task Adjustment] Raw response:', responseContent)

    const parsedResponse = JSON.parse(responseContent) as AITaskAdjustmentResponse
    
    // Validate response structure
    if (!parsedResponse.adjustments || !Array.isArray(parsedResponse.adjustments)) {
      throw new Error('Invalid response structure: missing adjustments array')
    }

    console.log('✅ [AI Task Adjustment] Generated adjustments:', parsedResponse.adjustments.length)
    return parsedResponse

  } catch (error) {
    console.error('❌ [AI Task Adjustment] Error generating adjustments:', error)
    throw error
  }
}

/**
 * Apply task adjustments to the database using RPC function
 */
export async function applyTaskAdjustments(
  adjustments: TaskAdjustment[]
): Promise<void> {
  try {
    console.log('📝 [Task Adjustment] Applying adjustments to database:', adjustments.length)
    
    if (adjustments.length === 0) {
      console.log('📝 [Task Adjustment] No adjustments to apply')
      return
    }
    
    // Use the batch update RPC function
    const { data, error } = await supabase.rpc('batch_update_tasks', {
      p_task_updates: adjustments
    })
    
    if (error) {
      console.error('❌ [Task Adjustment] RPC error:', error)
      throw new Error(`Failed to apply task adjustments: ${error.message}`)
    }
    
    console.log('✅ [Task Adjustment] Batch update result:', data)
    
    // Check if all updates were successful
    if (data && typeof data === 'object' && 'updated_count' in data && 'results' in data) {
      const result = data as unknown as BatchUpdateResult
      const failedUpdates = result.results.filter(item => !item.success)
      if (failedUpdates.length > 0) {
        console.warn('⚠️ [Task Adjustment] Some updates failed:', failedUpdates)
        throw new Error(`${failedUpdates.length} task updates failed`)
      }
      console.log(`🎉 [Task Adjustment] Successfully applied ${result.updated_count} adjustments`)
    }
  } catch (error) {
    console.error('❌ [Task Adjustment] Error applying adjustments:', error)
    throw error
  }
}

/**
 * Main function to perform intelligent task adjustment after check-in
 */
export async function performIntelligentTaskAdjustment(
  goalText: string,
  currentTasks: TaskForAdjustment[],
  checkInData: {
    mood: number
    motivation: number
    progressPercentage: number
    blocker: string
    summary: string
  }
): Promise<{
  adjustmentsMade: boolean
  adjustments: TaskAdjustment[]
  encouragementMessage: string
  strategy: string
}> {
  try {
    console.log('🧠 [Intelligent Task Adjustment] Starting analysis for goal:', goalText)
    
    // Filter out completed tasks - we only adjust incomplete tasks
    const incompleteTasks = currentTasks.filter(task => !task.isCompleted)
    
    console.log('🔍 [Task Filter] Task breakdown:', {
      total: currentTasks.length,
      incomplete: incompleteTasks.length,
      completed: currentTasks.length - incompleteTasks.length
    })
    
    if (incompleteTasks.length === 0) {
      console.log('✅ [Intelligent Task Adjustment] All tasks completed - no adjustments needed')
      return {
        adjustmentsMade: false,
        adjustments: [],
        encouragementMessage: "Congratulations! You've completed all your tasks. Keep up the excellent work!",
        strategy: "No adjustments needed - all tasks are complete"
      }
    }
    
    // Step 1: Analyze check-in data
    const analysis = analyzeCheckInData(
      checkInData.mood,
      checkInData.motivation,
      checkInData.progressPercentage,
      checkInData.blocker
    )
    
    console.log('📊 [Analysis Result]:', analysis)
    
    // Step 2: If no adjustment needed, return early
    if (!analysis.needsAdjustment) {
      return {
        adjustmentsMade: false,
        adjustments: [],
        encouragementMessage: "You're doing great! Keep up the excellent work with your current schedule.",
        strategy: "No adjustments needed - continue with current plan"
      }
    }
    
    // Step 3: Generate AI-powered task adjustments (using only incomplete tasks)
    const aiResponse = await generateTaskAdjustments(
      goalText,
      incompleteTasks,
      checkInData,
      analysis
    )
    
    // Step 4: Apply adjustments to database
    if (aiResponse.adjustments.length > 0) {
      await applyTaskAdjustments(aiResponse.adjustments)
    }
    
    return {
      adjustmentsMade: aiResponse.adjustments.length > 0,
      adjustments: aiResponse.adjustments,
      encouragementMessage: aiResponse.encouragement_message,
      strategy: aiResponse.overall_strategy
    }
    
  } catch (error) {
    console.error('❌ [Intelligent Task Adjustment] Error in task adjustment:', error)
    
    // Return graceful fallback
    return {
      adjustmentsMade: false,
      adjustments: [],
      encouragementMessage: "I'm here to support you. Tomorrow is a fresh start!",
      strategy: "Continue with current plan - adjustments will be made as needed"
    }
  }
}
