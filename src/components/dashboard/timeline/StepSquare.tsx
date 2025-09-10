import React from 'react'
import { CheckCircle, Circle, Brain } from 'lucide-react'
import { StepSquareProps } from './types'

export default function StepSquare({ 
  step, 
  stepIndex, 
  currentStepIndex, 
  allStepsCompleted, 
  onStepClick 
}: StepSquareProps) {
  // Null safety checks for step properties
  const stepText = step.text || 'Untitled Step'
  const isEven = stepIndex % 2 === 0
  const hasSessions = step.getSessions().length > 0
  const isCompleted = step.isCompleted()
  const isFutureStep = stepIndex > currentStepIndex && !isCompleted

  return (
    <div className="relative flex-shrink-0 mr-32">
      {/* Timeline dot at center intersection */}
      <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full z-20 ${
        isFutureStep ? 'bg-muted opacity-50' : allStepsCompleted ? 'bg-green-500' : 'bg-primary'
      }`} />
      
      {/* Connecting line extending from center to step */}
      <div className={`absolute left-1/2 transform -translate-x-1/2 w-0.5 z-0 ${
        isFutureStep ? 'bg-muted opacity-50' : allStepsCompleted ? 'bg-green-500' : 'bg-primary'
      } ${
        isEven 
          ? 'top-1/2 h-20' // Line extending down from center
          : 'top-1/2 -translate-y-full h-20' // Line extending up from center
      }`} />
      
      {/* Step positioned at end of connecting line */}
      <div className={`absolute left-1/2 transform -translate-x-1/2 ${
        isEven 
          ? 'top-1/2 mt-20' // Position at bottom of down line
          : 'top-1/2 -translate-y-full -mt-20' // Position at top of up line
      }`}>
        {/* Step Square */}
        <div
          onClick={() => onStepClick(step)}
          className={`
            w-32 h-32 rounded-lg cursor-pointer
            transition-all duration-200 hover:shadow-lg hover:scale-105
            flex flex-col items-center justify-center p-3 relative
            ${isCompleted
              ? 'bg-card' 
              : stepIndex === currentStepIndex
              ? 'bg-card border-2 border-primary/30 shadow-lg shadow-primary/10'
              : 'bg-card hover:bg-primary/5'
            }
            ${hasSessions ? 'ring-2 ring-primary/20' : ''}
            ${isFutureStep ? 'opacity-40' : ''}
          `}
          style={isCompleted ? {
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
          } : {}}
        >
          {/* Green gradient border for completed steps */}
          {step.isCompleted() && (
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-green-400 via-green-500 to-emerald-600 p-[2px]">
              <div className="w-full h-full bg-card rounded-[6px]"></div>
            </div>
          )}
          {/* Status Icon */}
          <div className="absolute top-2 right-2 z-10">
            {isCompleted ? (
              <CheckCircle className="w-4 h-4 text-green-500 drop-shadow-sm" />
            ) : (
              <Circle className={`w-4 h-4 ${isFutureStep ? 'text-muted-foreground/50' : 'text-muted-foreground'}`} />
            )}
          </div>
          
          {/* Session count indicator */}
          {hasSessions && (
            <div className="absolute top-2 left-2 flex items-center gap-1 text-xs text-primary z-10">
              <Brain className="w-3 h-3" />
              <span className="text-xs font-semibold">{step.getSessions().length}</span>
            </div>
          )}
          
          {/* Step content */}
          <div className="flex-1 flex flex-col items-center justify-center text-center z-10">
            <p className={`text-sm font-medium leading-tight ${
              isCompleted 
                ? 'text-card-foreground text-xs text-green-500 drop-shadow-sm' 
                : isFutureStep 
                ? 'text-card-foreground/50' 
                : 'text-card-foreground'
            }`}>
              {stepText.length > 45 ? `${stepText.substring(0, 45)}...` : stepText}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
