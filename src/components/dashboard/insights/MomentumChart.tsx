'use client'

import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { TrendingUp, Zap, Brain } from 'lucide-react'
import { Goal } from '@/src/classes/Goal'
import { AggregatedMetrics } from './types'

interface MomentumChartProps {
  goal: Goal
  metrics: AggregatedMetrics
}

export default function MomentumChart({ goal, metrics }: MomentumChartProps) {
  // Combine all metrics into a single dataset for the momentum chart
  const chartData = React.useMemo(() => {
    const dateMap = new Map()
    
    // Add effort data
    metrics.effort.forEach(item => {
      const date = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (!dateMap.has(date)) {
        dateMap.set(date, { name: date, fullDate: item.date })
      }
      dateMap.get(date).effort = item.value
    })
    
    // Add stress data (inverted for better visualization - lower stress is better)
    metrics.stress.forEach(item => {
      const date = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (!dateMap.has(date)) {
        dateMap.set(date, { name: date, fullDate: item.date })
      }
      dateMap.get(date).wellbeing = 10 - item.value // Invert stress to wellbeing
    })
    
    // Add progress data
    metrics.progress.forEach(item => {
      const date = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (!dateMap.has(date)) {
        dateMap.set(date, { name: date, fullDate: item.date })
      }
      dateMap.get(date).progress = item.value / 10 // Scale to 0-10 for consistency
    })
    
    return Array.from(dateMap.values()).slice(-14) // Last 14 days
  }, [metrics])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="text-card-foreground font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="text-card-foreground font-medium">
                {entry.value?.toFixed(1)}/10
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  // Calculate momentum score (average of effort, wellbeing, and progress)
  const momentumData = chartData.map(item => ({
    ...item,
    momentum: ((item.effort || 0) + (item.wellbeing || 0) + (item.progress || 0)) / 3
  }))

  const currentMomentum = momentumData.length > 0 
    ? momentumData[momentumData.length - 1].momentum 
    : 0

  const getMomentumColor = (momentum: number) => {
    if (momentum >= 7) return 'text-green-500'
    if (momentum >= 5) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getMomentumLabel = (momentum: number) => {
    if (momentum >= 7) return 'High'
    if (momentum >= 5) return 'Moderate'
    return 'Low'
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-card-foreground">Momentum & Wellbeing</h3>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Current Momentum</div>
          <div className={`text-lg font-bold ${getMomentumColor(currentMomentum)}`}>
            {getMomentumLabel(currentMomentum)}
          </div>
        </div>
      </div>
      
      <div className="h-64 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={momentumData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="momentumGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
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
              domain={[0, 10]}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Individual metrics as lines */}
            <Line 
              type="monotone" 
              dataKey="effort" 
              stroke="#f59e0b" 
              strokeWidth={2}
              name="Effort"
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
              connectNulls={false}
            />
            <Line 
              type="monotone" 
              dataKey="wellbeing" 
              stroke="#22c55e" 
              strokeWidth={2}
              name="Wellbeing"
              dot={{ fill: '#22c55e', strokeWidth: 2, r: 3 }}
              connectNulls={false}
            />
            <Line 
              type="monotone" 
              dataKey="progress" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Progress"
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
              connectNulls={false}
            />
            
            {/* Momentum area */}
            <Area
              type="monotone"
              dataKey="momentum"
              stroke="#8b5cf6"
              strokeWidth={3}
              fill="url(#momentumGradient)"
              name="Overall Momentum"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend and Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-card-foreground">Effort</span>
            <div className="flex-1 border-b border-yellow-500 opacity-30"></div>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-green-500" />
            <span className="text-sm text-card-foreground">Wellbeing</span>
            <div className="flex-1 border-b border-green-500 opacity-30"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-card-foreground">Progress</span>
            <div className="flex-1 border-b border-blue-500 opacity-30"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span className="text-sm text-card-foreground">Momentum</span>
            <div className="flex-1 border-b border-purple-500 opacity-30"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
