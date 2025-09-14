'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCoach } from '@/src/contexts/CoachContext'

interface RealTimeCaptionsProps {
  currentText?: string
  subtext?: string
  className?: string
  showOnSpeaking?: boolean
  showProgress?: boolean
  stepKey?: string | number
  showScrollable?: boolean
  previewText?: string // Text to show immediately with reduced opacity
  previewMode?: boolean // Whether to show preview before audio starts
}

export function RealTimeCaptions({ 
  currentText, 
  subtext, 
  className = '',
  showOnSpeaking = true,
  showProgress = true,
  stepKey,
  showScrollable = false,
  previewText,
  previewMode = false
}: RealTimeCaptionsProps) {
  const { isSpeaking, isPreparingSpeech, currentMessage, audioAnalysisData, currentAudio } = useCoach()
  const [allParts, setAllParts] = useState<Array<{ text: string; isWord: boolean; isBold?: boolean; isItalic?: boolean }>>([])
  const [previewParts, setPreviewParts] = useState<Array<{ text: string; isWord: boolean; isBold?: boolean; isItalic?: boolean }>>([])
  const [visibleWordCount, setVisibleWordCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isPreviewVisible, setIsPreviewVisible] = useState(false)
  const [hasCompletedSpeech, setHasCompletedSpeech] = useState(false)
  const [lastStepKey, setLastStepKey] = useState<string | number | undefined>(stepKey)
  const [currentAudioWordIndex, setCurrentAudioWordIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Utility function to parse markdown and create formatted text elements
  // Handles OpenAI's common formatting: **bold**, *italic*, and newlines
  const parseMarkdown = (text: string): Array<{ text: string; isWord: boolean; isBold?: boolean; isItalic?: boolean }> => {
    if (!text) return []
    
    const parts: Array<{ text: string; isWord: boolean; isBold?: boolean; isItalic?: boolean }> = []
    
    // Handle newlines first - convert to spaces for voice synthesis compatibility
    // Multiple newlines become single spaces to avoid long pauses
    const normalizedText = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ')
    
    // Split by markdown formatting while preserving the delimiters
    // This regex captures: **bold**, *italic*, and regular text
    const segments = normalizedText.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/)
    
    segments.forEach(segment => {
      if (!segment) return
      
      // Check if this segment is formatted with asterisks
      const boldMatch = segment.match(/^\*\*(.+)\*\*$/)
      const italicMatch = segment.match(/^\*([^*]+)\*$/)
      
      if (boldMatch) {
        // Bold text - split into words and spaces
        const content = boldMatch[1]
        const wordParts = content.split(/(\s+)/).filter(part => part.length > 0)
        wordParts.forEach(part => {
          parts.push({
            text: part,
            isWord: part.trim().length > 0,
            isBold: true
          })
        })
      } else if (italicMatch) {
        // Italic text - split into words and spaces
        const content = italicMatch[1]
        const wordParts = content.split(/(\s+)/).filter(part => part.length > 0)
        wordParts.forEach(part => {
          parts.push({
            text: part,
            isWord: part.trim().length > 0,
            isItalic: true
          })
        })
      } else {
        // Regular text - split into words and spaces
        const wordParts = segment.split(/(\s+)/).filter(part => part.length > 0)
        wordParts.forEach(part => {
          parts.push({
            text: part,
            isWord: part.trim().length > 0
          })
        })
      }
    })
    
    return parts
  }

  // Utility function to calculate which word should be shown based on audio timing
  // This EXACTLY matches the algorithm used in elevenlabs.ts for accurate synchronization
  const getCurrentAudioWordIndex = (currentTime: number, duration: number, wordCount: number, playbackRate: number = 0.85): number => {
    if (duration === 0 || wordCount === 0) return 0
    
    // Calculate progress through the audio
    const progress = currentTime / duration
    
    // Show words slightly ahead of the audio for more natural reading experience
    // This gives users time to read before hearing the word
    const leadTimeMs = 0.0 // No lead time - sync exactly with audio
    const leadTimeProgress = leadTimeMs / duration // Convert to progress percentage
    const adjustedProgress = Math.min(1, progress + leadTimeProgress)
    const wordIndex = Math.floor(adjustedProgress * wordCount)
    
    return Math.min(Math.max(0, wordIndex), wordCount - 1)
  }

  // Clear captions when step changes
  useEffect(() => {
    if (stepKey !== lastStepKey && lastStepKey !== undefined) {
      // Step has changed - clear previous captions
      setAllParts([])
      setVisibleWordCount(0)
      setIsVisible(false)
      setLastStepKey(stepKey)
      
    } else if (lastStepKey === undefined) {
      // Initialize step key
      setLastStepKey(stepKey)
    }
  }, [stepKey, lastStepKey])

  // Handle preview text display (immediate display with opacity)
  useEffect(() => {
    if (previewMode && previewText && !isSpeaking) {
      const parts = parseMarkdown(previewText)
      setPreviewParts(parts)
      setIsPreviewVisible(true)
    } else {
      setPreviewParts([])
      setIsPreviewVisible(false)
    }
  }, [previewMode, previewText, isSpeaking, isPreviewVisible])

  // Real audio-synchronized word timing using the same approach as coach blob
  useEffect(() => {
    if (isSpeaking && audioAnalysisData?.isPlaying && currentAudio && allParts.length > 0) {
      const updateWordTiming = () => {
        if (!currentAudio || currentAudio.paused || currentAudio.ended || !currentAudio.duration) return
        
        // Use EXACT same logic as coach blob - real audio timing
        const actualWords = allParts.filter(part => part.isWord)
        const wordCount = actualWords.length
        const currentWordIndex = getCurrentAudioWordIndex(
          currentAudio.currentTime, 
          currentAudio.duration, 
          wordCount, 
          currentAudio.playbackRate || 0.85
        )
        
        // Calculate how many parts (including spaces) to show based on word index
        let partsToShow = 0
        let actualWordCount = 0
        
        for (let i = 0; i < allParts.length; i++) {
          const part = allParts[i]
          
          if (part.isWord) {
            if (actualWordCount <= currentWordIndex) {
              partsToShow++
              actualWordCount++
            } else {
              break
            }
          } else {
            // Include spaces between visible words
            if (actualWordCount > 0 && actualWordCount <= currentWordIndex + 1) {
              partsToShow++
            }
          }
        }
        
        if (partsToShow !== visibleWordCount) {
          setVisibleWordCount(partsToShow)
          
          // Auto-scroll to bottom in scrollable mode only when content overflows
          if (showScrollable && scrollContainerRef.current) {
            setTimeout(() => {
              if (scrollContainerRef.current) {
                const container = scrollContainerRef.current
                const isOverflowing = container.scrollHeight > container.clientHeight
                
                if (isOverflowing) {
                  // Only scroll if content is overflowing
                  container.scrollTop = container.scrollHeight
                }
              }
            }, 50) // Small delay to ensure DOM update
          }
          
        }
        
        // Continue the animation loop using requestAnimationFrame for smooth updates
        animationFrameRef.current = requestAnimationFrame(updateWordTiming)
      }
      
      // Start the animation loop
      animationFrameRef.current = requestAnimationFrame(updateWordTiming)
      
      // Cleanup function
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
      }
    } else {
      // Stop animation frame when not actively playing audio
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [isSpeaking, audioAnalysisData?.isPlaying, currentAudio, allParts, visibleWordCount])


  // Initialize words when message starts or changes
  useEffect(() => {
    if (isSpeaking && currentMessage) {
      const parts = parseMarkdown(currentMessage)
      
      // If we have preview parts for the same message, use them instead of reinitializing
      if (isPreviewVisible && previewParts.length > 0) {
        const previewText = previewParts.map(p => p.text).join('')
        const currentText = parts.map(p => p.text).join('')
        
        if (previewText === currentText) {
          // Use preview parts as the base for highlighting
          setAllParts(previewParts)
          setVisibleWordCount(0)
          setIsVisible(true)
          setIsPreviewVisible(false) // Switch from preview to real-time mode
          
          return
        }
      }
      
      // Only reinitialize if it's a different message
      const currentPartsText = allParts.map(p => p.text).join('')
      const newPartsText = parts.map(p => p.text).join('')
      
      if (allParts.length === 0 || currentPartsText !== newPartsText) {
        setAllParts(parts)
        setVisibleWordCount(0)
        setIsVisible(true)
        
        // For scrollable mode: scroll to top when new message starts, then auto-scroll as words appear
        if (showScrollable && scrollContainerRef.current) {
          // First scroll to top to show the beginning of the new message
          scrollContainerRef.current.scrollTop = 0
        }
        
      }
    }
    // Keep captions visible on the same step even when not actively speaking
  }, [isSpeaking, currentMessage, allParts, showScrollable, isPreviewVisible, previewParts])


  // Track when speech completes to keep text bright
  useEffect(() => {
    if (!isSpeaking && currentMessage && allParts.length > 0) {
      setHasCompletedSpeech(true)
    } else if (isSpeaking) {
      setHasCompletedSpeech(false)
    }
  }, [isSpeaking, currentMessage, allParts.length])

  // Function to render words with highlighting as audio plays
  const renderWords = () => {
    // Use preview parts if available, otherwise use regular parts
    const partsToRender = isPreviewVisible && previewParts.length > 0 ? previewParts : allParts
    
    if (partsToRender.length === 0) return null
    
    return partsToRender.map((part, index) => {
      // Determine highlighting state based on audio progress and completion
      let highlightState: 'preview' | 'speaking' | 'completed' = 'preview'
      
      if (hasCompletedSpeech || (!isSpeaking && allParts.length > 0)) {
        // Speech completed - keep all words bright
        highlightState = 'completed'
      } else if (isSpeaking && audioAnalysisData?.isPlaying && index < visibleWordCount) {
        // Currently being spoken - use real audio timing
        highlightState = 'speaking'
      } else {
        // Not yet spoken or preview mode
        highlightState = 'preview'
      }
      
      // Build className based on formatting
      let className = part.isWord ? "inline-block" : "inline"
      if (part.isBold) className += " font-bold"
      if (part.isItalic) className += " italic"
      
      // Apply highlighting based on state
      switch (highlightState) {
        case 'speaking':
          className += " text-foreground brightness-110" // Bright when being spoken
          break
        case 'completed':
          className += " text-foreground" // Full color when speech is complete
          break
        case 'preview':
        default:
          className += " text-foreground/40" // Dim for preview/not yet spoken
          break
      }
      
      return (
        <motion.span
          key={`${currentMessage || 'preview'}-${index}`}
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 1,
            // Smooth transition when word is being highlighted
            scale: highlightState === 'speaking' ? 1.02 : 1
          }}
          transition={{ 
            duration: highlightState === 'speaking' ? 0.1 : 0.2,
            delay: !isSpeaking ? index * 0.01 : 0 // Stagger only for initial preview
          }}
          className={className}
        >
          {part.text}
        </motion.span>
      )
    })
  }

  if (showScrollable) {
    return (
      <div className={`w-full ${className}`}>
        <div 
          ref={scrollContainerRef}
          className="h-48 overflow-y-auto bg-card/50 rounded-lg border border-border/50 p-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
          style={{ 
            overflowAnchor: 'none' // Prevent scroll anchoring issues
          }}
        >
          {(isVisible && allParts.length > 0) || (isPreviewVisible && previewParts.length > 0) ? (
            <div className="text-foreground text-base leading-relaxed">
              {renderWords()}
              {/* Invisible element to ensure scroll to bottom works */}
              <div className="h-2" />
            </div>
          ) : (
            <div className="text-muted-foreground text-sm italic flex items-center justify-center h-full">
              Waiting for coach to speak...
            </div>
          )}
        </div>
      </div>
    )
  }

  // Original overlay mode for other components
  return (
    <div className="w-[70%] h-full flex items-center justify-center">
      <div className="max-w-lg mx-auto px-4 py-3 text-center min-h-[60px] flex items-center justify-center">
        {(isVisible || isPreviewVisible) && (
          <div className={`text-gray-200 text-lg md:text-xl leading-relaxed italic ${className}`}>
            {renderWords()}
          </div>
        )}
      </div>
    </div>
  )
}
