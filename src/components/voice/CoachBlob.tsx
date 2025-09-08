'use client'

import React from 'react'
import { motion } from 'framer-motion'
import AnimatedBlob from '@/src/components/ui/animated-blob'
import { useCoach } from '@/src/contexts/CoachContext'

interface CoachBlobProps {
  size?: number
  className?: string
  showWaitingIndicator?: boolean
}

export function CoachBlob({ 
  size = 200, 
  className = '',
  showWaitingIndicator = true
}: CoachBlobProps) {
  const { isSpeaking, isListening, isPreparingSpeech } = useCoach()

  return (
    <div className={`flex justify-center relative ${className}`}>
      <AnimatedBlob 
        isSpeaking={isSpeaking}
        isListening={isListening}
        size={size}
      />
    </div>
  )
}
