'use client'

import React from 'react'
import { CheckSquare, Target, BarChart3 } from 'lucide-react'

export type DashboardTab = 'tasks' | 'milestones' | 'insights'

interface DashboardTabsProps {
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
  hasGoals: boolean
}

const tabs = [
  {
    id: 'tasks' as const,
    label: 'Today\'s Tasks',
    icon: CheckSquare,
    description: 'Manage your daily tasks'
  },
  {
    id: 'milestones' as const,
    label: 'Milestones',
    icon: Target,
    description: 'Track your progress'
  },
  {
    id: 'insights' as const,
    label: 'Insights',
    icon: BarChart3,
    description: 'View your analytics'
  }
]

export default function DashboardTabs({ activeTab, onTabChange, hasGoals }: DashboardTabsProps) {
  return (
    <div className="bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const isDisabled = !hasGoals && (tab.id === 'tasks' || tab.id === 'insights')
            
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && onTabChange(tab.id)}
                disabled={isDisabled}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  isDisabled
                    ? 'border-transparent text-muted-foreground/50 cursor-not-allowed opacity-50'
                    : isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
                }`}
                title={isDisabled ? 'Create a goal first to access this feature' : tab.description}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {isDisabled && (
                  <span className="text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded text-muted-foreground/60">
                    Disabled
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
