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
 * Check if a task contains specific, measurable content with numbers or quantities
 */
function hasSpecificMeasurableContent(taskText: string): boolean {
  // Check for specific measurable patterns
  const measurablePatterns = [
    /\b\d+\s*(pushups?|squats?|situps?|pullups?|reps?|sets?)\b/i, // Exercise counts
    /\b\d+\s*(pages?|words?|chapters?|modules?|lessons?)\b/i, // Learning quantities
    /\b\d+\s*(minutes?|hours?|seconds?)\b/i, // Time durations
    /\b\d+\s*(steps?|miles?|km|kilometers?)\b/i, // Distance/movement
    /\b\d+\s*(glasses?|cups?|ounces?|liters?)\b/i, // Quantities
    /\b\d+\s*(dollars?|\$|applications?|emails?|calls?)\b/i, // Countable items
    /\bfor\s+\d+\s*(minutes?|hours?|seconds?)\b/i, // Duration activities
    /\b\d+\s*(times?|x|repetitions?)\b/i, // Repetition counts
    /\bwalk\s+\d+/i, // Walk with number
    /\brun\s+\d+/i, // Run with number
    /\bsave\s+\$?\d+/i, // Save money
    /\blearn\s+\d+/i, // Learn X things
    /\bcomplete\s+\d+/i, // Complete X things
    /\bwrite\s+\d+/i, // Write X words/pages
    /\bread\s+\d+/i, // Read X pages/chapters
  ]
  
  return measurablePatterns.some(pattern => pattern.test(taskText))
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
    const systemPrompt = `You are a professional life coach. Break down user goals into milestones with multiple specific daily tasks.

CRITICAL REQUIREMENTS:
1. Generate 4-8 milestones based on goal complexity
2. Each milestone has 5-15 days with 3-4 tasks per day
3. Each task MUST be specific with exact numbers, quantities, or measurable outcomes
4. Tasks must be completable in one day and build toward the milestone
5. Include preparation tasks before execution tasks

TASK SPECIFICITY RULES:
- Use exact numbers: "Do 50 pushups", "Read 20 pages", "Write 500 words", "Practice guitar for 30 minutes"
- Include specific quantities: "Complete 3 job applications", "Send 5 networking emails", "Learn 15 Spanish vocabulary words"
- Set measurable targets: "Save $25 today", "Walk 8,000 steps", "Meditate for 10 minutes", "Cook 1 healthy meal"
- Time-based tasks: "Study for 45 minutes", "Exercise for 30 minutes", "Practice skill for 20 minutes"
- Avoid vague terms: NO "improve", "better", "more", "some", "a few", "work on", "focus on"
- Each task = ONE specific action with a number, time duration, or measurable outcome

GOOD TASK EXAMPLES:
✅ "Do 30 squats" ✅ "Read 15 pages of book" ✅ "Write 300 words in journal" ✅ "Practice piano for 25 minutes"
✅ "Walk for 45 minutes" ✅ "Complete 2 online course modules" ✅ "Send 4 job applications" ✅ "Save $20 in savings account"

BAD TASK EXAMPLES:
❌ "Exercise more" ❌ "Read some pages" ❌ "Work on writing" ❌ "Practice a bit" ❌ "Save some money"

RESPONSE FORMAT:
Return ONLY valid JSON with this exact structure:
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

EXAMPLE:
{
  "steps": [
    {
      "text": "Build foundation fitness baseline",
      "order": 1,
      "estimated_duration_days": 7,
      "description": "Establish baseline measurements and basic fitness routine",
      "success_criteria": "Complete 7 consecutive days of 30-minute workouts",
      "daily_tasks": [
        {
          "text": "Do 20 pushups in 3 sets",
          "day_number": 1,
          "is_preparation": false,
          "success_criteria": "Complete 20 total pushups (can break into sets)"
        },
        {
          "text": "Walk 5,000 steps",
          "day_number": 1,
          "is_preparation": false,
          "success_criteria": "Reach exactly 5,000 steps on fitness tracker"
        },
        {
          "text": "Drink 8 glasses of water",
          "day_number": 1,
          "is_preparation": false,
          "success_criteria": "Consume 64 ounces (8 x 8oz glasses) of water"
        },
        {
          "text": "Do 25 pushups in 3 sets",
          "day_number": 2,
          "is_preparation": false,
          "success_criteria": "Complete 25 total pushups (can break into sets)"
        },
        {
          "text": "Walk 6,000 steps",
          "day_number": 2,
          "is_preparation": false,
          "success_criteria": "Reach exactly 6,000 steps on fitness tracker"
        },
        {
          "text": "Hold plank for 60 seconds total",
          "day_number": 2,
          "is_preparation": false,
          "success_criteria": "Hold plank position for cumulative 60 seconds"
        },
        {
          "text": "Drink 8 glasses of water",
          "day_number": 2,
          "is_preparation": false,
          "success_criteria": "Consume 64 ounces (8 x 8oz glasses) of water"
        },
        {
          "text": "Do 30 pushups in 4 sets",
          "day_number": 3,
          "is_preparation": false,
          "success_criteria": "Complete 30 total pushups (can break into sets)"
        },
        {
          "text": "Walk 7,000 steps",
          "day_number": 3,
          "is_preparation": false,
          "success_criteria": "Reach exactly 7,000 steps on fitness tracker"
        },
        {
          "text": "Hold plank for 90 seconds total",
          "day_number": 3,
          "is_preparation": false,
          "success_criteria": "Hold plank position for cumulative 90 seconds"
        },
        {
          "text": "Do 20 squats",
          "day_number": 3,
          "is_preparation": false,
          "success_criteria": "Complete 20 bodyweight squats with proper form"
        }
      ]
    }
  ],
  "total_estimated_duration_days": 30,
  "goal_summary": "Build consistent fitness habit with measurable daily progress"
}`

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
        max_tokens: 4000,
        response_format: { type: "json_object" }
      })
    }, 3, 2000) // 3 retries, starting with 2 second delay

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response from OpenAI')
    }

    // Check if the response was truncated
    if (completion.choices[0]?.finish_reason === 'length') {
      console.warn('⚠️ [OpenAI] Response was truncated due to max_tokens limit')
      throw new Error('Response was truncated. Please try again with a shorter goal description.')
    }

    console.log('🤖 [OpenAI] Raw response:', responseContent)

    // Parse and validate the JSON response
    let parsedResponse: OpenAIStepsResponse
    try {
      parsedResponse = JSON.parse(responseContent) as OpenAIStepsResponse
    } catch (parseError) {
      console.error('❌ [OpenAI] JSON parsing failed:', parseError)
      console.error('❌ [OpenAI] Raw response that failed to parse:', responseContent)
      
      // Try to extract JSON from the response if it's wrapped in markdown or other text
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          console.log('🔄 [OpenAI] Attempting to parse extracted JSON:', jsonMatch[0])
          parsedResponse = JSON.parse(jsonMatch[0]) as OpenAIStepsResponse
        } catch (secondParseError) {
          console.error('❌ [OpenAI] Second JSON parsing attempt failed:', secondParseError)
          throw new Error('OpenAI returned invalid JSON format. Please try again.')
        }
      } else {
        throw new Error('OpenAI response does not contain valid JSON. Please try again.')
      }
    }
    
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
        
        // Check for specific, measurable task text
        if (!hasSpecificMeasurableContent(task.text)) {
          console.warn(`⚠️ [OpenAI] Task may lack specificity: "${task.text}"`)
        }
      })
      
      // Validate we have multiple tasks per day (aim for 3-4)
      const tasksByDay = step.daily_tasks.reduce((acc, task) => {
        acc[task.day_number] = (acc[task.day_number] || 0) + 1
        return acc
      }, {} as Record<number, number>)
      
      const daysWithFewTasks = Object.entries(tasksByDay).filter(([_, count]) => count < 2)
      if (daysWithFewTasks.length > 0) {
        console.warn(`⚠️ [OpenAI] Step ${index + 1} has days with too few tasks:`, daysWithFewTasks)
      }
      
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
