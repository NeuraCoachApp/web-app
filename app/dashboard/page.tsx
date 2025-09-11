'use client'

import { useAuth } from '@/src/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, LogOut, User, RefreshCw } from 'lucide-react'
import { useProfile } from '@/src/hooks/useProfile'
import { useOnboardingRedirect } from '@/src/hooks/useOnboarding'
import { useGoals, goalsKeys } from '@/src/hooks/useGoals'
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

  // Fetch goals using the new hook
  const { goals: goalsCache, isLoading: goalsLoading } = useGoals(user?.id)
  
  // Convert goals cache to array for UI components
  const goals = goalsCache ? Array.from(goalsCache.values()).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ) : []
  
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
      queryClient.invalidateQueries({ queryKey: goalsKeys.user(user.id) })
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
            onMilestoneClick={(milestone) => {
              console.log('Milestone clicked:', milestone.text)
            }}
          />
        )}
      </div>

      {/* Goal Calendar - Progress tracking */}
      <div className="bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {goalsLoading ? (
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
        {goalsLoading ? (
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
            </div>
          </div>
        )}
        
        {/* Future sections can go here */}
      </div>
    </main>
  )
}
