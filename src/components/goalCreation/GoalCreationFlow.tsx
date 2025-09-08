'use client'

import React, { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useCoach } from '@/src/contexts/CoachContext'
import AnimatedBlob from '@/src/components/ui/animated-blob'
import { goalCreationSteps } from '@/src/hooks/goalCreation/useGoalCreation'
import { useGoalCreationContext } from './GoalCreationProvider'
import { GoalReasonStep } from './GoalReasonStep'
import { GoalSetupStep } from './GoalSetupStep'
import { GoalNotificationStep } from './GoalNotificationStep'
import { GoalTextOnlyStep } from './GoalTextOnlyStep'
import { GoalFinalStep } from './GoalFinalStep'

export function GoalCreationFlow() {
  const { 
    isSpeaking, 
    isListening, 
    hasVoiceEnabled, 
    enableVoice, 
    speak
  } = useCoach()
  
  const {
    state,
    getCurrentText,
    currentStepData
  } = useGoalCreationContext()

  // Speak the current step text when it changes
  useEffect(() => {
    const speakCurrentStep = async () => {
      if (hasVoiceEnabled && state.currentStep >= 0) {
        const text = getCurrentText()
        const subtext = currentStepData?.subtext
        const fullText = subtext ? `${text} ${subtext}` : text
        
        // The CoachContext will handle preventing duplicates
        await speak(fullText)
      }
    }

    speakCurrentStep()
  }, [state.currentStep, hasVoiceEnabled, speak, getCurrentText, currentStepData])

  const renderCurrentStep = () => {
    const stepId = currentStepData?.id

    switch (stepId) {
      case 'questions_time':
        return <GoalReasonStep />
      case 'goal_setup':
        return <GoalSetupStep />
      case 'notification_time':
        return <GoalNotificationStep />
      case 'final':
        return <GoalFinalStep />
      default:
        return <GoalTextOnlyStep />
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Voice Toggle */}
        {!hasVoiceEnabled && (
          <div className="mb-8">
            <button
              onClick={enableVoice}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mb-4"
            >
              🔊 Enable Voice (Recommended)
            </button>
            <p className="text-sm text-gray-400">
              For the best experience, enable voice to hear Ava speak
            </p>
          </div>
        )}

        {/* Animated Blob */}
        <div className="flex justify-center mb-8">
          <AnimatedBlob 
            isSpeaking={isSpeaking}
            isListening={isListening}
            size={200}
            className="mb-8"
          />
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <div key={state.currentStep}>
            {renderCurrentStep()}
          </div>
        </AnimatePresence>

        {/* Progress indicator */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-2">
            {goalCreationSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index <= state.currentStep ? 'bg-blue-500' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
