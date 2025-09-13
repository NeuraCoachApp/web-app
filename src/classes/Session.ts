import { Tables, Database } from '@/src/types/database'
import { Goal } from './Goal'

export class Session {
  public uuid: string
  public created_at: string
  public goal_uuid: string
  public user_uuid: string
  public summary: string
  public mood: number
  public motivation: number
  public blocker: string
  public completion: Database["public"]["CompositeTypes"]["task_completion"][] // Array of task completion objects
  private _goal?: Goal

  constructor(data: Tables<'session'>) {
    this.uuid = data.uuid
    this.created_at = data.created_at
    this.goal_uuid = data.goal_uuid
    this.user_uuid = data.user_uuid
    this.summary = data.summary
    this.mood = data.mood
    this.motivation = data.motivation
    this.blocker = data.blocker
    this.completion = data.completion || []
  }

  /**
   * Set the associated goal
   */
  setGoal(goal: Goal): void {
    this._goal = goal
  }

  /**
   * Get the associated goal
   */
  getGoal(): Goal | undefined {
    return this._goal
  }

  /**
   * Get mood as percentage (0-100)
   */
  getMoodPercentage(): number {
    return Math.round((this.mood / 10) * 100)
  }

  /**
   * Get motivation as percentage (0-100)
   */
  getMotivationPercentage(): number {
    return Math.round((this.motivation / 10) * 100)
  }

  /**
   * Get mood description
   */
  getMoodDescription(): string {
    if (this.mood <= 2) return 'Very low'
    if (this.mood <= 4) return 'Low'
    if (this.mood <= 6) return 'Moderate'
    if (this.mood <= 8) return 'Good'
    return 'Excellent'
  }

  /**
   * Get motivation description
   */
  getMotivationDescription(): string {
    if (this.motivation <= 2) return 'Very low'
    if (this.motivation <= 4) return 'Low'
    if (this.motivation <= 6) return 'Moderate'
    if (this.motivation <= 8) return 'High'
    return 'Very high'
  }

  /**
   * Check if session has blockers
   */
  hasBlockers(): boolean {
    return (this.blocker && this.blocker.trim().length > 0) || false
  }

  /**
   * Get completion items count
   */
  getCompletionItemsCount(): number {
    return this.completion.length
  }

  /**
   * Get count of completed tasks
   */
  getCompletedTasksCount(): number {
    return this.completion.filter(item => item.iscompleted === true).length
  }

  /**
   * Get count of incomplete tasks
   */
  getIncompleteTasksCount(): number {
    return this.completion.filter(item => item.iscompleted !== true).length
  }

  /**
   * Get completion percentage (0-100)
   */
  getCompletionPercentage(): number {
    if (this.completion.length === 0) return 0
    return Math.round((this.getCompletedTasksCount() / this.completion.length) * 100)
  }

  /**
   * Check if a specific task is completed
   */
  isTaskCompleted(taskUuid: string): boolean {
    const task = this.completion.find(item => item.task_uuid === taskUuid)
    return task?.iscompleted === true
  }

  /**
   * Get all completed task UUIDs
   */
  getCompletedTaskUuids(): string[] {
    return this.completion
      .filter(item => item.iscompleted === true)
      .map(item => item.task_uuid)
      .filter((uuid): uuid is string => uuid !== null)
  }

  /**
   * Get all incomplete task UUIDs
   */
  getIncompleteTaskUuids(): string[] {
    return this.completion
      .filter(item => item.iscompleted !== true)
      .map(item => item.task_uuid)
      .filter((uuid): uuid is string => uuid !== null)
  }

  /**
   * Add or update a task completion status
   */
  setTaskCompletion(taskUuid: string, isCompleted: boolean): void {
    const existingIndex = this.completion.findIndex(item => item.task_uuid === taskUuid)
    
    if (existingIndex >= 0) {
      this.completion[existingIndex].iscompleted = isCompleted
    } else {
      this.completion.push({ task_uuid: taskUuid, iscompleted: isCompleted })
    }
  }

  /**
   * Remove a task from completion tracking
   */
  removeTaskCompletion(taskUuid: string): void {
    this.completion = this.completion.filter(item => item.task_uuid !== taskUuid)
  }

  /**
   * Add multiple task completions at once (useful for daily check-ins)
   */
  addMultipleTaskCompletions(taskCompletions: { taskUuid: string, isCompleted: boolean }[]): void {
    taskCompletions.forEach(({ taskUuid, isCompleted }) => {
      this.setTaskCompletion(taskUuid, isCompleted)
    })
  }

  /**
   * Get all task UUIDs that were worked on in this session (completed or not)
   */
  getWorkedOnTaskUuids(): string[] {
    return this.completion
      .map(item => item.task_uuid)
      .filter((uuid): uuid is string => uuid !== null)
  }

  /**
   * Check if this session represents a daily check-in (has multiple task completions)
   */
  isDailyCheckIn(): boolean {
    return this.completion.length > 1
  }

  /**
   * Get summary of work done in this session
   */
  getWorkSummary(): { totalTasks: number, completedTasks: number, incompleteTasks: number } {
    const totalTasks = this.completion.length
    const completedTasks = this.getCompletedTasksCount()
    const incompleteTasks = this.getIncompleteTasksCount()
    
    return { totalTasks, completedTasks, incompleteTasks }
  }

  /**
   * Get formatted date
   */
  getFormattedDate(): string {
    return new Date(this.created_at).toLocaleDateString()
  }

  /**
   * Get formatted date and time
   */
  getFormattedDateTime(): string {
    return new Date(this.created_at).toLocaleString()
  }

  /**
   * Get session date as Date object
   */
  getDate(): Date {
    return new Date(this.created_at)
  }

  /**
   * Check if session is from today
   */
  isToday(): boolean {
    const today = new Date()
    const sessionDate = this.getDate()
    return today.toDateString() === sessionDate.toDateString()
  }

  /**
   * Check if session is from this week
   */
  isThisWeek(): boolean {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const sessionDate = this.getDate()
    return sessionDate >= weekAgo && sessionDate <= now
  }

  /**
   * Get days ago this session was created
   */
  getDaysAgo(): number {
    const now = new Date()
    const sessionDate = this.getDate()
    const diffTime = now.getTime() - sessionDate.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Convert to plain object (for JSON serialization)
   */
  toJSON(): {
    uuid: string
    created_at: string
    goal_uuid: string
    user_uuid: string
    summary: string
    mood: number
    motivation: number
    blocker: string
    completion: Database["public"]["CompositeTypes"]["task_completion"][]
    goal?: object
  } {
    return {
      uuid: this.uuid,
      created_at: this.created_at,
      goal_uuid: this.goal_uuid,
      user_uuid: this.user_uuid,
      summary: this.summary,
      mood: this.mood,
      motivation: this.motivation,
      blocker: this.blocker,
      completion: this.completion,
      goal: this._goal?.toJSON()
    }
  }

  /**
   * Create Session instance from database row
   */
  static fromDatabase(data: Tables<'session'>): Session {
    return new Session(data)
  }

  /**
   * Create Session instance from database row with goal
   */
  static fromDatabaseWithGoal(
    data: Tables<'session'>, 
    goal?: Goal
  ): Session {
    const session = new Session(data)
    if (goal) {
      session.setGoal(goal)
    }
    return session
  }
}