'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCoach } from '@/src/contexts/CoachContext'

interface RealTimeCaptionsProps {
  currentText?: string
  subtext?: string
  className?: string
  showOnSpeaking?: boolean
  showProgress?: boolean
  stepKey?: string | number
}

export function RealTimeCaptions({ 
  currentText, 
  subtext, 
  className = '',
  showOnSpeaking = true,
  showProgress = true,
  stepKey
}: RealTimeCaptionsProps) {
  const { isSpeaking, isPreparingSpeech, currentMessage, currentWordIndex } = useCoach()
  const [allWords, setAllWords] = useState<string[]>([])
  const [visibleWordCount, setVisibleWordCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [lastStepKey, setLastStepKey] = useState<string | number | undefined>(stepKey)

  // Clear captions when step changes
  useEffect(() => {
    if (stepKey !== lastStepKey && lastStepKey !== undefined) {
      // Step has changed - clear previous captions
      setAllWords([])
      setVisibleWordCount(0)
      setIsVisible(false)
      setLastStepKey(stepKey)
      
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log(`Step changed from ${lastStepKey} to ${stepKey} - clearing captions`)
      }
    } else if (lastStepKey === undefined) {
      // Initialize step key
      setLastStepKey(stepKey)
    }
  }, [stepKey, lastStepKey])

  // Initialize words when message starts or changes
  useEffect(() => {
    if (isSpeaking && currentMessage) {
      const words = currentMessage.split(/(\s+)/).filter(part => part.length > 0)
      
      // Only reinitialize if it's a different message
      if (allWords.length === 0 || allWords.join('') !== words.join('')) {
        setAllWords(words)
        setVisibleWordCount(0)
        setIsVisible(true)
        
        // Add debug logging
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
          console.log(`Caption initialized with ${words.length} parts: "${currentMessage}"`)
        }
      }
    }
    // Keep captions visible on the same step even when not actively speaking
  }, [isSpeaking, currentMessage, allWords])

  // Update visible word count as words are spoken
  useEffect(() => {
    if (isSpeaking && currentMessage && allWords.length > 0) {
      const actualWords = allWords.filter(word => word.trim().length > 0)
      const wordsToShow = Math.min(currentWordIndex + 1, actualWords.length)
      
      // Calculate how many parts (including spaces) to show
      let partsToShow = 0
      let actualWordCount = 0
      
      for (let i = 0; i < allWords.length; i++) {
        const part = allWords[i]
        const isWord = part.trim().length > 0
        
        if (isWord) {
          if (actualWordCount < wordsToShow) {
            partsToShow++
            actualWordCount++
          } else {
            break
          }
        } else {
          // Include spaces between visible words
          if (actualWordCount > 0 && actualWordCount < wordsToShow) {
            partsToShow++
          }
        }
      }
      
      if (partsToShow > visibleWordCount) {
        setVisibleWordCount(partsToShow)
        
        // Add debug logging
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
          console.log(`Caption update: wordIndex=${currentWordIndex}, showing ${partsToShow} parts`)
        }
      }
    }
  }, [currentWordIndex, isSpeaking, currentMessage, allWords, visibleWordCount])

  // Function to render words with individual fade-in animations
  const renderWords = () => {
    if (allWords.length === 0) return null
    
    return allWords.map((part, index) => {
      const isWord = part.trim().length > 0
      const shouldShow = index < visibleWordCount
      
      if (!shouldShow) {
        // Return invisible placeholder to maintain layout
        return (
          <span
            key={`${currentMessage}-${index}`}
            className={`invisible ${isWord ? "inline-block" : "inline"}`}
          >
            {part}
          </span>
        )
      }
      
      return (
        <motion.span
          key={`${currentMessage}-${index}`} // Unique key per message and position
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ 
            duration: 0.1,
            delay: 0 // No stagger delay - each word appears when it should
          }}
          className={isWord ? "inline-block" : "inline"}
        >
          {part}
        </motion.span>
      )
    })
  }

  return (
    <div className="w-[70%] h-full flex items-center justify-center">
      <div className="max-w-lg mx-auto px-4 py-3 text-center min-h-[60px] flex items-center justify-center">
        {isVisible && (
          <div className={`text-gray-200 text-lg md:text-xl leading-relaxed italic ${className}`}>
            {renderWords()}
          </div>
        )}
      </div>
    </div>
  )
}
