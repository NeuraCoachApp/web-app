import React from 'react'
import { Target, ChevronDown } from 'lucide-react'
import { GoalSwitcherProps } from './types'

export default function GoalSwitcher({ 
  goals, 
  selectedGoalIndex, 
  onGoalChange, 
  showDropdown, 
  setShowDropdown 
}: GoalSwitcherProps) {
  const currentGoal = goals[selectedGoalIndex]

  if (goals.length <= 1) return null

  return (
    <div className="mb-6 px-8">
      <div className="relative inline-block">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg 
                   hover:bg-muted transition-colors text-sm font-medium"
        >
          <Target className="w-4 h-4 text-primary" />
          <span>Goal {selectedGoalIndex + 1}: {currentGoal?.text.substring(0, 30)}...</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>
        
        {showDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-30 min-w-full">
            {goals.map((goal, index) => (
              <button
                key={goal.uuid}
                onClick={() => {
                  onGoalChange(index)
                  setShowDropdown(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors
                          ${index === selectedGoalIndex ? 'bg-primary/10 text-primary' : 'text-card-foreground'}
                          ${index === 0 ? 'rounded-t-lg' : ''} 
                          ${index === goals.length - 1 ? 'rounded-b-lg' : 'border-b border-border'}`}
              >
                <div className="flex items-center gap-2">
                  <Target className="w-3 h-3" />
                  <span>{goal.text}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {goal.getCompletedTasksCount()}/{goal.getTotalTasksCount()} tasks completed
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
