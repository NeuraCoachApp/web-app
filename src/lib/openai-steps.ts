import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPEN_AI_STEPS_CREATOR,
  dangerouslyAllowBrowser: true // This is needed for client-side usage
})

export interface GeneratedStep {
  text: string
  order: number
  estimated_duration_days: number
  description?: string
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
 * Generate structured steps for a goal using OpenAI
 */
export async function generateGoalSteps(
  goalText: string,
  userReason?: string
): Promise<OpenAIStepsResponse> {
  try {
    const systemPrompt = `You are a professional life coach and goal-setting expert. Your task is to break down user goals into actionable, achievable steps with SPECIFIC, MEASURABLE actions.

CRITICAL REQUIREMENTS:
1. Generate 3-7 steps maximum (prefer 4-5 steps for most goals)
2. Each step MUST have a CLEAR COMPLETION CONDITION - it ends when a specific target is achieved
3. Steps should be finite tasks, NOT ongoing habits or daily routines
4. Include specific numbers and measurable targets that define completion
5. Steps should build upon each other logically
6. Estimate realistic timeframes for each step
7. Use encouraging, supportive language
8. Consider the user's motivation/reason if provided

COMPLETION-BASED REQUIREMENTS:
- Each step must answer: "What specific achievement marks this step as DONE?"
- Use precise completion verbs: "Complete", "Finish", "Reach", "Build", "Create", "Record"
- Include concrete, countable targets: "Read 3 books" not "Read daily"
- Set finite, measurable goals: "Learn 100 vocabulary words" not "Learn vocabulary daily"
- Define exact end states: "Lose 10 pounds" not "Exercise regularly"
- Avoid vague terms: "master", "improve", "get better", "understand"
- Avoid ongoing words: "daily", "regularly", "consistently", "every day"
- Be binary: Either DONE or NOT DONE - no subjective interpretation

RESPONSE FORMAT:
Return a JSON object with this exact structure:
{
  "steps": [
    {
      "text": "Specific, measurable step with numbers (50-120 characters)",
      "order": 1,
      "estimated_duration_days": 7,
      "description": "Detailed description explaining the measurable target and how to track it"
    }
  ],
  "total_estimated_duration_days": 30,
  "goal_summary": "Brief restatement of the goal in coaching language"
}

STEP GUIDELINES:
- Every step must answer: "How much?", "How often?", "How many?", or "For how long?"
- Include tracking mechanisms where possible
- Duration should be realistic (typically 3-21 days per step)
- Order steps logically from preparation to execution to mastery
- Make success criteria crystal clear

COMPLETION-BASED vs HABIT-BASED EXAMPLES:

BAD (Ongoing Habit): "Exercise for 30 minutes daily"
GOOD (Clear Completion): "Complete 20 gym workouts of 45 minutes each"

BAD (Ongoing Habit): "Meditate for 10 minutes every morning"
GOOD (Clear Completion): "Complete 20 meditation sessions of 10 minutes each"

BAD (Vague): "Master 300 Spanish vocabulary words"
GOOD (Clear Completion): "Score 90% on a 300-word Spanish vocabulary test"

BAD (Ongoing Habit): "Save $200 per month"
GOOD (Clear Completion): "Reach $2,000 in savings account balance"

BAD (Vague): "Establish meal prep routine with 15 recipes mastered"
GOOD (Clear Completion): "Cook 15 healthy recipes successfully without recipe reference"

BAD (Ongoing Habit): "Walk 10,000 steps daily"
GOOD (Clear Completion): "Complete a 5K run in under 30 minutes"

BAD (Vague): "Improve guitar skills"
GOOD (Clear Completion): "Record yourself playing 3 songs without mistakes"

COMPLETE EXAMPLES:

Goal: "Get fit and lose weight"
Steps:
1. "Record baseline measurements: weight, body fat %, and 1-mile walk time" (7 days)
2. "Complete 16 gym sessions (documented with workout logs)" (21 days)
3. "Cook 12 healthy recipes under 500 calories without reference" (14 days)
4. "Reach target weight loss of 10 pounds (verified by scale)" (42 days)
5. "Complete a 5K run in under 30 minutes (timed and recorded)" (28 days)

Goal: "Learn to play guitar"
Steps:
1. "Play 8 basic chords (G, C, D, Em, Am, F, E, A) with clean sound for 30 seconds each" (14 days)
2. "Play 5 complete songs from memory without stopping" (21 days)
3. "Perform 3 fingerpicking patterns at 60 BPM with metronome" (21 days)
4. "Record yourself playing 3 songs with zero mistakes" (14 days)

Goal: "Start a side business"
Steps:
1. "Complete 50 customer interviews and document 3 validated business ideas" (21 days)
2. "Build working MVP and collect feedback from 20 test users" (28 days)
3. "Generate $1,000 in revenue with 10 paying customers (receipts documented)" (35 days)
4. "Reach $500 monthly recurring revenue for 2 consecutive months" (42 days)`

    const userPrompt = `Please break down this goal into actionable steps:

GOAL: "${goalText}"
${userReason ? `USER'S MOTIVATION: "${userReason}"` : ''}

Generate a structured plan that will help the user achieve this goal successfully.`

    console.log('🤖 [OpenAI] Generating steps for goal:', goalText)
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    })

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
      steps: parsedResponse.steps.map(s => ({ text: s.text, duration: s.estimated_duration_days }))
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
