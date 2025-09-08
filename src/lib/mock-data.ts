import { supabase } from './supabase'
import { Tables } from '@/src/types/database'
import { SessionWithGoalAndInsight } from '@/src/hooks/useGoals'

type Goal = Tables<'goal'>
type Step = Tables<'step'>
type Session = Tables<'session'>
type Insight = Tables<'insight'>
type UserGoal = Tables<'user_goal'>
type GoalSteps = Tables<'goal_steps'>

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
 * Generate mock insight data
 */
function generateMockInsight(): Omit<Insight, 'uuid' | 'created_at'> {
  return {
    summary: INSIGHT_SUMMARIES[Math.floor(Math.random() * INSIGHT_SUMMARIES.length)],
    progress: randomBetween(10, 95),
    effort_level: randomBetween(3, 10),
    stress_level: randomBetween(1, 7)
  }
}

// Define the structure for steps with sessions
export interface StepWithSessions {
  uuid: string
  text: string
  isCompleted: boolean
  created_at: string
  end_at: string
  next_step: string | null
  sessions: SessionWithGoalAndInsight[]
}

export interface GoalWithStepsAndSessions {
  uuid: string
  text: string
  created_at: string
  end_at: string
  steps: StepWithSessions[]
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
 * Creates a 7-day schedule where each day has assigned steps
 */
export function generateMockGoalData(userId: string): { success: boolean; data?: GoalWithStepsAndSessions; error?: any } {
  try {
    console.log('🎯 Generating 7-day scheduled mock goal data for user:', userId)

    // Select a random goal template
    const goalTemplate = SAMPLE_GOALS[Math.floor(Math.random() * SAMPLE_GOALS.length)]
    
    // Goal was created 7 days ago
    const goalStartDate = getDateNDaysAgo(7)
    
    // Create mock goal data
    const mockGoal = {
      uuid: `goal-${Date.now()}`,
      text: goalTemplate.text,
      created_at: goalStartDate.toISOString(),
      end_at: new Date(goalStartDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from goal start
    }

    console.log('✅ Created mock goal:', mockGoal.text, 'started 7 days ago')

    const mockSteps: StepWithSessions[] = []

    // Create step UUIDs
    const stepUuids: string[] = []
    for (let i = 0; i < goalTemplate.steps.length; i++) {
      const stepUuid = `step-${Date.now()}-${i}`
      stepUuids.push(stepUuid)
    }

    // Create a 7-day schedule with sequential step progression
    const dailySchedule: { [day: number]: number[] } = {}
    const totalSteps = Math.min(goalTemplate.steps.length, 10) // Use up to 10 steps
    
    // Initialize all days with empty arrays
    for (let day = 0; day < 7; day++) {
      dailySchedule[day] = []
    }
    
    // Track step progression and completion
    let currentStepIndex = 0
    let stepsCompleted: boolean[] = new Array(totalSteps).fill(false)
    
    // Assign steps day by day, ensuring sequential progression
    for (let day = 0; day < 7; day++) {
      // Each day should have 1-3 steps assigned
      const stepsForDay = randomBetween(1, 3)
      let stepsAssignedToday = 0
      
      // First, assign the current step (if available)
      if (currentStepIndex < totalSteps) {
        dailySchedule[day].push(currentStepIndex)
        stepsAssignedToday++
        
        // Determine if this step will be completed today (70% chance)
        const willCompleteToday = Math.random() < 0.7
        if (willCompleteToday) {
          stepsCompleted[currentStepIndex] = true
          currentStepIndex++ // Move to next step
        }
      }
      
      // Add additional steps for this day if needed and available
      while (stepsAssignedToday < stepsForDay && currentStepIndex < totalSteps) {
        // Can only assign next step if all previous steps are completed
        const canAssignNextStep = stepsCompleted[currentStepIndex - 1] !== false || currentStepIndex === 0
        
        if (canAssignNextStep) {
          dailySchedule[day].push(currentStepIndex)
          stepsAssignedToday++
          
          // 50% chance to complete additional steps on the same day
          const willCompleteToday = Math.random() < 0.5
          if (willCompleteToday) {
            stepsCompleted[currentStepIndex] = true
            currentStepIndex++
          } else {
            // Don't assign more steps if we can't complete this one
            break
          }
        } else {
          break
        }
      }
      
      // If no new steps were assigned and we still have incomplete steps, 
      // assign an existing incomplete step for retry
      if (stepsAssignedToday === 0 && currentStepIndex > 0) {
        // Find the most recent incomplete step
        for (let i = currentStepIndex - 1; i >= 0; i--) {
          if (!stepsCompleted[i]) {
            dailySchedule[day].push(i)
            // 80% chance to complete it on retry
            if (Math.random() < 0.8) {
              stepsCompleted[i] = true
              if (i === currentStepIndex - 1) {
                currentStepIndex = Math.min(currentStepIndex + 1, totalSteps)
              }
            }
            break
          }
        }
      }
    }
    
    // Ensure every day has at least one step
    for (let day = 0; day < 7; day++) {
      if (dailySchedule[day].length === 0) {
        // Assign the current available step or a previous incomplete step
        if (currentStepIndex < totalSteps) {
          dailySchedule[day].push(currentStepIndex)
        } else {
          // Find any incomplete step to retry
          const incompleteStep = stepsCompleted.findIndex(completed => !completed)
          if (incompleteStep !== -1) {
            dailySchedule[day].push(incompleteStep)
          } else {
            // All steps complete, assign the last step for maintenance
            dailySchedule[day].push(Math.max(0, currentStepIndex - 1))
          }
        }
      }
    }

    console.log('📅 Sequential daily schedule:', dailySchedule)
    console.log('📊 Steps completion status:', stepsCompleted)

    // Create steps with proper scheduling and sessions
    for (let i = 0; i < totalSteps; i++) {
      const stepText = goalTemplate.steps[i]
      
      // Find which days this step is assigned to (it might appear on multiple days)
      const assignedDays = Object.keys(dailySchedule).filter(day => 
        dailySchedule[parseInt(day)].includes(i)
      ).map(day => parseInt(day))
      
      // Use the first assigned day for step creation date
      const primaryDayIndex = assignedDays[0] || 0
      const stepDate = getDateNDaysAgo(6 - primaryDayIndex)
      
      // Step is created at the beginning of its first assigned day
      const stepCreatedAt = new Date(stepDate)
      stepCreatedAt.setHours(6, 0, 0, 0) // 6 AM
      
      // Step ends at the end of its last assigned day (or same day if only one)
      const lastDayIndex = assignedDays[assignedDays.length - 1] || primaryDayIndex
      const stepEndDate = getDateNDaysAgo(6 - lastDayIndex)
      const stepEndAt = new Date(stepEndDate)
      stepEndAt.setHours(23, 59, 59, 999) // 11:59 PM
      
      const mockStep: StepWithSessions = {
        uuid: stepUuids[i],
        text: stepText,
        isCompleted: false, // Will be determined by session progress
        created_at: stepCreatedAt.toISOString(),
        end_at: stepEndAt.toISOString(),
        next_step: i < totalSteps - 1 ? stepUuids[i + 1] : null,
        sessions: []
      }

      // Generate sessions for each day this step is assigned
      const isStepCompleted = stepsCompleted[i]
      let allSessions: { dayIndex: number; sessionDate: Date; sessionTime: Date }[] = []
      
      // First, collect all session times across all days
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
        
        // Create mock insight
        const mockInsight = {
          uuid: `insight-${Date.now()}-${i}-${sessionIndex}-${sessionInfo.dayIndex}`,
          summary: progress === 100 
            ? `Completed: ${stepText.substring(0, 60)}${stepText.length > 60 ? '...' : ''}` 
            : `Working on: ${stepText.substring(0, 60)}${stepText.length > 60 ? '...' : ''}`,
          progress,
          effort_level: randomBetween(3, 10),
          stress_level: randomBetween(1, 7),
          created_at: sessionInfo.sessionTime.toISOString()
        }

        const mockSession: SessionWithGoalAndInsight = {
          goal: mockGoal,
          insight: mockInsight,
          created_at: sessionInfo.sessionTime.toISOString()
        }

        mockStep.sessions.push(mockSession)
      })
      
      // Log sessions per day
      const sessionsByDay = assignedDays.map(dayIndex => {
        const sessionsThisDay = allSessions.filter(s => s.dayIndex === dayIndex).length
        console.log(`📝 Created ${sessionsThisDay} sessions for step "${stepText.substring(0, 30)}..." on day ${dayIndex + 1}`)
        return sessionsThisDay
      })
      
      console.log(`✅ Created step "${stepText.substring(0, 30)}..." with ${mockStep.sessions.length} total sessions (completed: ${isStepCompleted})`)
      mockSteps.push(mockStep)
    }

    const result: GoalWithStepsAndSessions = {
      ...mockGoal,
      steps: mockSteps
    }

    // Log the schedule summary
    console.log('📊 7-Day Sequential Schedule Summary:')
    for (let day = 0; day < 7; day++) {
      const date = getDateNDaysAgo(6 - day)
      const stepIndices = dailySchedule[day] || []
      const stepNames = stepIndices.map(i => `Step ${i + 1}${stepsCompleted[i] ? '✅' : '⭕'}`).join(', ')
      const totalSessions = stepIndices.reduce((sum, stepIndex) => {
        const step = mockSteps[stepIndex]
        return sum + (step?.sessions.filter(session => {
          const sessionDate = new Date(session.created_at)
          return sessionDate.toDateString() === date.toDateString()
        }).length || 0)
      }, 0)
      
      console.log(`  Day ${day + 1} (${date.toDateString()}): ${stepIndices.length} steps assigned [${stepNames}], ${totalSessions} sessions`)
    }

    console.log('🎉 Successfully generated 7-day scheduled mock goal data!')
    console.log(`📊 Created: 1 goal with ${mockSteps.length} steps and ${mockSteps.reduce((acc, step) => acc + step.sessions.length, 0)} total sessions`)
    
    return { success: true, data: result }
  } catch (error) {
    console.error('Error generating 7-day scheduled mock goal data:', error)
    return { success: false, error }
  }
}

