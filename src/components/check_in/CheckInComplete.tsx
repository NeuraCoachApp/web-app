'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCheckInContext } from './CheckInProvider'
import { CheckCircle, Flame, TrendingUp, Calendar, ArrowRight } from 'lucide-react'

export function CheckInComplete() {
  const {
    selectedGoal,
    userStreak,
    checkInData,
    submitCheckIn,
    isSubmitting,
    getProgressPercentage
  } = useCheckInContext()

  const router = useRouter()
  const [isComplete, setIsComplete] = useState(false)
  const [newStreak, setNewStreak] = useState(0)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  useEffect(() => {
    if (!hasSubmitted) {
      handleSubmitCheckIn()
      setHasSubmitted(true)
    }
  }, [hasSubmitted])

  const handleSubmitCheckIn = async () => {
    try {
      const result = await submitCheckIn()
      
      if (result.streak_updated) {
        setNewStreak((userStreak?.daily_streak || 0) + 1)
      } else {
        setNewStreak(userStreak?.daily_streak || 0)
      }
      
      setIsComplete(true)
    } catch (error) {
      console.error('Error submitting check-in:', error)
      // Handle error - could show error message
    }
  }

  const handleReturnToDashboard = () => {
    router.push('/dashboard')
  }

  const progressPercentage = getProgressPercentage()

  if (isSubmitting || !isComplete) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Completing Check-In</h2>
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
        <button
          onClick={handleReturnToDashboard}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Return to Dashboard
          <ArrowRight className="w-4 h-4" />
        </button>
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
