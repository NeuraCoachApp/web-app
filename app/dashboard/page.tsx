'use client'

import { useAuth } from '@/src/contexts/AuthContext'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, LogOut, User } from 'lucide-react'
import { useProfile } from '@/src/hooks/useProfile'
import { useOnboardingRedirect } from '@/src/hooks/useOnboarding'

export default function Dashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const { data: profile } = useProfile(user?.id)
  const { shouldRedirect, isLoading: onboardingLoading } = useOnboardingRedirect()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  // Check if user needs onboarding
  useEffect(() => {
    if (!onboardingLoading && shouldRedirect) {
      router.push('/onboarding')
    }
  }, [shouldRedirect, onboardingLoading, router])

  if (loading || onboardingLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-inter font-bold text-foreground mb-2">
            Welcome back, {
              profile?.first_name 
                ? `${profile.first_name}${profile.last_name ? ` ${profile.last_name}` : ''}!`
                : user.user_metadata?.full_name || user.email
            }!
          </h1>
          <p className="text-lg text-muted-foreground">
            Your AI coaching dashboard is ready.
          </p>
          {profile && (profile.first_name || profile.last_name) && (
            <p className="text-sm text-muted-foreground mt-2">
              Profile: {profile.first_name || 'No first name'} {profile.last_name || 'No last name'}
            </p>
          )}
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-inter font-semibold text-card-foreground mb-2">
              Daily Check-ins
            </h3>
            <p className="text-muted-foreground text-sm">
              Track your daily progress with AI-powered voice check-ins.
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-inter font-semibold text-card-foreground mb-2">
              Weekly Coaching
            </h3>
            <p className="text-muted-foreground text-sm">
              Schedule and manage your sessions with your human coach.
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-inter font-semibold text-card-foreground mb-2">
              Progress Insights
            </h3>
            <p className="text-muted-foreground text-sm">
              View your coaching journey and goal achievements.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
