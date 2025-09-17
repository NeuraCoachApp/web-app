'use client'

import React from 'react'
import { Calendar, ChevronDown } from 'lucide-react'

export type TimeframeOption = 'week' | 'month' | 'quarter' | 'year' | 'all'

interface TimeframeSelectorProps {
  selectedTimeframe: TimeframeOption
  onTimeframeChange: (timeframe: TimeframeOption) => void
}

const timeframeOptions = [
  { value: 'week' as const, label: 'Past Week' },
  { value: 'month' as const, label: 'Past Month' },
  { value: 'quarter' as const, label: 'Past 3 Months' },
  { value: 'year' as const, label: 'Past Year' },
  { value: 'all' as const, label: 'All Time' }
]

export default function TimeframeSelector({ selectedTimeframe, onTimeframeChange }: TimeframeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4 text-muted-foreground" />
      <div className="relative">
        <select
          value={selectedTimeframe}
          onChange={(e) => onTimeframeChange(e.target.value as TimeframeOption)}
          className="appearance-none bg-background border border-border rounded-lg px-3 py-2 pr-8 text-sm text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer hover:bg-muted/50 transition-colors"
        >
          {timeframeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  )
}
