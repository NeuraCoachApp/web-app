import React from 'react'
import { CalendarStatsProps } from './types'

export default function CalendarStats({ days }: CalendarStatsProps) {
  // Calculate overall stats
  const totalDaysWithProgress = days.filter(day => day.sessions.length > 0).length
  const perfectDays = days.filter(day => day.status === 'complete').length
  
  return (
    <div className="grid grid-cols-3 gap-4 text-center border-t border-border pt-4 mt-6">
      <div>
        <div className="text-lg font-semibold text-card-foreground">{totalDaysWithProgress}</div>
        <div className="text-xs text-muted-foreground">Days Worked</div>
      </div>
      <div>
        <div className="text-lg font-semibold text-green-600">{perfectDays}</div>
        <div className="text-xs text-muted-foreground">Perfect Days</div>
      </div>
      <div>
        <div className="text-lg font-semibold text-primary">
          {totalDaysWithProgress > 0 ? Math.round((perfectDays / totalDaysWithProgress) * 100) : 0}%
        </div>
        <div className="text-xs text-muted-foreground">Success Rate</div>
      </div>
    </div>
  )
}
