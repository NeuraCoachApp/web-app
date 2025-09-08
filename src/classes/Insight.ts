import { Tables } from '@/src/types/database'
import { Step } from './Step'

export class Insight {
  public uuid: string
  public summary: string
  public progress: number
  public effort_level: number
  public stress_level: number
  public step_uuid: string
  public created_at: string
  private _step?: Step

  constructor(data: Tables<'insight'>) {
    this.uuid = data.uuid
    this.summary = data.summary
    this.progress = data.progress
    this.effort_level = data.effort_level
    this.stress_level = data.stress_level
    this.step_uuid = data.step_uuid
    this.created_at = data.created_at
  }

  /**
   * Set the associated step
   */
  setStep(step: Step): void {
    this._step = step
  }

  /**
   * Get the associated step
   */
  getStep(): Step | undefined {
    return this._step
  }

  /**
   * Check if this insight indicates step completion (100% progress)
   */
  isStepCompleted(): boolean {
    return this.progress === 100
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
   * Get effort level as percentage (0-100)
   */
  getEffortLevelPercentage(): number {
    return Math.round((this.effort_level / 10) * 100)
  }

  /**
   * Get stress level as percentage (0-100)
   */
  getStressLevelPercentage(): number {
    return Math.round((this.stress_level / 10) * 100)
  }

  /**
   * Get effort level description
   */
  getEffortLevelDescription(): string {
    if (this.effort_level <= 3) return 'Low effort'
    if (this.effort_level <= 6) return 'Moderate effort'
    if (this.effort_level <= 8) return 'High effort'
    return 'Maximum effort'
  }

  /**
   * Get stress level description
   */
  getStressLevelDescription(): string {
    if (this.stress_level <= 2) return 'Very relaxed'
    if (this.stress_level <= 4) return 'Calm'
    if (this.stress_level <= 6) return 'Moderate stress'
    if (this.stress_level <= 8) return 'High stress'
    return 'Very stressed'
  }

  /**
   * Get progress description
   */
  getProgressDescription(): string {
    if (this.progress === 0) return 'Not started'
    if (this.progress < 25) return 'Just started'
    if (this.progress < 50) return 'Making progress'
    if (this.progress < 75) return 'Good progress'
    if (this.progress < 100) return 'Almost complete'
    return 'Completed'
  }

  /**
   * Convert to plain object (for JSON serialization)
   */
  toJSON() {
    return {
      uuid: this.uuid,
      summary: this.summary,
      progress: this.progress,
      effort_level: this.effort_level,
      stress_level: this.stress_level,
      step_uuid: this.step_uuid,
      created_at: this.created_at,
      step: this._step?.toJSON()
    }
  }

  /**
   * Create Insight instance from database row
   */
  static fromDatabase(data: Tables<'insight'>): Insight {
    return new Insight(data)
  }

  /**
   * Create Insight instance from database row with step
   */
  static fromDatabaseWithStep(data: Tables<'insight'>, step?: Step): Insight {
    const insight = new Insight(data)
    if (step) {
      insight.setStep(step)
    }
    return insight
  }
}
