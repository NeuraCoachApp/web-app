import React from 'react'
import { CheckCircle, AlertCircle, XCircle, Circle } from 'lucide-react'
import { DayRectangleProps } from './types'
import { getDateString } from './utils'

export default function DayRectangle({ dayProgress, index, onClick, isSelected }: DayRectangleProps) {
  const { date, dayName, totalSteps, completedSteps, status } = dayProgress
  
  const getStatusColor = () => {
    switch (status) {
      case 'complete':
        return 'border-2 border-emerald-500 text-emerald-400 bg-emerald-500/10'
      case 'partial':
        return 'border-2 border-amber-500 text-amber-400 bg-amber-500/10'
      case 'none':
        return 'border-2 border-red-500 text-red-400 bg-red-500/10'
      default:
        return 'border-2 border-gray-600 text-gray-400 bg-gray-600/10'
    }
  }
  
  const getStatusIcon = () => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-3 h-3" />
      case 'partial':
        return <AlertCircle className="w-3 h-3" />
      case 'none':
        return <XCircle className="w-3 h-3" />
      default:
        return null
    }
  }
  
  const isToday = getDateString(date) === getDateString(new Date())
  const isFuture = date > new Date()
  
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
        {dayName}
        {/* Today indicator next to day name */}
        {isToday && (
          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
        )}
      </div>
      <div
        onClick={() => onClick(dayProgress)}
        className={`
          w-full aspect-square flex flex-col items-center justify-center
          transition-all duration-200 hover:scale-105 cursor-pointer relative
          rounded-lg
          ${getStatusColor()}
          ${isSelected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
          ${isFuture ? 'opacity-50' : ''}
        `}
        title={
          totalSteps === 0
            ? `${date.toLocaleDateString()}: No tasks assigned for this day. Click to view details.`
            : status === 'none' 
            ? `${date.toLocaleDateString()}: No work done on ${totalSteps} assigned task${totalSteps === 1 ? '' : 's'}. Click to view details.`
            : `${date.toLocaleDateString()}: Completed ${completedSteps}/${totalSteps} assigned task${totalSteps === 1 ? '' : 's'}. Click to view details.`
        }
      >
        {totalSteps > 0 ? (
          <>
            <div className="flex items-center justify-center mb-0.5">
              {getStatusIcon()}
            </div>
            <div className="text-xs font-semibold">
              {completedSteps}/{totalSteps}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center mb-0.5">
              {getStatusIcon()}
            </div>
            <div className="text-xs font-medium">
              No tasks
            </div>
          </>
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        {date.getDate()}
      </div>
    </div>
  )
}
