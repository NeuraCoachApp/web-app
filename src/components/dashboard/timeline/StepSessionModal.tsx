import React from 'react'
import { Calendar, CheckCircle, Circle, TrendingUp, Zap, Brain } from 'lucide-react'
import { StepSessionModalProps } from './types'

export default function StepSessionModal({ isOpen, onClose, step }: StepSessionModalProps) {
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
