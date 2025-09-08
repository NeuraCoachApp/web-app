import React from 'react'
import { TrendingUp, Calendar } from 'lucide-react'
import { MetricCardProps } from './types'

export default function MetricCard({ 
  title, 
  icon: Icon, 
  data, 
  color, 
  unit = '',
  maxValue = 10 
}: MetricCardProps) {
  const latestValue = data.length > 0 ? data[data.length - 1].value : 0
  const previousValue = data.length > 1 ? data[data.length - 2].value : latestValue
  const trend = latestValue - previousValue
  
  // Calculate average
  const average = data.length > 0 
    ? Math.round(data.reduce((sum, item) => sum + item.value, 0) / data.length * 10) / 10
    : 0

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${color}`} />
          <h3 className="font-medium text-card-foreground">{title}</h3>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${color}`}>
            {latestValue}{unit}
          </div>
          {trend !== 0 && (
            <div className={`text-xs flex items-center gap-1 ${
              trend > 0 ? 'text-red-500' : 'text-green-500'
            }`}>
              <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(trend).toFixed(1)}
            </div>
          )}
        </div>
      </div>

      {/* Simple Bar Chart */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Recent Sessions</span>
          <span>Avg: {average}{unit}</span>
        </div>
        <div className="flex items-end gap-1 h-16">
          {data.slice(-10).map((item, index) => {
            const height = (item.value / maxValue) * 100
            return (
              <div key={index} className="flex-1 flex flex-col justify-end">
                <div 
                  className={`rounded-sm opacity-70 hover:opacity-100 transition-opacity cursor-pointer ${
                    color.includes('blue') ? 'bg-blue-500' :
                    color.includes('yellow') ? 'bg-yellow-500' :
                    color.includes('red') ? 'bg-red-500' :
                    'bg-gray-500'
                  }`}
                  style={{ height: `${Math.max(4, height)}%` }}
                  title={`${item.date}: ${item.value}${unit} - ${item.summary}`}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Latest Summary */}
      {data.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(data[data.length - 1].date).toLocaleDateString()}</span>
          </div>
          <p className="line-clamp-2">{data[data.length - 1].summary}</p>
        </div>
      )}
    </div>
  )
}
