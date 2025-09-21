import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPEN_AI_STEPS_CREATOR,
  dangerouslyAllowBrowser: true // This is needed for client-side usage
})

export interface GeneratedTask {
  text: string
  day_number: number
  is_preparation?: boolean
  success_criteria: string
}

export interface GeneratedStep {
  text: string
  order: number
  estimated_duration_days: number
  description?: string
  success_criteria?: string
  daily_tasks: GeneratedTask[]
}

export interface OpenAIStepsResponse {
  steps: GeneratedStep[]
  total_estimated_duration_days: number
  goal_summary: string
}

/**
 * Check if a step contains specific, measurable elements and has clear completion criteria
 */
function isStepSpecific(stepText: string): boolean {
  // Check for precise completion-based patterns
  const completionPatterns = [
    /\b(complete|finish|reach|build|create|record|document)\b/i, // Precise completion verbs
    /\b\d+\s*(books?|songs?|recipes?|workouts?|sessions?|courses?|projects?)\b/i, // Countable achievements
    /\bscore\s+\d+%/i, // Test scores: "score 90%"
    /\blose\s+\d+\s*(pounds?|kg|lbs)\b/i, // Weight loss targets
    /\breach\s+\$?\d+/i, // Savings targets: "reach $2000"
    /\b\d+[\d,]*\s*(dollars?|\$|€|£|¥)\s+(in\s+)?(revenue|profit|savings?)/i, // Money targets
    /\brun\s+\d+[km]?\s*(in\s+under|without)/i, // Fitness achievements
    /(timed|verified|documented|recorded|logged)/i // Verification methods
  ]
  
  // Check for vague/ambiguous terms (these are BAD)
  const vaguePatterns = [
    /\b(master|improve|understand|get\s+better|enhance|develop)\b/i, // Vague achievement words
    /\b(proficient|skilled|good\s+at|comfortable\s+with)\b/i // Subjective skill levels
  ]
  
  // Check for habit-based patterns (these are BAD)
  const habitPatterns = [
    /\b(daily|every\s+day|each\s+day)\b/i,
    /\b(weekly|every\s+week|each\s+week)\b/i,
    /\b(regularly|consistently)\b/i,
    /\d+\s*(times?|x)\s*(per|a|each)\s*(day|week)/i // "3 times per week"
  ]
  
  // General specificity patterns
  const specificityPatterns = [
    /\b\d+\b/i, // Any number
    /(track|measure|record|log|count|weigh|timer?)/i, // Tracking words
    /\b(at least|minimum|maximum|exactly|precisely)\s*\d+/i // Specific targets
  ]
  
  const hasCompletion = completionPatterns.some(pattern => pattern.test(stepText))
  const hasVague = vaguePatterns.some(pattern => pattern.test(stepText))
  const hasHabit = habitPatterns.some(pattern => pattern.test(stepText))
  const hasSpecificity = specificityPatterns.some(pattern => pattern.test(stepText))
  
  // Step is good if it has completion/specificity AND no vague/habit terms
  return (hasCompletion || hasSpecificity) && !hasVague && !hasHabit
}

/**
 * Retry function with exponential backoff for rate limiting
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      // If it's a rate limit error (429) and we have retries left
      if (error?.status === 429 && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
        console.log(`🔄 [OpenAI] Rate limited. Retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries + 1})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // If it's not a rate limit error or we're out of retries, throw
      throw error
    }
  }
  
  throw new Error('Max retries exceeded')
}

/**
 * Generate structured steps for a goal using OpenAI
 */
