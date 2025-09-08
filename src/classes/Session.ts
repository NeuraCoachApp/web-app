import { Tables } from '@/src/types/database'
import { Goal } from './Goal'
import { Insight } from './Insight'

export class Session {
  public uuid: string
  public created_at: string
  public goal_uuid: string
  public insight_uuid: string
  public user_uuid: string
  private _goal?: Goal
  private _insight?: Insight

  constructor(data: Tables<'session'>) {
    this.uuid = data.uuid
    this.created_at = data.created_at
    this.goal_uuid = data.goal_uuid
    this.insight_uuid = data.insight_uuid
    this.user_uuid = data.user_uuid
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
   * Set the associated insight
   */
  setInsight(insight: Insight): void {
    this._insight = insight
  }

  /**
   * Get the associated insight
   */
  getInsight(): Insight | undefined {
    return this._insight
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
  toJSON(): any {
    return {
      uuid: this.uuid,
      created_at: this.created_at,
      goal_uuid: this.goal_uuid,
      insight_uuid: this.insight_uuid,
      user_uuid: this.user_uuid,
      goal: this._goal?.toJSON(),
      insight: this._insight?.toJSON()
    }
  }

  /**
   * Create Session instance from database row
   */
  static fromDatabase(data: Tables<'session'>): Session {
    return new Session(data)
  }

  /**
   * Create Session instance from database row with goal and insight
   */
  static fromDatabaseWithRelations(
    data: Tables<'session'>, 
    goal?: Goal, 
    insight?: Insight
  ): Session {
    const session = new Session(data)
    if (goal) {
      session.setGoal(goal)
    }
    if (insight) {
      session.setInsight(insight)
    }
    return session
  }
}