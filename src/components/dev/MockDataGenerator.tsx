'use client'

import React, { useState } from 'react'
import { useAuth } from '@/src/contexts/AuthContext'
import { generateMockDataForCurrentUser, clearMockSessions, getMockGoals, generateAdditionalMockGoal } from '@/src/lib/mock-data'
import { Database, Trash2, RefreshCw, Target } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { goalsKeys, sessionsKeys } from '@/src/hooks/useGoals'

export default function MockDataGenerator() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [message, setMessage] = useState('')
  const [hasExistingGoals, setHasExistingGoals] = useState<boolean | null>(null)

  // Check if user has mock sessions on mount
  React.useEffect(() => {
    if (user?.id) {
      checkExistingMockData()
    }
  }, [user?.id])

  const checkExistingMockData = () => {
    if (!user?.id) return
    
    try {
      const mockGoals = getMockGoals(user.id)
      setHasExistingGoals(mockGoals.length > 0)
    } catch (error) {
      console.error('Error checking existing mock data:', error)
    }
  }

  const handleGenerateMockData = async () => {
    if (!user) {
      setMessage('❌ No authenticated user found')
      return
    }

    setIsGenerating(true)
    setMessage('🔄 Generating mock data...')

    try {
      const result = await generateMockDataForCurrentUser()
      
      if (result.success) {
        // Invalidate all relevant caches to trigger refetch
        if (user?.id) {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: goalsKeys.user(user.id) }),
            queryClient.invalidateQueries({ queryKey: sessionsKeys.user(user.id) }),
            queryClient.invalidateQueries({ queryKey: ['onboarding', 'status', user.id] }),
            queryClient.invalidateQueries({ queryKey: ['goals', 'creation', 'status', user.id] })
          ])
        }
        
        setMessage('🎉 Successfully generated mock data! Your timeline should update automatically.')
        setHasExistingGoals(true)
        
        // Small delay to show the cache invalidation is working
        setTimeout(() => {
          checkExistingMockData()
          setMessage('✅ Mock data generated and timeline updated!')
        }, 500)
      } else {
        setMessage(`❌ Failed to generate mock data: ${result.error}`)
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddGoal = async () => {
    if (!user) {
      setMessage('❌ No authenticated user found')
      return
    }

    setIsGenerating(true)
    setMessage('🎯 Adding additional goal...')

    try {
      const result = generateAdditionalMockGoal(user.id)
      
      if (result.success) {
        // Invalidate sessions cache to trigger refetch
        if (user?.id) {
          await queryClient.invalidateQueries({ queryKey: sessionsKeys.user(user.id) })
        }
        
        setMessage(`🎉 Successfully added new goal! You now have multiple goals to switch between.`)
        
        // Small delay to show the cache invalidation is working
        setTimeout(() => {
          checkExistingMockData()
          setMessage('✅ Additional goal added and timeline updated!')
        }, 500)
      } else {
        setMessage(`❌ Failed to add goal: ${result.error}`)
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClearMockData = async () => {
    if (!user) {
      setMessage('❌ No authenticated user found')
      return
    }

    setIsClearing(true)
    setMessage('🧹 Clearing existing data...')

    try {
      // Clear client-side mock data
      clearMockSessions(user.id)
      
      // Invalidate sessions cache to trigger refetch
      await queryClient.invalidateQueries({ queryKey: sessionsKeys.user(user.id) })
      
      setMessage('✅ Successfully cleared mock data! Your timeline should update automatically.')
      setHasExistingGoals(false)
      
      // Small delay to show the cache invalidation is working
      setTimeout(() => {
        checkExistingMockData()
        setMessage('🧹 Mock data cleared and timeline updated!')
      }, 500)
    } catch (error) {
      setMessage(`❌ Error: ${error}`)
    } finally {
      setIsClearing(false)
    }
  }

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Please sign in to use the mock data generator.</p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-4">
        <Database className="w-6 h-6 text-primary" />
        <h3 className="text-lg font-inter font-semibold text-card-foreground">
          Mock Data Generator
        </h3>
      </div>
      
      <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">
                    <strong>User:</strong> {user.email}
                  </p>
                  <p className="mb-2">
                    <strong>Status:</strong> {
                      hasExistingGoals === null 
                        ? 'Checking...' 
                        : hasExistingGoals 
                          ? '✅ Has mock data' 
                          : '❌ No mock data'
                    }
                  </p>
                  <p>
                    Generate client-side mock sessions (no database) for testing the timeline.
                  </p>
                </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleGenerateMockData}
            disabled={isGenerating || isClearing}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground 
                     rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Generate Goal'}
          </button>

          <button
            onClick={handleAddGoal}
            disabled={isGenerating || isClearing || !hasExistingGoals}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground 
                     rounded-lg hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
          >
            <Target className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            Add Another Goal
          </button>

          <button
            onClick={handleClearMockData}
            disabled={isGenerating || isClearing || !hasExistingGoals}
            className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground 
                     rounded-lg hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
          >
            <Trash2 className={`w-4 h-4 ${isClearing ? 'animate-pulse' : ''}`} />
            {isClearing ? 'Clearing...' : 'Clear All Data'}
          </button>
        </div>

        {message && (
          <div className="bg-background border border-border rounded-lg p-3">
            <p className="text-sm text-foreground whitespace-pre-wrap">{message}</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-background rounded-lg p-3">
            <p className="font-medium mb-1">What gets generated (client-side only):</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Mock goals (randomly selected from 3 templates)</li>
              <li>10 steps per goal with realistic progression</li>
              <li>1-3 sessions per reached step with insights</li>
              <li>Completed steps appear first in timeline</li>
              <li>Sessions distributed over the last 30 days</li>
              <li>No database writes - pure client-side data</li>
              <li>Goal switcher appears with multiple goals</li>
            </ul>
        </div>
      </div>
    </div>
  )
}
