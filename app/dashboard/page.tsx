'use client'

import { useAuth } from '@/src/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboardingRedirect } from '@/src/hooks/useOnboarding'
import { useGoals } from '@/src/hooks/useGoals'
import { DashboardHeader, DashboardTabs, DashboardContent } from '@/src/components/dashboard'
import { DashboardTab } from '@/src/components/dashboard/navigation/DashboardTabs'
import { GoalCreationProvider, GoalCreationFlow } from '@/src/components/goal_creation'
import LoadingSpinner from '@/src/components/ui/loading-spinner'

export default function Dashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const { shouldRedirect: shouldRedirectToOnboarding, isLoading: onboardingLoading } = useOnboardingRedirect()

  // Fetch goals using the new hook
  const { goals: goalsCache, isLoading: goalsLoading, updateTaskCompletion } = useGoals(user?.id)
  
  // Convert goals cache to array for UI components
  const goals = goalsCache ? Array.from(goalsCache.values()).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ) : []
  
  // Track currently selected goal and active tab
  const [selectedGoalIndex, setSelectedGoalIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<DashboardTab>('tasks')
  const [showGoalCreation, setShowGoalCreation] = useState(false)
  const selectedGoal = goals && goals.length > 0 ? goals[selectedGoalIndex] : null
  const hasGoals = goals.length > 0

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  // Check if user needs onboarding
  useEffect(() => {
    if (!onboardingLoading && shouldRedirectToOnboarding) {
      router.push('/onboarding')
    }
  }, [shouldRedirectToOnboarding, onboardingLoading, router])

  // Automatically switch to milestones tab when user has no goals
  useEffect(() => {
    if (!goalsLoading && !hasGoals && (activeTab === 'tasks' || activeTab === 'insights')) {
      setActiveTab('milestones')
    }
  }, [goalsLoading, hasGoals, activeTab])

  // Show full loading only for critical auth/onboarding checks
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" className="text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleTaskToggle = (task: any) => {
    const newCompletionStatus = !task.isCompleted
    console.log('Task toggled:', task.text, 'new status:', newCompletionStatus)
    
    updateTaskCompletion({
      taskUuid: task.uuid,
      isCompleted: newCompletionStatus
    })
  }

  const handleCreateNewGoal = () => {
    setShowGoalCreation(true)
  }

  const handleGoalCreationComplete = () => {
    setShowGoalCreation(false)
    // The goals will automatically refresh due to the useGoals hook
  }

  // If showing goal creation, render the goal creation flow
  if (showGoalCreation) {
    return (
      <main className="min-h-screen bg-background">
        <GoalCreationProvider onComplete={handleGoalCreationComplete} skipRedirectCheck={true}>
          <GoalCreationFlow />
        </GoalCreationProvider>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Dashboard Header with Goal Selector */}
      <DashboardHeader
        goals={goals}
        selectedGoalIndex={selectedGoalIndex}
        onGoalChange={setSelectedGoalIndex}
        onSignOut={handleSignOut}
        onSettingsClick={() => router.push('/dashboard/settings')}
        onCreateNewGoal={handleCreateNewGoal}
      />

      {/* Dashboard Navigation Tabs */}
      <DashboardTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasGoals={hasGoals}
      />

      {/* Main Dashboard Content */}
      <DashboardContent
        activeTab={activeTab}
        selectedGoal={selectedGoal}
        goals={goals}
        selectedGoalIndex={selectedGoalIndex}
        onGoalChange={setSelectedGoalIndex}
        onTaskToggle={handleTaskToggle}
        isLoading={goalsLoading}
      />

    </main>
  )
}
