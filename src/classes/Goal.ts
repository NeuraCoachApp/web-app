import { Tables } from '@/src/types/database'
import { Step } from './Step'

export class Goal {
  public uuid: string
  public text: string
  public created_at: string
  public end_at: string
  public steps: Step[] = []

  constructor(data: Tables<'goal'>) {
    this.uuid = data.uuid
    this.text = data.text
    this.created_at = data.created_at
    this.end_at = data.end_at
  }

  /**
   * Add a step to this goal
   */
  addStep(step: Step): void {
    this.steps.push(step)
  }

  /**
   * Get all steps for this goal, sorted by deadline priority
   * Incomplete steps with closest deadlines appear first, then completed steps
   */
  getSteps(): Step[] {
    return [...this.steps].sort((a, b) => {
      const aCompleted = a.isCompleted()
      const bCompleted = b.isCompleted()
      
      // If completion status differs, prioritize incomplete steps
      if (aCompleted !== bCompleted) {
        return aCompleted ? 1 : -1 // Incomplete steps (false) come first
      }
      
      // For steps with same completion status, sort by deadline
      const aEndDate = new Date(a.end_at).getTime()
      const bEndDate = new Date(b.end_at).getTime()
      
      // If both are incomplete, closest deadline first
      // If both are completed, earliest deadline first (chronological order)
      return aEndDate - bEndDate
    })
  }

  /**
   * Get completed steps count
   */
  getCompletedStepsCount(): number {
    return this.steps.filter(step => step.isCompleted()).length
  }

  /**
   * Get total steps count
   */
  getTotalStepsCount(): number {
    return this.steps.length
  }

  /**
   * Get completion percentage
   */
  getCompletionPercentage(): number {
    const totalSteps = this.getTotalStepsCount()
    if (totalSteps === 0) return 0
    return Math.round((this.getCompletedStepsCount() / totalSteps) * 100)
  }

  /**
   * Get all sessions from all steps
   */
  getAllSessions() {
    return this.steps.flatMap(step => step.getSessions())
  }

  /**
   * Get total sessions count across all steps
   */
  getTotalSessionsCount(): number {
    return this.getAllSessions().length
  }

  /**
   * Get steps that have sessions
   */
  getActiveStepsCount(): number {
    return this.steps.filter(step => step.getSessions().length > 0).length
  }

  /**
   * Convert to plain object (for JSON serialization)
   */
  toJSON(): any {
    return {
      uuid: this.uuid,
      text: this.text,
      created_at: this.created_at,
      end_at: this.end_at,
      steps: this.steps.map(step => step.toJSON())
    }
  }

  /**
   * Create Goal instance from database row with steps
   */
  static fromDatabaseWithSteps(goalData: Tables<'goal'>, steps: Step[] = []): Goal {
    const goal = new Goal(goalData)
    steps.forEach(step => goal.addStep(step))
    return goal
  }
}
