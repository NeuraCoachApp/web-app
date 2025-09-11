import React from 'react'
import { Calendar, CheckCircle, Circle, Target, Clock, X } from 'lucide-react'
import { MilestoneTasksModalProps } from './types'
import { Task } from '@/src/classes/Task'

export default function MilestoneTasksModal({ isOpen, onClose, milestone, goal }: MilestoneTasksModalProps) {
  if (!isOpen || !milestone || !goal) return null

  // Get tasks for this milestone from the goal
  const milestoneTasks = goal.getTasks().filter(task => task.milestone_uuid === milestone.uuid)

  const completedTasks = milestoneTasks.filter(task => task.isCompleted)
  const incompleteTasks = milestoneTasks.filter(task => !task.isCompleted)

  const getTaskStatusIcon = (task: Task) => {
    if (task.isCompleted) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    } else if (task.isOverdue()) {
      return <Circle className="w-4 h-4 text-red-500" />
    } else if (task.isActive()) {
      return <Target className="w-4 h-4 text-yellow-500" />
    } else {
      return <Circle className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getTaskStatusText = (task: Task) => {
    if (task.isCompleted) return 'Completed'
    if (task.isOverdue()) return 'Overdue'
    if (task.isActive()) return 'Active'
    if (task.isUpcoming()) return 'Upcoming'
    return 'Pending'
  }

  const getTaskStatusColor = (task: Task) => {
    if (task.isCompleted) return 'text-green-500'
    if (task.isOverdue()) return 'text-red-500'
    if (task.isActive()) return 'text-yellow-500'
    return 'text-muted-foreground'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg border border-border p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-inter font-semibold text-card-foreground">
            Milestone Tasks
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Milestone Info */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Milestone:</span>
          </div>
          <p className="text-card-foreground font-medium mb-3">{milestone.text}</p>
          
          {/* Milestone Timeline */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Start:</span>
              <span className="text-card-foreground font-medium">
                {milestone.getFormattedStartDate()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">End:</span>
              <span className="text-card-foreground font-medium">
                {milestone.getFormattedEndDate()}
              </span>
            </div>
          </div>
          
          {/* Milestone Status */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <span className={`text-sm font-medium ${
              milestone.isPast() ? 'text-green-500' : 
              milestone.isActive() ? 'text-yellow-500' : 
              'text-muted-foreground'
            }`}>
              {milestone.isPast() ? 'Completed' : 
               milestone.isActive() ? 'Active' : 
               milestone.isUpcoming() ? 'Upcoming' : 'Past'}
            </span>
          </div>
        </div>

        {/* Tasks Summary */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Tasks Progress</span>
            <span>{completedTasks.length} of {milestoneTasks.length} completed</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${milestoneTasks.length > 0 ? (completedTasks.length / milestoneTasks.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {milestoneTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No tasks found for this milestone</p>
            </div>
          ) : (
            <>
              {/* Incomplete Tasks */}
              {incompleteTasks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-card-foreground mb-3">
                    Active Tasks ({incompleteTasks.length})
                  </h4>
                  <div className="space-y-2">
                    {incompleteTasks.map((task) => (
                      <div
                        key={task.uuid}
                        className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border/50"
                      >
                        <div className="mt-0.5">
                          {getTaskStatusIcon(task)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-card-foreground">
                            {task.text}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span className={getTaskStatusColor(task)}>
                              {getTaskStatusText(task)}
                            </span>
                            <span>Due: {task.getFormattedEndDate()}</span>
                            {task.getDaysRemaining() !== 0 && (
                              <span className={task.isOverdue() ? 'text-red-500' : ''}>
                                {task.getDaysRemaining() > 0 
                                  ? `${task.getDaysRemaining()} days left` 
                                  : `${Math.abs(task.getDaysRemaining())} days overdue`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-card-foreground mb-3">
                    Completed Tasks ({completedTasks.length})
                  </h4>
                  <div className="space-y-2">
                    {completedTasks.map((task) => (
                      <div
                        key={task.uuid}
                        className="flex items-start gap-3 p-3 bg-green-50/50 dark:bg-green-950/20 rounded-lg border border-green-200/50 dark:border-green-800/50"
                      >
                        <div className="mt-0.5">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-green-700 dark:text-green-300 line-through">
                            {task.text}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-green-600 dark:text-green-400">
                            <span>Completed</span>
                            <span>Due: {task.getFormattedEndDate()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
