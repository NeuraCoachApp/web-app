'use client'

import React, { useState, useMemo } from 'react'
import { Goal } from '@/src/classes/Goal'
import { Step } from '@/src/classes/Step'
import { Target, CheckCircle, Circle, Calendar, TrendingUp, Zap, Brain, ChevronDown } from 'lucide-react'

interface GoalTimelineProps {
  goals: Goal[]
  selectedGoalIndex?: number
  onGoalChange?: (index: number) => void
  onStepClick?: (step: Step) => void
}

interface StepSessionModalProps {
  isOpen: boolean
  onClose: () => void
  step: Step | null
}

function StepSessionModal({ isOpen, onClose, step }: StepSessionModalProps) {
  if (!isOpen || !step) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg border border-border p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-inter font-semibold text-card-foreground">
            Step Sessions
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl"
          >
            ×
          </button>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            {step.isCompleted() ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">Step:</span>
          </div>
          <p className="text-card-foreground font-medium mb-3">{step.text}</p>
          
          {/* Step Deadline */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Deadline:</span>
            <span className="text-card-foreground font-medium">
              {step.getFormattedEndDate()}
            </span>
            {/* Deadline status indicator */}
            {(() => {
              if (step.isCompleted()) {
                return <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Completed</span>
              } else if (step.isOverdue()) {
                return <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Overdue</span>
              } else if (step.getDaysRemaining() <= 1) {
                return <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Due Soon</span>
              } else {
                return <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">On Track</span>
              }
            })()}
          </div>
        </div>

        {step.getSessions().length === 0 ? (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No sessions logged for this step yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-card-foreground">
              Sessions ({step.getSessions().length})
            </h4>
            {step.getSessions().map((session, index) => {
              const insight = session.getInsight()
              return (
                <div key={`${step.uuid}-session-${index}`} className="bg-background rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {session.getFormattedDate()}
                    </span>
                  </div>
                  
                  {insight && (
                    <div className="space-y-2">
                      <p className="text-sm text-card-foreground">
                        {insight.summary}
                      </p>
                      
                      <div className="flex gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-blue-500" />
                          <span>Progress: {insight.progress}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-yellow-500" />
                          <span>Effort: {insight.effort_level}/10</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Brain className="w-3 h-3 text-red-500" />
                          <span>Stress: {insight.stress_level}/10</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function GoalTimeline({ 
  goals, 
  selectedGoalIndex: externalSelectedGoalIndex = 0, 
  onGoalChange, 
  onStepClick 
}: GoalTimelineProps) {
  const [selectedStep, setSelectedStep] = useState<Step | null>(null)
  const [internalSelectedGoalIndex, setInternalSelectedGoalIndex] = useState(0)
  const [showGoalDropdown, setShowGoalDropdown] = useState(false)

  // Use external goal index if provided, otherwise use internal state
  const selectedGoalIndex = onGoalChange ? externalSelectedGoalIndex : internalSelectedGoalIndex
  const setSelectedGoalIndex = onGoalChange || setInternalSelectedGoalIndex

  const currentGoal = goals && goals.length > 0 ? goals[selectedGoalIndex] : null

  // Get steps from the current goal
  const sortedSteps = useMemo(() => {
    if (!currentGoal) return []
    return currentGoal.getSteps()
  }, [currentGoal])

  // Determine current step index (first incomplete step with sessions, or first incomplete step)
  const currentStepIndex = useMemo(() => {
    if (sortedSteps.length === 0) return -1
    
    // Find the first step that is not completed but has sessions (user is working on it)
    const activeStepIndex = sortedSteps.findIndex(step => 
      !step.isCompleted() && step.getSessions().length > 0
    )
    
    if (activeStepIndex !== -1) return activeStepIndex
    
    // If no active step with sessions, find first incomplete step
    const firstIncompleteIndex = sortedSteps.findIndex(step => !step.isCompleted())
    
    return firstIncompleteIndex !== -1 ? firstIncompleteIndex : sortedSteps.length - 1
  }, [sortedSteps])

  // Check if all steps are completed
  const allStepsCompleted = useMemo(() => {
    if (sortedSteps.length === 0) return false
    return sortedSteps.every(step => step.isCompleted())
  }, [sortedSteps])

  // Debug logging
  console.log('🎨 [GoalTimeline] Received goals:', goals)
  console.log('🎨 [GoalTimeline] Goals count:', goals?.length || 0)
  console.log('🎨 [GoalTimeline] Selected goal index:', selectedGoalIndex)
  console.log('🎨 [GoalTimeline] Current goal:', currentGoal)
  console.log('🎨 [GoalTimeline] Sorted steps count:', sortedSteps.length)
  console.log('🎨 [GoalTimeline] Current step index:', currentStepIndex)
  console.log('🎨 [GoalTimeline] All steps completed:', allStepsCompleted)
  
  sortedSteps.forEach((step, index) => {
    const isCompleted = step.isCompleted()
    const isFuture = index > currentStepIndex && !isCompleted
    console.log(`📋 [GoalTimeline] Step ${index + 1}: ${isCompleted ? '✅' : '⭕'} ${isFuture ? '🔮' : '🎯'} ${step.text.substring(0, 30)}... (Next: ${step.next_step?.substring(0, 8) || 'null'}, Sessions: ${step.getSessions().length})`)
  })

  // Create placeholder timeline when no goals exist
  const renderPlaceholderTimeline = () => {
    const placeholderSteps = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      text: `Step ${i + 1}`,
      isPlaceholder: true
    }))

    return (
      <div className="w-full">
        <div className="mb-8">
          {/* Horizontal Timeline Container */}
          <div className="relative overflow-x-auto py-32">
            <div className="flex items-center min-w-max px-8">
              
              {/* Goal Creation Block - Glowing */}
              <div className="relative flex flex-col items-center mr-20">
                <div 
                  onClick={() => window.location.href = '/goal-creation'}
                  className="w-32 h-32 bg-primary rounded-lg cursor-pointer 
                           transition-all duration-200 hover:shadow-lg hover:scale-105
                           flex flex-col items-center justify-center p-4
                           animate-pulse shadow-lg shadow-primary/50 ring-2 ring-primary/30"
                >
                  <Target className="w-8 h-8 text-primary-foreground mb-2" />
                  <p className="text-xs font-medium text-primary-foreground text-center leading-tight">
                    Create Your Goal
                  </p>
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs text-muted-foreground">Start Here</p>
                </div>
                
                {/* Timeline line starting from goal creation */}
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-20 h-0.5 bg-muted opacity-50" />
              </div>

              {/* Placeholder Steps with alternating up/down pattern */}
              <div className="relative flex items-center">
                {/* Main horizontal timeline line */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted opacity-50 transform -translate-y-1/2" />
                
                {placeholderSteps.map((step, stepIndex) => {
                  const isEven = stepIndex % 2 === 0
                  
                  return (
                    <div key={step.id} className="relative flex-shrink-0 mr-32">
                      {/* Timeline dot at center intersection */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-muted opacity-50 rounded-full z-20" />
                      
                      {/* Connecting line extending from center to step */}
                      <div className={`absolute left-1/2 transform -translate-x-1/2 w-0.5 bg-muted opacity-50 z-0 ${
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
                        {/* Placeholder Step Square */}
                        <div className="w-28 h-28 bg-muted/30 rounded-lg 
                                      flex flex-col items-center justify-center p-3 
                                      opacity-40">
                          {/* Status Icon */}
                          <div className="absolute top-2 right-2">
                            <Circle className="w-4 h-4 text-muted-foreground/50" />
                          </div>
                          
                          {/* Step content */}
                          <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <p className="text-xs font-medium text-muted-foreground/70 leading-tight">
                              {step.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Goal Completion Placeholder */}
              <div className="relative flex flex-col items-center ml-16">
                <div className="w-28 h-28 bg-muted/30 rounded-lg opacity-40
                             flex flex-col items-center justify-center p-3">
                  <Target className="w-7 h-7 text-muted-foreground/50 mb-1" />
                  <p className="text-xs font-medium text-muted-foreground/70 text-center">
                    Complete
                  </p>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-xs text-muted-foreground/70">Finish</p>
                </div>
                
                {/* Timeline line ending at completion */}
                <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-16 h-0.5 bg-muted opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!goals || goals.length === 0) {
    return renderPlaceholderTimeline()
  }

  const handleStepClick = (step: Step) => {
    setSelectedStep(step)
    
    if (onStepClick) {
      onStepClick(step)
    }
  }

  return (
    <>
      <div className="w-full">
        {/* Goal Switcher */}
        {goals.length > 1 && (
          <div className="mb-6 px-8">
            <div className="relative inline-block">
              <button
                onClick={() => setShowGoalDropdown(!showGoalDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg 
                         hover:bg-muted transition-colors text-sm font-medium"
              >
                <Target className="w-4 h-4 text-primary" />
                <span>Goal {selectedGoalIndex + 1}: {currentGoal?.text.substring(0, 30)}...</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showGoalDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showGoalDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-30 min-w-full">
                  {goals.map((goal, index) => (
                    <button
                      key={goal.uuid}
                      onClick={() => {
                        setSelectedGoalIndex(index)
                        setShowGoalDropdown(false)
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
                        {goal.getCompletedStepsCount()}/{goal.getTotalStepsCount()} steps completed
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="mb-8">
          {/* Horizontal Timeline Container */}
          <div className="relative overflow-x-auto py-32">
            <div className="flex items-center min-w-max px-8">
              
              {/* Goal Square */}
              <div className="relative flex flex-col items-center mr-20">
                <div className={`w-32 h-32 rounded-lg cursor-pointer 
                             transition-all duration-200 hover:shadow-lg hover:scale-105
                             flex flex-col items-center justify-center p-4 relative overflow-hidden
                             ${allStepsCompleted ? 'bg-green-500' : 'bg-primary'}`}>
                  
                  {/* Glossy Green Overlay for Completed Goal */}
                  {allStepsCompleted && (
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
                    {currentGoal?.text && currentGoal.text.length > 60 ? `${currentGoal.text.substring(0, 60)}...` : currentGoal?.text}
                  </p>
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs text-muted-foreground">Goal</p>
                  <p className="text-xs text-muted-foreground">
                    {currentGoal ? new Date(currentGoal.created_at).toLocaleDateString() : ''}
                  </p>
                </div>
                
                {/* Timeline line starting from goal */}
                {sortedSteps.length > 0 && (
                  <div className={`absolute left-full top-1/2 transform -translate-y-1/2 w-20 h-0.5 ${
                    allStepsCompleted ? 'bg-green-500' : 'bg-primary'
                  }`} />
                )}
              </div>

              {/* Steps with alternating up/down pattern */}
              <div className="relative flex items-center">
                {/* Main horizontal timeline line */}
                <div className={`absolute top-1/2 left-0 right-0 h-0.5 transform -translate-y-1/2 ${
                  allStepsCompleted ? 'bg-green-500' : 'bg-primary'
                }`} />
                
                {sortedSteps.map((step, stepIndex) => {
                  const isEven = stepIndex % 2 === 0
                  const isLast = stepIndex === sortedSteps.length - 1
                  const hasSessions = step.getSessions().length > 0
                  const isCompleted = step.isCompleted()
                  const isFutureStep = stepIndex > currentStepIndex && !isCompleted
                  
                  return (
                    <div key={step.uuid} className="relative flex-shrink-0 mr-32">
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
                          onClick={() => handleStepClick(step)}
                          className={`
                            w-28 h-28 bg-card rounded-lg cursor-pointer
                            transition-all duration-200 hover:shadow-lg hover:scale-105
                            flex flex-col items-center justify-center p-3 relative
                            ${isCompleted
                              ? 'relative overflow-hidden' 
                              : 'hover:bg-primary/5'
                            }
                            ${hasSessions ? 'ring-2 ring-primary/20' : ''}
                            ${isFutureStep ? 'opacity-40' : ''}
                          `}
                        >
                          {/* Glossy Green Overlay for Completed Steps */}
                          {step.isCompleted() && (
                            <>
                              {/* Base green gradient background */}
                              <div className="absolute inset-0 bg-green-500 rounded-lg" />
                              
                              {/* Edge highlight */}
                              <div className="absolute inset-0 border border-green-500/50 rounded-lg" />
                            </>
                          )}
                          {/* Status Icon */}
                          <div className="absolute top-2 right-2">
                            {isCompleted ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Circle className={`w-4 h-4 ${isFutureStep ? 'text-muted-foreground/50' : 'text-muted-foreground'}`} />
                            )}
                          </div>
                          
                          {/* Session count indicator */}
                          {hasSessions && (
                            <div className="absolute top-2 left-2 flex items-center gap-1 text-xs text-primary">
                              <Brain className="w-3 h-3" />
                              <span className="text-xs font-semibold">{step.getSessions().length}</span>
                            </div>
                          )}
                          
                          {/* Step content */}
                          <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <p className={`text-xs font-medium leading-tight ${
                              isFutureStep ? 'text-card-foreground/50' : 'text-card-foreground'
                            }`}>
                              {step.text.length > 45 ? `${step.text.substring(0, 45)}...` : step.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Goal Completion Indicator */}
              {sortedSteps.length > 0 && (
                <div className="relative flex flex-col items-center ml-16">
                  <div className={`w-28 h-28 rounded-lg flex flex-col items-center justify-center p-3 relative overflow-hidden ${
                    allStepsCompleted ? 'bg-green-500' : 'bg-primary/10'
                  }`}>
                    
                    {/* Glossy Green Overlay for Completed Goal */}
                    {allStepsCompleted && (
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
                      allStepsCompleted ? 'text-white' : 'text-primary'
                    }`} />
                    <p className={`text-xs font-medium text-center relative z-10 ${
                      allStepsCompleted ? 'text-white' : 'text-foreground'
                    }`}>
                      Complete
                    </p>
                    <p className={`text-xs text-center relative z-10 ${
                      allStepsCompleted ? 'text-green-100' : 'text-muted-foreground'
                    }`}>
                      {currentGoal ? `${currentGoal.getCompletedStepsCount()}/${currentGoal.getTotalStepsCount()}` : '0/0'}
                    </p>
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-xs text-muted-foreground">Finish</p>
                  </div>
                  
                  {/* Timeline line ending at completion */}
                  <div className={`absolute right-full top-1/2 transform -translate-y-1/2 w-16 h-0.5 ${
                    allStepsCompleted ? 'bg-green-500' : 'bg-primary'
                  }`} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Step Session Modal */}
      <StepSessionModal
        isOpen={!!selectedStep}
        onClose={() => setSelectedStep(null)}
        step={selectedStep}
      />
    </>
  )
}
