import React from 'react'
import { Target } from 'lucide-react'
import { GoalSquareProps } from './types'

export default function GoalSquare({ goal, allMilestonesCompleted }: GoalSquareProps) {
  return (
    <div className="relative flex flex-col items-center mr-20">
      <div className={`w-32 h-32 rounded-lg cursor-pointer
                   transition-all duration-200 hover:shadow-lg hover:scale-105
                   flex flex-col items-center justify-center p-4 relative overflow-hidden
                   ${allMilestonesCompleted ? 'bg-green-500' : 'bg-primary'}`}>
        
        {/* Glossy Green Overlay for Completed Goal */}
        {allMilestonesCompleted && (
          <>
            {/* Base green gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 rounded-lg" />
            
            {/* Glossy shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent rounded-lg" />
            
            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-green-300/20 to-green-200/30 rounded-lg" />
            
            {/* Edge highlight */}
            <div className="absolute inset-0 border border-green-300/50 rounded-lg" />
          </>
        )}
        
        <Target className="w-8 h-8 text-primary-foreground mb-2 relative z-10" />
        <p className="text-xs font-medium text-primary-foreground text-center leading-tight relative z-10">
          {goal.text && goal.text.length > 60 ? `${goal.text.substring(0, 60)}...` : goal.text}
        </p>
      </div>
      <div className="mt-2 text-center">
        <p className="text-xs text-muted-foreground">Goal</p>
        <p className="text-xs text-muted-foreground">
          {new Date(goal.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}
