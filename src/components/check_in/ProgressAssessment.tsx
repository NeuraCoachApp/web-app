'use client'

import React, { useState, useEffect } from 'react'
import { useCheckInContext } from './CheckInProvider'
import { useCoach } from '@/src/contexts/CoachContext'
import { CheckSquare, Square, Calendar, TrendingUp } from 'lucide-react'

export function ProgressAssessment() {
  const {
    selectedGoal,
    dailyProgress,
    todaysTasks,
    checkInData,
    updateCheckInData,
    setCurrentStep,
    needsBlockerDiscussion,
    canProceedToNext
  } = useCheckInContext()

  const [taskCompletions, setTaskCompletions] = useState<Array<{
    task_uuid: string
    isCompleted: boolean
  }>>([])

  // Initialize task completions from today's tasks
  useEffect(() => {
    if (todaysTasks && todaysTasks.length > 0) {
      const completions = todaysTasks.map((task: any) => ({
        task_uuid: task.uuid,
        isCompleted: task.isCompleted || false
      }))
      setTaskCompletions(completions)
      updateCheckInData({ task_completions: completions })
    }
  }, [todaysTasks, updateCheckInData])

  const handleTaskToggle = (taskUuid: string) => {
    const updatedCompletions = taskCompletions.map(completion => 
      completion.task_uuid === taskUuid 
        ? { ...completion, isCompleted: !completion.isCompleted }
        : completion
    )
    
    setTaskCompletions(updatedCompletions)
    updateCheckInData({ task_completions: updatedCompletions })
  }

  const calculateCurrentProgress = () => {
    if (taskCompletions.length === 0) return 0
    const completed = taskCompletions.filter(t => t.isCompleted).length
    return Math.round((completed / taskCompletions.length) * 100)
  }

  const { markUserInteracted } = useCoach()

  const handleContinue = () => {
    const progressPercentage = calculateCurrentProgress()
    
    // Ensure user interaction is registered for voice synthesis
    markUserInteracted()
    
    if (progressPercentage < 80) {
      // Need blocker discussion
      setCurrentStep('chat')
    } else {
      // Skip chat, go directly to mood/motivation
      setCurrentStep('mood')
    }
  }

  const currentProgress = calculateCurrentProgress()
  const totalTasks = taskCompletions.length
  const completedTasks = taskCompletions.filter(t => t.isCompleted).length

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Goal Info */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Daily Progress Review
        </h2>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
        {selectedGoal && (
          <div className="mt-4 p-4 bg-card/50 rounded-lg border border-border/50">
            <p className="text-sm text-muted-foreground mb-1">Working on:</p>
            <p className="font-medium text-foreground">{selectedGoal.text}</p>
          </div>
        )}
      </div>

      {/* Task List */}
      {todaysTasks && todaysTasks.length > 0 && (
        <div className="bg-card/50 rounded-xl border border-border/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Today's Tasks</h3>
          </div>
          
          <div className="space-y-3">
            {todaysTasks.map((task: any) => {
              const completion = taskCompletions.find(c => c.task_uuid === task.uuid)
              const isCompleted = completion?.isCompleted || false
              
              return (
                <div 
                  key={task.uuid} 
                  className="flex items-center gap-4 p-4 bg-background/40 rounded-lg border border-border/30 hover:bg-background/60 transition-colors"
                >
                  <button
                    onClick={() => handleTaskToggle(task.uuid)}
                    className="flex-shrink-0 text-primary hover:text-primary/80 transition-colors hover:scale-110 transform duration-200"
                  >
                    {isCompleted ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      isCompleted 
                        ? 'text-muted-foreground line-through' 
                        : 'text-foreground'
                    }`}>
                      {task.text}
                    </p>
                    {task.milestone_text && (
                      <p className="text-xs text-muted-foreground mt-1">
                        From: {task.milestone_text}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* No tasks message */}
      {(!todaysTasks || todaysTasks.length === 0) && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No tasks for today
          </h3>
          <p className="text-muted-foreground">
            All your tasks are either completed or scheduled for other days.
          </p>
        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-center pt-6">
        <button
          onClick={handleContinue}
          disabled={!canProceedToNext()}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentProgress < 80 ? 'Continue - Let\'s Talk' : 'Continue to Check-In'}
        </button>
      </div>

      {/* Progress hint */}
      {currentProgress < 80 && (
        <div className="text-center text-sm text-muted-foreground">
          <p>Since your progress is under 80%, I'll help you work through any blockers.</p>
        </div>
      )}
    </div>
  )
}
