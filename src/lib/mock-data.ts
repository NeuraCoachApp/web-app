import { supabase } from './supabase'
import { Tables } from '@/src/types/database'
import { Goal, Step, Session, Insight } from '@/src/classes'
import { SessionWithGoalAndInsight } from '@/src/hooks/useGoals'


// Sample goal and step data - Each step is a binary yes/no action
const SAMPLE_GOALS = [
  {
    text: "Build a Sustainable Morning Routine",
    steps: [
      "Wake up at 6:00 AM",
      "Drink a glass of water upon waking",
      "Complete 10 minutes of meditation",
      "Write in gratitude journal for 5 minutes",
      "Do 15 minutes of light stretching",
      "Eat a healthy breakfast",
      "Review daily priorities and goals",
      "Read for 20 minutes",
      "Take a cold shower",
      "Set positive intentions for the day"
    ]
  },
  {
    text: "Learn Spanish Fluently in 6 Months",
    steps: [
      "Complete today's Duolingo lesson",
      "Watch 30 minutes of Spanish content",
      "Practice speaking for 15 minutes",
      "Learn 10 new Spanish vocabulary words",
      "Listen to Spanish podcast during commute",
      "Read one Spanish news article",
      "Write journal entry in Spanish",
      "Attend Spanish conversation group meeting",
      "Complete grammar lesson online",
      "Research Spanish-speaking travel destinations"
    ]
  },
  {
    text: "Launch My Side Business",
    steps: [
      "Complete market research analysis",
      "Define target audience personas",
      "Write business plan draft",
      "Register business name and get licenses",
      "Build MVP prototype",
      "Create brand logo and guidelines",
      "Launch business website",
      "Release beta version to test users",
      "Collect and analyze user feedback",
      "Execute first marketing campaign"
    ]
  },
  {
    text: "Get Fit and Healthy",
    steps: [
      "Complete 30-minute workout",
      "Drink 8 glasses of water",
      "Eat 5 servings of fruits and vegetables",
      "Take 10,000 steps",
      "Get 8 hours of sleep",
      "Prepare healthy meals for tomorrow",
      "Do 10 minutes of stretching",
      "Track calories and macros",
      "Take vitamins and supplements",
      "Meditate for stress relief"
    ]
  },
  {
    text: "Master Guitar Playing",
    steps: [
      "Practice scales for 15 minutes",
      "Learn one new chord",
      "Play through favorite song",
      "Practice fingerpicking technique",
      "Record today's practice session",
      "Watch guitar tutorial video",
      "Tune guitar properly",
      "Practice rhythm patterns",
      "Work on chord transitions",
      "Play with metronome for timing"
    ]
  }
]

// Sample insight summaries for binary yes/no actions
const INSIGHT_SUMMARIES = [
  "Successfully completed this step! Great job staying committed to your goal.",
  "Accomplished this task despite some initial resistance. Building discipline!",
  "Knocked this one out efficiently. You're developing a strong routine.",
  "Completed with focus and intention. Quality execution today.",
  "Got it done even though motivation was low. That's real progress.",
  "Finished this step and discovered it was easier than expected.",
  "Pushed through and completed it. Overcoming resistance builds strength.",
  "Executed this step smoothly. You're getting into a good rhythm.",
  "Completed successfully after adjusting your approach. Flexibility wins.",
  "Achieved this step and it felt like a meaningful milestone.",
  "Completed this in a focused flow state. Excellent concentration.",
  "Got it done despite obstacles. Resilience is your superpower.",
  "Finished this step and made valuable connections in the process.",
  "Completed efficiently with an improved method. Great optimization!",
  "Successfully completed this step. Small consistent wins add up big."
]

/**
 * Generate random number between min and max (inclusive)
 */
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generate random date within the last N days
 */
function randomDateWithinDays(days: number): string {
  const now = new Date()
  const pastDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))
  const randomTime = pastDate.getTime() + Math.random() * (now.getTime() - pastDate.getTime())
  return new Date(randomTime).toISOString()
}

/**
 * Generate a specific date within the last N days
 */
function getDateNDaysAgo(daysAgo: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date
}

/**
 * Generate client-side mock goal with steps and sessions (no database insertion)
 * Creates sequential step progression where:
 * - Only first N steps are completed (40-70% completion rate)
 * - Steps are ordered chronologically by deadline from goal start date
 * - Each step gets a deadline progressively later from goal start (step 1, 2, 3... in order)
 * - This creates a natural timeline showing goal progression from start to finish
 */
