'use client'

import React from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Zap, TrendingUp, TrendingDown, Battery } from 'lucide-react'
import { Goal } from '@/src/classes/Goal'
import { MetricData } from './types'

interface MotivationTrendChartProps {
  goal: Goal
  data: MetricData[]
}

export default function MotivationTrendChart({ goal, data }: MotivationTrendChartProps) {
  // Transform the data for the chart
  const chartData = data.slice(-14).map((item, index) => {
    const date = new Date(item.date)
    return {
      name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: item.date,
      motivation: item.value,
      summary: item.summary
    }
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const motivationDescription = getMotivationDescription(data.motivation)
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3 max-w-xs">
          <p className="text-card-foreground font-medium mb-1">{label}</p>
          <p className="text-amber-500 mb-2">
            Motivation: {data.motivation.toFixed(1)}/10 ({motivationDescription})
          </p>
          <p className="text-xs text-muted-foreground">
            {data.summary}
          </p>
        </div>
      )
    }
    return null
  }

  const getMotivationDescription = (motivation: number) => {
    if (motivation <= 2) return 'Very Low'
    if (motivation <= 4) return 'Low'
    if (motivation <= 6) return 'Moderate'
    if (motivation <= 8) return 'High'
    return 'Very High'
  }

  const getMotivationColor = (motivation: number) => {
    if (motivation <= 3) return 'text-red-500'
    if (motivation <= 5) return 'text-orange-500'
    if (motivation <= 7) return 'text-amber-500'
    if (motivation <= 8.5) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getMotivationIcon = (motivation: number) => {
    if (motivation <= 3) return <Battery className="w-4 h-4 text-red-500" />
    if (motivation <= 6) return <Battery className="w-4 h-4 text-amber-500" />
    return <Zap className="w-4 h-4 text-yellow-500" />
  }

  const averageMotivation = data.length > 0 
    ? data.reduce((sum, item) => sum + item.value, 0) / data.length
    : 0

  const latestMotivation = data.length > 0 ? data[data.length - 1].value : 0
  const previousMotivation = data.length > 1 ? data[data.length - 2].value : latestMotivation
  const motivationTrend = latestMotivation - previousMotivation

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-card-foreground">Motivation Trend</h3>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Current Motivation</div>
          <div className={`text-lg font-bold ${getMotivationColor(latestMotivation)} flex items-center gap-1`}>
            {getMotivationIcon(latestMotivation)}
            {latestMotivation.toFixed(1)}/10
            {motivationTrend !== 0 && (
              <span className="text-xs">
                {motivationTrend > 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {getMotivationDescription(latestMotivation)}
          </div>
        </div>
      </div>
      
      <div className="h-64 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="motivationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
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
            
            {/* Average line */}
            <ReferenceLine 
              y={averageMotivation} 
              stroke="#6b7280" 
              strokeDasharray="5 5" 
              label={{ value: `Avg: ${averageMotivation.toFixed(1)}`, position: "insideTopRight" }}
            />
            
            {/* Motivation zones */}
            <ReferenceLine y={4} stroke="#ef4444" strokeDasharray="2 2" strokeOpacity={0.3} />
            <ReferenceLine y={7} stroke="#f59e0b" strokeDasharray="2 2" strokeOpacity={0.3} />
            
            <Area
              type="monotone"
              dataKey="motivation"
              stroke="#f59e0b"
              strokeWidth={3}
              fill="url(#motivationGradient)"
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Motivation Distribution */}
      <div className="grid grid-cols-4 gap-3 text-center text-xs mb-4">
        <div>
          <div className="text-lg font-semibold text-red-500">
            {data.filter(d => d.value <= 3).length}
          </div>
          <div className="text-muted-foreground">Very Low</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-orange-500">
            {data.filter(d => d.value > 3 && d.value <= 5).length}
          </div>
          <div className="text-muted-foreground">Low</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-amber-500">
            {data.filter(d => d.value > 5 && d.value <= 7).length}
          </div>
          <div className="text-muted-foreground">Moderate</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-green-500">
            {data.filter(d => d.value > 7).length}
          </div>
          <div className="text-muted-foreground">High</div>
        </div>
      </div>

      {/* Motivation Insights */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">Average Motivation</div>
          <div className={`text-xl font-bold ${getMotivationColor(averageMotivation)}`}>
            {averageMotivation.toFixed(1)}/10
          </div>
          <div className="text-xs text-muted-foreground">
            {getMotivationDescription(averageMotivation)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">Peak Days</div>
          <div className="text-xl font-bold text-green-500">
            {data.filter(d => d.value >= 8).length}
          </div>
          <div className="text-xs text-muted-foreground">
            High motivation days
          </div>
        </div>
      </div>
    </div>
  )
}
