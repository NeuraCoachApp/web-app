import { supabase } from './supabase'
import { Tables } from '@/src/types/database'
import { Goal, Milestone, Task, Session } from '@/src/classes'

// Sample goal and task data - Each task is a binary yes/no action
const SAMPLE_GOALS = [
  {
    text: "Build a Sustainable Morning Routine",
    milestones: [
      {
        text: "Establish Wake-up Routine",
        tasks: [
          "Wake up at 6:00 AM",
          "Drink a glass of water upon waking",
          "Set positive intentions for the day"
        ]
      },
      {
        text: "Create Mindfulness Practice",
        tasks: [
          "Complete 10 minutes of meditation",
          "Write in gratitude journal for 5 minutes",
          "Do 15 minutes of light stretching"
        ]
      },
      {
        text: "Build Healthy Habits",
        tasks: [
          "Eat a healthy breakfast",
          "Review daily priorities and goals",
          "Read for 20 minutes",
          "Take a cold shower"
        ]
      }
    ]
  },
  {
    text: "Learn Spanish Fluently in 6 Months",
    milestones: [
      {
        text: "Build Daily Practice",
        tasks: [
          "Complete today's Duolingo lesson",
          "Watch 30 minutes of Spanish content",
          "Practice speaking for 15 minutes",
          "Learn 10 new Spanish vocabulary words"
        ]
      },
      {
        text: "Immerse in Spanish Media",
        tasks: [
          "Listen to Spanish podcast during commute",
          "Read one Spanish news article",
          "Write journal entry in Spanish"
        ]
      },
      {
        text: "Practice with Community",
        tasks: [
          "Attend Spanish conversation group meeting",
          "Complete grammar lesson online",
          "Research Spanish-speaking travel destinations"
        ]
      }
    ]
  },
  {
    text: "Launch My Side Business",
    milestones: [
      {
        text: "Research and Planning",
        tasks: [
          "Complete market research analysis",
          "Define target audience personas",
          "Write business plan draft"
        ]
      },
      {
        text: "Legal and Branding",
        tasks: [
          "Register business name and get licenses",
          "Create brand logo and guidelines",
          "Launch business website"
        ]
      },
      {
        text: "Product Development",
        tasks: [
          "Build MVP prototype",
          "Release beta version to test users",
          "Collect and analyze user feedback",
          "Execute first marketing campaign"
        ]
      }
    ]
  },
  {
    text: "Get Fit and Healthy",
    milestones: [
      {
        text: "Daily Fitness Routine",
        tasks: [
          "Complete 30-minute workout",
          "Take 10,000 steps",
          "Do 10 minutes of stretching"
        ]
      },
      {
        text: "Nutrition and Hydration",
        tasks: [
          "Drink 8 glasses of water",
          "Eat 5 servings of fruits and vegetables",
          "Prepare healthy meals for tomorrow",
          "Track calories and macros"
        ]
      },
      {
        text: "Recovery and Wellness",
        tasks: [
          "Get 8 hours of sleep",
          "Take vitamins and supplements",
          "Meditate for stress relief"
        ]
      }
    ]
  },
  {
    text: "Master Guitar Playing",
    milestones: [
      {
        text: "Technical Skills",
        tasks: [
          "Practice scales for 15 minutes",
          "Learn one new chord",
          "Practice fingerpicking technique",
          "Work on chord transitions"
        ]
      },
      {
        text: "Musical Expression",
        tasks: [
          "Play through favorite song",
          "Practice rhythm patterns",
          "Play with metronome for timing"
        ]
      },
      {
        text: "Learning and Recording",
        tasks: [
          "Record today's practice session",
          "Watch guitar tutorial video",
          "Tune guitar properly"
        ]
      }
    ]
  }
]

