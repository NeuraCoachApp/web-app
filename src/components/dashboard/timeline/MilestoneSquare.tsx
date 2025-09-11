import React from 'react'
import { CheckCircle, Circle, Calendar, Target } from 'lucide-react'
import { MilestoneSquareProps } from './types'

export default function MilestoneSquare({ 
  milestone, 
  milestoneIndex, 
  currentMilestoneIndex, 
  allMilestonesCompleted, 
  onMilestoneClick 
}: MilestoneSquareProps) {
  // Null safety checks for milestone properties
  const milestoneText = milestone.text || 'Untitled Milestone'
  const isEven = milestoneIndex % 2 === 0
  const isCompleted = milestone.isPast()
  const isActive = milestone.isActive()
  const isUpcoming = milestone.isUpcoming()
  const isFutureMilestone = milestoneIndex > currentMilestoneIndex && !isCompleted

  return (
    <div className="relative flex-shrink-0 mr-32">
      {/* Timeline dot at center intersection */}
      <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full z-20 ${
        isFutureMilestone ? 'bg-muted opacity-50' : 
        isCompleted ? 'bg-green-500' : 
        isActive ? 'bg-yellow-500' : 'bg-primary'
      }`} />
      
      {/* Connecting line extending from center to milestone */}
      <div className={`absolute left-1/2 transform -translate-x-1/2 w-0.5 z-0 ${
        isFutureMilestone ? 'bg-muted opacity-50' : 
        isCompleted ? 'bg-green-500' : 
        isActive ? 'bg-yellow-500' : 'bg-primary'
      } ${
        isEven 
          ? 'top-1/2 h-20' // Line extending down from center
          : 'top-1/2 -translate-y-full h-20' // Line extending up from center
      }`} />
      
      {/* Milestone positioned at end of connecting line */}
      <div className={`absolute left-1/2 transform -translate-x-1/2 ${
        isEven 
          ? 'top-1/2 mt-20' // Position at bottom of down line
          : 'top-1/2 -translate-y-full -mt-20' // Position at top of up line
      }`}>
        {/* Milestone Square */}
        <div
          onClick={() => onMilestoneClick(milestone)}
          className={`
            w-32 h-32 rounded-lg cursor-pointer
            transition-all duration-200 hover:shadow-lg hover:scale-105
            flex flex-col items-center justify-center p-3 relative
            ${isCompleted
              ? 'bg-card' 
              : isActive
              ? 'bg-card border-2 border-yellow-400/30 shadow-lg shadow-yellow-400/10'
              : milestoneIndex === currentMilestoneIndex
              ? 'bg-card border-2 border-primary/30 shadow-lg shadow-primary/10'
              : 'bg-card hover:bg-primary/5'
            }
            ${isFutureMilestone ? 'opacity-40' : ''}
          `}
          style={isCompleted ? {
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
          } : isActive ? {
            boxShadow: '0 0 20px rgba(234, 179, 8, 0.3)'
          } : {}}
        >
          {/* Green gradient border for completed milestones */}
          {isCompleted && (
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-green-400 via-green-500 to-emerald-600 p-[2px]">
              <div className="w-full h-full bg-card rounded-[6px]"></div>
            </div>
          )}

          {/* Yellow gradient border for active milestones */}
          {isActive && !isCompleted && (
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 p-[2px]">
              <div className="w-full h-full bg-card rounded-[6px]"></div>
            </div>
          )}

          {/* Status Icon */}
          <div className="absolute top-2 right-2 z-10">
            {isCompleted ? (
              <CheckCircle className="w-4 h-4 text-green-500 drop-shadow-sm" />
            ) : isActive ? (
              <Target className="w-4 h-4 text-yellow-500 drop-shadow-sm" />
            ) : (
              <Circle className={`w-4 h-4 ${isFutureMilestone ? 'text-muted-foreground/50' : 'text-muted-foreground'}`} />
            )}
          </div>
          
          {/* Date indicator */}
          <div className="absolute top-2 left-2 flex items-center gap-1 text-xs z-10">
            <Calendar className={`w-3 h-3 ${
              isCompleted ? 'text-green-500' : 
              isActive ? 'text-yellow-500' : 
              isFutureMilestone ? 'text-muted-foreground/50' : 'text-primary'
            }`} />
            <span className={`text-xs font-semibold ${
              isCompleted ? 'text-green-500' : 
              isActive ? 'text-yellow-500' : 
              isFutureMilestone ? 'text-muted-foreground/50' : 'text-primary'
            }`}>
              {new Date(milestone.start_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          
          {/* Milestone content */}
          <div className="flex-1 flex flex-col items-center justify-center text-center z-10">
            <p className={`text-sm font-medium leading-tight ${
              isCompleted 
                ? 'text-green-500 drop-shadow-sm' 
                : isActive
                ? 'text-yellow-600'
                : isFutureMilestone 
                ? 'text-card-foreground/50' 
                : 'text-card-foreground'
            }`}>
              {milestoneText.length > 45 ? `${milestoneText.substring(0, 45)}...` : milestoneText}
            </p>
            
            {/* Duration indicator */}
            <p className={`text-xs mt-1 ${
              isCompleted 
                ? 'text-green-400' 
                : isActive
                ? 'text-yellow-400'
                : isFutureMilestone 
                ? 'text-muted-foreground/40' 
                : 'text-muted-foreground'
            }`}>
              {milestone.getDurationInDays()} days
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