export function generateMockGoalData(userId: string): { success: boolean; data?: Goal; error?: any } {
  try {
    console.log('🎯 Generating 7-day scheduled mock goal data for user:', userId)

    // Select a random goal template
    const goalTemplate = SAMPLE_GOALS[Math.floor(Math.random() * SAMPLE_GOALS.length)]
    
    // Goal was created 7 days ago
    const goalStartDate = getDateNDaysAgo(7)
    
    // Create Goal class instance
    const goal = new Goal({
      uuid: `goal-${Date.now()}`,
      text: goalTemplate.text,
      created_at: goalStartDate.toISOString(),
      end_at: new Date(goalStartDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from goal start
    })

    console.log('✅ Created mock goal:', goal.text, 'started 7 days ago')

    // Create step UUIDs
    const stepUuids: string[] = []
    for (let i = 0; i < goalTemplate.steps.length; i++) {
      const stepUuid = `step-${Date.now()}-${i}`
      stepUuids.push(stepUuid)
    }

    // Create sequential step progression with proper deadline ordering
    const totalSteps = Math.min(goalTemplate.steps.length, 10) // Use up to 10 steps
    
    // Determine how many steps should be completed (realistic progression over 7 days)
    // Complete 40-70% of steps to show realistic progress
    const completionRate = randomBetween(40, 70) / 100
    const stepsToComplete = Math.floor(totalSteps * completionRate)
    
    console.log(`📊 Planning to complete ${stepsToComplete} out of ${totalSteps} steps (${Math.round(completionRate * 100)}% completion rate)`)
    
    // Track step completion - only sequential completion allowed
    let stepsCompleted: boolean[] = new Array(totalSteps).fill(false)
    
    // Mark first N steps as completed in sequence
    for (let i = 0; i < stepsToComplete; i++) {
      stepsCompleted[i] = true
    }
    
    // Create a schedule where completed steps get sessions in earlier days
    // and incomplete steps get sessions in later days
    const dailySchedule: { [day: number]: number[] } = {}
    
    // Initialize all days with empty arrays
    for (let day = 0; day < 7; day++) {
      dailySchedule[day] = []
    }
    
    // Distribute completed steps across first 5 days (days 0-4)
    const completedDays = 5
    let completedStepsAssigned = 0
    
    for (let day = 0; day < completedDays && completedStepsAssigned < stepsToComplete; day++) {
      // Assign 1-2 completed steps per day
      const stepsForDay = Math.min(randomBetween(1, 2), stepsToComplete - completedStepsAssigned)
      
      for (let i = 0; i < stepsForDay && completedStepsAssigned < stepsToComplete; i++) {
        dailySchedule[day].push(completedStepsAssigned)
        completedStepsAssigned++
      }
    }
    
    // Assign remaining incomplete steps to later days (days 5-6)
    // Focus on the next 1-2 steps that user is currently working on
    const incompleteDays = [5, 6]
    const currentWorkingStepIndex = stepsToComplete // First incomplete step
    
    if (currentWorkingStepIndex < totalSteps) {
      // Assign current working step to day 5
      dailySchedule[5].push(currentWorkingStepIndex)
      
      // Maybe assign next step to day 6 if it exists
      if (currentWorkingStepIndex + 1 < totalSteps && Math.random() < 0.6) {
        dailySchedule[6].push(currentWorkingStepIndex + 1)
      }
    }
    
    // Ensure every day has at least one step
    for (let day = 0; day < 7; day++) {
      if (dailySchedule[day].length === 0) {
        if (day < 5 && stepsToComplete > 0) {
          // Early days should have completed steps
          const randomCompletedStep = Math.floor(Math.random() * stepsToComplete)
          dailySchedule[day].push(randomCompletedStep)
        } else {
          // Later days should have current working step
          const workingStep = Math.min(stepsToComplete, totalSteps - 1)
          dailySchedule[day].push(workingStep)
        }
      }
    }

    console.log('📅 Sequential daily schedule:', dailySchedule)
    console.log('📊 Steps completion status:', stepsCompleted)

    // Create steps with proper deadline ordering
    // Steps should have deadlines that result in incomplete steps appearing first when sorted
    for (let i = 0; i < totalSteps; i++) {
      const stepText = goalTemplate.steps[i]
      
      // Find which days this step is assigned to (it might appear on multiple days)
      const assignedDays = Object.keys(dailySchedule).filter(day => 
        dailySchedule[parseInt(day)].includes(i)
      ).map(day => parseInt(day))
      
      // Step creation date: all steps were created when goal started (7 days ago)
      const stepCreatedAt = new Date(goalStartDate)
      stepCreatedAt.setHours(6, 0, 0, 0) // 6 AM
      
      // Step end date logic: chronological ordering from goal start date
      // Each step gets a deadline that's progressively later from the goal start
      // This creates a natural timeline progression regardless of completion status
      let stepEndAt: Date
      
      // Calculate step deadline as goal start + (step index * days per step)
      // Spread steps across the goal duration (7 days) plus some buffer
      const goalDurationDays = 7
      const totalDurationDays = goalDurationDays + 3 // Add 3 days buffer for incomplete steps
      const daysPerStep = totalDurationDays / totalSteps
      const stepDeadlineDays = Math.ceil((i + 1) * daysPerStep)
      
      stepEndAt = new Date(goalStartDate)
      stepEndAt.setDate(stepEndAt.getDate() + stepDeadlineDays)
      stepEndAt.setHours(23, 59, 59, 999)
      
      // Create Step class instance
      const step = new Step({
        uuid: stepUuids[i],
        text: stepText,
        isCompleted: false, // Will be determined by session progress
        created_at: stepCreatedAt.toISOString(),
        end_at: stepEndAt.toISOString(),
        next_step: i < totalSteps - 1 ? stepUuids[i + 1] : null
      })

      // Generate sessions for each day this step is assigned
      const isStepCompleted = stepsCompleted[i]
      let allSessions: { dayIndex: number; sessionDate: Date; sessionTime: Date }[] = []
      
      // Only create sessions for days that have this step assigned
      if (assignedDays.length > 0) {
        for (const dayIndex of assignedDays) {
          const sessionDate = getDateNDaysAgo(6 - dayIndex)
          
          // Generate 1-2 sessions for this step on this day
          const sessionsThisDay = randomBetween(1, 2)
          
          for (let j = 0; j < sessionsThisDay; j++) {
            // Create session at random time during the day
            const sessionTime = new Date(sessionDate)
            sessionTime.setHours(
              randomBetween(8, 20), // Between 8 AM and 8 PM
              randomBetween(0, 59),
              randomBetween(0, 59)
            )
            
            allSessions.push({ dayIndex, sessionDate, sessionTime })
          }
        }
        
        // Sort sessions chronologically to identify the last one
        allSessions.sort((a, b) => a.sessionTime.getTime() - b.sessionTime.getTime())
      }
      
      // Create sessions with proper progress values
      allSessions.forEach((sessionInfo, sessionIndex) => {
        const isLastSession = sessionIndex === allSessions.length - 1
        
        // Determine progress for this session
        let progress: number
        if (isStepCompleted && isLastSession) {
          // Last session of a completed step MUST be 100%
          progress = 100
        } else if (isStepCompleted) {
          // Earlier sessions of completed steps have high but not 100% progress
          progress = randomBetween(60, 95)
        } else {
          // Incomplete steps have partial progress, never 100%
          progress = randomBetween(20, 85)
        }
        
        // Create Insight class instance
        const insight = new Insight({
          uuid: `insight-${Date.now()}-${i}-${sessionIndex}-${sessionInfo.dayIndex}`,
          summary: progress === 100 
            ? `Completed: ${stepText.substring(0, 60)}${stepText.length > 60 ? '...' : ''}` 
            : `Working on: ${stepText.substring(0, 60)}${stepText.length > 60 ? '...' : ''}`,
          progress,
          effort_level: randomBetween(3, 10),
          stress_level: randomBetween(1, 7),
          step_uuid: stepUuids[i],
          created_at: sessionInfo.sessionTime.toISOString()
        })
        insight.setStep(step)

        // Create Session class instance
        const session = new Session({
          uuid: `session-${Date.now()}-${i}-${sessionIndex}-${sessionInfo.dayIndex}`,
          created_at: sessionInfo.sessionTime.toISOString(),
          goal_uuid: goal.uuid,
          insight_uuid: insight.uuid,
          user_uuid: userId
        })
        session.setGoal(goal)
        session.setInsight(insight)

        step.addSession(session)
      })
      
      // Log sessions per day
      if (assignedDays.length > 0) {
        const sessionsByDay = assignedDays.map(dayIndex => {
          const sessionsThisDay = allSessions.filter(s => s.dayIndex === dayIndex).length
          console.log(`📝 Created ${sessionsThisDay} sessions for step "${stepText.substring(0, 30)}..." on day ${dayIndex + 1}`)
          return sessionsThisDay
        })
      }
      
      console.log(`✅ Created step "${stepText.substring(0, 30)}..." with ${step.getSessions().length} total sessions (completed: ${isStepCompleted}) [deadline: ${stepEndAt.toDateString()}]`)
      goal.addStep(step)
    }

    // Log the schedule summary
    console.log('📊 7-Day Sequential Schedule Summary:')
    for (let day = 0; day < 7; day++) {
      const date = getDateNDaysAgo(6 - day)
      const stepIndices = dailySchedule[day] || []
      const stepNames = stepIndices.map(i => `Step ${i + 1}${stepsCompleted[i] ? '✅' : '⭕'}`).join(', ')
      const totalSessions = stepIndices.reduce((sum, stepIndex) => {
        const step = goal.getSteps()[stepIndex]
        return sum + (step?.getSessions().filter(session => {
          const sessionDate = new Date(session.created_at)
          return sessionDate.toDateString() === date.toDateString()
        }).length || 0)
      }, 0)
      
      console.log(`  Day ${day + 1} (${date.toDateString()}): ${stepIndices.length} steps assigned [${stepNames}], ${totalSessions} sessions`)
    }

    // Log the final step ordering as it will appear in the timeline
    const finalSteps = goal.getSteps()
    console.log('🎯 Final Step Order (chronological by deadline from goal start):')
    finalSteps.forEach((step, index) => {
      const status = step.isCompleted() ? '✅ Completed' : '⭕ Incomplete'
      const deadline = step.getFormattedEndDate()
      const originalIndex = stepUuids.findIndex(uuid => uuid === step.uuid)
      console.log(`  ${index + 1}. [Step ${originalIndex + 1}] ${step.text.substring(0, 35)}... [${status}] [Deadline: ${deadline}]`)
    })

    console.log('🎉 Successfully generated sequential mock goal data!')
    console.log(`📊 Created: 1 goal with ${goal.getTotalStepsCount()} steps and ${goal.getTotalSessionsCount()} total sessions`)
    console.log(`📈 Progress: ${stepsToComplete}/${totalSteps} steps completed (${Math.round((stepsToComplete/totalSteps) * 100)}%)`)
    
    return { success: true, data: goal }
  } catch (error) {
    console.error('Error generating 7-day scheduled mock goal data:', error)
    return { success: false, error }
  }
}

// Client-side mock data store - now supports multiple goals per user
let mockGoalsStore: { [userId: string]: Goal[] } = {}

/**
 * Generate mock data for current authenticated user (client-side only)
 */
export async function generateMockDataForCurrentUser(): Promise<{ success: boolean; data?: Goal; error?: any }> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('No authenticated user found:', userError)
      return { success: false, error: userError || 'No authenticated user' }
    }

    const result = generateMockGoalData(user.id)
    
    if (result.success && result.data) {
      // Store the mock data for this user (add to existing goals or create new array)
      if (!mockGoalsStore[user.id]) {
        mockGoalsStore[user.id] = []
      }
      mockGoalsStore[user.id].push(result.data)
      console.log(`🗃️ Stored mock goal with ${result.data.getTotalStepsCount()} steps for user ${user.id}. Total goals: ${mockGoalsStore[user.id].length}`)
    }
    
    return result
  } catch (error) {
    console.error('Error getting current user:', error)
    return { success: false, error }
  }
}

