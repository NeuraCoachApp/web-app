'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Target, CheckCircle2, Circle } from 'lucide-react'
import { Goal } from '@/src/classes/Goal'

interface MilestoneProgressChartProps {
  goal: Goal
}

export default function MilestoneProgressChart({ goal }: MilestoneProgressChartProps) {
  const milestones = goal.milestones || []
  const allTasks = goal.getTasks()
  
  const chartData = milestones.map((milestone, index) => {
    // Filter tasks that belong to this milestone
    const milestoneTasks = allTasks.filter(task => task.milestone_uuid === milestone.uuid)
    const completedTasks = milestoneTasks.filter(task => task.isCompleted).length
    const totalTasks = milestoneTasks.length
    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    
    return {
      name: `M${index + 1}`,
      fullName: milestone.text.length > 20 ? milestone.text.substring(0, 20) + '...' : milestone.text,
      completion: completionPercentage,
      completedTasks,
      totalTasks,
      isCompleted: completionPercentage === 100
    }
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3 max-w-xs">
          <p className="text-card-foreground font-medium mb-1">{data.fullName}</p>
          <p className="text-primary mb-1">
            Progress: {data.completion.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">
            {data.completedTasks} of {data.totalTasks} tasks completed
          </p>
        </div>
      )
    }
    return null
  }

  const getBarColor = (completion: number) => {
    if (completion === 100) return '#22c55e' // Green for completed
    if (completion >= 50) return '#f59e0b' // Yellow for in progress
    return '#ef4444' // Red for just started
  }

  const completedMilestones = chartData.filter(m => m.isCompleted).length
  const totalMilestones = chartData.length
  const overallProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-card-foreground">Milestone Progress</h3>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Milestones Complete</div>
          <div className="text-lg font-bold text-indigo-500">
            {completedMilestones}/{totalMilestones}
          </div>
        </div>
      </div>
      
      {chartData.length > 0 ? (
        <>
          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  className="text-xs fill-muted-foreground"
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  className="text-xs fill-muted-foreground"
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="completion" 
                  radius={[4, 4, 0, 0]}
                  className="hover:opacity-80 transition-opacity"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.completion)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Milestone List */}
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {chartData.map((milestone, index) => (
              <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                {milestone.isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-card-foreground truncate">
                    {milestone.fullName}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className="rounded-full h-2 transition-all duration-300"
                        style={{ 
                          width: `${milestone.completion}%`,
                          backgroundColor: getBarColor(milestone.completion)
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {milestone.completion.toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {milestone.completedTasks}/{milestone.totalTasks} tasks
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No milestones created yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Milestones will appear here once you create your first goal
          </p>
        </div>
      )}

      {/* Overall Progress */}
      {chartData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Overall Milestone Progress</span>
            <span className="text-sm font-medium text-indigo-500">
              {overallProgress.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2 w-full bg-muted rounded-full h-2">
            <div 
              className="bg-indigo-500 rounded-full h-2 transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
