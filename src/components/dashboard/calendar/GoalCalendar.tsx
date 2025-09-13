'use client'

import React, { useState } from 'react'
import { Calendar } from 'lucide-react'
import { CalendarProps, DayProgress } from './types'
import { calculateDayProgress } from './utils'
import CalendarHeader from './CalendarHeader'
import DayRectangle from './DayRectangle'
import CalendarLegend from './CalendarLegend'

export default function GoalCalendar({ goal }: CalendarProps) {
  const [selectedDay, setSelectedDay] = useState<DayProgress | null>(null)

  if (!goal) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-3">
          <Calendar className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Select a goal to view progress calendar
          </p>
        </div>
      </div>
    )
  }
  
  // Generate last 7 days
  const days: DayProgress[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    days.push(calculateDayProgress(goal, date))
  }

  const handleDayClick = (dayProgress: DayProgress) => {
    setSelectedDay(dayProgress)
  }
  
  return (
    <div className="bg-card">
      <CalendarHeader goal={goal} />
      
      {/* Calendar Grid */}
      <div className="flex items-start mb-4 gap-1">
        {days.map((dayProgress, index) => (
          <DayRectangle 
            key={index} 
            dayProgress={dayProgress} 
            index={index} 
            onClick={handleDayClick}
            isSelected={selectedDay?.date.getTime() === dayProgress.date.getTime()}
          />
        ))}
      </div>
      
      <CalendarLegend />
    </div>
  )
}