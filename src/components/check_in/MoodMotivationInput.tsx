'use client'

import React, { useState, useEffect } from 'react'
import { useCheckInContext } from './CheckInProvider'
import { useCoach } from '@/src/contexts/CoachContext'
import { Heart, Zap, Smile, Meh, Frown } from 'lucide-react'

export function MoodMotivationInput() {
  const {
    checkInData,
    updateCheckInData,
    setCurrentStep,
    canProceedToNext
  } = useCheckInContext()

  const [mood, setMood] = useState(checkInData.mood || 5)
  const [motivation, setMotivation] = useState(checkInData.motivation || 5)
  const [hasSpokenIntro, setHasSpokenIntro] = useState(false)

  const { speak, hasUserInteracted } = useCoach()

  // Speak introduction when component mounts
  useEffect(() => {
    if (!hasSpokenIntro && hasUserInteracted) {
      const introMessage = "Now let's capture how you're feeling. Use the sliders to rate your current mood and motivation levels."
      speak(introMessage).then(() => {
        setHasSpokenIntro(true)
      }).catch((error) => {
        console.error('Error speaking mood intro:', error)
        setHasSpokenIntro(true)
      })
    }
  }, [hasSpokenIntro, hasUserInteracted, speak])

  const handleMoodChange = (value: number) => {
    setMood(value)
    updateCheckInData({ mood: value })
  }

  const handleMotivationChange = (value: number) => {
    setMotivation(value)
    updateCheckInData({ motivation: value })
  }

  const handleContinue = async () => {
    // Provide voice feedback based on mood/motivation levels
    let feedbackMessage = "Thank you for sharing how you're feeling. "
    
    if (mood >= 7 && motivation >= 7) {
      feedbackMessage += "I'm glad to hear you're feeling positive and motivated!"
    } else if (mood <= 4 || motivation <= 4) {
      feedbackMessage += "I understand you're having a tough time. Remember, tomorrow is a fresh start."
    } else {
      feedbackMessage += "Your feelings are completely valid. Every day is a step forward."
    }
    
    try {
      await speak(feedbackMessage)
    } catch (error) {
      console.error('Error speaking feedback:', error)
    }
    
    setCurrentStep('complete')
  }

  const getMoodEmoji = (value: number) => {
    if (value <= 3) return <Frown className="w-6 h-6 text-red-500" />
    if (value <= 6) return <Meh className="w-6 h-6 text-yellow-500" />
    return <Smile className="w-6 h-6 text-green-500" />
  }

  const getMoodLabel = (value: number) => {
    if (value <= 2) return 'Very Low'
    if (value <= 4) return 'Low'
    if (value <= 6) return 'Neutral'
    if (value <= 8) return 'Good'
    return 'Excellent'
  }

  const getMotivationLabel = (value: number) => {
    if (value <= 2) return 'Very Unmotivated'
    if (value <= 4) return 'Low Motivation'
    if (value <= 6) return 'Somewhat Motivated'
    if (value <= 8) return 'Motivated'
    return 'Highly Motivated'
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Heart className="w-8 h-8 text-red-500" />
          <h2 className="text-2xl font-bold text-foreground">How Are You Feeling?</h2>
        </div>
        <p className="text-muted-foreground">
          Help me understand your current emotional state and motivation levels. This helps me provide better support.
        </p>
      </div>

      {/* Mood Assessment */}
      <div className="bg-card/50 rounded-xl border border-border/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          {getMoodEmoji(mood)}
          <div>
            <h3 className="text-lg font-semibold text-foreground">Current Mood</h3>
            <p className="text-sm text-muted-foreground">How are you feeling right now overall?</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Mood Level:</span>
            <span className="font-semibold text-foreground">
              {mood}/10 - {getMoodLabel(mood)}
            </span>
          </div>

          {/* Mood Slider */}
          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="10"
              value={mood}
              onChange={(e) => handleMoodChange(parseInt(e.target.value))}
              className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 (Very Low)</span>
              <span>5 (Neutral)</span>
              <span>10 (Excellent)</span>
            </div>
          </div>

          {/* Quick mood buttons */}
          <div className="flex gap-2 justify-center">
            {[3, 5, 7, 9].map((value) => (
              <button
                key={value}
                onClick={() => handleMoodChange(value)}
                className={`px-3 py-2 text-xs rounded-full border transition-colors ${
                  mood === value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border/50 hover:bg-muted/50'
                }`}
              >
                {getMoodLabel(value)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Motivation Assessment */}
      <div className="bg-card/50 rounded-xl border border-border/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Zap className={`w-6 h-6 ${
            motivation >= 7 ? 'text-orange-500' : 
            motivation >= 4 ? 'text-yellow-500' : 
            'text-gray-500'
          }`} />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Motivation Level</h3>
            <p className="text-sm text-muted-foreground">How motivated do you feel to continue working on your goal?</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Motivation Level:</span>
            <span className="font-semibold text-foreground">
              {motivation}/10 - {getMotivationLabel(motivation)}
            </span>
          </div>

          {/* Motivation Slider */}
          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="10"
              value={motivation}
              onChange={(e) => handleMotivationChange(parseInt(e.target.value))}
              className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 (Very Low)</span>
              <span>5 (Neutral)</span>
              <span>10 (Very High)</span>
            </div>
          </div>

          {/* Quick motivation buttons */}
          <div className="flex gap-2 justify-center">
            {[2, 5, 7, 9].map((value) => (
              <button
                key={value}
                onClick={() => handleMotivationChange(value)}
                className={`px-3 py-2 text-xs rounded-full border transition-colors ${
                  motivation === value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border/50 hover:bg-muted/50'
                }`}
              >
                {getMotivationLabel(value)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Insights */}
      {(mood <= 4 || motivation <= 4) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> I notice you're feeling {mood <= 4 ? 'low' : 'unmotivated'} today. 
            That's completely normal and part of the journey. Tomorrow is a fresh start, and I'm here to support you.
          </p>
        </div>
      )}

      {(mood >= 8 && motivation >= 8) && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-800 dark:text-green-200">
            <strong>Great!</strong> You're feeling positive and motivated. This is the perfect mindset for tackling tomorrow's challenges!
          </p>
        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-center pt-6">
        <button
          onClick={handleContinue}
          disabled={!mood || !motivation}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Complete Check-In
        </button>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
}