/**
 * Get all mock goals for a user
 */
export function getMockGoals(userId: string): Goal[] {
  return mockGoalsStore[userId] || []
}

/**
 * Get mock goal for a user (first goal for backward compatibility)
 */
export function getMockGoal(userId: string): Goal | null {
  const goals = mockGoalsStore[userId]
  return goals && goals.length > 0 ? goals[0] : null
}

/**
 * Get specific mock goal by index
 */
export function getMockGoalByIndex(userId: string, index: number): Goal | null {
  const goals = mockGoalsStore[userId]
  return goals && goals[index] ? goals[index] : null
}

/**
 * Get mock sessions for a user (flattened from all goals)
 */
export function getMockSessions(userId: string): SessionWithGoalAndInsight[] {
  const goals = mockGoalsStore[userId]
  if (!goals) return []
  
  // Convert Session class instances to SessionWithGoalAndInsight format
  return goals.flatMap(goal => 
    goal.getAllSessions().map(session => ({
      goal: {
        uuid: goal.uuid,
        text: goal.text,
        created_at: goal.created_at,
        end_at: goal.end_at
      } as Tables<'goal'>,
      insight: {
        uuid: session.getInsight()?.uuid || '',
        summary: session.getInsight()?.summary || '',
        progress: session.getInsight()?.progress || 0,
        effort_level: session.getInsight()?.effort_level || 0,
        stress_level: session.getInsight()?.stress_level || 0,
        step_uuid: session.getInsight()?.step_uuid || '',
        created_at: session.getInsight()?.created_at || session.created_at
      } as Tables<'insight'>,
      created_at: session.created_at
    }))
  )
}

