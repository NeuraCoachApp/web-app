import { Tables } from '@/src/types/database'

export class Task {
  public uuid: string
  public text: string
  public created_at: string
  public start_at: string
  public end_at: string
  public isCompleted: boolean
  public goal_uuid: string
  public milestone_uuid: string

  constructor(data: Tables<'task'>) {
    this.uuid = data.uuid
    this.text = data.text
    this.created_at = data.created_at
    this.start_at = data.start_at
    this.end_at = data.end_at
    this.isCompleted = data.isCompleted
    this.goal_uuid = data.goal_uuid
    this.milestone_uuid = data.milestone_uuid
  }

  /**
   * Get formatted created date
   */
  getFormattedCreatedDate(): string {
    return new Date(this.created_at).toLocaleDateString()
  }

  /**
   * Get formatted start date
   */
  getFormattedStartDate(): string {
    return new Date(this.start_at).toLocaleDateString()
  }

  /**
   * Get formatted end date
   */
  getFormattedEndDate(): string {
    return new Date(this.end_at).toLocaleDateString()
  }

  /**
   * Get created date as Date object
   */
  getCreatedDate(): Date {
    return new Date(this.created_at)
  }

  /**
   * Get start date as Date object
   */
  getStartDate(): Date {
    return new Date(this.start_at)
  }

  /**
   * Get end date as Date object
   */
  getEndDate(): Date {
    return new Date(this.end_at)
  }

  /**
   * Check if task is currently active (within date range)
   */
  isActive(): boolean {
    const now = new Date()
    const startDate = this.getStartDate()
    const endDate = this.getEndDate()
    return now >= startDate && now <= endDate
  }

  /**
   * Check if task is upcoming (starts in the future)
   */
  isUpcoming(): boolean {
    const now = new Date()
    const startDate = this.getStartDate()
    return now < startDate
  }

  /**
   * Check if task is overdue (past end date and not completed)
   */
  isOverdue(): boolean {
    if (this.isCompleted) return false
    const now = new Date()
    const endDate = this.getEndDate()
    return now > endDate
  }

  /**
   * Get days until task starts
   */
  getDaysUntilStart(): number {
    const now = new Date()
    const startDate = this.getStartDate()
    const diffTime = startDate.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get days until task ends
   */
  getDaysUntilEnd(): number {
    const now = new Date()
    const endDate = this.getEndDate()
    const diffTime = endDate.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get days remaining (negative if overdue)
   */
  getDaysRemaining(): number {
    const now = new Date()
    const endDate = this.getEndDate()
    const diffTime = endDate.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get duration of task in days
   */
  getDurationInDays(): number {
    const startDate = this.getStartDate()
    const endDate = this.getEndDate()
    const diffTime = endDate.getTime() - startDate.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Toggle completion status
   */
  toggleCompletion(): void {
    this.isCompleted = !this.isCompleted
  }

  /**
   * Mark task as completed
   */
  markCompleted(): void {
    this.isCompleted = true
  }

  /**
   * Mark task as incomplete
   */
  markIncomplete(): void {
    this.isCompleted = false
  }

  /**
   * Get task status description
   */
  getStatusDescription(): string {
    if (this.isCompleted) return 'Completed'
    if (this.isOverdue()) return 'Overdue'
    if (this.isActive()) return 'Active'
    if (this.isUpcoming()) return 'Upcoming'
    return 'Unknown'
  }

  /**
   * Convert to plain object (for JSON serialization)
   */
  toJSON(): {
    uuid: string
    text: string
    created_at: string
    start_at: string
    end_at: string
    isCompleted: boolean
    goal_uuid: string
    milestone_uuid: string
  } {
    return {
      uuid: this.uuid,
      text: this.text,
      created_at: this.created_at,
      start_at: this.start_at,
      end_at: this.end_at,
      isCompleted: this.isCompleted,
      goal_uuid: this.goal_uuid,
      milestone_uuid: this.milestone_uuid
    }
  }

  /**
   * Create Task instance from database row
   */
  static fromDatabase(data: Tables<'task'>): Task {
    return new Task(data)
  }
}
