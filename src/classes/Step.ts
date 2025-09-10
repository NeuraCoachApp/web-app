import { Tables } from '@/src/types/database'
import { Session } from './Session'

export class Step {
  public uuid: string
  public text: string
  public isCompletedFlag: boolean
  public created_at: string
  public end_at: string
  public next_step: string | null
  private _sessions: Session[] = []

  constructor(data: Tables<'step'>) {
    this.uuid = data.uuid || ''
    this.text = data.text || ''
    this.isCompletedFlag = data.isCompleted || false
    this.created_at = data.created_at || new Date().toISOString()
    this.end_at = data.end_at || new Date().toISOString()
    this.next_step = data.next_step
  }

  /**
   * Add a session to this step
   */
  addSession(session: Session): void {
    this._sessions.push(session)
  }

  /**
   * Get all sessions for this step
   */
  getSessions(): Session[] {
    return this._sessions
  }

  /**
   * Check if step is completed based on session progress (100% progress)
   */
  isCompleted(): boolean {
    return this._sessions.some(session => session.getInsight()?.progress === 100)
  }

  /**
   * Get the latest session
   */
  getLatestSession(): Session | null {
    if (this._sessions.length === 0) return null
    return this._sessions.reduce((latest, current) => {
      return new Date(current.created_at) > new Date(latest.created_at) ? current : latest
    })
  }

  /**
   * Get sessions count
   */
  getSessionsCount(): number {
    return this._sessions.length
  }

  /**
   * Get average progress across all sessions
   */
  getAverageProgress(): number {
    if (this._sessions.length === 0) return 0
    const totalProgress = this._sessions.reduce((sum, session) => {
      return sum + (session.getInsight()?.progress || 0)
    }, 0)
    return Math.round(totalProgress / this._sessions.length)
  }

  /**
   * Get average effort level across all sessions
   */
  getAverageEffortLevel(): number {
    if (this._sessions.length === 0) return 0
    const totalEffort = this._sessions.reduce((sum, session) => {
      return sum + (session.getInsight()?.effort_level || 0)
    }, 0)
    return Math.round((totalEffort / this._sessions.length) * 10) / 10
  }

  /**
   * Get average stress level across all sessions
   */
  getAverageStressLevel(): number {
    if (this._sessions.length === 0) return 0
    const totalStress = this._sessions.reduce((sum, session) => {
      return sum + (session.getInsight()?.stress_level || 0)
    }, 0)
    return Math.round((totalStress / this._sessions.length) * 10) / 10
  }

  /**
   * Get formatted creation date
   */
  getFormattedCreatedDate(): string {
    if (!this.created_at) return 'Unknown'
    return new Date(this.created_at).toLocaleDateString()
  }

  /**
   * Get formatted end date
   */
  getFormattedEndDate(): string {
    if (!this.end_at) return 'Unknown'
    return new Date(this.end_at).toLocaleDateString()
  }

  /**
   * Check if step is currently active (within date range)
   */
  isActive(): boolean {
    if (!this.created_at || !this.end_at) return false
    const now = new Date()
    const startDate = new Date(this.created_at)
    const endDate = new Date(this.end_at)
    return now >= startDate && now <= endDate
  }

  /**
   * Check if step is overdue
   */
  isOverdue(): boolean {
    if (!this.end_at) return false
    const now = new Date()
    const endDate = new Date(this.end_at)
    return now > endDate && !this.isCompleted()
  }

  /**
   * Get days remaining until end date
   */
  getDaysRemaining(): number {
    if (!this.end_at) return 0
    const now = new Date()
    const endDate = new Date(this.end_at)
    const diffTime = endDate.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Convert to plain object (for JSON serialization)
   */
  toJSON(): any {
    return {
      uuid: this.uuid,
      text: this.text,
      isCompleted: this.isCompletedFlag,
      created_at: this.created_at,
      end_at: this.end_at,
      next_step: this.next_step,
      sessions: this._sessions.map(session => session.toJSON())
    }
  }

  /**
   * Create Step instance from database row
   */
  static fromDatabase(data: Tables<'step'>): Step {
    return new Step(data)
  }

  /**
   * Create Step instance from database row with sessions
   */
  static fromDatabaseWithSessions(data: Tables<'step'>, sessions: Session[] = []): Step {
    const step = new Step(data)
    sessions.forEach(session => step.addSession(session))
    return step
  }
}
