'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { BarChart3 } from 'lucide-react'
import { Goal } from '@/src/classes/Goal'
import { MetricData } from './types'

interface TaskProgressChartProps {
  goal: Goal
  data: MetricData[]
}

export default function TaskProgressChart({ goal, data }: TaskProgressChartProps) {
  // Transform the data for the chart
  const chartData = data.slice(-14).map((item, index) => {
    const date = new Date(item.date)
    return {
      name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: item.date,
      progress: item.value,
      summary: item.summary
    }
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3 max-w-xs">
          <p className="text-card-foreground font-medium mb-1">{label}</p>
          <p className="text-primary mb-2">
            Progress: {data.progress}%
          </p>
          <p className="text-xs text-muted-foreground">
            {data.summary}
          </p>
        </div>
      )
    }
    return null
  }

  const averageProgress = data.length > 0 
    ? Math.round(data.reduce((sum, item) => sum + item.value, 0) / data.length)
    : 0

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-card-foreground">Session Progress Trend</h3>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Avg Progress</div>
          <div className="text-lg font-bold text-blue-500">{averageProgress}%</div>
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
              dataKey="progress" 
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              className="hover:opacity-80 transition-opacity"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Progress Insights */}
      <div className="grid grid-cols-3 gap-4 text-center text-sm">
        <div>
          <div className="text-lg font-semibold text-green-600">
            {data.filter(d => d.value >= 80).length}
          </div>
          <div className="text-xs text-muted-foreground">High Progress Days</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-yellow-600">
            {data.filter(d => d.value >= 50 && d.value < 80).length}
          </div>
          <div className="text-xs text-muted-foreground">Medium Progress Days</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-red-500">
            {data.filter(d => d.value < 50).length}
          </div>
          <div className="text-xs text-muted-foreground">Low Progress Days</div>
        </div>
      </div>
    </div>
  )
}
