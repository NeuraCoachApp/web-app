'use client'

import React from 'react'
import { useCheckInContext } from './CheckInProvider'
import { ProgressAssessment } from './ProgressAssessment'
import { VoiceCoachChat } from './VoiceCoachChat'
import { MoodMotivationInput } from './MoodMotivationInput'
import { CheckInComplete } from './CheckInComplete'
import { FlowLayout } from '@/src/components/voice/FlowLayout'
import { Flame, Target, MessageCircle, Heart } from 'lucide-react'

export function CheckInFlow() {
  const {
    currentStep,
    selectedGoal,
    userStreak,
    getProgressPercentage,
    needsBlockerDiscussion,
    error
  } = useCheckInContext()

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-muted-foreground mb-6">
            {error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const getStepInfo = () => {
    switch (currentStep) {
      case 'assessment':
        return {
          title: 'Daily Check-In',
          subtitle: `How did today go with your goal: "${selectedGoal?.text}"?`,
          icon: <Target className="w-6 h-6" />,
          step: 1,
          totalSteps: needsBlockerDiscussion() ? 4 : 3
        }
      case 'chat':
        return {
          title: 'Let\'s Talk',
          subtitle: 'I notice you didn\'t complete all your tasks today. Let\'s work through what happened.',
          icon: <MessageCircle className="w-6 h-6" />,
          step: 2,
          totalSteps: 4
        }
      case 'mood':
        return {
          title: 'How Are You Feeling?',
          subtitle: 'Help me understand your current mood and motivation levels.',
          icon: <Heart className="w-6 h-6" />,
          step: needsBlockerDiscussion() ? 3 : 2,
          totalSteps: needsBlockerDiscussion() ? 4 : 3
        }
      case 'complete':
        return {
          title: 'Check-In Complete!',
          subtitle: 'Great job checking in today. Keep up the momentum!',
          icon: <Flame className="w-6 h-6" />,
          step: needsBlockerDiscussion() ? 4 : 3,
          totalSteps: needsBlockerDiscussion() ? 4 : 3
        }
      default:
        return {
          title: 'Daily Check-In',
          subtitle: '',
          icon: <Target className="w-6 h-6" />,
          step: 1,
          totalSteps: 3
        }
    }
  }

  const stepInfo = getStepInfo()

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'assessment':
        return <ProgressAssessment />
      case 'chat':
        return <VoiceCoachChat />
      case 'mood':
        return <MoodMotivationInput />
      case 'complete':
        return <CheckInComplete />
      default:
        return <ProgressAssessment />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80">
      {/* Main content - full screen for chat step */}
      {currentStep === 'chat' ? (
        <div className="min-h-screen flex items-center justify-center px-6">
          {renderCurrentStep()}
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-6 py-8">
          {renderCurrentStep()}
        </div>
      )}
    </div>
  )
}
