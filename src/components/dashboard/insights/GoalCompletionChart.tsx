'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Target, CheckCircle, Clock } from 'lucide-react'
import { Goal } from '@/src/classes/Goal'

interface GoalCompletionChartProps {
  goal: Goal
}

export default function GoalCompletionChart({ goal }: GoalCompletionChartProps) {
  const completedTasks = goal.getCompletedTasksCount()
  const totalTasks = goal.getTotalTasksCount()
  const activeTasks = totalTasks - completedTasks
  
  const data = [
    {
      name: 'Completed Tasks',
      value: completedTasks,
      color: '#22c55e',
      icon: CheckCircle
    },
    {
      name: 'Active Tasks',
      value: activeTasks,
      color: '#f59e0b',
      icon: Clock
    }
  ]

  const COLORS = ['#22c55e', '#f59e0b']

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="text-card-foreground font-medium">{data.name}</p>
          <p className="text-primary">
            {data.value} tasks ({((data.value / totalTasks) * 100).toFixed(1)}%)
          </p>
        </div>
      )
    }
    return null
  }

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    if (percent < 0.05) return null // Don't show label for very small slices

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-sm font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-card-foreground">Goal Completion</h3>
      </div>
      
      <div className="h-64 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend and Stats */}
      <div className="space-y-3">
        {data.map((item, index) => {
          const Icon = item.icon
          return (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-card-foreground">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-card-foreground">
                  {item.value}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  ({((item.value / totalTasks) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Overall Progress */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary mb-1">
            {goal.getCompletionPercentage()}%
          </div>
          <div className="text-xs text-muted-foreground">
            Overall Progress
          </div>
        </div>
      </div>
    </div>
  )
}