// Sample session summaries for task completion
const SESSION_SUMMARIES = [
  "Successfully completed this task! Great job staying committed to your goal.",
  "Accomplished this task despite some initial resistance. Building discipline!",
  "Knocked this one out efficiently. You're developing a strong routine.",
  "Completed with focus and intention. Quality execution today.",
  "Got it done even though motivation was low. That's real progress.",
  "Finished this task and discovered it was easier than expected.",
  "Pushed through and completed it. Overcoming resistance builds strength.",
  "Executed this task smoothly. You're getting into a good rhythm.",
  "Completed successfully after adjusting your approach. Flexibility wins.",
  "Achieved this task and it felt like a meaningful milestone.",
  "Completed this in a focused flow state. Excellent concentration.",
  "Got it done despite obstacles. Resilience is your superpower.",
  "Finished this task and made valuable connections in the process.",
  "Completed efficiently with an improved method. Great optimization!",
  "Successfully completed this task. Small consistent wins add up big."
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
 * Generate client-side mock goal with milestones, tasks and sessions (no database insertion)
 * Creates realistic goal progression with:
 * - Multiple milestones with tasks
 * - Some tasks completed, some in progress
 * - Sessions for task progress tracking
 */
export function generateMockGoalData(userId: string): { success: boolean; data?: Goal; error?: any } {
  try {
    console.log('🎯 Generating mock goal data for user:', userId)

    // Select a random goal template
    const goalTemplate = SAMPLE_GOALS[Math.floor(Math.random() * SAMPLE_GOALS.length)]
    
    // Goal was created 7 days ago
    const goalStartDate = getDateNDaysAgo(7)
    
    // Create Goal class instance
    const goal = new Goal({
      uuid: `goal-${Date.now()}`,
      text: goalTemplate.text,
      created_at: goalStartDate.toISOString(),
      init_end_at: new Date(goalStartDate.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from start
      user_uuid: userId
    })

    console.log('✅ Created mock goal:', goal.text)

    // Create milestones and tasks
    let currentDate = new Date(goalStartDate)
    
    goalTemplate.milestones.forEach((milestoneTemplate, milestoneIndex) => {
      // Create milestone
      const milestoneStartDate = new Date(currentDate)
      const milestoneEndDate = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days duration
      
      const milestone = new Milestone({
        uuid: `milestone-${Date.now()}-${milestoneIndex}`,
        text: milestoneTemplate.text,
        start_at: milestoneStartDate.toISOString(),
        end_at: milestoneEndDate.toISOString(),
        goal_uuid: goal.uuid
      })
      
      // Create tasks for this milestone
      milestoneTemplate.tasks.forEach((taskText, taskIndex) => {
        const taskStartDate = new Date(milestoneStartDate.getTime() + taskIndex * 7 * 24 * 60 * 60 * 1000) // 7 days apart
        const taskEndDate = new Date(taskStartDate.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days duration
        
        const isCompleted = Math.random() < 0.6 // 60% chance of completion
        
        const task = new Task({
          uuid: `task-${Date.now()}-${milestoneIndex}-${taskIndex}`,
          text: taskText,
          created_at: goalStartDate.toISOString(),
          start_at: taskStartDate.toISOString(),
          end_at: taskEndDate.toISOString(),
          isCompleted,
          goal_uuid: goal.uuid,
          milestone_uuid: milestone.uuid
        })
        
        // Create 1-3 sessions for each task
        const sessionCount = randomBetween(1, 3)
        for (let sessionIndex = 0; sessionIndex < sessionCount; sessionIndex++) {
          const sessionDate = new Date(taskStartDate.getTime() + sessionIndex * 2 * 24 * 60 * 60 * 1000) // Every 2 days
          sessionDate.setHours(randomBetween(8, 20), randomBetween(0, 59))
          
          const session = new Session({
            uuid: `session-${Date.now()}-${milestoneIndex}-${taskIndex}-${sessionIndex}`,
            created_at: sessionDate.toISOString(),
            goal_uuid: goal.uuid,
            user_uuid: userId,
            summary: SESSION_SUMMARIES[Math.floor(Math.random() * SESSION_SUMMARIES.length)],
            mood: randomBetween(5, 9),
            motivation: randomBetween(5, 9),
            blocker: Math.random() < 0.3 ? "Had some challenges but pushed through" : "",
            completion: isCompleted ? [taskText] : []
          })
          
          session.setGoal(goal)
          goal.addSession(session)
        }
        
        goal.addTask(task)
      })
      
      goal.addMilestone(milestone)
      currentDate = new Date(milestoneEndDate.getTime() + 7 * 24 * 60 * 60 * 1000) // 1 week gap between milestones
    })

    console.log('🎉 Successfully generated mock goal data!')
    console.log(`📊 Created: 1 goal with ${goal.getTotalMilestonesCount()} milestones, ${goal.getTotalTasksCount()} tasks, and ${goal.getTotalSessionsCount()} sessions`)
    console.log(`📈 Progress: ${goal.getCompletedTasksCount()}/${goal.getTotalTasksCount()} tasks completed (${goal.getCompletionPercentage()}%)`)
    
    return { success: true, data: goal }
  } catch (error) {
    console.error('Error generating 7-day scheduled mock goal data:', error)
    return { success: false, error }
  }
}

// Client-side mock data store - now supports multiple goals per user
let mockGoalsStore: { [userId: string]: Goal[] } = {}

/**
 * Generate mock data for current authenticated user and insert into database
 */
export async function generateMockDataForCurrentUser(): Promise<{ success: boolean; data?: Goal; error?: any }> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('No authenticated user found:', userError)
      return { success: false, error: userError || 'No authenticated user' }
    }

    console.log('🎯 Generating and inserting mock goal data into database for user:', user.id)

    // Select a random goal template
    const goalTemplate = SAMPLE_GOALS[Math.floor(Math.random() * SAMPLE_GOALS.length)]
    
    // Create goal in database
    const { data: goalData, error: goalError } = await supabase
      .from('goal')
      .insert({
        text: goalTemplate.text,
        init_end_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
        user_uuid: user.id
      })
      .select()
      .single()

    if (goalError || !goalData) {
      console.error('❌ Failed to create goal:', goalError)
      return { success: false, error: goalError }
    }

    console.log('✅ Created goal in database:', goalData.uuid)

    // Create milestones and tasks for the goal
    for (let milestoneIndex = 0; milestoneIndex < goalTemplate.milestones.length; milestoneIndex++) {
      const milestoneTemplate = goalTemplate.milestones[milestoneIndex]
      const milestoneStartDate = new Date(Date.now() + milestoneIndex * 30 * 24 * 60 * 60 * 1000) // 30 days apart
      const milestoneEndDate = new Date(milestoneStartDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days duration

      // Create milestone in database
      const { data: milestoneData, error: milestoneError } = await supabase
        .from('milestone')
        .insert({
          text: milestoneTemplate.text,
          start_at: milestoneStartDate.toISOString(),
          end_at: milestoneEndDate.toISOString(),
          goal_uuid: goalData.uuid
        })
        .select()
        .single()

      if (milestoneError || !milestoneData) {
        console.warn('⚠️ Failed to create milestone:', milestoneError)
        continue
      }

      console.log('✅ Created milestone:', milestoneData.uuid)

      // Create tasks for this milestone
      for (let taskIndex = 0; taskIndex < milestoneTemplate.tasks.length; taskIndex++) {
        const taskText = milestoneTemplate.tasks[taskIndex]
        const taskStartDate = new Date(milestoneStartDate.getTime() + taskIndex * 7 * 24 * 60 * 60 * 1000) // 7 days apart
        const taskEndDate = new Date(taskStartDate.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days duration

        const { data: taskData, error: taskError } = await supabase
          .from('task')
          .insert({
            text: taskText,
            start_at: taskStartDate.toISOString(),
            end_at: taskEndDate.toISOString(),
            goal_uuid: goalData.uuid,
            milestone_uuid: milestoneData.uuid,
            isCompleted: Math.random() < 0.6 // 60% chance of completion
          })
          .select()
          .single()

        if (taskError || !taskData) {
          console.warn('⚠️ Failed to create task:', taskError)
          continue
        }

        // Create 1-2 sessions for each task
        const sessionCount = Math.floor(Math.random() * 2) + 1
        for (let sessionIndex = 0; sessionIndex < sessionCount; sessionIndex++) {
          const sessionDate = new Date(taskStartDate.getTime() + sessionIndex * 2 * 24 * 60 * 60 * 1000) // Every 2 days
          sessionDate.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60)) // 8AM-8PM

          await supabase
            .from('session')
            .insert({
              goal_uuid: goalData.uuid,
              user_uuid: user.id,
              summary: SESSION_SUMMARIES[Math.floor(Math.random() * SESSION_SUMMARIES.length)],
              mood: Math.floor(Math.random() * 5) + 5, // 5-9
              motivation: Math.floor(Math.random() * 5) + 5, // 5-9
              blocker: Math.random() < 0.3 ? "Had some challenges but pushed through" : "",
              completion: taskData.isCompleted ? [taskText] : [],
              created_at: sessionDate.toISOString()
            })
        }

        console.log('✅ Created task with sessions:', taskData.uuid)
      }
    }

    // Create a Goal class instance for return (though it won't have all the relations populated)
    const goal = new Goal(goalData)
    
    console.log('🎉 Successfully generated and inserted mock data into database!')
    return { success: true, data: goal }
  } catch (error) {
    console.error('❌ Error generating mock data:', error)
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
export function getMockSessions(userId: string): Session[] {
  const goals = mockGoalsStore[userId]
  if (!goals) return []
  
  // Return Session class instances directly
  return goals.flatMap(goal => goal.getSessions())
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
export async function generateAdditionalMockGoal(userId: string): Promise<{ success: boolean; data?: Goal; error?: any }> {
  try {
    return await generateMockDataForCurrentUser()
  } catch (error) {
    console.error('❌ Error generating additional mock goal:', error)
    return { success: false, error }
  }
}

/**
 * Utility function to check if user has any goals
 */
export async function userHasGoals(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('goal')
      .select('uuid')
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
