'use client'

import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Heart, TrendingUp, TrendingDown } from 'lucide-react'
import { Goal } from '@/src/classes/Goal'
import { MetricData } from './types'

interface MoodTrendChartProps {
  goal: Goal
  data: MetricData[]
}

export default function MoodTrendChart({ goal, data }: MoodTrendChartProps) {
  // Transform the data for the chart
  const chartData = data.slice(-14).map((item, index) => {
    const date = new Date(item.date)
    return {
      name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: item.date,
      mood: item.value,
      summary: item.summary
    }
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const moodDescription = getMoodDescription(data.mood)
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3 max-w-xs">
          <p className="text-card-foreground font-medium mb-1">{label}</p>
          <p className="text-pink-500 mb-2">
            Mood: {data.mood.toFixed(1)}/10 ({moodDescription})
          </p>
          <p className="text-xs text-muted-foreground">
            {data.summary}
          </p>
        </div>
      )
    }
    return null
  }

  const getMoodDescription = (mood: number) => {
    if (mood <= 2) return 'Very Low'
    if (mood <= 4) return 'Low'
    if (mood <= 6) return 'Moderate'
    if (mood <= 8) return 'Good'
    return 'Excellent'
  }

  const getMoodColor = (mood: number) => {
    if (mood <= 3) return 'text-red-500'
    if (mood <= 5) return 'text-orange-500'
    if (mood <= 7) return 'text-yellow-500'
    if (mood <= 8.5) return 'text-green-500'
    return 'text-emerald-500'
  }

  const averageMood = data.length > 0 
    ? data.reduce((sum, item) => sum + item.value, 0) / data.length
    : 0

  const latestMood = data.length > 0 ? data[data.length - 1].value : 0
  const previousMood = data.length > 1 ? data[data.length - 2].value : latestMood
  const moodTrend = latestMood - previousMood

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-500" />
          <h3 className="font-semibold text-card-foreground">Mood Trend</h3>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Current Mood</div>
          <div className={`text-lg font-bold ${getMoodColor(latestMood)} flex items-center gap-1`}>
            {latestMood.toFixed(1)}/10
            {moodTrend !== 0 && (
              <span className="text-xs">
                {moodTrend > 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {getMoodDescription(latestMood)}
          </div>
        </div>
      </div>
      
      <div className="h-64 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              y={averageMood} 
              stroke="#6b7280" 
              strokeDasharray="5 5" 
              label={{ value: `Avg: ${averageMood.toFixed(1)}`, position: "insideTopRight" }}
            />
            
            {/* Mood zones */}
            <ReferenceLine y={5} stroke="#ef4444" strokeDasharray="2 2" strokeOpacity={0.3} />
            <ReferenceLine y={7} stroke="#f59e0b" strokeDasharray="2 2" strokeOpacity={0.3} />
            
            <Line 
              type="monotone" 
              dataKey="mood" 
              stroke="#ec4899"
              strokeWidth={3}
              dot={{ fill: '#ec4899', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#ec4899', strokeWidth: 2 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Mood Distribution */}
      <div className="grid grid-cols-5 gap-2 text-center text-xs">
        <div>
          <div className="text-lg font-semibold text-red-500">
            {data.filter(d => d.value <= 2).length}
          </div>
          <div className="text-muted-foreground">Very Low</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-orange-500">
            {data.filter(d => d.value > 2 && d.value <= 4).length}
          </div>
          <div className="text-muted-foreground">Low</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-yellow-500">
            {data.filter(d => d.value > 4 && d.value <= 6).length}
          </div>
          <div className="text-muted-foreground">Moderate</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-green-500">
            {data.filter(d => d.value > 6 && d.value <= 8).length}
          </div>
          <div className="text-muted-foreground">Good</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-emerald-500">
            {data.filter(d => d.value > 8).length}
          </div>
          <div className="text-muted-foreground">Excellent</div>
        </div>
      </div>

      {/* Average Mood */}
      <div className="mt-4 pt-4 border-t border-border text-center">
        <div className="text-sm text-muted-foreground mb-1">Average Mood</div>
        <div className={`text-xl font-bold ${getMoodColor(averageMood)}`}>
          {averageMood.toFixed(1)}/10
        </div>
        <div className="text-xs text-muted-foreground">
          {getMoodDescription(averageMood)}
        </div>
      </div>
    </div>
  )
}
