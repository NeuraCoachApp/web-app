'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { GoalStepBase, GoalStepText } from './GoalStepBase'
import { useGoalCreationContext } from './GoalCreationProvider'
import { getCoachSpeakingTime } from '@/src/lib/speech-timing'

export function GoalTextOnlyStep() {
  const { getCurrentText, currentStepData } = useGoalCreationContext()
  
  // Calculate dynamic timing based on text content
  const currentText = getCurrentText()
  const currentSubtext = currentStepData?.subtext
  const speakingTimeMs = getCoachSpeakingTime(currentText, currentSubtext)
  const speakingTimeSeconds = speakingTimeMs / 1000

  return (
    <GoalStepBase>
      <GoalStepText 
        title={currentText}
        subtitle={currentSubtext}
      />

      {/* Progress bar for auto-advancing steps */}
      <div className="mt-8">
        <div className="w-full bg-gray-700 rounded-full h-1">
          <motion.div
            className="bg-blue-500 h-1 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: speakingTimeSeconds }}
          />
        </div>
      </div>
    </GoalStepBase>
  )
}
