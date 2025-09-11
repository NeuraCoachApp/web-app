import { Tables } from '@/src/types/database'

export class Milestone {
  public uuid: string
  public text: string
  public start_at: string
  public end_at: string
  public goal_uuid: string

  constructor(data: Tables<'milestone'>) {
    this.uuid = data.uuid
    this.text = data.text
    this.start_at = data.start_at
    this.end_at = data.end_at
    this.goal_uuid = data.goal_uuid
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
   * Check if milestone is currently active (within date range)
   */
  isActive(): boolean {
    const now = new Date()
    const startDate = this.getStartDate()
    const endDate = this.getEndDate()
    return now >= startDate && now <= endDate
  }

  /**
   * Check if milestone is upcoming (starts in the future)
   */
  isUpcoming(): boolean {
    const now = new Date()
    const startDate = this.getStartDate()
    return now < startDate
  }

  /**
   * Check if milestone is past (ended)
   */
  isPast(): boolean {
    const now = new Date()
    const endDate = this.getEndDate()
    return now > endDate
  }

  /**
   * Get days until milestone starts
   */
  getDaysUntilStart(): number {
    const now = new Date()
    const startDate = this.getStartDate()
    const diffTime = startDate.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get days until milestone ends
   */
  getDaysUntilEnd(): number {
    const now = new Date()
    const endDate = this.getEndDate()
    const diffTime = endDate.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get duration of milestone in days
   */
  getDurationInDays(): number {
    const startDate = this.getStartDate()
    const endDate = this.getEndDate()
    const diffTime = endDate.getTime() - startDate.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Convert to plain object (for JSON serialization)
   */
  toJSON(): any {
    return {
      uuid: this.uuid,
      text: this.text,
      start_at: this.start_at,
      end_at: this.end_at,
      goal_uuid: this.goal_uuid
    }
  }

  /**
   * Create Milestone instance from database row
   */
  static fromDatabase(data: Tables<'milestone'>): Milestone {
    return new Milestone(data)
  }
}
