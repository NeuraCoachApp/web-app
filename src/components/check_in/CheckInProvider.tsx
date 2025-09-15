'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/src/contexts/AuthContext'
import { useGoals } from '@/src/hooks/useGoals'
import { useCheckInFlow, useDailyProgress, useUserStreak, useTodaysTasks } from '@/src/hooks/useCheckIn'
import { Goal } from '@/src/classes/Goal'

interface CheckInContextType {
  // Flow state
  currentStep: 'assessment' | 'chat' | 'mood' | 'complete'
  setCurrentStep: (step: 'assessment' | 'chat' | 'mood' | 'complete') => void
  
  // Data
  selectedGoal: Goal | null
  setSelectedGoal: (goal: Goal | null) => void
  dailyProgress: any
  userStreak: any
  todaysTasks: any
  canCheckInNow: boolean
  
  // Check-in flow
  checkInData: any
  updateCheckInData: (updates: any) => void
  submitCheckIn: () => Promise<any>
  isSubmitting: boolean
  
  // Loading states
  isLoading: boolean
  error: Error | null
  
  // Helper functions
  getProgressPercentage: () => number
  needsBlockerDiscussion: () => boolean
  canProceedToNext: () => boolean
}

const CheckInContext = createContext<CheckInContextType | undefined>(undefined)

export function useCheckInContext() {
  const context = useContext(CheckInContext)
  if (context === undefined) {
    throw new Error('useCheckInContext must be used within a CheckInProvider')
  }
  return context
}

interface CheckInProviderProps {
  children: React.ReactNode
}

export function CheckInProvider({ children }: CheckInProviderProps) {
  const { user, loading: authLoading, canCheckInNow, canCheckInLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const goalUuid = searchParams.get('goal')
  
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  
  // Get user's goals
  const { goals, isLoading: goalsLoading } = useGoals(user?.id)
  
  // Check-in flow hook
  const checkInFlow = useCheckInFlow()
  
  // Data hooks
  const { data: dailyProgress, isLoading: progressLoading, error: progressError } = useDailyProgress(selectedGoal?.uuid)
  const { data: userStreak, isLoading: streakLoading } = useUserStreak(user?.id)
  const { data: todaysTasks, isLoading: tasksLoading } = useTodaysTasks(selectedGoal?.uuid)
  
  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])
  
  // Set selected goal from URL parameter or default to first goal
  useEffect(() => {
    if (!goals || goalsLoading) return
    
    const goalsArray = Array.from(goals.values())
    
    if (goalUuid) {
      const goal = goalsArray.find(g => g.uuid === goalUuid)
      if (goal) {
        setSelectedGoal(goal)
        return
      }
    }
    
    // Default to first goal if no specific goal selected
    if (goalsArray.length > 0) {
      setSelectedGoal(goalsArray[0])
    }
  }, [goals, goalsLoading, goalUuid])
  
  // Initialize check-in data with selected goal
  useEffect(() => {
    if (selectedGoal && !checkInFlow.checkInData.goal_uuid) {
      checkInFlow.updateCheckInData({ goal_uuid: selectedGoal.uuid })
    }
  }, [selectedGoal, checkInFlow])
  
  // Check if user has already checked in today
  useEffect(() => {
    if (userStreak && !userStreak.can_check_in_today) {
      // User has already checked in today, redirect to dashboard
      router.push('/dashboard?message=already_checked_in')
    }
  }, [userStreak, router])
  
  // Helper functions
  const getProgressPercentage = (): number => {
    if (!dailyProgress) return 0
    return dailyProgress.progress_percentage || 0
  }
  
  const needsBlockerDiscussion = (): boolean => {
    return getProgressPercentage() < 80
  }
  
  const canProceedToNext = (): boolean => {
    const step = checkInFlow.currentStep
    
    switch (step) {
      case 'assessment':
        // Can proceed if we have task completion data
        return (checkInFlow.checkInData.task_completions?.length || 0) > 0
      case 'chat':
        // Can proceed if blocker discussion is complete (has summary)
        return !!checkInFlow.checkInData.summary
      case 'mood':
        // Can proceed if mood and motivation are set
        return !!(checkInFlow.checkInData.mood && checkInFlow.checkInData.motivation)
      case 'complete':
        return false // Final step
      default:
        return false
    }
  }
  
  const isLoading = authLoading || goalsLoading || progressLoading || streakLoading || tasksLoading || canCheckInLoading
  const error = progressError as Error | null
  
  // Don't render if not authenticated or still loading critical data
  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  // Don't render if no goals exist
  if (!selectedGoal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">No Goals Found</h2>
          <p className="text-muted-foreground mb-6">
            You need to create a goal before you can check in.
          </p>
          <button
            onClick={() => router.push('/goal-creation')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Goal
          </button>
        </div>
      </div>
    )
  }
  
  // Don't render if outside check-in time window
  if (!canCheckInNow) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Check-in Not Available</h2>
          <p className="text-muted-foreground mb-6">
            Check-ins are only available between 6:00 PM and 11:59 PM.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }
  
  const contextValue: CheckInContextType = {
    currentStep: checkInFlow.currentStep,
    setCurrentStep: checkInFlow.setCurrentStep,
    selectedGoal,
    setSelectedGoal,
    dailyProgress,
    userStreak,
    todaysTasks,
    canCheckInNow,
    checkInData: checkInFlow.checkInData,
    updateCheckInData: checkInFlow.updateCheckInData,
    submitCheckIn: checkInFlow.submitCheckIn,
    isSubmitting: checkInFlow.isSubmitting,
    isLoading,
    error,
    getProgressPercentage,
    needsBlockerDiscussion,
    canProceedToNext
  }
  
  return (
    <CheckInContext.Provider value={contextValue}>
      {children}
    </CheckInContext.Provider>
  )
}
