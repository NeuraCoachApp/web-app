'use client'

import React, { useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useCoach } from '@/src/contexts/CoachContext'
import { CoachBlob } from './CoachBlob'
import { RealTimeCaptions } from './RealTimeCaptions'

interface FlowLayoutProps {
  children: React.ReactNode
  currentStep: number
  totalSteps: number
  getCurrentText: () => string
  currentStepData?: {
    subtext?: string
    [key: string]: any
  }
  stepKey?: string | number
  showCaptions?: boolean
  showProgressIndicator?: boolean
  blobSize?: number
  className?: string
}

export function FlowLayout({
  children,
  currentStep,
  totalSteps,
  getCurrentText,
  currentStepData,
  stepKey,
  showCaptions = true,
  showProgressIndicator = true,
  blobSize = 200,
  className = ""
}: FlowLayoutProps) {
  const { hasVoiceEnabled, speak } = useCoach()
  const lastSpokenContentRef = useRef<string>('')
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-speak when step changes
  useEffect(() => {
    // Clear any pending speech
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current)
    }

    const speakCurrentStep = async () => {
      if (hasVoiceEnabled && currentStep >= 0) {
        const text = getCurrentText()
        const subtext = currentStepData?.subtext
        const fullText = subtext ? `${text} ${subtext}` : text
        
        // Only speak if the content has actually changed
        if (fullText !== lastSpokenContentRef.current) {
          lastSpokenContentRef.current = fullText
          
          // The CoachContext will handle preventing duplicates
          await speak(fullText)
        }
      }
    }

    // Small delay to prevent rapid-fire speech attempts
    speechTimeoutRef.current = setTimeout(speakCurrentStep, 100)

    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current)
      }
    }
  }, [currentStep, hasVoiceEnabled, speak, getCurrentText, currentStepData])

  return (
    <div className={`min-h-screen bg-black text-white flex flex-col relative items-center justify-center px-4 ${className}`}>
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Coach Blob */}
        <CoachBlob size={blobSize} className="mb-8" />

        {/* Content */}
        <AnimatePresence mode="wait">
          <div key={stepKey || currentStep}>
            {children}
          </div>
        </AnimatePresence>


        {/* Real-time Captions */}
        {showCaptions && (
          <RealTimeCaptions stepKey={stepKey} />
        )}
      </div>
    </div>
  )
}
