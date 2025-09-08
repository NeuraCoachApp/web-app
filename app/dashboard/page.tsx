'use client'

import { useAuth } from '@/src/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, LogOut, User, RefreshCw } from 'lucide-react'
import { useProfile } from '@/src/hooks/useProfile'
import { useOnboardingRedirect } from '@/src/hooks/useOnboarding'
import { useUserGoals, useSessions, goalsKeys, sessionsKeys } from '@/src/hooks/useGoals'
import { GoalTimeline, GoalInsights, GoalCalendar } from '@/src/components/dashboard'
import MockDataGenerator from '@/src/components/dev/MockDataGenerator'
import LoadingSpinner from '@/src/components/ui/loading-spinner'
import { useQueryClient } from '@tanstack/react-query'
import { Goal } from '@/src/classes/Goal'

export default function Dashboard() {
  const { user, loading, signOut } = useAuth()
  const queryClient = useQueryClient()
  const router = useRouter()
  const { shouldRedirect: shouldRedirectToOnboarding, isLoading: onboardingLoading } = useOnboardingRedirect()

  // Fetch goals and sessions using hooks
  const { data: goals = [], isLoading: goalsLoading } = useUserGoals(user?.id)
  const { data: sessions = [], isLoading: sessionsLoading } = useSessions(user?.id)
  
  // Track currently selected goal for insights
  const [selectedGoalIndex, setSelectedGoalIndex] = useState(0)
  const selectedGoal = goals && goals.length > 0 ? goals[selectedGoalIndex] : null

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

  const handleRefreshData = async () => {
    if (!user?.id) return
    
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: goalsKeys.user(user.id) }),
      queryClient.invalidateQueries({ queryKey: sessionsKeys.user(user.id) })
    ])
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
                <Globe className="w-4 h-4 text-background" />
              </div>
              <div className="text-foreground text-sm font-dm-mono font-medium uppercase tracking-wider-2">
                AI Coach Dashboard
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Timeline - Full Width with no margins */}
      <div className="bg-card">
        {goalsLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4">
              <LoadingSpinner size="lg" className="text-primary" />
              <div className="text-muted-foreground text-sm">Loading your goals...</div>
            </div>
          </div>
        ) : (
          <GoalTimeline 
            goals={goals} 
            selectedGoalIndex={selectedGoalIndex}
            onGoalChange={setSelectedGoalIndex}
            onStepClick={(step) => {
              console.log('Step clicked:', step.text, 'Sessions:', step.getSessions().length)
            }}
          />
        )}
      </div>

      {/* Goal Calendar - Progress tracking */}
      <div className="bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-4">
                <LoadingSpinner size="md" className="text-primary" />
                <div className="text-muted-foreground text-sm">Loading calendar...</div>
              </div>
            </div>
          ) : (
            <GoalCalendar goal={selectedGoal} />
          )}
        </div>
      </div>

      {/* Goal Insights - Full Width with no margins */}
      <div className="bg-background border-t border-border">
        {sessionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <LoadingSpinner size="md" className="text-primary" />
              <div className="text-muted-foreground text-sm">Loading insights...</div>
            </div>
          </div>
        ) : (
          <GoalInsights goal={selectedGoal} />
        )}
      </div>

      {/* Resume container with margins */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Development Tools - Only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8">
            <h3 className="text-lg font-inter font-semibold text-foreground mb-4">
              Development Tools
            </h3>
            <div className="space-y-4">
              <MockDataGenerator />
              
              {/* Debug Info */}
              <div className="bg-background border border-border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Debug Info</h4>
                  <button
                    onClick={handleRefreshData}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-primary text-primary-foreground 
                             rounded hover:bg-primary/90 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Refresh
                  </button>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Goals Loading: {goalsLoading ? '⏳ Loading...' : '✅ Loaded'}</p>
                  <p>Sessions Loading: {sessionsLoading ? '⏳ Loading...' : '✅ Loaded'}</p>
                  <p>Onboarding Check: {onboardingLoading ? '⏳ Loading...' : '✅ Loaded'}</p>
                  <p>Goals: {goals.length > 0 ? `✅ ${goals.length} Available` : '❌ None'}</p>
                  <p>User ID: {user?.id || 'None'}</p>
                  {goals.length > 0 && (
                    <div>
                      <p>Current Goal: {goals[0]?.text.substring(0, 30)}...</p>
                      <p>Total Steps: {goals.reduce((acc, goal) => acc + goal.getTotalStepsCount(), 0)}</p>
                      <p>Goals: {goals.map((g, i) => `${i + 1}.${g.text.substring(0, 15)}...`).join(' | ')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Future sections can go here */}
      </div>
    </main>
  )
}
