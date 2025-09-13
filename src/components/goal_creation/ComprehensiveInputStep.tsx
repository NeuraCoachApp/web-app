'use client'

import React, { useState, useEffect } from 'react'
import { FlowStep, FlowStepButton, FlowInput } from '@/src/components/voice'
import { useGoalCreationContext } from './GoalCreationProvider'
import { useCoach } from '@/src/contexts/CoachContext'

interface ComprehensiveInputStepProps {
  stepId: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  inputType?: 'text' | 'textarea' | 'time' | 'select'
  options?: string[] // For select type
  buttonText?: string
}

export function ComprehensiveInputStep({
  stepId,
  value,
  onChange,
  placeholder,
  inputType = 'textarea',
  options,
  buttonText = 'Continue'
}: ComprehensiveInputStepProps) {
  const { handleNext } = useGoalCreationContext()
  const { isSpeaking, isPreparingSpeech } = useCoach()
  const [showInput, setShowInput] = useState(false)

  // Show input only after speech is complete
  useEffect(() => {
    if (!isSpeaking && !isPreparingSpeech && !showInput) {
      // Add a small delay to ensure speech has fully completed
      const timer = setTimeout(() => {
        setShowInput(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isSpeaking, isPreparingSpeech, showInput])

  const handleInputChange = (newValue: string) => {
    onChange(newValue)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim() && inputType !== 'textarea') {
      e.preventDefault()
      handleNext()
    }
  }

  const renderInput = () => {
    switch (inputType) {
      case 'time':
        return (
          <input
            type="time"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
        )
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          >
            <option value="">Select an option...</option>
            {options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        )
      
      case 'text':
        return (
          <FlowInput
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            showVoiceButton={true}
            autoFocus
          />
        )
      
      case 'textarea':
      default:
        return (
          <FlowInput
            type="textarea"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            showVoiceButton={true}
            autoFocus
            rows={3}
          />
        )
    }
  }

  return (
    <FlowStep>
      <div className="mt-8 space-y-4">
        {showInput && (
          <>
            <div className="flex flex-col items-center space-y-4">
              {renderInput()}
            </div>
            
            <FlowStepButton
              onClick={handleNext}
              disabled={!value.trim()}
            >
              {buttonText}
            </FlowStepButton>
          </>
        )}
      </div>
    </FlowStep>
  )
}