/**
 * Sort steps based on completion status and next_step linked list relationship
 * Completed steps appear first, then incomplete steps in their natural order
 * @deprecated Use Step class methods instead
 */
export function sortStepsByNextStep(steps: Step[]): Step[] {
  if (steps.length === 0) return []
  
  // First, build the complete ordered chain using next_step relationships
  const referencedSteps = new Set(steps.map(step => step.next_step).filter(Boolean))
  const firstStep = steps.find(step => !referencedSteps.has(step.uuid))
  
  if (!firstStep) {
    console.warn('Could not find first step, sorting by completion status only')
    return [...steps].sort((a, b) => {
      const aCompleted = a.isCompleted()
      const bCompleted = b.isCompleted()
      if (aCompleted === bCompleted) return 0
      return aCompleted ? -1 : 1 // Completed steps first
    })
  }
  
  // Build the complete ordered list by following next_step references
  const completeOrderedSteps: Step[] = []
  const stepMap = new Map(steps.map(step => [step.uuid, step]))
  
  let currentStep: Step | undefined = firstStep
  while (currentStep) {
    completeOrderedSteps.push(currentStep)
    currentStep = currentStep.next_step ? stepMap.get(currentStep.next_step) : undefined
  }
  
  // Now separate completed and incomplete steps while maintaining their relative order
  const completedSteps = completeOrderedSteps.filter(step => step.isCompleted())
  const incompleteSteps = completeOrderedSteps.filter(step => !step.isCompleted())
  
  // Return completed steps first, then incomplete steps
  const finalOrder = [...completedSteps, ...incompleteSteps]
  
  console.log(`🔗 Sorted ${finalOrder.length} steps: ${completedSteps.length} completed first, then ${incompleteSteps.length} incomplete`)
  console.log(`📋 Order: ${finalOrder.map((s, i) => `${i + 1}.${s.isCompleted() ? '✅' : '⭕'}`).join(' ')}`)
  
  return finalOrder
}

