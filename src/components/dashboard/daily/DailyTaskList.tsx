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
    <div className="flex items-center gap-4 py-4 px-5 hover:bg-background/60 transition-all duration-200">
      <button
        onClick={handleToggle}
        className="flex-shrink-0 text-primary hover:text-primary/80 transition-colors hover:scale-110 transform duration-200"
      >
        {task.isCompleted ? (
          <CheckSquare className="w-5 h-5" />
        ) : (
          <Square className="w-5 h-5" />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${
          task.isCompleted 
            ? 'text-muted-foreground line-through' 
            : isOverdue 
              ? 'text-red-400' 
              : 'text-foreground'
        }`}>
          {task.text}
        </p>
        {isOverdue && !task.isCompleted && (
          <p className="text-xs text-red-400 mt-1 font-medium">
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
      <div className="w-full max-w-2xl mx-auto">
        <div 
          className="relative rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/25 border border-border/50 overflow-hidden backdrop-blur-sm"
          style={{
            backgroundImage: 'url(/background/topography.svg)',
            backgroundSize: '600px 600px',
            backgroundRepeat: 'repeat',
            backgroundPosition: 'center',
            backgroundAttachment: 'local',
            filter: 'invert(0) contrast(1)',
          }}
        >
          {/* Dark mode background adjustment - inverted pattern for visibility */}
          <div 
            className="absolute inset-0 hidden dark:block"
            style={{
              backgroundImage: 'url(/background/topography.svg)',
              backgroundSize: '600px 600px',
              backgroundRepeat: 'repeat',
              backgroundPosition: 'center',
              filter: 'invert(1) opacity(0.15) contrast(1.2)',
            }}
          />
          
          {/* Overlay to ensure readability */}
          <div className="absolute inset-0 bg-background/85 dark:bg-background/75" />
          
          {/* Content */}
          <div className="relative z-10 text-center py-12 px-8">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No tasks for today
            </h3>
            <p className="text-muted-foreground">
              {goal ? 'All your tasks are either completed or scheduled for other days.' : 'Select a goal to see your daily tasks.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const completedCount = todaysTasks.filter(task => task.isCompleted).length

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div 
        className="relative rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/25 border border-border/50 overflow-hidden backdrop-blur-sm"
        style={{
          backgroundImage: 'url(/background/topography.svg)',
          backgroundSize: '600px 600px',
          backgroundRepeat: 'repeat',
          backgroundPosition: 'center',
          backgroundAttachment: 'local'
        }}
      >
        {/* Dark mode background adjustment - inverted pattern for visibility */}
        <div 
          className="absolute inset-0 hidden dark:block"
          style={{
            backgroundImage: 'url(/background/topography.svg)',
            backgroundSize: '600px 600px',
            backgroundRepeat: 'repeat',
            backgroundPosition: 'center',
            filter: 'invert(1) opacity(0.2) contrast(1)',
          }}
        />
        
        {/* Overlay to ensure readability */}
        <div className="absolute inset-0 bg-background/85 dark:bg-background/10" />
        
        {/* Content */}
        <div className="relative z-10 p-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
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
              <p className="text-sm text-muted-foreground mt-2">
                From goal: <span className="font-medium text-foreground">{goal.text}</span>
              </p>
            )}
          </div>

          {/* Task List */}
          <div className="space-y-2 mb-8">
            {todaysTasks.map(task => (
              <div key={task.uuid} className="bg-background/40 rounded-xl border border-border/30 backdrop-blur-sm">
                <TaskItem
                  task={task}
                  onToggle={onTaskToggle}
                />
              </div>
            ))}
          </div>

          {/* Progress Summary */}
          <div className="p-6 bg-card/90 backdrop-blur-md border border-border/50 rounded-xl shadow-lg">
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-muted-foreground font-medium">Progress:</span>
              <span className="font-semibold text-foreground">
                {completedCount} of {todaysTasks.length} completed
              </span>
            </div>
            <div className="w-full bg-muted/60 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-primary h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ 
                  width: `${todaysTasks.length > 0 ? (completedCount / todaysTasks.length) * 100 : 0}%` 
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
