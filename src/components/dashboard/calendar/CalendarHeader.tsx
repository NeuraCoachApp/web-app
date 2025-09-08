import React from 'react'
import { Calendar } from 'lucide-react'
import { Goal } from '@/src/classes/Goal'

interface CalendarHeaderProps {
  goal: Goal | null
}

export default function CalendarHeader({ goal }: CalendarHeaderProps) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="font-medium text-card-foreground">7-Day Progress</h3>
      </div>
      
      {/* Goal Title */}
      {goal && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {goal.text}
          </p>
        </div>
      )}
    </>
  )
}
