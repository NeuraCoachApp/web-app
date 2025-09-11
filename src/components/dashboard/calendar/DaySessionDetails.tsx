import React from 'react'
import { Calendar, Clock, TrendingUp, Zap, Brain } from 'lucide-react'
import { DaySessionDetailsProps } from './types'

export default function DaySessionDetails({ dayProgress }: DaySessionDetailsProps) {
  if (!dayProgress) {
    return (
      <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
        <p className="text-sm text-muted-foreground text-center">
          Click on a day above to view session details
        </p>
      </div>
    )
  }

  const { date, sessions } = dayProgress

  if (sessions.length === 0) {
    return (
      <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-medium text-card-foreground">
            {date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h4>
        </div>
        <p className="text-sm text-muted-foreground">
          No sessions recorded on this day.
        </p>
      </div>
    )
  }

  // Sort sessions by creation time
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  return (
    <div className="mt-6 p-4 bg-card rounded-lg border border-border">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-medium text-card-foreground">
          {date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h4>
        <span className="text-xs text-muted-foreground">
          ({sessions.length} session{sessions.length !== 1 ? 's' : ''})
        </span>
      </div>

      <div className="space-y-3">
        {sortedSessions.map((session, index) => {
          // Session now contains direct properties instead of insight
          const sessionData = {
            summary: session.summary,
            mood: session.mood,
            motivation: session.motivation
          }
          const sessionTime = new Date(session.created_at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })

          return (
            <div key={`${session.uuid}-${index}`} className="bg-background rounded-lg p-3 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">
                  {sessionTime}
                </span>
              </div>

              {sessionData.summary ? (
                <div className="space-y-2">
                  <p className="text-sm text-card-foreground">
                    {sessionData.summary}
                  </p>
                  
                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-blue-500" />
                      <span className="text-muted-foreground">Mood:</span>
                      <span className="font-medium text-card-foreground">{sessionData.mood}/10</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-yellow-500" />
                      <span className="text-muted-foreground">Motivation:</span>
                      <span className="font-medium text-card-foreground">{sessionData.motivation}/10</span>
                    </div>
                  </div>

                  {/* Mood progress bar */}
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div 
                      className="bg-primary rounded-full h-1.5 transition-all duration-300" 
                      style={{ width: `${(sessionData.mood / 10) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Session recorded without data
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
