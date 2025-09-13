import { Tables } from '@/src/types/database'
import { Milestone } from './Milestone'
import { Task } from './Task'
import { Session } from './Session'

export class Goal {
  public uuid: string
  public text: string
  public created_at: string
  public init_end_at: string
  public user_uuid: string
  public milestones: Milestone[] = []
  public tasks: Task[] = []
  public sessions: Session[] = []

  constructor(data: Tables<'goal'>) {
    this.uuid = data.uuid
    this.text = data.text
    this.created_at = data.created_at
    this.init_end_at = data.init_end_at
    this.user_uuid = data.user_uuid
  }

  /**
   * Add a milestone to this goal
   */
  addMilestone(milestone: Milestone): void {
    this.milestones.push(milestone)
  }

  /**
   * Add a task to this goal
   */
  addTask(task: Task): void {
    this.tasks.push(task)
  }

  /**
   * Add a session to this goal
   */
  addSession(session: Session): void {
    this.sessions.push(session)
  }

  /**
   * Get all milestones for this goal, sorted chronologically by start date
   */
  getMilestones(): Milestone[] {
    return [...this.milestones].sort((a, b) => {
      const aStartDate = new Date(a.start_at).getTime()
      const bStartDate = new Date(b.start_at).getTime()
      return aStartDate - bStartDate
    })
  }

  /**
   * Get all tasks for this goal, sorted chronologically by start date
   */
  getTasks(): Task[] {
    return [...this.tasks].sort((a, b) => {
      const aStartDate = new Date(a.start_at).getTime()
      const bStartDate = new Date(b.start_at).getTime()
      return aStartDate - bStartDate
    })
  }

  /**
   * Get all sessions for this goal, sorted by creation date (newest first)
   */
  getSessions(): Session[] {
    return [...this.sessions].sort((a, b) => {
      const aDate = new Date(a.created_at).getTime()
      const bDate = new Date(b.created_at).getTime()
      return bDate - aDate
    })
  }

  /**
   * Get completed tasks count
   */
  getCompletedTasksCount(): number {
    return this.tasks.filter(task => task.isCompleted).length
  }

  /**
   * Get total tasks count
   */
  getTotalTasksCount(): number {
    return this.tasks.length
  }

  /**
   * Get completion percentage based on tasks
   */
  getCompletionPercentage(): number {
    const totalTasks = this.getTotalTasksCount()
    if (totalTasks === 0) return 0
    return Math.round((this.getCompletedTasksCount() / totalTasks) * 100)
  }

  /**
   * Get total milestones count
   */
  getTotalMilestonesCount(): number {
    return this.milestones.length
  }

  /**
   * Get total sessions count
   */
  getTotalSessionsCount(): number {
    return this.sessions.length
  }

  /**
   * Get latest session
   */
  getLatestSession(): Session | null {
    const sessions = this.getSessions()
    return sessions.length > 0 ? sessions[0] : null
  }

  /**
   * Get sessions from the last N days
   */
  getRecentSessions(days: number = 7): Session[] {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    return this.sessions.filter(session => {
      const sessionDate = new Date(session.created_at)
      return sessionDate >= cutoffDate
    })
  }

  /**
   * Convert to plain object (for JSON serialization)
   */
  toJSON(): {
    uuid: string
    text: string
    created_at: string
    init_end_at: string
    user_uuid: string
    milestones: object[]
    tasks: object[]
    sessions: object[]
  } {
    return {
      uuid: this.uuid,
      text: this.text,
      created_at: this.created_at,
      init_end_at: this.init_end_at,
      user_uuid: this.user_uuid,
      milestones: this.milestones.map(milestone => milestone.toJSON()),
      tasks: this.tasks.map(task => task.toJSON()),
      sessions: this.sessions.map(session => session.toJSON())
    }
  }

  /**
   * Create Goal instance from database row with related data
   */
  static fromDatabaseWithRelations(
    goalData: Tables<'goal'>, 
    milestones: Milestone[] = [],
    tasks: Task[] = [],
    sessions: Session[] = []
  ): Goal {
    const goal = new Goal(goalData)
    milestones.forEach(milestone => goal.addMilestone(milestone))
    tasks.forEach(task => goal.addTask(task))
    sessions.forEach(session => goal.addSession(session))
    return goal
  }
}
