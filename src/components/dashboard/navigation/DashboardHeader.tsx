'use client'

import React from 'react'
import { Globe, LogOut, User, ChevronDown } from 'lucide-react'
import { ThemeToggle } from '@/src/components/ui/theme-toggle'
import { Goal } from '@/src/classes/Goal'

interface DashboardHeaderProps {
  userEmail?: string
  goals: Goal[]
  selectedGoalIndex: number
  onGoalChange: (index: number) => void
  onSignOut: () => void
}

export default function DashboardHeader({ 
  userEmail, 
  goals, 
  selectedGoalIndex, 
  onGoalChange, 
  onSignOut 
}: DashboardHeaderProps) {
  const selectedGoal = goals[selectedGoalIndex]

  return (
    <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left side - Logo and Goal Selector */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
                <Globe className="w-4 h-4 text-background" />
              </div>
              <div className="text-foreground text-sm font-dm-mono font-medium uppercase tracking-wider-2">
                AI Coach Dashboard
              </div>
            </div>

            {/* Goal Selector Dropdown or No Goals Message */}
            {goals.length > 0 ? (
              <div className="relative">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="hidden sm:inline">Current Goal:</span>
                  <div className="relative">
                    <select
                      value={selectedGoalIndex}
                      onChange={(e) => onGoalChange(parseInt(e.target.value))}
                      className="appearance-none bg-background border border-border rounded-lg px-3 py-2 pr-8 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      {goals.map((goal, index) => (
                        <option key={goal.uuid} value={index}>
                          {goal.text}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">No goals yet</span>
                <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                  Create your first goal in the Milestones tab
                </span>
              </div>
            )}
          </div>
          
          {/* Right side - User info and actions */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{userEmail}</span>
            </div>
            <ThemeToggle />
            <button
              onClick={onSignOut}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
