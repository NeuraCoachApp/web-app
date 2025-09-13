'use client'

import React from 'react'
import { Goal } from '@/src/classes/Goal'
import { Task } from '@/src/classes/Task'
import { GoalTimeline, GoalInsights, GoalCalendar } from '@/src/components/dashboard'
import { DailyTaskList } from '@/src/components/dashboard/daily'
import LoadingSpinner from '@/src/components/ui/loading-spinner'
import { DashboardTab } from './DashboardTabs'

interface DashboardContentProps {
  activeTab: DashboardTab
  selectedGoal: Goal | null
  goals: Goal[]
  selectedGoalIndex: number
  onGoalChange: (index: number) => void
  onTaskToggle: (task: Task) => void
  isLoading: boolean
}

export default function DashboardContent({
  activeTab,
  selectedGoal,
  goals,
  selectedGoalIndex,
  onGoalChange,
  onTaskToggle,
  isLoading
}: DashboardContentProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" className="text-primary" />
          <div className="text-muted-foreground text-sm">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tasks':
        return (
          <div className="space-y-8">
            {/* Daily Task List */}
            <div className="bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <DailyTaskList 
                  goal={selectedGoal} 
                  onTaskToggle={onTaskToggle}
                />
              </div>
            </div>

            {/* Goal Calendar - Progress tracking */}
            <div className="bg-background border-t border-border">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <GoalCalendar goal={selectedGoal} />
              </div>
            </div>
          </div>
        )

      case 'milestones':
        return (
          <div className="bg-card mt-8">
            <GoalTimeline 
              goals={goals} 
              selectedGoalIndex={selectedGoalIndex}
              onGoalChange={onGoalChange}
              onMilestoneClick={(milestone) => {
                console.log('Milestone clicked:', milestone.text)
              }}
            />
          </div>
        )

      case 'insights':
        return (
          <div className="bg-background">
            <GoalInsights goal={selectedGoal} />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-[calc(100vh-200px)]">
      {renderTabContent()}
    </div>
  )
}
