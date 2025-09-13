'use client'

import React from 'react'
import { Goal } from '@/src/classes/Goal'
import { Task } from '@/src/classes/Task'
import { getTodaysTasks } from '../timeline/utils'
import { Calendar, Square, CheckSquare } from 'lucide-react'

interface DailyTaskListProps {
  goal: Goal | null
  onTaskToggle?: (task: Task) => void
}

interface TaskItemProps {
  task: Task
  onToggle?: (task: Task) => void
}

function TaskItem({ task, onToggle }: TaskItemProps) {
  const handleToggle = () => {
    if (onToggle) {
      onToggle(task)
    }
  }

  const isOverdue = task.isOverdue()

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
      <button
        onClick={handleToggle}
        className="flex-shrink-0 text-primary hover:text-primary/80 transition-colors"
      >
        {task.isCompleted ? (
          <CheckSquare className="w-5 h-5" />
        ) : (
          <Square className="w-5 h-5" />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${
          task.isCompleted 
            ? 'text-muted-foreground line-through' 
            : isOverdue 
              ? 'text-red-400' 
              : 'text-foreground'
        }`}>
          {task.text}
        </p>
        {isOverdue && !task.isCompleted && (
          <p className="text-xs text-red-400 mt-1">
            Overdue by {Math.abs(task.getDaysRemaining())} day{Math.abs(task.getDaysRemaining()) === 1 ? '' : 's'}
          </p>
        )}
      </div>
    </div>
  )
}

export default function DailyTaskList({ goal, onTaskToggle }: DailyTaskListProps) {
  const todaysTasks = getTodaysTasks(goal)

  if (todaysTasks.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          No tasks for today
        </h3>
        <p className="text-muted-foreground">
          {goal ? 'All your tasks are either completed or scheduled for other days.' : 'Select a goal to see your daily tasks.'}
        </p>
      </div>
    )
  }

  const completedCount = todaysTasks.filter(task => task.isCompleted).length

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">
            Today's Tasks
          </h2>
        </div>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
        {goal && (
          <p className="text-sm text-muted-foreground mt-1">
            From goal: <span className="font-medium text-foreground">{goal.text}</span>
          </p>
        )}
      </div>

      {/* Task List */}
      <div className="space-y-1 mb-6">
        {todaysTasks.map(task => (
          <TaskItem
            key={task.uuid}
            task={task}
            onToggle={onTaskToggle}
          />
        ))}
      </div>

      {/* Progress Summary */}
      <div className="p-4 bg-card border border-border rounded-lg">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progress:</span>
          <span className="font-semibold text-foreground">
            {completedCount} of {todaysTasks.length} completed
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${todaysTasks.length > 0 ? (completedCount / todaysTasks.length) * 100 : 0}%` 
            }}
          />
        </div>
      </div>
    </div>
  )
}
