'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCheckInContext } from './CheckInProvider'
import { CheckCircle, Flame, TrendingUp, Calendar, ArrowRight, Brain } from 'lucide-react'
// AI task adjustments now happen in background during voice insights in VoiceCoachChat.tsx
// import { performIntelligentTaskAdjustment } from '@/src/lib/ai-task-adjustment'
import { useQueryClient } from '@tanstack/react-query'
import { goalsKeys } from '@/src/hooks/useGoals'
import { checkInKeys } from '@/src/hooks/useCheckIn'
import { useAuth } from '@/src/contexts/AuthContext'

export function CheckInComplete() {
  const {
    selectedGoal,
    userStreak,
    checkInData,
    submitCheckIn,
    isSubmitting,
    getProgressPercentage,
    todaysTasks
  } = useCheckInContext()

  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [isComplete, setIsComplete] = useState(false)
  const [newStreak, setNewStreak] = useState(0)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  // Removed isAdjustingTasks and adjustmentResult since task adjustments now happen in background during voice
  // const [isAdjustingTasks, setIsAdjustingTasks] = useState(false)
  // const [adjustmentResult, setAdjustmentResult] = useState<{
  //   adjustmentsMade: boolean
  //   encouragementMessage: string
  //   strategy: string
  //   adjustments?: any[]
  // } | null>(null)

  const handleSubmitCheckIn = useCallback(async () => {
    // Prevent duplicate submissions
    if (hasSubmitted) {
      console.log('🚫 [CheckInComplete] Submission already in progress or completed, skipping')
      return
    }
    
    setHasSubmitted(true) // Set this immediately to prevent duplicate calls
    
    try {
      // Submit the check-in session to database
      console.log('📝 [CheckInComplete] Creating check-in session...')
      const result = await submitCheckIn()
      
      if (result.existing_session) {
        console.log('ℹ️ [CheckInComplete] Session already exists for today, proceeding to completion')
        // Don't update streak for existing sessions
        setNewStreak(userStreak?.daily_streak || 0)
      } else if (result.streak_updated) {
        setNewStreak((userStreak?.daily_streak || 0) + 1)
      } else {
        setNewStreak(userStreak?.daily_streak || 0)
      }
      
      setIsComplete(true)
      console.log('✅ [CheckInComplete] Check-in session handled successfully')
      
      // Note: AI task adjustments are now handled in background during voice insights
      // in VoiceCoachChat.tsx, so no need to do them here
      
    } catch (error) {
      console.error('❌ [CheckInComplete] Error submitting check-in:', error)
      
      // Handle specific duplicate key error
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
        console.log('ℹ️ [CheckInComplete] Duplicate session detected, treating as existing session')
        // Treat as successful completion - user has already checked in today
        setNewStreak(userStreak?.daily_streak || 0)
        setIsComplete(true)
      } else {
        // Reset hasSubmitted on other errors so user can retry
        setHasSubmitted(false)
      }
    }
  }, [submitCheckIn, userStreak, hasSubmitted])

  // Remove auto-submit on mount - user must click "Continue Check-in" button
  // useEffect(() => {
  //   // Only run once when component mounts
  //   if (!hasSubmitted && !isSubmitting) {
  //     console.log('🎯 [CheckInComplete] Component mounted, triggering submission')
  //     handleSubmitCheckIn()
  //   }
  // }, []) // Remove dependencies to ensure this only runs once

  const handleReturnToDashboard = () => {
    router.push('/dashboard')
  }

  const handleContinueCheckIn = () => {
    if (isComplete) {
      // If already complete, go to dashboard
      handleReturnToDashboard()
    } else {
      // Otherwise, submit the check-in
      handleSubmitCheckIn()
    }
  }

  const progressPercentage = getProgressPercentage()

  // Show loading screen only while actually submitting, not when complete
  if (!isComplete && (isSubmitting || hasSubmitted)) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Completing Check-In
          </h2>
          <p className="text-muted-foreground">
            Saving your progress and updating your streak...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Success Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Check-In Complete!</h2>
        <p className="text-muted-foreground">
          Thank you for checking in today. Your progress has been recorded.
        </p>
      </div>

      {/* Streak Celebration */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-orange-200 dark:border-orange-800 p-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Flame className="w-8 h-8 text-orange-500" />
          <h3 className="text-2xl font-bold text-orange-700 dark:text-orange-300">
            {newStreak} Day Streak!
          </h3>
        </div>
        <p className="text-center text-orange-600 dark:text-orange-400">
          {newStreak === 1 
            ? "You've started your check-in streak! Keep it going tomorrow." 
            : `Amazing! You've checked in ${newStreak} days in a row. Consistency is key to achieving your goals.`
          }
        </p>
      </div>

      {/* Progress Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Today's Progress */}
        <div className="bg-card/50 rounded-xl border border-border/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Today's Progress</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Completion Rate:</span>
              <span className={`font-bold text-lg ${
                progressPercentage >= 80 ? 'text-green-600' : 
                progressPercentage >= 50 ? 'text-yellow-600' : 
                'text-red-600'
              }`}>
                {progressPercentage}%
              </span>
            </div>
            <div className="w-full bg-muted/60 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  progressPercentage >= 80 ? 'bg-green-500' : 
                  progressPercentage >= 50 ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {progressPercentage >= 80 
                ? "Excellent work today! You're on track." 
                : progressPercentage >= 50 
                  ? "Good effort today. Tomorrow is a new opportunity." 
                  : "Every step counts. Tomorrow is a fresh start."
              }
            </p>
          </div>
        </div>

        {/* Mood & Motivation */}
        <div className="bg-card/50 rounded-xl border border-border/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Your State</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Mood:</span>
              <span className="font-semibold text-foreground">
                {checkInData.mood || 5}/10
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Motivation:</span>
              <span className="font-semibold text-foreground">
                {checkInData.motivation || 5}/10
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Understanding your emotional state helps me provide better support.
            </p>
          </div>
        </div>
      </div>

      {/* Goal Context */}
      {selectedGoal && (
        <div className="bg-card/50 rounded-xl border border-border/50 p-6">
          <h3 className="text-lg font-semibold text-foreground mb-3">Working On:</h3>
          <p className="text-muted-foreground">{selectedGoal.text}</p>
        </div>
      )}

      {/* AI Task Adjustment Results - Show actual changes made */}
      {checkInData.taskAdjustments ? (
        <div className={`rounded-xl border p-6 ${
          checkInData.taskAdjustments.adjustmentsMade 
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <Brain className={`w-6 h-6 ${
              checkInData.taskAdjustments.adjustmentsMade ? 'text-blue-600' : 'text-green-600'
            }`} />
            <h3 className={`text-lg font-semibold ${
              checkInData.taskAdjustments.adjustmentsMade 
                ? 'text-blue-800 dark:text-blue-200'
                : 'text-green-800 dark:text-green-200'
            }`}>
              {checkInData.taskAdjustments.adjustmentsMade ? 'Tasks Updated' : 'Tasks Look Great'}
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className={`text-sm ${
              checkInData.taskAdjustments.adjustmentsMade 
                ? 'text-blue-700 dark:text-blue-300'
                : 'text-green-700 dark:text-green-300'
            }`}>
              <p><strong>Strategy:</strong> {checkInData.taskAdjustments.strategy}</p>
            </div>
            
            <div className={`text-sm ${
              checkInData.taskAdjustments.adjustmentsMade 
                ? 'text-blue-700 dark:text-blue-300'
                : 'text-green-700 dark:text-green-300'
            }`}>
              <p>{checkInData.taskAdjustments.encouragementMessage}</p>
            </div>

            {/* Show specific task changes */}
            {checkInData.taskAdjustments.adjustmentsMade && checkInData.taskAdjustments.adjustments && checkInData.taskAdjustments.adjustments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                    Task Changes Made:
                  </h4>
                  <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded-full">
                    {checkInData.taskAdjustments.adjustments.length} task{checkInData.taskAdjustments.adjustments.length !== 1 ? 's' : ''} updated
                  </span>
                </div>
                <div className="space-y-3">
                  {checkInData.taskAdjustments.adjustments.map((adjustment: any, index: number) => {
                    // Get action-specific styling
                    const getActionStyle = (action: string) => {
                      switch (action) {
                        case 'postpone':
                          return {
                            badge: 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100',
                            icon: '⏰'
                          }
                        case 'simplify':
                          return {
                            badge: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
                            icon: '✂️'
                          }
                        case 'update':
                          return {
                            badge: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
                            icon: '📝'
                          }
                        case 'split':
                          return {
                            badge: 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100',
                            icon: '🔀'
                          }
                        default:
                          return {
                            badge: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
                            icon: '📋'
                          }
                      }
                    }
                    
                    const actionStyle = getActionStyle(adjustment.action)
                    
                    return (
                      <div key={index} className="bg-white dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                        <div className="flex items-start gap-3 mb-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${actionStyle.badge} capitalize`}>
                            {actionStyle.icon} {adjustment.action}
                          </span>
                          <span className="text-xs text-blue-600 dark:text-blue-400 flex-1 leading-relaxed">
                            {adjustment.reason}
                          </span>
                        </div>
                        
                        {adjustment.new_text && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                              {adjustment.action === 'update' ? 'Updated Task:' : 
                               adjustment.action === 'simplify' ? 'Simplified Task:' : 
                               adjustment.action === 'postpone' ? 'Adjusted Task:' :
                               adjustment.action === 'split' ? 'Refined Task:' : 'New Task:'}
                            </p>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-300">
                              <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                                "{adjustment.new_text}"
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {(adjustment.new_start_at || adjustment.new_end_at) && (
                          <div className="mt-3 flex flex-wrap gap-3 text-xs">
                            {adjustment.new_start_at && (
                              <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded">
                                <span>📅 Start: {new Date(adjustment.new_start_at).toLocaleDateString()}</span>
                              </div>
                            )}
                            {adjustment.new_end_at && (
                              <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded">
                                <span>⏳ Due: {new Date(adjustment.new_end_at).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Fallback if no adjustment data available
        <div className="rounded-xl border p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3 mb-3">
            <Brain className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
              Tasks Optimized
            </h3>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-green-700 dark:text-green-300">
              <strong>Smart Adjustments:</strong> Your tasks have been intelligently adjusted based on your check-in conversation to better support your goals.
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Check your dashboard to see the updated tasks that are tailored to your current mood, motivation, and progress!
            </p>
          </div>
        </div>
      )}

      {/* Blocker Note (if applicable) */}
      {checkInData.blocker && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 p-6">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
            Today's Challenges Noted
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300 text-sm">
            I've recorded our conversation about what blocked your progress today. 
            This will help me provide better support and suggestions moving forward.
          </p>
        </div>
      )}


      {/* Next Steps */}
      <div className="bg-primary/5 rounded-xl border border-primary/20 p-6">
        <h3 className="text-lg font-semibold text-foreground mb-3">What's Next?</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• Your check-in has been recorded and your streak updated</p>
          <p>• Tomorrow's tasks are waiting for you in your dashboard</p>
          <p>• Remember to check in again tomorrow evening (6 PM - 11:59 PM)</p>
          <p>• I'll be here to support you every step of the way</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
        {!isComplete ? (
          <button
            onClick={handleContinueCheckIn}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-green-400 transition-colors"
          >
            {isSubmitting ? 'Creating Check-in...' : 'Continue Check-in'}
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        ) : (
          <button
            onClick={handleReturnToDashboard}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Return to Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Encouragement */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          {progressPercentage >= 80 
            ? "Keep up the fantastic work! You're building great habits." 
            : "Remember, progress isn't always linear. Every check-in is a step forward."
          }
        </p>
      </div>
    </div>
  )
}