/**
 * Clear mock data for a user
 */
export function clearMockSessions(userId: string): void {
  delete mockGoalsStore[userId]
  console.log(`🗑️ Cleared mock goal data for user ${userId}`)
}

/**
 * Generate additional mock goal for a user
 */
export function generateAdditionalMockGoal(userId: string): { success: boolean; data?: Goal; error?: any } {
  const result = generateMockGoalData(userId)
  
  if (result.success && result.data) {
    if (!mockGoalsStore[userId]) {
      mockGoalsStore[userId] = []
    }
    mockGoalsStore[userId].push(result.data)
    console.log(`➕ Added additional goal for user ${userId}. Total goals: ${mockGoalsStore[userId].length}`)
  }
  
  return result
}

/**
 * Utility function to check if user has any goals
 */
export async function userHasGoals(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_goal')
      .select('id')
      .eq('user_uuid', userId)
      .limit(1)

    if (error) {
      console.error('Error checking user goals:', error)
      return false
    }

    return data && data.length > 0
  } catch (error) {
    console.error('Error checking user goals:', error)
    return false
  }
}

/**
 * Development utility - generate mock data if none exists
 */
export async function ensureMockDataExists(userId: string): Promise<void> {
  try {
    const hasGoals = await userHasGoals(userId)
    
    if (!hasGoals) {
      console.log('🔄 No goals found, generating mock data...')
      const result = await generateMockDataForCurrentUser()
      
      if (result.success) {
        console.log('✅ Mock data generated successfully')
      } else {
        console.error('❌ Failed to generate mock data:', result.error)
      }
    } else {
      console.log('✅ User already has goals, skipping mock data generation')
    }
  } catch (error) {
    console.error('Error ensuring mock data exists:', error)
  }
}
