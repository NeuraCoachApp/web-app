'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { CheckCircle2, Target, AlertCircle } from 'lucide-react'
import { Goal } from '@/src/classes/Goal'
import { MetricData } from './types'

interface SessionCompletionChartProps {
  goal: Goal
  data: MetricData[]
}

export default function SessionCompletionChart({ goal, data }: SessionCompletionChartProps) {
  // Transform the data for the chart
  const chartData = data.slice(-14).map((item, index) => {
    const date = new Date(item.date)
    return {
      name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: item.date,
      completion: item.value,
      summary: item.summary
    }
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const completionLevel = getCompletionLevel(data.completion)
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3 max-w-xs">
          <p className="text-card-foreground font-medium mb-1">{label}</p>
          <p className="text-blue-500 mb-2">
            Session Completion: {data.completion}% ({completionLevel})
          </p>
          <p className="text-xs text-muted-foreground">
            {data.summary}
          </p>
        </div>
      )
    }
    return null
  }

  const getCompletionLevel = (completion: number) => {
    if (completion === 100) return 'Perfect'
    if (completion >= 80) return 'Excellent'
    if (completion >= 60) return 'Good'
    if (completion >= 40) return 'Fair'
    return 'Needs Work'
  }

  const getCompletionColor = (completion: number) => {
    if (completion >= 90) return '#22c55e' // Green
    if (completion >= 70) return '#84cc16' // Light green
    if (completion >= 50) return '#eab308' // Yellow
    if (completion >= 30) return '#f97316' // Orange
    return '#ef4444' // Red
  }

  const averageCompletion = data.length > 0 
    ? data.reduce((sum, item) => sum + item.value, 0) / data.length
    : 0

  const perfectSessions = data.filter(d => d.value === 100).length
  const excellentSessions = data.filter(d => d.value >= 80 && d.value < 100).length
  const needsWorkSessions = data.filter(d => d.value < 50).length

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-card-foreground">Session Completion Rate</h3>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Average Completion</div>
          <div className="text-lg font-bold text-blue-500">
            {averageCompletion.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">
            {getCompletionLevel(averageCompletion)}
          </div>
        </div>
      </div>
      
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
                <Cell key={`cell-${index}`} fill={getCompletionColor(entry.completion)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            {perfectSessions}
          </div>
          <div className="text-xs text-green-700 dark:text-green-300">
            Perfect Sessions (100%)
          </div>
        </div>
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {excellentSessions}
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300">
            Excellent Sessions (80%+)
          </div>
        </div>
        <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <AlertCircle className="w-6 h-6 text-orange-500 mx-auto mb-2" />
          <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
            {needsWorkSessions}
          </div>
          <div className="text-xs text-orange-700 dark:text-orange-300">
            Needs Work (&lt;50%)
          </div>
        </div>
      </div>

      {/* Completion Rate Insights */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
        <div>
          <div className="text-sm text-muted-foreground mb-2">Completion Trend</div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>90-100%</span>
              <span className="font-medium">{data.filter(d => d.value >= 90).length} sessions</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>70-89%</span>
              <span className="font-medium">{data.filter(d => d.value >= 70 && d.value < 90).length} sessions</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>50-69%</span>
              <span className="font-medium">{data.filter(d => d.value >= 50 && d.value < 70).length} sessions</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>&lt;50%</span>
              <span className="font-medium">{data.filter(d => d.value < 50).length} sessions</span>
            </div>
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground mb-2">Consistency Score</div>
          <div className="text-center">
            {/* Calculate consistency based on how many sessions are above 70% */}
            <div className="text-2xl font-bold text-blue-500">
              {data.length > 0 ? Math.round((data.filter(d => d.value >= 70).length / data.length) * 100) : 0}%
            </div>
            <div className="text-xs text-muted-foreground">
              Sessions with good completion
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
