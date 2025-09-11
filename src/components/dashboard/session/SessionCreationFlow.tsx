import React from 'react'
import { Task } from '@/src/classes/Task'
import { Goal } from '@/src/classes/Goal'

interface SessionCreationFlowProps {
  task: Task
  goal: Goal
  isOpen: boolean
  onClose: () => void
  onSessionComplete?: (success: boolean) => void
}

export function SessionCreationFlow({ 
  task, 
  goal, 
  isOpen, 
  onClose, 
  onSessionComplete 
}: SessionCreationFlowProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg border border-border p-6 max-w-lg w-full mx-4">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-card-foreground">
            Session Creation
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl"
          >
            ×
          </button>
        </div>
        
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Session creation flow will be implemented with the new task structure.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Task: {task.text}
          </p>
          <p className="text-sm text-muted-foreground">
            Goal: {goal.text}
          </p>
          
          <button
            onClick={() => {
              onSessionComplete?.(true)
              onClose()
            }}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}