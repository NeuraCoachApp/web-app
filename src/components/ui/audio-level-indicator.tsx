'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AudioAnalysisData } from '@/src/lib/audio-analyzer'

interface AudioLevelIndicatorProps {
  isActive?: boolean
  isSpeaking?: boolean
  lineCount?: number
  className?: string
  audioAnalysisData?: AudioAnalysisData | null
}

export function AudioLevelIndicator({ 
  isActive = false, 
  isSpeaking = false,
  lineCount = 5,
  className = "",
  audioAnalysisData = null
}: AudioLevelIndicatorProps) {
  const [levels, setLevels] = useState<number[]>([])

  useEffect(() => {
    if (isActive) {
      // Use real audio data if available and speaking
      if (isSpeaking && audioAnalysisData?.isPlaying && audioAnalysisData.frequencyBands.length > 0) {
        // Map frequency bands to visual bars
        const bands = audioAnalysisData.frequencyBands
        const volume = audioAnalysisData.volume
        
        const newLevels = Array.from({ length: lineCount }, (_, index) => {
          // Map bar index to frequency band
          const bandIndex = Math.floor((index / lineCount) * bands.length)
          const bandLevel = bands[bandIndex] || 0
          
          // Add some volume influence for more dynamic visualization
          const volumeBoost = volume * 0.3
          const finalLevel = Math.min(bandLevel + volumeBoost, 1.0)
          
          // Ensure minimum level for visual consistency
          return Math.max(finalLevel, 0.15)
        })
        
        setLevels(newLevels)
      } else {
        // Fallback to animated patterns when no real audio data
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
      }
    } else {
      // Reset to minimal levels when not active
      setLevels(Array.from({ length: lineCount }, () => 0.15))
    }
  }, [isActive, isSpeaking, lineCount, audioAnalysisData])

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
            backgroundColor: (() => {
              if (!isActive) return 'rgba(255,255,255,0.4)'
              
              if (isSpeaking && audioAnalysisData?.isPlaying) {
                // Dynamic color based on frequency content
                const bandIndex = Math.floor((index / lineCount) * (audioAnalysisData.frequencyBands.length || 1))
                const bandLevel = audioAnalysisData.frequencyBands[bandIndex] || 0
                const volume = audioAnalysisData.volume || 0
                
                // Create color based on frequency and volume
                const red = Math.round(67 + (bandLevel * 100))
                const green = Math.round(233 - (volume * 100))
                const blue = Math.round(123 + (bandLevel * 50))
                
                return `rgba(${Math.min(red, 255)}, ${Math.min(green, 255)}, ${Math.min(blue, 255)}, 0.9)`
              }
              
              return isSpeaking 
                ? 'rgba(67, 233, 123, 0.9)' // Green for speaking
                : 'rgba(244, 114, 182, 0.9)' // Pink for listening
            })(),
            boxShadow: isActive 
              ? isSpeaking 
                ? '0 0 6px rgba(67, 233, 123, 0.6)' 
                : '0 0 6px rgba(244, 114, 182, 0.6)'
              : '0 0 2px rgba(255,255,255,0.2)',
          }}
          transition={{
            duration: isSpeaking && audioAnalysisData?.isPlaying ? 0.05 : 0.08, // Faster response for real audio
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  )
}

export default AudioLevelIndicator
