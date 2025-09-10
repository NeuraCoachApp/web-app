'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import AudioLevelIndicator from './audio-level-indicator'
import { useCoach } from '@/src/contexts/CoachContext'

interface AnimatedBlobProps {
  isListening?: boolean
  isSpeaking?: boolean
  size?: number
  className?: string
}

export default function AnimatedBlob({ 
  isListening = false, 
  isSpeaking = false, 
  size = 200,
  className = ""
}: AnimatedBlobProps) {
  const [currentVariant, setCurrentVariant] = useState('idle')
  const { audioAnalysisData } = useCoach()

  useEffect(() => {
    if (isSpeaking) {
      setCurrentVariant('speaking')
    } else if (isListening) {
      setCurrentVariant('listening')
    } else {
      setCurrentVariant('idle')
    }
  }, [isListening, isSpeaking])

  // Calculate dynamic values based on audio analysis
  const volume = audioAnalysisData?.volume || 0
  const lowFreq = audioAnalysisData?.lowFrequency || 0
  const midFreq = audioAnalysisData?.midFrequency || 0
  const highFreq = audioAnalysisData?.highFrequency || 0
  const frequencyBands = audioAnalysisData?.frequencyBands || []
  
  // Create complex shape distortions based on audio characteristics
  const getAudioShapeDistortion = () => {
    if (!isSpeaking || !audioAnalysisData?.isPlaying) {
      return {
        scaleX: 1,
        scaleY: 1,
        borderRadius: "60% 40% 30% 70%/60% 30% 70% 40%",
        skewX: 0,
        skewY: 0
      }
    }
    
    // Use frequency bands for more detailed shape control
    const band1 = frequencyBands[0] || lowFreq // Bass - affects bottom expansion
    const band2 = frequencyBands[1] || lowFreq // Low-mid - affects left side
    const band3 = frequencyBands[2] || midFreq // Mid - affects top expansion  
    const band4 = frequencyBands[3] || midFreq // Mid-high - affects right side
    const band5 = frequencyBands[4] || highFreq // High-mid - affects overall roundness
    const band6 = frequencyBands[5] || highFreq // High - affects top-right corner
    const band7 = frequencyBands[6] || highFreq // Very high - affects skew
    const band8 = frequencyBands[7] || highFreq // Ultra high - affects fine details
    
    // Create asymmetric scaling based on frequency distribution
    const scaleX = 1 + (band2 * 0.3) + (band4 * 0.2) + (volume * 0.1) // Left-right influenced by side frequencies
    const scaleY = 1 + (band1 * 0.4) + (band3 * 0.3) + (volume * 0.15) // Up-down influenced by bass and mids
    
    // Create organic border radius variations using all frequency bands
    const topLeft = Math.round(45 + (band3 * 25) + (volume * 15)) // Top expansion from mids
    const topRight = Math.round(35 + (band6 * 30) + (band4 * 15)) // Top-right from highs
    const bottomLeft = Math.round(25 + (band2 * 35) + (band1 * 20)) // Bottom-left from bass
    const bottomRight = Math.round(65 + (band1 * 20) + (band8 * 15)) // Bottom-right mixed
    
    // Secondary radius values for more complex shapes
    const topLeft2 = Math.round(55 + (band5 * 20) + (band7 * 15))
    const topRight2 = Math.round(25 + (band8 * 25) + (band3 * 20))  
    const bottomLeft2 = Math.round(70 + (band6 * 15) + (band2 * 10))
    const bottomRight2 = Math.round(35 + (band4 * 25) + (band1 * 15))
    
    const borderRadius = `${topLeft}% ${topRight}% ${bottomLeft}% ${bottomRight}%/${topLeft2}% ${topRight2}% ${bottomLeft2}% ${bottomRight2}%`
    
    // Add subtle skewing based on high frequencies for more organic feel
    const skewX = (band7 - 0.5) * 3 // Range: -1.5 to 1.5 degrees
    const skewY = (band8 - 0.5) * 2 // Range: -1 to 1 degrees
    
    return {
      scaleX: Math.min(scaleX, 1.6), // Cap scaling to prevent extreme distortion
      scaleY: Math.min(scaleY, 1.5),
      borderRadius,
      skewX: Math.max(-2, Math.min(2, skewX)), // Cap skew
      skewY: Math.max(-1.5, Math.min(1.5, skewY))
    }
  }
  
  const shapeDistortion = getAudioShapeDistortion()

  const blobVariants = {
    idle: {
      scaleX: 1,
      scaleY: 1,
      rotate: 0,
      skewX: 0,
      skewY: 0,
      borderRadius: "60% 40% 30% 70%/60% 30% 70% 40%",
      transition: {
        duration: 0.5,
        ease: "easeInOut",
      }
    },
    listening: {
      scaleX: [1, 1.05, 1],
      scaleY: [1, 1.1, 1],
      skewX: [0, 0.5, 0],
      borderRadius: [
        "60% 40% 30% 70%/60% 30% 70% 40%",
        "30% 60% 70% 40%/50% 60% 30% 60%",
        "60% 40% 30% 70%/60% 30% 70% 40%"
      ],
      transition: {
        duration: 2,
        ease: "easeInOut",
        repeat: Infinity,
      }
    },
    speaking: {
      scaleX: shapeDistortion.scaleX,
      scaleY: shapeDistortion.scaleY,
      skewX: shapeDistortion.skewX,
      skewY: shapeDistortion.skewY,
      borderRadius: shapeDistortion.borderRadius,
      transition: {
        duration: 0.08, // Very fast response to audio changes for organic feel
        ease: "easeOut",
      }
    }
  }

  // Generate dynamic gradient based on frequency content
  const getAudioGradient = () => {
    if (!isSpeaking || !audioAnalysisData?.isPlaying) {
      return "linear-gradient(45deg, #667eea 0%, #764ba2 100%)"
    }
    
    // Map frequency bands to colors
    const bassIntensity = Math.round(lowFreq * 255)
    const midIntensity = Math.round(midFreq * 255) 
    const trebleIntensity = Math.round(highFreq * 255)
    const volumeIntensity = Math.round(volume * 100)
    
    // Create color based on frequency analysis
    // Low freq = red/orange, Mid freq = green/blue, High freq = purple/pink
    const color1 = `rgb(${Math.min(255, 102 + bassIntensity)}, ${Math.min(255, 126 + midIntensity)}, ${Math.min(255, 234 + trebleIntensity)})`
    const color2 = `rgb(${Math.min(255, 118 + trebleIntensity)}, ${Math.min(255, 75 + bassIntensity)}, ${Math.min(255, 162 + midIntensity)})`
    
    return `linear-gradient(${45 + (volumeIntensity * 2.7)}deg, ${color1} 0%, ${color2} 100%)`
  }

  const gradientVariants = {
    idle: {
      background: "linear-gradient(45deg, #667eea 0%, #764ba2 100%)",
      transition: {
        duration: 0.5,
        ease: "easeInOut",
      }
    },
    listening: {
      background: [
        "linear-gradient(45deg, #667eea 0%, #764ba2 100%)",
        "linear-gradient(45deg, #f093fb 0%, #f5576c 100%)",
        "linear-gradient(45deg, #667eea 0%, #764ba2 100%)"
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
      }
    },
    speaking: {
      background: getAudioGradient(),
      transition: {
        duration: 0.15, // Smooth but responsive color changes
        ease: "easeOut",
      }
    }
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <motion.div
        className="relative"
        style={{
          width: size,
          height: size,
        }}
        variants={blobVariants}
        animate={currentVariant}
      >
        <motion.div
          className="absolute inset-0 opacity-80"
          variants={gradientVariants}
          animate={currentVariant}
          style={{
            borderRadius: "inherit",
            filter: "blur(1px)",
          }}
        />
        
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            borderRadius: "inherit",
            background: "inherit",
            filter: "blur(10px)",
            scale: 1.2,
          }}
          animate={{
            opacity: isSpeaking && audioAnalysisData?.isPlaying 
              ? 0.3 + (volume * 0.4) // Dynamic opacity based on volume
              : isSpeaking ? [0.3, 0.6, 0.3] 
              : isListening ? [0.3, 0.5, 0.3] 
              : 0.3,
            scaleX: isSpeaking && audioAnalysisData?.isPlaying
              ? 1.2 + (volume * 0.2) + (lowFreq * 0.1) // Dynamic X scale
              : 1.2,
            scaleY: isSpeaking && audioAnalysisData?.isPlaying
              ? 1.2 + (volume * 0.25) + (midFreq * 0.15) // Dynamic Y scale
              : 1.2
          }}
          transition={{
            duration: isSpeaking && audioAnalysisData?.isPlaying ? 0.1 : isSpeaking ? 0.5 : isListening ? 1.5 : 3,
            repeat: (isSpeaking && !audioAnalysisData?.isPlaying) || isListening ? Infinity : 0,
            ease: "easeOut"
          }}
        />

        {/* Inner highlight */}
        <motion.div
          className="absolute inset-4 rounded-full opacity-40"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)",
          }}
          animate={{
            scaleX: isSpeaking && audioAnalysisData?.isPlaying
              ? 1 + (highFreq * 0.3) + (volume * 0.1) // High frequencies affect inner highlight X
              : isSpeaking ? [1, 1.2, 1] : isListening ? [1, 1.1, 1] : 1,
            scaleY: isSpeaking && audioAnalysisData?.isPlaying  
              ? 1 + (midFreq * 0.25) + (volume * 0.15) // Mid frequencies affect inner highlight Y
              : isSpeaking ? [1, 1.2, 1] : isListening ? [1, 1.1, 1] : 1,
          }}
          transition={{
            duration: isSpeaking && audioAnalysisData?.isPlaying ? 0.1 : isSpeaking ? 0.4 : isListening ? 2 : 0.5,
            repeat: (isSpeaking && !audioAnalysisData?.isPlaying) || isListening ? Infinity : 0,
            ease: "easeInOut"
          }}
        />

        {/* Audio Level Indicator - positioned in center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <AudioLevelIndicator 
            isActive={isSpeaking || isListening} 
            isSpeaking={isSpeaking}
            lineCount={5}
            audioAnalysisData={audioAnalysisData}
          />
        </div>
      </motion.div>
    </div>
  )
}
