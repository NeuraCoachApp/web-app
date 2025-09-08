import React from 'react'

export default function CalendarLegend() {
  return (
    <div className="flex items-center justify-center gap-3 mb-4 text-xs">
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 border-2 border-emerald-500 rounded bg-emerald-500/20"></div>
        <span className="text-muted-foreground">All Steps Done</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 border-2 border-amber-500 rounded bg-amber-500/20"></div>
        <span className="text-muted-foreground">Partial Progress</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 border-2 border-red-500 rounded bg-red-500/20"></div>
        <span className="text-muted-foreground">No Work Done</span>
      </div>
    </div>
  )
}
