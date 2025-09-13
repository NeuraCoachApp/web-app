import React from 'react'
import { Target } from 'lucide-react'
import { TimelineLayoutProps } from './types'
import { Goal } from '@/src/classes'

export default function TimelineLayout({ children }: TimelineLayoutProps) {
  return (
    <div className="w-full">
      <div className="my-8">
        {/* Horizontal Timeline Container */}
        <div className="relative overflow-x-auto py-32">
          <div className="flex items-center min-w-max px-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export function TimelineCompletionIndicator({ 
  allMilestonesCompleted, 
  currentGoal 
}: { 
  allMilestonesCompleted: boolean
  currentGoal: Goal | null
}) {
  return (
    <div className="relative flex flex-col items-center ml-16">
      <div className={`w-28 h-28 rounded-lg flex flex-col items-center justify-center p-3 relative overflow-hidden ${
        allMilestonesCompleted ? 'bg-green-500' : 'bg-primary/10'
      }`}>
        
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
        
        <Target className={`w-7 h-7 mb-1 relative z-10 ${
          allMilestonesCompleted ? 'text-white' : 'text-primary'
        }`} />
        <p className={`text-xs font-medium text-center relative z-10 ${
          allMilestonesCompleted ? 'text-white' : 'text-foreground'
        }`}>
          Complete
        </p>
        <p className={`text-xs text-center relative z-10 ${
          allMilestonesCompleted ? 'text-green-100' : 'text-muted-foreground'
        }`}>
          {currentGoal ? `${currentGoal.getTotalMilestonesCount()} milestones` : '0 milestones'}
        </p>
      </div>
      <div className="mt-3 text-center">
        <p className="text-xs text-muted-foreground">Finish</p>
      </div>
      
      {/* Timeline line ending at completion */}
      <div className={`absolute right-full top-1/2 transform -translate-y-1/2 w-16 h-0.5 ${
        allMilestonesCompleted ? 'bg-green-500' : 'bg-primary'
      }`} />
    </div>
  )
}
