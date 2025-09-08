'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface AudioLevelIndicatorProps {
  isActive?: boolean
  isSpeaking?: boolean
  lineCount?: number
  className?: string
}

export function AudioLevelIndicator({ 
  isActive = false, 
  isSpeaking = false,
  lineCount = 5,
  className = ""
}: AudioLevelIndicatorProps) {
  const [levels, setLevels] = useState<number[]>([])

  useEffect(() => {
    if (isActive) {
      // Generate random audio levels for visualization with varied patterns
      const interval = setInterval(() => {
        const newLevels = Array.from({ length: lineCount }, (_, index) => {
          // Create some variation in patterns - center lines tend to be higher
          const centerWeight = 1 - Math.abs(index - Math.floor(lineCount / 2)) / Math.floor(lineCount / 2)
          
          if (isSpeaking) {
            // More dynamic animation for speaking
            const baseHeight = Math.random() * 0.7 + 0.2 // Random height between 0.2 and 0.9
            const weightedHeight = baseHeight * (0.6 + centerWeight * 0.4) // Center bias
            return Math.min(weightedHeight, 1.0)
          } else {
            // Gentler animation for listening
            const baseHeight = Math.random() * 0.4 + 0.2 // Random height between 0.2 and 0.6
            const weightedHeight = baseHeight * (0.8 + centerWeight * 0.2) // Less center bias
            return Math.min(weightedHeight, 0.7)
          }
        })
        setLevels(newLevels)
      }, isSpeaking ? 70 : 120) // Faster updates when speaking

      return () => clearInterval(interval)
    } else {
      // Reset to minimal levels when not active
      setLevels(Array.from({ length: lineCount }, () => 0.15))
    }
  }, [isActive, isSpeaking, lineCount])

  return (
    <div className={`flex items-end justify-center gap-1 h-10 ${className}`}>
      {Array.from({ length: lineCount }, (_, index) => (
        <motion.div
          key={index}
          className="rounded-full shadow-sm"
          style={{
            width: 3,
            minHeight: 3,
          }}
          animate={{
            height: isActive ? `${(levels[index] || 0.15) * 100}%` : '15%',
            opacity: isActive ? 0.9 : 0.4,
            backgroundColor: isSpeaking 
              ? 'rgba(67, 233, 123, 0.9)' // Green for speaking
              : 'rgba(244, 114, 182, 0.9)', // Pink for listening
            boxShadow: isActive 
              ? isSpeaking 
                ? '0 0 6px rgba(67, 233, 123, 0.6)' 
                : '0 0 6px rgba(244, 114, 182, 0.6)'
              : '0 0 2px rgba(255,255,255,0.2)',
          }}
          transition={{
            duration: 0.08,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  )
}

export default AudioLevelIndicator