// Client-side mock data store - now supports multiple goals per user
let mockGoalsStore: { [userId: string]: GoalWithStepsAndSessions[] } = {}

/**
 * Generate mock data for current authenticated user (client-side only)
 */
export async function generateMockDataForCurrentUser(): Promise<{ success: boolean; data?: GoalWithStepsAndSessions; error?: any }> {
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
      console.log(`🗃️ Stored mock goal with ${result.data.steps.length} steps for user ${user.id}. Total goals: ${mockGoalsStore[user.id].length}`)
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
export function getMockGoals(userId: string): GoalWithStepsAndSessions[] {
  return mockGoalsStore[userId] || []
}

/**
 * Get mock goal for a user (first goal for backward compatibility)
 */
export function getMockGoal(userId: string): GoalWithStepsAndSessions | null {
  const goals = mockGoalsStore[userId]
  return goals && goals.length > 0 ? goals[0] : null
}

/**
 * Get specific mock goal by index
 */
export function getMockGoalByIndex(userId: string, index: number): GoalWithStepsAndSessions | null {
  const goals = mockGoalsStore[userId]
  return goals && goals[index] ? goals[index] : null
}

/**
 * Get mock sessions for a user (flattened from all goals)
 */
export function getMockSessions(userId: string): SessionWithGoalAndInsight[] {
  const goals = mockGoalsStore[userId]
  if (!goals) return []
  
  return goals.flatMap(goal => goal.steps.flatMap(step => step.sessions))
}

// Utility function to check if a step is completed based on 100% progress
function isStepCompleted(step: StepWithSessions): boolean {
  return step.sessions.some(session => session.insight.progress === 100)
}

/**
 * Sort steps based on completion status and next_step linked list relationship
 * Completed steps appear first, then incomplete steps in their natural order
 */
export function sortStepsByNextStep(steps: StepWithSessions[]): StepWithSessions[] {
  if (steps.length === 0) return []
  
  // First, build the complete ordered chain using next_step relationships
  const referencedSteps = new Set(steps.map(step => step.next_step).filter(Boolean))
  const firstStep = steps.find(step => !referencedSteps.has(step.uuid))
  
  if (!firstStep) {
    console.warn('Could not find first step, sorting by completion status only')
    return [...steps].sort((a, b) => {
      const aCompleted = isStepCompleted(a)
      const bCompleted = isStepCompleted(b)
      if (aCompleted === bCompleted) return 0
      return aCompleted ? -1 : 1 // Completed steps first
    })
  }
  
  // Build the complete ordered list by following next_step references
  const completeOrderedSteps: StepWithSessions[] = []
  const stepMap = new Map(steps.map(step => [step.uuid, step]))
  
  let currentStep: StepWithSessions | undefined = firstStep
  while (currentStep) {
    completeOrderedSteps.push(currentStep)
    currentStep = currentStep.next_step ? stepMap.get(currentStep.next_step) : undefined
  }
  
  // Now separate completed and incomplete steps while maintaining their relative order
  const completedSteps = completeOrderedSteps.filter(step => isStepCompleted(step))
  const incompleteSteps = completeOrderedSteps.filter(step => !isStepCompleted(step))
  
  // Return completed steps first, then incomplete steps
  const finalOrder = [...completedSteps, ...incompleteSteps]
  
  console.log(`🔗 Sorted ${finalOrder.length} steps: ${completedSteps.length} completed first, then ${incompleteSteps.length} incomplete`)
  console.log(`📋 Order: ${finalOrder.map((s, i) => `${i + 1}.${isStepCompleted(s) ? '✅' : '⭕'}`).join(' ')}`)
  
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
export function generateAdditionalMockGoal(userId: string): { success: boolean; data?: GoalWithStepsAndSessions; error?: any } {
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