export async function generateGoalSteps(
  goalText: string,
  userReason?: string
): Promise<OpenAIStepsResponse> {
  try {
    const systemPrompt = `You are a professional life coach and goal-setting expert. Your task is to break down user goals into MILESTONES with DAILY TASKS.

CRITICAL REQUIREMENTS:
1. Generate 4-12 milestones based on goal complexity (simple goals: 4-6, complex goals: 8-12)
2. Each milestone MUST have a CLEAR COMPLETION CONDITION
3. Each milestone must be broken down into DAILY TASKS (2-5 tasks per day for capable users)
4. Each daily task must be accomplishable in a single day
5. Daily tasks should be specific, actionable, and measurable
6. Include preparation tasks (research, setup, discovery) before execution tasks
7. Tasks should build logically toward completing the milestone
8. Users are capable and motivated - don't underestimate their capacity

DAILY TASK REQUIREMENTS:
- ONE ACTION PER TASK - no compound actions
- ACCOMPLISHABLE IN ONE DAY - no multi-day tasks
- SPECIFIC AND CONCRETE - avoid vague language
- MEASURABLE OUTCOME - clear success criteria
- SEQUENTIAL LOGIC - each task builds toward the milestone
- MULTIPLE TASKS PER DAY - users can handle 2-5 tasks daily
- BALANCE WORKLOAD - mix quick wins with substantial tasks

RESPONSE FORMAT:
Return a JSON object with this exact structure:
{
  "steps": [
    {
      "text": "Milestone title (50-120 characters)",
      "order": 1,
      "estimated_duration_days": 7,
      "description": "What this milestone achieves overall",
      "success_criteria": "How to know this milestone is 100% complete",
      "daily_tasks": [
        {
          "text": "First actionable task for day 1",
          "day_number": 1,
          "is_preparation": true,
          "success_criteria": "Exact completion criteria for this task"
        },
        {
          "text": "Second actionable task for day 1",
          "day_number": 1,
          "is_preparation": true,
          "success_criteria": "Exact completion criteria for this task"
        },
        {
          "text": "Third actionable task for day 1",
          "day_number": 1,
          "is_preparation": false,
          "success_criteria": "Exact completion criteria for this task"
        },
        {
          "text": "First actionable task for day 2",
          "day_number": 2,
          "is_preparation": false,
          "success_criteria": "Exact completion criteria for this task"
        },
        {
          "text": "Second actionable task for day 2",
          "day_number": 2,
          "is_preparation": false,
          "success_criteria": "Exact completion criteria for this task"
        }
      ]
    }
  ],
  "total_estimated_duration_days": 30,
  "goal_summary": "Brief restatement of the goal in coaching language"
}

DAILY TASK EXAMPLES:

EXAMPLE 1 - Sleep Goal (6 milestones):
Milestone 1: "Research and prepare sleep optimization setup"
Daily Tasks:
- Day 1: "Research sleep tracking apps and download the best one", "Purchase blackout curtains or eye mask", "Set phone to Do Not Disturb mode after 9 PM"
- Day 2: "Install blackout curtains", "Set bedroom temperature to 65-68°F", "Remove electronic devices from bedroom"

Milestone 2: "Establish consistent bedtime routine"
Daily Tasks:
- Day 1: "Create evening routine checklist", "Set bedtime alarm for 10 PM", "Practice 10-minute wind-down routine"
- Day 2: "Follow complete bedtime routine", "Read for 20 minutes before sleep", "Log sleep quality in tracking app"

EXAMPLE 2 - Fitness Goal (8 milestones):
Milestone 1: "Complete comprehensive fitness assessment"
Daily Tasks:
- Day 1: "Research local gyms and fitness centers", "Schedule fitness assessment appointment", "Purchase workout clothes and water bottle"
- Day 2: "Complete body measurements and weight recording", "Take progress photos", "Set up fitness tracking app"
- Day 3: "Complete cardiovascular endurance test", "Test maximum push-ups and sit-ups", "Record baseline strength measurements"

Milestone 2: "Master basic exercise form and techniques"
Daily Tasks:
- Day 1: "Watch instructional videos for 5 basic exercises", "Practice bodyweight squats with proper form", "Learn correct push-up technique"
- Day 2: "Practice proper plank form for 30 seconds", "Learn correct deadlift movement pattern", "Record form practice session"
- Day 3: "Complete first supervised workout with trainer", "Get feedback on exercise form", "Create personalized workout plan"

Milestone 3: "Build workout consistency habit"
Daily Tasks:
- Day 1: "Complete second gym workout following plan", "Track exercises and weights used", "Plan next workout session"
- Day 2: "Complete third gym workout", "Increase weight by 5lbs on 2 exercises", "Assess muscle soreness and recovery"

BAD DAILY TASK EXAMPLES:
❌ "Track sleep for 5 nights and optimize bedroom setup" (compound task within single task)
❌ "Research apps, set up bedroom, and start tracking sleep" (compound task within single task)
❌ "Maintain consistent sleep schedule throughout the week" (ongoing habit, not specific action)

GOOD DAILY TASK EXAMPLES (multiple tasks per day):
✅ Day 1: "Download and set up Sleep Cycle app on phone", "Purchase blackout curtains online", "Set phone to airplane mode at 9 PM"
✅ Day 2: "Install blackout curtains in bedroom", "Set bedroom temperature to 67°F", "Create bedtime routine checklist"
✅ Day 3: "Record tonight's sleep duration and quality in app", "Practice 10-minute meditation before bed", "Remove all screens from bedroom"

MILESTONE QUANTITY GUIDELINES:
- Simple goals (habits, skills): 4-6 milestones
- Moderate goals (projects, learning): 6-8 milestones  
- Complex goals (business, major life changes): 8-12 milestones
- Each milestone should represent a meaningful achievement toward the overall goal`

    const userPrompt = `Please break down this goal into actionable steps:

GOAL: "${goalText}"
${userReason ? `USER'S MOTIVATION: "${userReason}"` : ''}

Generate a structured plan that will help the user achieve this goal successfully.`

    console.log('🤖 [OpenAI] Generating steps for goal:', goalText)
    
    const completion = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      })
    }, 3, 2000) // 3 retries, starting with 2 second delay

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response from OpenAI')
    }

    console.log('🤖 [OpenAI] Raw response:', responseContent)

    // Parse and validate the JSON response
    const parsedResponse = JSON.parse(responseContent) as OpenAIStepsResponse
    
    // Validate the response structure
    if (!parsedResponse.steps || !Array.isArray(parsedResponse.steps)) {
      throw new Error('Invalid response structure: missing steps array')
    }

    if (parsedResponse.steps.length === 0) {
      throw new Error('No steps generated')
    }

    // Validate each step
    parsedResponse.steps.forEach((step, index) => {
      if (!step.text || typeof step.text !== 'string') {
        throw new Error(`Invalid step ${index + 1}: missing or invalid text`)
      }
      if (typeof step.order !== 'number') {
        throw new Error(`Invalid step ${index + 1}: missing or invalid order`)
      }
      if (typeof step.estimated_duration_days !== 'number' || step.estimated_duration_days < 1) {
        throw new Error(`Invalid step ${index + 1}: missing or invalid duration`)
      }
      
      // Validate daily_tasks array
      if (!step.daily_tasks || !Array.isArray(step.daily_tasks)) {
        throw new Error(`Invalid step ${index + 1}: missing or invalid daily_tasks array`)
      }
      
      if (step.daily_tasks.length === 0) {
        throw new Error(`Invalid step ${index + 1}: no daily tasks provided`)
      }
      
      // Validate each daily task
      step.daily_tasks.forEach((task, taskIndex) => {
        if (!task.text || typeof task.text !== 'string') {
          throw new Error(`Invalid step ${index + 1}, task ${taskIndex + 1}: missing or invalid text`)
        }
        if (typeof task.day_number !== 'number' || task.day_number < 1) {
          throw new Error(`Invalid step ${index + 1}, task ${taskIndex + 1}: missing or invalid day_number`)
        }
        if (!task.success_criteria || typeof task.success_criteria !== 'string') {
          throw new Error(`Invalid step ${index + 1}, task ${taskIndex + 1}: missing or invalid success_criteria`)
        }
      })
      
      // Validate specificity - check for measurable elements
      if (!isStepSpecific(step.text)) {
        console.warn(`⚠️ [OpenAI] Step ${index + 1} may lack specificity: "${step.text}"`)
        // Note: We warn but don't throw to avoid breaking the flow, as OpenAI might generate valid steps that don't match our regex
      }
    })

    // Sort steps by order to ensure correct sequence
    parsedResponse.steps.sort((a, b) => a.order - b.order)

    console.log('✅ [OpenAI] Successfully generated steps:', {
      stepCount: parsedResponse.steps.length,
      totalDuration: parsedResponse.total_estimated_duration_days,
      steps: parsedResponse.steps.map(s => ({ 
        milestone: s.text, 
        duration: s.estimated_duration_days,
        dailyTaskCount: s.daily_tasks.length,
        tasks: s.daily_tasks.map(t => ({ day: t.day_number, text: t.text }))
      }))
    })

    return parsedResponse
  } catch (error) {
    console.error('❌ [OpenAI] Error generating goal steps:', error)
    
    // If it's a parsing error, try to provide more context
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse OpenAI response as JSON')
    }
    
    // Re-throw with more context
    throw new Error(`Failed to generate goal steps: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validate that the OpenAI API key is configured
 */
export function validateOpenAIConfiguration(): boolean {
  const apiKey = process.env.NEXT_PUBLIC_OPEN_AI_STEPS_CREATOR
  if (!apiKey) {
    console.error('❌ [OpenAI] API key not configured. Please set NEXT_PUBLIC_OPEN_AI_STEPS_CREATOR environment variable.')
    return false
  }
  
  if (!apiKey.startsWith('sk-')) {
    console.error('❌ [OpenAI] Invalid API key format. API key should start with "sk-"')
    return false
  }
  
  return true
}

/**
 * Test function to validate step specificity (for development/debugging)
 */
export function testStepSpecificity(): void {
  const testSteps = [
    // Should be specific with clear completion (return true)
    "Complete 20 gym workouts of 45 minutes each",
    "Complete 20 meditation sessions of 10 minutes each", 
    "Score 90% on a 300-word Spanish vocabulary test",
    "Reach $2,000 in savings account balance",
    "Cook 15 healthy recipes successfully without recipe reference",
    "Complete a 5K run in under 30 minutes",
    "Record yourself playing 3 songs without mistakes",
    "Read 5 books and write summary notes for each",
    
    // Should be non-specific (return false) - habits, vague terms, or no completion
    "Exercise for 30 minutes daily", // Habit
    "Master guitar skills", // Vague
    "Improve diet", // Vague
    "Learn vocabulary daily", // Habit
    "Save money regularly", // Habit + vague
    "Get better at meditation", // Vague
    "Understand Spanish grammar", // Vague
    "Be more active", // Vague
    "Practice consistently", // Habit + vague
    "Develop good habits" // Vague
  ]
  
  console.log('🧪 [Testing] Step Completion Criteria Validation:')
  testSteps.forEach((step, index) => {
    const isSpecific = isStepSpecific(step)
    const expected = index < 8 // First 8 should be specific
    const status = isSpecific === expected ? '✅' : '❌'
    const reason = index < 8 ? 'Clear completion' : 
                   step.includes('daily') || step.includes('regularly') || step.includes('consistently') ? 'Habit-based' : 'Vague'
    console.log(`${status} "${step}" - Specific: ${isSpecific} (${reason})`)
  })
}
