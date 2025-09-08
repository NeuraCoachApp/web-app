'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import AudioLevelIndicator from './audio-level-indicator'

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

  useEffect(() => {
    if (isSpeaking) {
      setCurrentVariant('speaking')
    } else if (isListening) {
      setCurrentVariant('listening')
    } else {
      setCurrentVariant('idle')
    }
  }, [isListening, isSpeaking])

  const blobVariants = {
    idle: {
      scale: 1,
      rotate: 0,
      borderRadius: "60% 40% 30% 70%/60% 30% 70% 40%",
      transition: {
        duration: 0.5,
        ease: "easeInOut",
      }
    },
    listening: {
      scale: [1, 1.1, 1],
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
      scale: [1, 1.2, 0.9, 1.1, 1],
      borderRadius: [
        "60% 40% 30% 70%/60% 30% 70% 40%",
        "40% 60% 70% 30%/40% 70% 60% 30%",
        "70% 30% 60% 40%/30% 60% 40% 70%",
        "50% 50% 50% 50%/50% 50% 50% 50%",
        "60% 40% 30% 70%/60% 30% 70% 40%"
      ],
      transition: {
        duration: 0.8,
        ease: "easeInOut",
        repeat: Infinity,
      }
    }
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
      background: [
        "linear-gradient(45deg, #667eea 0%, #764ba2 100%)",
        "linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)",
        "linear-gradient(45deg, #43e97b 0%, #38f9d7 100%)",
        "linear-gradient(45deg, #fa709a 0%, #fee140 100%)",
        "linear-gradient(45deg, #667eea 0%, #764ba2 100%)"
      ],
      transition: {
        duration: 0.8,
        repeat: Infinity,
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
            opacity: isSpeaking ? [0.3, 0.6, 0.3] : isListening ? [0.3, 0.5, 0.3] : 0.3,
          }}
          transition={{
            duration: isSpeaking ? 0.5 : isListening ? 1.5 : 3,
            repeat: (isSpeaking || isListening) ? Infinity : 0,
          }}
        />

        {/* Inner highlight */}
        <motion.div
          className="absolute inset-4 rounded-full opacity-40"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)",
          }}
          animate={{
            scale: isSpeaking ? [1, 1.2, 1] : isListening ? [1, 1.1, 1] : 1,
          }}
          transition={{
            duration: isSpeaking ? 0.4 : isListening ? 2 : 0.5,
            repeat: (isSpeaking || isListening) ? Infinity : 0,
            ease: "easeInOut"
          }}
        />

        {/* Audio Level Indicator - positioned in center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <AudioLevelIndicator 
            isActive={isSpeaking || isListening} 
            isSpeaking={isSpeaking}
            lineCount={5}
          />
        </div>
      </motion.div>
    </div>
  )
}
